((root) => {
    'use strict';

    const isCommonJS = typeof module !== 'undefined' && module.exports;
    const isNode = !(typeof window !== 'undefined' && root === window);
    const setImmediate = root.setImmediate || ((cb) => setTimeout(cb, 0));
    const Worker = isNode ? require(`${__dirname}/Worker.js`) : root.Worker;
    const URL = typeof root !== 'undefined' ? (root.URL ? root.URL : root.webkitURL) : null;
    const _supports = (isNode || root.Worker) ? true : false; // node always supports parallel

    const extend = (from, to) => {
        if (!to) to = {};
        for (let i in from) {
            if (to[i] === undefined) to[i] = from[i];
        }
        return to;
    };

    class Operation {
        constructor() {
            this._callbacks = [];
            this._errCallbacks = [];
            this._resolved = 0;
            this._result = null;
        }

        resolve(err, res) {
            if (!err) {
                this._resolved = 1;
                this._result = res;
                for (let i = 0; i < this._callbacks.length; ++i) {
                    this._callbacks[i](res);
                }
            } else {
                this._resolved = 2;
                this._result = err;
                for (let i = 0; i < this._errCallbacks.length; ++i) {
                    this._errCallbacks[i](err);
                }
            }
            this._callbacks = [];
            this._errCallbacks = [];
        }

        then(cb, errCb) {
            if (this._resolved === 1) {
                if (cb) {
                    cb(this._result);
                }
                return;
            } else if (this._resolved === 2) {
                if (errCb) {
                    errCb(this._result);
                }
                return;
            }
            if (cb) {
                this._callbacks[this._callbacks.length] = cb;
            }
            if (errCb) {
                this._errCallbacks[this._errCallbacks.length] = errCb;
            }
            return this;
        }
    }

    const defaults = {
        evalPath: isNode ? `${__dirname}/eval.js` : null,
        maxWorkers: isNode ? require('os').cpus().length : (navigator.hardwareConcurrency || 4),
        synchronous: true,
        env: {},
        envNamespace: 'env'
    };

    class Parallel {
        constructor(data, options) {
            this.data = data;
            this.options = extend(defaults, options);
            this.operation = new Operation();
            this.operation.resolve(null, this.data);
            this.requiredScripts = [];
            this.requiredFunctions = [];
        }

        static isSupported() { return _supports; }

        getWorkerSource(cb, env) {
            let preStr = '';
            let i = 0;
            if (!isNode && this.requiredScripts.length !== 0) {
                preStr += `importScripts("${this.requiredScripts.join('","')}");\r\n`;
            }

            for (i = 0; i < this.requiredFunctions.length; ++i) {
                if (this.requiredFunctions[i].name) {
                    preStr += `var ${this.requiredFunctions[i].name} = ${this.requiredFunctions[i].fn.toString()};`;
                } else {
                    preStr += this.requiredFunctions[i].fn.toString();
                }
            }

            env = JSON.stringify(env || {});

            const ns = this.options.envNamespace;

            if (isNode) {
                return `${preStr}process.on("message", function(e) {global.${ns} = ${env};process.send(JSON.stringify((${cb.toString()})(JSON.parse(e).data)))})`;
            } else {
                return `${preStr}self.onmessage = function(e) {var global = {}; global.${ns} = ${env};self.postMessage((${cb.toString()})(e.data))}`;
            }
        }

        require(fn, name) {
            if (typeof fn === 'string') {
                this.requiredScripts.push(fn);
            } else if (typeof fn === 'function') {
                this.requiredFunctions.push({ fn: fn, name: name });
            } else if (typeof fn === 'object') {
                this.requiredFunctions.push(fn);
            }
            return this;
        }

        _spawnWorker(cb, env) {
            let wrk;
            const src = this.getWorkerSource(cb, env);
            if (isNode) {
                wrk = new Worker(this.options.evalPath);
                wrk.postMessage(src);
            } else {
                if (Worker === undefined) {
                    return undefined;
                }

                try {
                    if (this.requiredScripts.length !== 0) {
                        if (this.options.evalPath !== null) {
                            wrk = new Worker(this.options.evalPath);
                            wrk.postMessage(src);
                        } else {
                            throw new Error('Can\'t use required scripts without eval.js!');
                        }
                    } else if (!URL) {
                        throw new Error('Can\'t create a blob URL in this browser!');
                    } else {
                        const blob = new Blob([src], { type: 'text/javascript' });
                        const url = URL.createObjectURL(blob);
                        wrk = new Worker(url);
                    }
                } catch (e) {
                    if (this.options.evalPath !== null) { // blob/url unsupported, cross-origin error
                        wrk = new Worker(this.options.evalPath);
                        wrk.postMessage(src);
                    } else {
                        throw e;
                    }
                }
            }

            return wrk;
        }

        spawn(cb, env) {
            const that = this;
            const newOp = new Operation();

            env = extend(this.options.env, env || {});

            this.operation.then(() => {
                const wrk = that._spawnWorker(cb, env);
                if (wrk !== undefined) {
                    wrk.onmessage = (msg) => {
                        wrk.terminate();
                        that.data = msg.data;
                        newOp.resolve(null, that.data);
                    };
                    wrk.onerror = (e) => {
                        wrk.terminate();
                        newOp.resolve(e, null);
                    };
                    wrk.postMessage(that.data);
                } else if (that.options.synchronous) {
                    setImmediate(() => {
                        try {
                            that.data = cb(that.data);
                            newOp.resolve(null, that.data);
                        } catch (e) {
                            newOp.resolve(e, null);
                        }
                    });
                } else {
                    throw new Error('Workers do not exist and synchronous operation not allowed!');
                }
            });
            this.operation = newOp;
            return this;
        }

        map(cb, env) {
            env = extend(this.options.env, env || {});

            if (!this.data.length) {
                return this.spawn(cb, env);
            }

            const that = this;
            let startedOps = 0;
            let doneOps = 0;
            const newOp = new Operation();

            const done = (err, wrk) => {
                if (err) {
                    newOp.resolve(err, null);
                } else if (++doneOps === that.data.length) {
                    newOp.resolve(null, that.data);
                    if (wrk) wrk.terminate();
                } else if (startedOps < that.data.length) {
                    that._spawnMapWorker(startedOps++, cb, done, env, wrk);
                } else {
                    if (wrk) wrk.terminate();
                }
            };

            this.operation.then(() => {
                for (; startedOps - doneOps < that.options.maxWorkers && startedOps < that.data.length; ++startedOps) {
                    that._spawnMapWorker(startedOps, cb, done, env);
                }
            });

            this.operation = newOp;
            return this;
        }

        _spawnMapWorker(i, cb, done, env, wrk) {
            const that = this;
            if (!wrk) wrk = that._spawnWorker(cb, env);

            if (wrk !== undefined) {
                wrk.onmessage = (msg) => {
                    that.data[i] = msg.data;
                    done(null, wrk);
                };
                wrk.onerror = (e) => {
                    wrk.terminate();
                    done(e);
                };
                wrk.postMessage(that.data[i]);
            } else if (that.options.synchronous) {
                setImmediate(() => {
                    that.data[i] = cb(that.data[i]);
                    done();
                });
            } else {
                throw new Error('Workers do not exist and synchronous operation not allowed!');
            }
        }

        reduce(cb, env) {
            env = extend(this.options.env, env || {});

            if (!this.data.length) {
                throw new Error('Can\'t reduce non-array data');
            }

            let runningWorkers = 0;
            const that = this;
            let newOp = new Operation();

            const done = (err, wrk) => {
                --runningWorkers;
                if (err) {
                    newOp.resolve(err, null);
                } else if (that.data.length === 1 && runningWorkers === 0) {
                    that.data = that.data[0];
                    newOp.resolve(null, that.data);
                    if (wrk) wrk.terminate();
                } else if (that.data.length > 1) {
                    ++runningWorkers;
                    that._spawnReduceWorker([that.data[0], that.data[1]], cb, done, env, wrk);
                    that.data.splice(0, 2);
                } else {
                    if (wrk) wrk.terminate();
                }
            };

            this.operation.then(() => {
                if (that.data.length === 1) {
                    newOp.resolve(null, that.data[0]);
                } else {
                    for (let i = 0; i < that.options.maxWorkers && i < Math.floor(that.data.length / 2); ++i) {
                        ++runningWorkers;
                        that._spawnReduceWorker([that.data[i * 2], that.data[i * 2 + 1]], cb, done, env);
                    }

                    that.data.splice(0, i * 2);
                }
            });
            this.operation = newOp;
            return this;
        }

        _spawnReduceWorker(data, cb, done, env, wrk) {
            const that = this;
            if (!wrk) wrk = that._spawnWorker(cb, env);

            if (wrk !== undefined) {
                wrk.onmessage = (msg) => {
                    that.data.push(msg.data);
                    done(null, wrk);
                };
                wrk.onerror = (e) => {
                    wrk.terminate();
                    done(e, null);
                }
                wrk.postMessage(data);
            } else if (that.options.synchronous) {
                setImmediate(() => {
                    that.data.push(cb(data));
                    done();
                });
            } else {
                throw new Error('Workers do not exist and synchronous operation not allowed!');
            }
        }

        then(cb, errCb) {
            const that = this;
            const newOp = new Operation();
            errCb = typeof errCb === 'function' ? errCb : function(){};

            this.operation.then(() => {
                let retData;

                try {
                    if (cb) {
                        retData = cb(that.data);
                        if (retData !== undefined) {
                            that.data = retData;
                        }
                    }
                    newOp.resolve(null, that.data);
                } catch (e) {
                    if (errCb) {
                        retData = errCb(e);
                        if (retData !== undefined) {
                            that.data = retData;
                        }

                        newOp.resolve(null, that.data);
                    } else {
                        newOp.resolve(null, e);
                    }
                }
            }, (err) => {
                if (errCb) {
                    const retData = errCb(err);
                    if (retData !== undefined) {
                        that.data = retData;
                    }

                    newOp.resolve(null, that.data);
                } else {
                    newOp.resolve(null, err);
                }
            });
            this.operation = newOp;
            return this;
        }
    }

    root.Parallel = Parallel;
})(typeof window !== 'undefined' ? window : self);
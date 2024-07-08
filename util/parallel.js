// parallel.js
(function(root) {
    const isCommonJS = typeof module !== 'undefined' && module.exports;
    const isNode = !(typeof window !== 'undefined' && root === window);
    const setImmediate = setImmediate || function(cb) { setTimeout(cb, 0); };
    const Worker = isNode ? require('worker_threads').Worker : root.Worker;
    const URL = typeof root !== 'undefined' ? (root.URL ? root.URL : root.webkitURL) : null;
    const _supports = (isNode || root.Worker) ? true : false;

    function extend(from, to) {
        if (!to) to = {};
        for (const i in from) {
            if (to[i] === undefined) to[i] = from[i];
        }
        return to;
    }

    function Operation() {
        this._callbacks = [];
        this._errCallbacks = [];
        this._resolved = 0;
        this._result = null;
    }

    Operation.prototype.resolve = function(err, res) {
        if (!err) {
            this._resolved = 1;
            this._result = res;
            this._callbacks.forEach(cb => cb(res));
        } else {
            this._resolved = 2;
            this._result = err;
            this._errCallbacks.forEach(cb => cb(err));
        }
        this._callbacks = [];
        this._errCallbacks = [];
    };

    Operation.prototype.then = function(cb, errCb) {
        if (this._resolved === 1) {
            if (cb) cb(this._result);
        } else if (this._resolved === 2) {
            if (errCb) errCb(this._result);
        } else {
            if (cb) this._callbacks.push(cb);
            if (errCb) this._errCallbacks.push(errCb);
        }
        return this;
    };

    const defaults = {
        evalPath: isNode ? __dirname + '/eval.js' : null,
        maxWorkers: isNode ? require('os').cpus().length : (navigator.hardwareConcurrency || 4),
        synchronous: true,
        env: {},
        envNamespace: 'env'
    };

    function Parallel(data, options) {
        this.data = data;
        this.options = extend(defaults, options);
        this.operation = new Operation();
        this.operation.resolve(null, this.data);
        this.requiredScripts = [];
        this.requiredFunctions = [];
    }

    Parallel.isSupported = function() { return _supports; };

    Parallel.prototype.getWorkerSource = function(cb, env) {
        let preStr = '';
        if (!isNode && this.requiredScripts.length) {
            preStr += 'importScripts("' + this.requiredScripts.join('","') + '");\r\n';
        }

        this.requiredFunctions.forEach(func => {
            preStr += func.name ? `var ${func.name} = ${func.fn.toString()};` : func.fn.toString();
        });

        env = JSON.stringify(env || {});
        const ns = this.options.envNamespace;

        if (isNode) {
            return preStr + `process.on("message", function(e) {global.${ns} = ${env};process.send(JSON.stringify((${cb.toString()})(JSON.parse(e).data)))})`;
        } else {
            return preStr + `self.onmessage = function(e) {var global = {}; global.${ns} = ${env};self.postMessage((${cb.toString()})(e.data))}`;
        }
    };

    Parallel.prototype.require = function() {
        Array.prototype.slice.call(arguments).forEach(func => {
            if (typeof func === 'string') {
                this.requiredScripts.push(func);
            } else if (typeof func === 'function') {
                this.requiredFunctions.push({ fn: func });
            } else if (typeof func === 'object') {
                this.requiredFunctions.push(func);
            }
        });
        return this;
    };

    Parallel.prototype._spawnWorker = function(cb, env) {
        const src = this.getWorkerSource(cb, env);
        let worker;
        if (isNode) {
            worker = new Worker(this.options.evalPath);
            worker.postMessage(src);
        } else {
            try {
                if (this.requiredScripts.length && this.options.evalPath) {
                    worker = new Worker(this.options.evalPath);
                    worker.postMessage(src);
                } else if (!URL) {
                    throw new Error('Cannot create a blob URL in this browser!');
                } else {
                    const blob = new Blob([src], { type: 'text/javascript' });
                    worker = new Worker(URL.createObjectURL(blob));
                }
            } catch (e) {
                if (this.options.evalPath) {
                    worker = new Worker(this.options.evalPath);
                    worker.postMessage(src);
                } else {
                    throw e;
                }
            }
        }
        return worker;
    };

    Parallel.prototype.spawn = function(cb, env) {
        const newOp = new Operation();
        env = extend(this.options.env, env || {});
        this.operation.then(() => {
            const worker = this._spawnWorker(cb, env);
            if (worker) {
                worker.onmessage = msg => {
                    worker.terminate();
                    this.data = msg.data;
                    newOp.resolve(null, this.data);
                };
                worker.onerror = e => {
                    worker.terminate();
                    newOp.resolve(e, null);
                };
                worker.postMessage(this.data);
            } else if (this.options.synchronous) {
                setImmediate(() => {
                    try {
                        this.data = cb(this.data);
                        newOp.resolve(null, this.data);
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
    };

    Parallel.prototype._spawnMapWorker = function(i, cb, env) {
        const worker = this._spawnWorker(cb, env);
        if (worker) {
            worker.onmessage = msg => {
                this.data[i] = msg.data;
                this.operation.resolve(null, this.data);
                worker.terminate();
            };
            worker.onerror = e => {
                this.operation.resolve(e, null);
                worker.terminate();
            };
        }
        return worker;
    };

    Parallel.prototype.map = function(cb, env) {
        const newOp = new Operation();
        env = extend(this.options.env, env || {});
        const len = this.data.length;
        const result = new Array(len);
        let resolved = 0;
        for (let i = 0; i < len; i++) {
            const worker = this._spawnMapWorker(i, cb, env);
            if (worker) {
                worker.postMessage(this.data[i]);
            } else if (this.options.synchronous) {
                setImmediate(() => {
                    try {
                        result[i] = cb(this.data[i]);
                        resolved++;
                        if (resolved === len) {
                            newOp.resolve(null, result);
                        }
                    } catch (e) {
                        newOp.resolve(e, null);
                    }
                });
            } else {
                throw new Error('Workers do not exist and synchronous operation not allowed!');
            }
        }
        this.operation = newOp;
        return this;
    };

    Parallel.prototype.reduce = function(cb, env) {
        const newOp = new Operation();
        env = extend(this.options.env, env || {});
        this.operation.then(() => {
            const worker = this._spawnWorker(cb, env);
            if (worker) {
                worker.onmessage = msg => {
                    this.data = msg.data;
                    newOp.resolve(null, this.data);
                    worker.terminate();
                };
                worker.onerror = e => {
                    newOp.resolve(e, null);
                    worker.terminate();
                };
                worker.postMessage(this.data);
            } else if (this.options.synchronous) {
                setImmediate(() => {
                    try {
                        this.data = cb(this.data);
                        newOp.resolve(null, this.data);
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
    };

    Parallel.prototype.then = function(cb, errCb) {
        this.operation.then(cb, errCb);
        return this;
    };

    Parallel.prototype.resolved = function() {
        return this.operation._resolved !== 0;
    };

    Parallel.prototype.data = function() {
        return this.operation._result;
    };

    if (isCommonJS) {
        module.exports = Parallel;
    } else {
        root.Parallel = Parallel;
    }
})(this);

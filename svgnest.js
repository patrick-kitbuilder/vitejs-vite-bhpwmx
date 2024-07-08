// svgnest.js
(function(root) {
    'use strict';

    root.SvgNest = new SvgNest();

    function SvgNest() {
        const self = this;

        let svg = null;
        this.style = null;
        let parts = null;
        let tree = null;
        let bin = null;
        let binPolygon = null;
        let binBounds = null;
        let nfpCache = {};
        const config = {
            clipperScale: 10000000,
            curveTolerance: 0.3,
            spacing: 0,
            rotations: 4,
            populationSize: 10,
            mutationRate: 10,
            useHoles: false,
            exploreConcave: false
        };

        this.working = false;
        let GA = null;
        let best = null;
        let workerTimer = null;
        let progress = 0;

        this.parsesvg = function(svgstring) {
            this.stop();
            bin = null;
            binPolygon = null;
            tree = null;
            svg = SvgParser.load(svgstring);
            this.style = SvgParser.getStyle();
            svg = SvgParser.clean();
            tree = this.getParts(svg.childNodes);

            return svg;
        };

        this.setbin = function(element) {
            if (!svg) {
                return;
            }
            bin = element;
        };

        this.config = function(c) {
            if (!c) {
                return config;
            }
            config.curveTolerance = parseFloat(c.curveTolerance) || config.curveTolerance;
            config.spacing = parseFloat(c.spacing) || config.spacing;
            config.rotations = parseInt(c.rotations) || config.rotations;
            config.populationSize = parseInt(c.populationSize) || config.populationSize;
            config.mutationRate = parseInt(c.mutationRate) || config.mutationRate;
            config.useHoles = !!c.useHoles;
            config.exploreConcave = !!c.exploreConcave;

            SvgParser.config({ tolerance: config.curveTolerance });
            best = null;
            nfpCache = {};
            binPolygon = null;
            GA = null;

            return config;
        };

        this.start = function(progressCallback, displayCallback) {
            if (!svg || !bin) {
                return false;
            }

            parts = Array.prototype.slice.call(svg.childNodes);
            const binindex = parts.indexOf(bin);

            if (binindex >= 0) {
                parts.splice(binindex, 1);
            }

            tree = this.getParts(parts.slice(0));
            offsetTree(tree, 0.5 * config.spacing, this.polygonOffset.bind(this));

            function offsetTree(t, offset, offsetFunction) {
                for (let i = 0; i < t.length; i++) {
                    const offsetpaths = offsetFunction(t[i], offset);
                    if (offsetpaths.length == 1) {
                        Array.prototype.splice.apply(t[i], [0, t[i].length].concat(offsetpaths[0]));
                    }
                    if (t[i].childNodes && t[i].childNodes.length > 0) {
                        offsetTree(t[i].childNodes, -offset, offsetFunction);
                    }
                }
            }

            binPolygon = SvgParser.polygonify(bin);
            binPolygon = this.cleanPolygon(binPolygon);

            if (!binPolygon || binPolygon.length < 3) {
                return false;
            }

            binBounds = GeometryUtil.getPolygonBounds(binPolygon);

            if (config.spacing > 0) {
                const offsetBin = this.polygonOffset(binPolygon, -0.5 * config.spacing);
                if (offsetBin.length == 1) {
                    binPolygon = offsetBin.pop();
                }
            }

            binPolygon.id = -1;

            let xbinmax = binPolygon[0].x;
            let xbinmin = binPolygon[0].x;
            let ybinmax = binPolygon[0].y;
            let ybinmin = binPolygon[0].y;

            for (let i = 1; i < binPolygon.length; i++) {
                if (binPolygon[i].x > xbinmax) {
                    xbinmax = binPolygon[i].x;
                } else if (binPolygon[i].x < xbinmin) {
                    xbinmin = binPolygon[i].x;
                }
                if (binPolygon[i].y > ybinmax) {
                    ybinmax = binPolygon[i].y;
                } else if (binPolygon[i].y < ybinmin) {
                    ybinmin = binPolygon[i].y;
                }
            }

            for (let i = 0; i < binPolygon.length; i++) {
                binPolygon[i].x -= xbinmin;
                binPolygon[i].y -= ybinmin;
            }

            binPolygon.width = xbinmax - xbinmin;
            binPolygon.height = ybinmax - ybinmin;

            if (GeometryUtil.polygonArea(binPolygon) > 0) {
                binPolygon.reverse();
            }

            for (let i = 0; i < tree.length; i++) {
                const start = tree[i][0];
                const end = tree[i][tree[i].length - 1];
                if (start == end || (GeometryUtil.almostEqual(start.x, end.x) && GeometryUtil.almostEqual(start.y, end.y))) {
                    tree[i].pop();
                }
                if (GeometryUtil.polygonArea(tree[i]) > 0) {
                    tree[i].reverse();
                }
            }

            this.working = false;
            workerTimer = setInterval(() => {
                if (!this.working) {
                    this.launchWorkers.call(this, tree, binPolygon, config, progressCallback, displayCallback);
                    this.working = true;
                }
                progressCallback(progress);
            }, 100);
        };

        this.launchWorkers = function(tree, binPolygon, config, progressCallback, displayCallback) {
            function shuffle(array) {
                let currentIndex = array.length;
                while (currentIndex !== 0) {
                    const randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
                }
                return array;
            }

            let i, j;

            if (GA === null) {
                const adam = tree.slice(0);
                adam.sort((a, b) => Math.abs(GeometryUtil.polygonArea(b)) - Math.abs(GeometryUtil.polygonArea(a)));
                GA = new GeneticAlgorithm(adam, binPolygon, config);
            }

            let individual = null;

            for (i = 0; i < GA.population.length; i++) {
                if (!GA.population[i].fitness) {
                    individual = GA.population[i];
                    break;
                }
            }

            if (individual === null) {
                GA.generation();
                individual = GA.population[1];
            }

            const placelist = individual.placement;
            const rotations = individual.rotation;

            const ids = [];
            for (i = 0; i < placelist.length; i++) {
                ids.push(placelist[i].id);
                placelist[i].rotation = rotations[i];
            }

            const nfpPairs = [];
            let key;
            const newCache = {};

            for (i = 0; i < placelist.length; i++) {
                const part = placelist[i];
                key = { A: binPolygon.id, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i] };
                if (!nfpCache[JSON.stringify(key)]) {
                    nfpPairs.push({ A: binPolygon, B: part, key: key });
                } else {
                    newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)];
                }
                for (j = 0; j < i; j++) {
                    const placed = placelist[j];
                    key = { A: placed.id, B: part.id, inside: false, Arotation: rotations[j], Brotation: rotations[i] };
                    if (!nfpCache[JSON.stringify(key)]) {
                        nfpPairs.push({ A: placed, B: part, key: key });
                    } else {
                        newCache[JSON.stringify(key)] = nfpCache[JSON.stringify(key)];
                    }
                }
            }

            nfpCache = newCache;

            const worker = new PlacementWorker(binPolygon, placelist.slice(0), ids, rotations, config, nfpCache);

            const p = new Parallel(nfpPairs, {
                env: {
                    binPolygon: binPolygon,
                    searchEdges: config.exploreConcave,
                    useHoles: config.useHoles
                },
                evalPath: 'util/eval.js'
            });

            p.require('matrix.js');
            p.require('geometryutil.js');
            p.require('placementworker.js');
            p.require('clipper.js');

            this.working = true;

            p.map(pair => {
                if (!pair || pair.length == 0) {
                    return null;
                }
                const searchEdges = global.env.searchEdges;
                const useHoles = global.env.useHoles;

                const A = rotatePolygon(pair.A, pair.key.Arotation);
                const B = rotatePolygon(pair.B, pair.key.Brotation);

                let nfp;

                if (pair.key.inside) {
                    nfp = GeometryUtil.noFitPolygon(A, B, true, searchEdges);
                    if (nfp && nfp.length > 0) {
                        for (let i = 0; i < nfp.length; i++) {
                            if (GeometryUtil.polygonArea(nfp[i]) > 0) {
                                nfp[i].reverse();
                            }
                        }
                    }
                } else {
                    nfp = minkowskiDifference(A, B);
                    if (nfp.length == 0) {
                        return null;
                    }
                    for (let i = 0; i < nfp.length; i++) {
                        if (GeometryUtil.polygonArea(nfp[i]) > 0) {
                            nfp[i].reverse();
                        }
                    }
                }

                return { key: pair.key, value: nfp };
            }).then(generatedNfp => {
                if (generatedNfp) {
                    for (let i = 0; i < generatedNfp.length; i++) {
                        const Nfp = generatedNfp[i];
                        if (Nfp) {
                            const key = JSON.stringify(Nfp.key);
                            nfpCache[key] = Nfp.value;
                        }
                    }
                }
                worker.nfpCache = nfpCache;

                const p2 = new Parallel([placelist.slice(0)], {
                    env: {
                        self: worker
                    },
                    evalPath: 'util/eval.js'
                });

                p2.require('json.js');
                p2.require('clipper.js');
                p2.require('matrix.js');

                p2.map(individual => {
                    const fitness = individualFitness(individual);
                    return fitness;
                }).then(results => {
                    GA.population = GA.population.slice(0, 1);
                    GA.population[0].fitness = results[0];
                    GA.generation();
                    self.working = false;
                    displayCallback(GA.population[0]);
                });
            });

            this.working = false;
            progressCallback(progress);
        };

        this.stop = function() {
            if (workerTimer) {
                clearInterval(workerTimer);
            }
        };

        this.cleanPolygon = function(polygon) {
            const cleaned = [];
            for (let i = 0; i < polygon.length; i++) {
                if (polygon[i] && polygon[i].x !== undefined && polygon[i].y !== undefined) {
                    cleaned.push(polygon[i]);
                }
            }
            return cleaned;
        };

        this.polygonOffset = function(polygon, offset) {
            ClipperLib.JS.ScaleUpPath(polygon, config.clipperScale);
            const co = new ClipperLib.ClipperOffset();
            co.AddPath(polygon, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
            const newpaths = [];
            co.Execute(newpaths, offset * config.clipperScale);
            for (let i = 0; i < newpaths.length; i++) {
                ClipperLib.JS.ScaleDownPath(newpaths[i], config.clipperScale);
            }
            return newpaths;
        };

        this.getParts = function(nodes) {
            const parts = [];
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].tagName === 'g') {
                    parts.push.apply(parts, this.getParts(nodes[i].childNodes));
                } else if (nodes[i].tagName === 'polygon' || nodes[i].tagName === 'polyline' || nodes[i].tagName === 'path') {
                    parts.push(SvgParser.polygonify(nodes[i]));
                }
            }
            return parts;
        };

        function rotatePolygon(polygon, degrees) {
            const angle = degrees * Math.PI / 180;
            const rotated = [];
            for (let i = 0; i < polygon.length; i++) {
                const x = polygon[i].x;
                const y = polygon[i].y;
                rotated.push({
                    x: x * Math.cos(angle) - y * Math.sin(angle),
                    y: x * Math.sin(angle) + y * Math.cos(angle)
                });
            }
            return rotated;
        }

        function minkowskiDifference(A, B) {
            const Ac = toClipperCoordinates(A);
            ClipperLib.JS.ScaleUpPath(Ac, config.clipperScale);
            const Bc = toClipperCoordinates(B);
            ClipperLib.JS.ScaleUpPath(Bc, config.clipperScale);
            for (let i = 0; i < Bc.length; i++) {
                Bc[i].X *= -1;
                Bc[i].Y *= -1;
            }
            const solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
            let clipperNfp;

            let largestArea = null;
            for (let i = 0; i < solution.length; i++) {
                const n = toNestCoordinates(solution[i], config.clipperScale);
                const sarea = GeometryUtil.polygonArea(n);
                if (largestArea === null || largestArea > sarea) {
                    clipperNfp = n;
                    largestArea = sarea;
                }
            }

            for (let i = 0; i < clipperNfp.length; i++) {
                clipperNfp[i].x += B[0].x;
                clipperNfp[i].y += B[0].y;
            }

            return [clipperNfp];
        }

        function toClipperCoordinates(polygon) {
            return polygon.map(point => ({ X: point.x, Y: point.y }));
        }

        function toNestCoordinates(polygon, scale) {
            return polygon.map(point => ({ x: point.X / scale, y: point.Y / scale }));
        }

        function individualFitness(individual) {
            const GA = global.env.self;
            const placement = individual.placement;
            let binArea = 0;
            for (let i = 0; i < placement.length; i++) {
                const bounds = GeometryUtil.getPolygonBounds(placement[i]);
                binArea += bounds.width * bounds.height;
            }
            const fitness = binArea / GA.binBounds.width / GA.binBounds.height;
            return fitness;
        }
    }

}(typeof window !== 'undefined' ? window : self));

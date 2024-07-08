(() => {
    'use strict';

    const SvgNest = {
        config: {
            clipperScale: 10000000,
            curveTolerance: 0.3,
            spacing: 0,
            rotations: 4,
            populationSize: 10,
            mutationRate: 10,
            useHoles: true,
            exploreConcave: false
        },

        // set the config from the outside
        setConfig: (config) => {
            const keys = Object.keys(config);
            for (const key of keys) {
                if (key in SvgNest.config) {
                    SvgNest.config[key] = config[key];
                }
            }

            // update spacing in clipper as well
            ClipperLib.JS.ScaleUpPath(SvgNest.binPolygon, SvgNest.config.clipperScale);
            const spacing = SvgNest.config.spacing * SvgNest.config.clipperScale;
            SvgNest.binPolygon = ClipperLib.Clipper.OffsetPolygons([SvgNest.binPolygon], -spacing, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
            for (const poly of SvgNest.binPolygon) {
                for (const point of poly) {
                    point.X = parseInt(point.X);
                    point.Y = parseInt(point.Y);
                }
            }
        },

        // set the SVG string to nest
        setbin: (bin) => {
            const binparser = new DOMParser();
            const binDoc = binparser.parseFromString(bin, "image/svg+xml");

            if (binDoc.getElementsByTagName("parsererror").length) {
                throw new Error("Error while parsing SVG");
            }

            SvgNest.binsvg = binDoc.querySelector('svg');
            SvgNest.bins = SvgParser.toPath(binDoc);

            SvgNest.binPolygon = SvgParser.polygonify(SvgNest.bins);
            ClipperLib.JS.ScaleUpPath(SvgNest.binPolygon, SvgNest.config.clipperScale);

            SvgNest.tree = null;
        },

        // set the SVG string to nest
        setparts: (parts) => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(parts, "image/svg+xml");

            if (svgDoc.getElementsByTagName("parsererror").length) {
                throw new Error("Error while parsing SVG");
            }

            SvgNest.partssvg = svgDoc.querySelector('svg');
            const paths = SvgParser.toPath(svgDoc);

            SvgNest.parts = [];
            for (let i = 0; i < paths.length; i++) {
                let poly = SvgParser.polygonify(paths[i]);
                const cleanPoly = ClipperLib.Clipper.CleanPolygon(poly, 0.01 * SvgNest.config.curveTolerance * SvgNest.config.clipperScale);
                if (cleanPoly) {
                    SvgNest.parts.push(cleanPoly);
                }
            }

            // rectify all polygons
            for (let i = 0; i < SvgNest.parts.length; i++) {
                let p = SvgNest.parts[i];
                if (!ClipperLib.Clipper.Orientation(p)) {
                    p.reverse();
                }

                const area = Math.abs(ClipperLib.Clipper.Area(p));
                if (area < 1) {
                    SvgNest.parts.splice(i, 1);
                    i--;
                }
            }

            // sort by area descending
            SvgNest.parts.sort((a, b) => {
                return Math.abs(ClipperLib.Clipper.Area(b)) - Math.abs(ClipperLib.Clipper.Area(a));
            });

            SvgNest.tree = null;
        },

        // start nesting
        start: (progressCallback, displayCallback) => {
            // build the tree
            if (!SvgNest.tree) {
                SvgNest.tree = new RectTree(SvgNest.binPolygon);
                SvgNest.remainingParts = SvgNest.parts.slice(0);
            }

            const p = new Parallel([SvgNest.binPolygon, SvgNest.tree, SvgNest.remainingParts, SvgNest.config], {evalPath: 'util/eval.js'});

            p.require('util/clipper.js');
            p.require('util/parallel.js');
            p.require('util/geometryutil.js');
            p.require('util/placementworker.js');

            p.spawn(PlacementWorker).then((data) => {
                SvgNest.setState(data);
                SvgNest.applyPlacement(data.placements);

                if (progressCallback) {
                    progressCallback(1 - SvgNest.remainingParts.length / SvgNest.parts.length);
                }

                if (displayCallback) {
                    displayCallback(SvgNest.applyPlacement(data.placements), data.fitness, data.placements.length, SvgNest.parts.length);
                }

                if (SvgNest.remainingParts.length > 0) {
                    setTimeout(() => {
                        SvgNest.start(progressCallback, displayCallback);
                    }, 0);
                }
            });
        },

        // stop nesting
        stop: () => {
            if (SvgNest.placementWorker) {
                SvgNest.placementWorker.terminate();
                SvgNest.placementWorker = null;
            }
        },

        // apply placement to SVG
        applyPlacement: (placement) => {
            const svg = SvgNest.partssvg.cloneNode(true);
            const binclone = SvgNest.binsvg.cloneNode(true);

            svg.setAttribute('width', binclone.getAttribute('width'));
            svg.setAttribute('height', binclone.getAttribute('height'));

            const bingroup = document.createElementNS('http://www.w3.org/2000/svg','g');

            for (let i = 0; i < placement.length; i++) {
                const p = placement[i];
                const part = svg.querySelector('#' + p.id);

                if (part) {
                    const partgroup = document.createElementNS('http://www.w3.org/2000/svg','g');
                    partgroup.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ') rotate(' + p.rotation + ')');
                    part.removeAttribute('id');
                    partgroup.appendChild(part);
                    bingroup.appendChild(partgroup);
                }
            }

            const binPaths = binclone.querySelectorAll('path');
            for (let i = 0; i < binPaths.length; i++) {
                bingroup.appendChild(binPaths[i]);
            }

            svg.appendChild(bingroup);

            return svg;
        },

        // get a progress estimate
        progress: () => {
            return 1 - SvgNest.remainingParts.length / SvgNest.parts.length;
        },

        // set the current state from a worker
        setState: (state) => {
            SvgNest.remainingParts = state.paths;
            SvgNest.tree = state.tree;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SvgNest;
    }
    else {
        window.SvgNest = SvgNest;
    }
})();
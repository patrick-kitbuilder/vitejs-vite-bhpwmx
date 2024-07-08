// placementworker.js
(function(root) {
    'use strict';

    function PlacementWorker(binPolygon, parts, ids, rotations, config, nfpCache) {
        this.binPolygon = binPolygon;
        this.parts = parts;
        this.ids = ids;
        this.rotations = rotations;
        this.config = config;
        this.nfpCache = nfpCache;
    }

    PlacementWorker.prototype.placeParts = function() {
        const placements = [];
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            const rotation = this.rotations[i];
            const nfp = this.getNfp(this.binPolygon, part, rotation, true);

            if (!nfp || nfp.length === 0) {
                return null;
            }

            const bestPlacement = this.findBestPlacement(nfp, part);
            placements.push(bestPlacement);
        }

        return placements;
    };

    PlacementWorker.prototype.getNfp = function(binPolygon, part, rotation, inside) {
        const key = JSON.stringify({
            A: binPolygon.id,
            B: part.id,
            Arotation: 0,
            Brotation: rotation,
            inside: inside
        });

        if (this.nfpCache[key]) {
            return this.nfpCache[key];
        }

        const A = rotatePolygon(binPolygon, 0);
        const B = rotatePolygon(part, rotation);

        let nfp;
        if (inside) {
            nfp = GeometryUtil.noFitPolygon(A, B, true);
        } else {
            nfp = minkowskiDifference(A, B);
        }

        this.nfpCache[key] = nfp;
        return nfp;
    };

    PlacementWorker.prototype.findBestPlacement = function(nfp, part) {
        let minArea = Infinity;
        let bestPlacement = null;

        for (let i = 0; i < nfp.length; i++) {
            const placedPart = translatePolygon(part, nfp[i]);
            const area = GeometryUtil.polygonArea(placedPart);

            if (area < minArea) {
                minArea = area;
                bestPlacement = placedPart;
            }
        }

        return bestPlacement;
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

    function translatePolygon(polygon, point) {
        const translated = [];
        for (let i = 0; i < polygon.length; i++) {
            translated.push({
                x: polygon[i].x + point.x,
                y: polygon[i].y + point.y
            });
        }
        return translated;
    }

    function minkowskiDifference(A, B) {
        const Ac = toClipperCoordinates(A);
        ClipperLib.JS.ScaleUpPath(Ac, 10000000);
        const Bc = toClipperCoordinates(B);
        ClipperLib.JS.ScaleUpPath(Bc, 10000000);

        for (let i = 0; i < Bc.length; i++) {
            Bc[i].X *= -1;
            Bc[i].Y *= -1;
        }

        const solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
        let clipperNfp;
        let largestArea = null;

        for (let i = 0; i < solution.length; i++) {
            const n = toNestCoordinates(solution[i], 10000000);
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

    root.PlacementWorker = PlacementWorker;

}(typeof window !== 'undefined' ? window : global));


// clipperjs uses alerts for warnings
function alert(message) { 
    console.log('alert: ', message);
}

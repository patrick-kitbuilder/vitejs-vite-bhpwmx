// jsClipper uses X/Y instead of x/y...
const toClipperCoordinates = (polygon) => {
    return polygon.map(point => ({
        X: point.x,
        Y: point.y
    }));
};

const toNestCoordinates = (polygon, scale) => {
    return polygon.map(point => ({
        x: point.X / scale,
        y: point.Y / scale
    }));
};

const rotatePolygon = (polygon, degrees) => {
    const angle = degrees * Math.PI / 180;
    const rotated = polygon.map(point => {
        const x1 = point.x * Math.cos(angle) - point.y * Math.sin(angle);
        const y1 = point.x * Math.sin(angle) + point.y * Math.cos(angle);
        return {x: x1, y: y1};
    });

    if (polygon.children && polygon.children.length > 0) {
        rotated.children = polygon.children.map(child => rotatePolygon(child, degrees));
    }

    return rotated;
};

class PlacementWorker {
    constructor(binPolygon, paths, ids, rotations, config, nfpCache) {
        this.binPolygon = binPolygon;
        this.paths = paths;
        this.ids = ids;
        this.rotations = rotations;
        this.config = config;
        this.nfpCache = nfpCache || {};
    }

    placePaths(paths) {
        const self = global.env.self;

        if (!self.binPolygon) {
            return null;
        }

        let rotated = paths.map(path => {
            const r = rotatePolygon(path, path.rotation);
            r.rotation = path.rotation;
            r.source = path.source;
            r.id = path.id;
            return r;
        });

        paths = rotated;

        let allplacements = [];
        let fitness = 0;
        const binarea = Math.abs(GeometryUtil.polygonArea(self.binPolygon));
        let key, nfp;

        while (paths.length > 0) {
            let placed = [];
            let placements = [];
            fitness += 1; // add 1 for each new bin opened (lower fitness is better)

            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];

                // inner NFP
                key = JSON.stringify({A:-1, B:path.id, inside:true, Arotation:0, Brotation:path.rotation});
                const binNfp = self.nfpCache[key];

                // part unplaceable, skip
                if (!binNfp || binNfp.length == 0) {
                    continue;
                }

                // ensure all necessary NFPs exist
                let error = false;
                for (let j = 0; j < placed.length; j++) {
                    key = JSON.stringify({A:placed[j].id, B:path.id, inside:false, Arotation:placed[j].rotation, Brotation:path.rotation});
                    nfp = self.nfpCache[key];

                    if (!nfp) {
                        error = true;
                        break;
                    }
                }

                // part unplaceable, skip
                if (error) {
                    continue;
                }

                let position = null;
                if (placed.length == 0) {
                    // first placement, put it on the left
                    for (let j = 0; j < binNfp.length; j++) {
                        for (let k = 0; k < binNfp[j].length; k++) {
                            if (position === null || binNfp[j][k].x - path[0].x < position.x) {
                                position = {
                                    x: binNfp[j][k].x - path[0].x,
                                    y: binNfp[j][k].y - path[0].y,
                                    id: path.id,
                                    rotation: path.rotation
                                };
                            }
                        }
                    }

                    placements.push(position);
                    placed.push(path);

                    continue;
                }

                let clipperBinNfp = binNfp.map(polygon => {
                    const clipperPolygon = toClipperCoordinates(polygon);
                    ClipperLib.JS.ScaleUpPath(clipperPolygon, self.config.clipperScale);
                    return clipperPolygon;
                });

                let clipper = new ClipperLib.Clipper();
                let combinedNfp = new ClipperLib.Paths();

                for (let j = 0; j < placed.length; j++) {
                    key = JSON.stringify({A:placed[j].id, B:path.id, inside:false, Arotation:placed[j].rotation, Brotation:path.rotation});
                    nfp = self.nfpCache[key];

                    if (!nfp) {
                        continue;
                    }

                    for (let k = 0; k < nfp.length; k++) {
                        let clone = toClipperCoordinates(nfp[k]);
                        for (let m = 0; m < clone.length; m++) {
                            clone[m].X += placements[j].x;
                            clone[m].Y += placements[j].y;
                        }

                        ClipperLib.JS.ScaleUpPath(clone, self.config.clipperScale);
                        clone = ClipperLib.Clipper.CleanPolygon(clone, 0.0001 * self.config.clipperScale);
                        const area = Math.abs(ClipperLib.Clipper.Area(clone));
                        if (clone.length > 2 && area > 0.1 * self.config.clipperScale * self.config.clipperScale) {
                            clipper.AddPath(clone, ClipperLib.PolyType.ptSubject, true);
                        }
                    }
                }

                if (!clipper.Execute(ClipperLib.ClipType.ctUnion, combinedNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
                    continue;
                }

                // difference with bin polygon
                let finalNfp = new ClipperLib.Paths();
                clipper = new ClipperLib.Clipper();

                clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
                clipper.AddPaths(clipperBinNfp, ClipperLib.PolyType.ptSubject, true);
                if (!clipper.Execute(ClipperLib.ClipType.ctDifference, finalNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
                    continue;
                }

                finalNfp = ClipperLib.Clipper.CleanPolygons(finalNfp, 0.0001 * self.config.clipperScale);

                for (let j = 0; j < finalNfp.length; j++) {
                    const area = Math.abs(ClipperLib.Clipper.Area(finalNfp[j]));
                    if (finalNfp[j].length < 3 || area < 0.1 * self.config.clipperScale * self.config.clipperScale) {
                        finalNfp.splice(j, 1);
                        j--;
                    }
                }

                if (!finalNfp || finalNfp.length == 0) {
                    continue;
                }

                let f = finalNfp.map(polygon => toNestCoordinates(polygon, self.config.clipperScale));
                finalNfp = f;

                // choose placement that results in the smallest bounding box
                let minwidth = null;
                let minarea = null;
                let minx = null;
                let nf, area, shiftvector;

                for (let j = 0; j < finalNfp.length; j++) {
                    nf = finalNfp[j];
                    if (Math.abs(GeometryUtil.polygonArea(nf)) < 2) {
                        continue;
                    }

                    for (let k = 0; k < nf.length; k++) {
                        let allpoints = [];
                        for (let m = 0; m < placed.length; m++) {
                            for (let n = 0; n < placed[m].length; n++) {
                                allpoints.push({x: placed[m][n].x + placements[m].x, y: placed[m][n].y + placements[m].y});
                            }
                        }

                        shiftvector = {
                            x: nf[k].x - path[0].x,
                            y: nf[k].y - path[0].y,
                            id: path.id,
                            rotation: path.rotation,
                            nfp: combinedNfp
                        };

                        for (let m = 0; m < path.length; m++) {
                            allpoints.push({x: path[m].x + shiftvector.x, y: path[m].y + shiftvector.y});
                        }

                        let rectbounds = GeometryUtil.getPolygonBounds(allpoints);

                        // weigh width more, to help compress in direction of gravity
                        area = rectbounds.width * 2 + rectbounds.height;

                        if (minarea === null || area < minarea || (GeometryUtil.almostEqual(minarea, area) && (minx === null || shiftvector.x < minx))) {
                            minarea = area;
                            minwidth = rectbounds.width;
                            position = shiftvector;
                            minx = shiftvector.x;
                        }
                    }
                }
                if (position) {
                    placed.push(path);
                    placements.push(position);
                }
            }

            if (minwidth) {
                fitness += minwidth / binarea;
            }

            for (let i = 0; i < placed.length; i++) {
                const index = paths.indexOf(placed[i]);
                if (index >= 0) {
                    paths.splice(index, 1);
                }
            }

            if (placements && placements.length > 0) {
                allplacements.push(placements);
            } else {
                break; // something went wrong
            }
        }

        // there were parts that couldn't be placed
        fitness += 2 * paths.length;

        return {placements: allplacements, fitness: fitness, paths: paths, area: binarea};
    }
}

(typeof window !== 'undefined' ? window : self).PlacementWorker = PlacementWorker;

// clipperjs uses alerts for warnings
function alert(message) { 
    console.log('alert: ', message);
}
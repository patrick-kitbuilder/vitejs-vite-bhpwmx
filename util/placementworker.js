// jsClipper uses X/Y instead of x/y...
function toClipperCoordinates(polygon) {
  var clone = [];
  for (var i = 0; i < polygon.length; i++) {
    clone.push({
      X: polygon[i].x,
      Y: polygon[i].y,
    });
  }

  return clone;
}

function toNestCoordinates(polygon, scale) {
  var clone = [];
  for (var i = 0; i < polygon.length; i++) {
    clone.push({
      x: polygon[i].X / scale,
      y: polygon[i].Y / scale,
    });
  }

  return clone;
}

function rotatePolygon(polygon, degrees) {
  var rotated = [];
  var angle = (degrees * Math.PI) / 180;
  for (var i = 0; i < polygon.length; i++) {
    var x = polygon[i].x;
    var y = polygon[i].y;
    var x1 = x * Math.cos(angle) - y * Math.sin(angle);
    var y1 = x * Math.sin(angle) + y * Math.cos(angle);

    rotated.push({ x: x1, y: y1 });
  }

  if (polygon.children && polygon.children.length > 0) {
    rotated.children = [];
    for (var j = 0; j < polygon.children.length; j++) {
      rotated.children.push(rotatePolygon(polygon.children[j], degrees));
    }
  }

  return rotated;
}

function simplifyPolygons(polygons, tolerance) {
  var simplified = [];
  for (var i = 0; i < polygons.length; i++) {
    var simplifiedPolygon = ClipperLib.Clipper.SimplifyPolygon(
      polygons[i],
      ClipperLib.PolyFillType.pftNonZero
    );
    simplified.push(simplifiedPolygon);
  }
  return simplified;
}

function PlacementWorker(binPolygon, paths, ids, rotations, config, nfpCache) {
  this.binPolygon = binPolygon;
  this.paths = paths;
  this.ids = ids;
  this.rotations = rotations;
  this.config = config;
  this.nfpCache = nfpCache || {};

  // return a placement for the paths/rotations given
  // happens inside a webworker
  this.placePaths = function (paths) {
    var self = global.env.self;

    if (!self.binPolygon) {
      console.log('No bin polygon provided.');
      return null;
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      console.error('Paths array is either not an array or is empty:', paths);
      return null;
    }

    var i, j, k, m, n, path;

    // Simplify polygons before processing
    paths = simplifyPolygons(paths, 0.1); // Adjust tolerance as needed

    // Sort paths based on area in descending order
    paths.sort(function (a, b) {
      return (
        Math.abs(GeometryUtil.polygonArea(b)) -
        Math.abs(GeometryUtil.polygonArea(a))
      );
    });

    var allplacements = [];
    var fitness = 0;
    var binarea = Math.abs(GeometryUtil.polygonArea(self.binPolygon));
    var key, nfp;

    var maxIterations = 1000; // Set a maximum number of iterations
    var iterationCount = 0;

    while (paths.length > 0) {
      console.log('Iteration:', iterationCount);

      var placed = [];
      var placements = [];
      fitness += 1; // add 1 for each new bin opened (lower fitness is better)

      for (i = 0; i < paths.length; i++) {
        path = paths[i];
        console.log('Processing path:', path);

        if (!path || !path.id) {
          console.error('Path or Path ID is undefined. Path:', path);
          continue;
        }

        var maxRotations = 4; // Only consider 4 rotations (0, 90, 180, 270 degrees)

        for (var r = 0; r < maxRotations; r++) {
          var rotatedPath = rotatePolygon(path, r * 90);
          rotatedPath.rotation = r * 90;
          rotatedPath.source = path.source;
          rotatedPath.id = path.id;
          console.log('Trying rotation:', rotatedPath.rotation);

          // inner NFP
          key = JSON.stringify({
            A: -1,
            B: rotatedPath.id,
            inside: true,
            Arotation: 0,
            Brotation: rotatedPath.rotation,
          });
          var binNfp = self.nfpCache[key];

          // part unplaceable, skip
          if (!binNfp || binNfp.length == 0) {
            console.log('No NFP found for key:', key);
            continue;
          }

          // ensure all necessary NFPs exist
          var error = false;
          for (j = 0; j < placed.length; j++) {
            key = JSON.stringify({
              A: placed[j].id,
              B: rotatedPath.id,
              inside: false,
              Arotation: placed[j].rotation,
              Brotation: rotatedPath.rotation,
            });
            nfp = self.nfpCache[key];

            if (!nfp) {
              error = true;
              console.log('Missing NFP for key:', key);
              break;
            }
          }

          // part unplaceable, skip
          if (error) {
            continue;
          }

          var position = null;
          if (placed.length == 0) {
            // first placement, put it on the left
            for (j = 0; j < binNfp.length; j++) {
              for (k = 0; k < binNfp[j].length; k++) {
                if (
                  position === null ||
                  binNfp[j][k].x - rotatedPath[0].x < position.x
                ) {
                  position = {
                    x: binNfp[j][k].x - rotatedPath[0].x,
                    y: binNfp[j][k].y - rotatedPath[0].y,
                    id: rotatedPath.id,
                    rotation: rotatedPath.rotation,
                  };
                  console.log('Initial placement position:', position);
                }
              }
            }

            placements.push(position);
            placed.push(rotatedPath);

            continue;
          }

          var clipperBinNfp = [];
          for (j = 0; j < binNfp.length; j++) {
            clipperBinNfp.push(toClipperCoordinates(binNfp[j]));
          }

          ClipperLib.JS.ScaleUpPaths(clipperBinNfp, self.config.clipperScale);

          var clipper = new ClipperLib.Clipper();
          var combinedNfp = new ClipperLib.Paths();

          for (j = 0; j < placed.length; j++) {
            key = JSON.stringify({
              A: placed[j].id,
              B: rotatedPath.id,
              inside: false,
              Arotation: placed[j].rotation,
              Brotation: rotatedPath.rotation,
            });
            nfp = self.nfpCache[key];

            if (!nfp) {
              console.log('Missing NFP during combination for key:', key);
              continue;
            }

            for (k = 0; k < nfp.length; k++) {
              var clone = toClipperCoordinates(nfp[k]);
              for (m = 0; m < clone.length; m++) {
                clone[m].X += placements[j].x;
                clone[m].Y += placements[j].y;
              }

              ClipperLib.JS.ScaleUpPath(clone, self.config.clipperScale);
              clone = ClipperLib.Clipper.CleanPolygon(
                clone,
                0.0001 * self.config.clipperScale
              );
              var area = Math.abs(ClipperLib.Clipper.Area(clone));
              if (
                clone.length > 2 &&
                area > 0.1 * self.config.clipperScale * self.config.clipperScale
              ) {
                clipper.AddPath(clone, ClipperLib.PolyType.ptSubject, true);
              }
            }
          }

          if (
            !clipper.Execute(
              ClipperLib.ClipType.ctUnion,
              combinedNfp,
              ClipperLib.PolyFillType.pftNonZero,
              ClipperLib.PolyFillType.pftNonZero
            )
          ) {
            console.log('Clipper union operation failed.');
            continue;
          }

          // difference with bin polygon
          var finalNfp = new ClipperLib.Paths();
          clipper = new ClipperLib.Clipper();

          clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
          clipper.AddPaths(clipperBinNfp, ClipperLib.PolyType.ptSubject, true);
          if (
            !clipper.Execute(
              ClipperLib.ClipType.ctDifference,
              finalNfp,
              ClipperLib.PolyFillType.pftNonZero,
              ClipperLib.PolyFillType.pftNonZero
            )
          ) {
            console.log('Clipper difference operation failed.');
            continue;
          }

          finalNfp = ClipperLib.Clipper.CleanPolygons(
            finalNfp,
            0.0001 * self.config.clipperScale
          );

          for (j = 0; j < finalNfp.length; j++) {
            var area = Math.abs(ClipperLib.Clipper.Area(finalNfp[j]));
            if (
              finalNfp[j].length < 3 ||
              area < 0.1 * self.config.clipperScale * self.config.clipperScale
            ) {
              finalNfp.splice(j, 1);
              j--;
            }
          }

          if (!finalNfp || finalNfp.length == 0) {
            console.log('Final NFP is empty.');
            continue;
          }

          var f = [];
          for (j = 0; j < finalNfp.length; j++) {
            // back to normal scale
            f.push(toNestCoordinates(finalNfp[j], self.config.clipperScale));
          }
          finalNfp = f;

          // choose placement that results in the smallest bounding box
          // could use convex hull instead, but it can create oddly shaped nests (triangles or long slivers) which are not optimal for real-world use
          // todo: generalize gravity direction
          var minwidth = null;
          var minarea = null;
          var minx = null;
          var nf, area, shiftvector;

          for (j = 0; j < finalNfp.length; j++) {
            nf = finalNfp[j];
            if (Math.abs(GeometryUtil.polygonArea(nf)) < 2) {
              continue;
            }

            for (k = 0; k < nf.length; k++) {
              var allpoints = [];
              for (m = 0; m < placed.length; m++) {
                for (n = 0; n < placed[m].length; n++) {
                  allpoints.push({
                    x: placed[m][n].x + placements[m].x,
                    y: placed[m][n].y + placements[m].y,
                  });
                }
              }

              shiftvector = {
                x: nf[k].x - rotatedPath[0].x,
                y: nf[k].y - rotatedPath[0].y,
                id: rotatedPath.id,
                rotation: rotatedPath.rotation,
                nfp: combinedNfp,
              };

              for (m = 0; m < rotatedPath.length; m++) {
                allpoints.push({
                  x: rotatedPath[m].x + shiftvector.x,
                  y: rotatedPath[m].y + shiftvector.y,
                });
              }

              var rectbounds = GeometryUtil.getPolygonBounds(allpoints);

              // weigh width more, to help compress in direction of gravity
              area = rectbounds.width * 2 + rectbounds.height;

              if (
                minarea === null ||
                area < minarea ||
                (GeometryUtil.almostEqual(minarea, area) &&
                  (minx === null || shiftvector.x < minx))
              ) {
                minarea = area;
                minwidth = rectbounds.width;
                position = shiftvector;
                minx = shiftvector.x;
              }
            }
          }
          if (position) {
            console.log('Position found:', position);
            placed.push(rotatedPath);
            placements.push(position);
          } else {
            console.log(
              'No valid position found for path id:',
              rotatedPath.id,
              'with rotation:',
              rotatedPath.rotation
            );
          }
        }
      }

      if (minwidth) {
        fitness += minwidth / binarea;
      }

      for (i = 0; i < placed.length; i++) {
        var index = paths.indexOf(placed[i]);
        if (index >= 0) {
          paths.splice(index, 1);
        }
      }

      if (placements && placements.length > 0) {
        allplacements.push(placements);
      } else {
        console.log('No placements found in this iteration.');
        break; // something went wrong
      }

      if (iterationCount >= maxIterations) {
        console.log('Early termination: maximum iterations reached');
        break;
      }

      iterationCount++;
    }

    // there were parts that couldn't be placed
    fitness += 2 * paths.length;

    console.log(
      'Finished with fitness:',
      fitness,
      'and iterations:',
      iterationCount
    );
    return {
      placements: allplacements,
      fitness: fitness,
      paths: paths,
      area: binarea,
    };
  };
}
(typeof window !== 'undefined' ? window : self).PlacementWorker =
  PlacementWorker;

// clipperjs uses alerts for warnings
function alert(message) {
  console.log('alert: ', message);
}

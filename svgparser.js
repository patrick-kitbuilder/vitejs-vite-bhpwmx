// svgparser.js
(function(root) {
    'use strict';

    function SvgParser() {
        this.svg = null;
        this.svgRoot = null;
        this.allowedElements = ['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect', 'line'];
        this.conf = {
            tolerance: 2,
            toleranceSvg: 0.005
        };
    }

    SvgParser.prototype.config = function(config) {
        this.conf.tolerance = config.tolerance;
    };

    SvgParser.prototype.load = function(svgString) {
        if (!svgString || typeof svgString !== 'string') {
            throw new Error('invalid SVG string');
        }

        var parser = new DOMParser();
        var svg = parser.parseFromString(svgString, "image/svg+xml");

        this.svgRoot = null;

        if (svg) {
            this.svg = svg;
            for (var i = 0; i < svg.childNodes.length; i++) {
                var child = svg.childNodes[i];
                if (child.tagName && child.tagName === 'svg') {
                    this.svgRoot = child;
                    break;
                }
            }
        } else {
            throw new Error("Failed to parse SVG string");
        }

        if (!this.svgRoot) {
            throw new Error("SVG has no children");
        }

        return this.svgRoot;
    };

    SvgParser.prototype.cleanInput = function() {
        this.applyTransform(this.svgRoot);
        this.flatten(this.svgRoot);
        this.filter(this.allowedElements);
        this.recurse(this.svgRoot, this.splitPath);
        return this.svgRoot;
    };

    SvgParser.prototype.getStyle = function() {
        if (!this.svgRoot) {
            return null;
        }
        for (var i = 0; i < this.svgRoot.childNodes.length; i++) {
            var el = this.svgRoot.childNodes[i];
            if (el.tagName === 'style') {
                return el;
            }
        }
        return null;
    };

    SvgParser.prototype.pathToAbsolute = function(path) {
        if (!path || path.tagName !== 'path') {
            throw new Error('invalid path');
        }

        var seglist = path.pathSegList;
        var x = 0, y = 0, x0 = 0, y0 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;

        for (var i = 0; i < seglist.numberOfItems; i++) {
            var s = seglist.getItem(i);
            var command = s.pathSegTypeAsLetter;

            if (/[MLHVCSQTA]/.test(command)) {
                if ('x' in s) x = s.x;
                if ('y' in s) y = s.y;
            } else {
                if ('x1' in s) x1 = x + s.x1;
                if ('x2' in s) x2 = x + s.x2;
                if ('y1' in s) y1 = y + s.y1;
                if ('y2' in s) y2 = y + s.y2;
                if ('x' in s) x += s.x;
                if ('y' in s) y += s.y;
                switch (command) {
                    case 'm':
                        seglist.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                        break;
                    case 'l':
                        seglist.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                        break;
                    case 'h':
                        seglist.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                        break;
                    case 'v':
                        seglist.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                        break;
                    case 'c':
                        seglist.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                        break;
                    case 's':
                        seglist.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                        break;
                    case 'q':
                        seglist.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                        break;
                    case 't':
                        seglist.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                        break;
                    case 'a':
                        seglist.replaceItem(path.createSVGPathSegArcAbs(x, y, s.r1, s.r2, s.angle, s.largeArcFlag, s.sweepFlag), i);
                        break;
                    case 'z':
                    case 'Z':
                        x = x0;
                        y = y0;
                        break;
                }
            }

            if (command === 'M' || command === 'm') {
                x0 = x;
                y0 = y;
            }
        }
    };

    SvgParser.prototype.transformParse = function(transformString) {
        var operations = {
            matrix: true,
            scale: true,
            rotate: true,
            translate: true,
            skewX: true,
            skewY: true
        };

        var CMD_SPLIT_RE = /\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*(.+?)\s*\)[\s,]*/;
        var PARAMS_SPLIT_RE = /[\s,]+/;

        var matrix = new Matrix();
        var cmd, params;

        transformString.split(CMD_SPLIT_RE).forEach(function(item) {
            if (!item.length) {
                return;
            }

            if (operations[item] !== undefined) {
                cmd = item;
                return;
            }

            params = item.split(PARAMS_SPLIT_RE).map(function(i) { return +i || 0; });

            switch (cmd) {
                case 'matrix':
                    if (params.length === 6) {
                        matrix.matrix(params);
                    }
                    break;
                case 'scale':
                    if (params.length === 1) {
                        matrix.scale(params[0], params[0]);
                    } else if (params.length === 2) {
                        matrix.scale(params[0], params[1]);
                    }
                    break;
                case 'rotate':
                    if (params.length === 1) {
                        matrix.rotate(params[0], 0, 0);
                    } else if (params.length === 3) {
                        matrix.rotate(params[0], params[1], params[2]);
                    }
                    break;
                case 'translate':
                    if (params.length === 1) {
                        matrix.translate(params[0], 0);
                    } else if (params.length === 2) {
                        matrix.translate(params[0], params[1]);
                    }
                    break;
                case 'skewX':
                    if (params.length === 1) {
                        matrix.skewX(params[0]);
                    }
                    break;
                case 'skewY':
                    if (params.length === 1) {
                        matrix.skewY(params[0]);
                    }
                    break;
            }
        });

        return matrix;
    };

    SvgParser.prototype.applyTransform = function(element, globalTransform = '') {
        var transformString = element.getAttribute('transform') || '';
        var fullTransform = globalTransform + transformString;

        var transform = transformString.length > 0 ? this.transformParse(fullTransform) : new Matrix();
        var tarray = transform.toArray();

        if (element.tagName === 'g' || element.tagName === 'svg' || element.tagName === 'defs' || element.tagName === 'clipPath') {
            element.removeAttribute('transform');
            var children = Array.prototype.slice.call(element.childNodes);

            for (var i = 0; i < children.length; i++) {
                if (children[i].tagName) {
                    this.applyTransform(children[i], fullTransform);
                }
            }
        } else if (transform && !transform.isIdentity()) {
            var id = element.getAttribute('id');
            var className = element.getAttribute('class');

            switch (element.tagName) {
                case 'ellipse':
                    var path = this.svg.createElementNS(element.namespaceURI, 'path');
                    var move = path.createSVGPathSegMovetoAbs(parseFloat(element.getAttribute('cx')) - parseFloat(element.getAttribute('rx')), element.getAttribute('cy'));
                    var arc1 = path.createSVGPathSegArcAbs(parseFloat(element.getAttribute('cx')) + parseFloat(element.getAttribute('rx')), element.getAttribute('cy'), element.getAttribute('rx'), element.getAttribute('ry'), 0, 1, 0);
                    var arc2 = path.createSVGPathSegArcAbs(parseFloat(element.getAttribute('cx')) - parseFloat(element.getAttribute('rx')), element.getAttribute('cy'), element.getAttribute('rx'), element.getAttribute('ry'), 0, 1, 0);

                    path.pathSegList.appendItem(move);
                    path.pathSegList.appendItem(arc1);
                    path.pathSegList.appendItem(arc2);
                    path.pathSegList.appendItem(path.createSVGPathSegClosePath());

                    var transformPropertyEllipse = element.getAttribute('transform');
                    if (transformPropertyEllipse) {
                        path.setAttribute('transform', transformPropertyEllipse);
                    }

                    element.parentElement.replaceChild(path, element);
                    element = path;

                case 'path':
                    this.pathToAbsolute(element);
                    var seglist = element.pathSegList;
                    var prevx = 0;
                    var prevy = 0;

                    var transformedPath = '';

                    for (var i = 0; i < seglist.numberOfItems; i++) {
                        var s = seglist.getItem(i);
                        var command = s.pathSegTypeAsLetter;

                        if (command === 'H') {
                            seglist.replaceItem(element.createSVGPathSegLinetoAbs(s.x, prevy), i);
                            s = seglist.getItem(i);
                        } else if (command === 'V') {
                            seglist.replaceItem(element.createSVGPathSegLinetoAbs(prevx, s.y), i);
                            s = seglist.getItem(i);
                        } else if (command === 'A') {
                            seglist.replaceItem(element.createSVGPathSegArcAbs(s.x, s.y, s.r1 * scale, s.r2 * scale, s.angle + rotate, s.largeArcFlag, s.sweepFlag), i);
                            s = seglist.getItem(i);
                        }

                        var transPoints = {};

                        if ('x' in s && 'y' in s) {
                            var transformed = transform.calc(s.x, s.y);
                            prevx = s.x;
                            prevy = s.y;
                            transPoints.x = transformed[0];
                            transPoints.y = transformed[1];
                        }
                        if ('x1' in s && 'y1' in s) {
                            var transformed1 = transform.calc(s.x1, s.y1);
                            transPoints.x1 = transformed1[0];
                            transPoints.y1 = transformed1[1];
                        }
                        if ('x2' in s && 'y2' in s) {
                            var transformed2 = transform.calc(s.x2, s.y2);
                            transPoints.x2 = transformed2[0];
                            transPoints.y2 = transformed2[1];
                        }

                        var commandStringTransformed = '';

                        switch (command) {
                            case 'M':
                                commandStringTransformed += `${command} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'L':
                                commandStringTransformed += `${command} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'C':
                                commandStringTransformed += `${command} ${transPoints.x1} ${transPoints.y1}  ${transPoints.x2} ${transPoints.y2} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'S':
                                commandStringTransformed += `${command} ${transPoints.x2} ${transPoints.y2} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'Q':
                                commandStringTransformed += `${command} ${transPoints.x1} ${transPoints.y1} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'T':
                                commandStringTransformed += `${command} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'A':
                                var largeArcFlag = s.largeArcFlag ? 1 : 0;
                                var sweepFlag = s.sweepFlag ? 1 : 0;
                                commandStringTransformed += `${command} ${s.r1} ${s.r2} ${s.angle} ${largeArcFlag} ${sweepFlag} ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'H':
                                commandStringTransformed += `L ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'V':
                                commandStringTransformed += `L ${transPoints.x} ${transPoints.y}`;
                                break;
                            case 'Z':
                            case 'z':
                                commandStringTransformed += command;
                                break;
                        }

                        transformedPath += commandStringTransformed;
                    }

                    element.setAttribute('d', transformedPath);
                    element.removeAttribute('transform');
                    break;

                case 'circle':
                    var transformedCircle = transform.calc(element.getAttribute('cx'), element.getAttribute('cy'));
                    element.setAttribute('cx', transformedCircle[0]);
                    element.setAttribute('cy', transformedCircle[1]);
                    element.setAttribute('r', element.getAttribute('r') * scale);
                    break;

                case 'line':
                    var transformedStartPt = transform.calc(element.getAttribute('x1'), element.getAttribute('y1'));
                    var transformedEndPt = transform.calc(element.getAttribute('x2'), element.getAttribute('y2'));
                    element.setAttribute('x1', transformedStartPt[0]);
                    element.setAttribute('y1', transformedStartPt[1]);
                    element.setAttribute('x2', transformedEndPt[0]);
                    element.setAttribute('y2', transformedEndPt[1]);
                    break;

                case 'rect':
                    var polygon = this.svg.createElementNS(element.namespaceURI, 'polygon');
                    var p1 = this.svgRoot.createSVGPoint();
                    var p2 = this.svgRoot.createSVGPoint();
                    var p3 = this.svgRoot.createSVGPoint();
                    var p4 = this.svgRoot.createSVGPoint();

                    p1.x = parseFloat(element.getAttribute('x')) || 0;
                    p1.y = parseFloat(element.getAttribute('y')) || 0;

                    p2.x = p1.x + parseFloat(element.getAttribute('width'));
                    p2.y = p1.y;

                    p3.x = p2.x;
                    p3.y = p1.y + parseFloat(element.getAttribute('height'));

                    p4.x = p1.x;
                    p4.y = p3.y;

                    polygon.points.appendItem(p1);
                    polygon.points.appendItem(p2);
                    polygon.points.appendItem(p3);
                    polygon.points.appendItem(p4);

                    var transformPropertyRect = element.getAttribute('transform');
                    if (transformPropertyRect) {
                        polygon.setAttribute('transform', transformPropertyRect);
                    }

                    element.parentElement.replaceChild(polygon, element);
                    element = polygon;

                case 'polygon':
                case 'polyline':
                    var transformedPoly = '';
                    for (var i = 0; i < element.points.numberOfItems; i++) {
                        var point = element.points.getItem(i);
                        var transformedPoint = transform.calc(point.x, point.y);
                        var pointPairString = `${transformedPoint[0]},${transformedPoint[1]} `;
                        transformedPoly += pointPairString;
                    }

                    element.setAttribute('points', transformedPoly);
                    element.removeAttribute('transform');
                    break;
            }

            if (id) {
                element.setAttribute('id', id);
            }
            if (className) {
                element.setAttribute('class', className);
            }
        }
    };

    SvgParser.prototype.flatten = function(element) {
        for (var i = 0; i < element.childNodes.length; i++) {
            this.flatten(element.childNodes[i]);
        }

        if (element.tagName !== 'svg') {
            while (element.childNodes.length > 0) {
                element.parentElement.appendChild(element.childNodes[0]);
            }
        }
    };

    SvgParser.prototype.filter = function(whitelist, element) {
        if (!whitelist || whitelist.length == 0) {
            throw new Error('invalid whitelist');
        }

        element = element || this.svgRoot;

        for (var i = 0; i < element.childNodes.length; i++) {
            this.filter(whitelist, element.childNodes[i]);
        }

        if (element.childNodes.length == 0 && whitelist.indexOf(element.tagName) < 0) {
            element.parentElement.removeChild(element);
        }
    };

    SvgParser.prototype.splitPath = function(path) {
        if (!path || path.tagName !== 'path' || !path.parentElement) {
            return false;
        }

        var seglist = [];

        for (var i = 0; i < path.pathSegList.numberOfItems; i++) {
            seglist.push(path.pathSegList.getItem(i));
        }

        var x = 0, y = 0, x0 = 0, y0 = 0;
        var paths = [];
        var p;

        var lastM = 0;
        for (var i = seglist.length - 1; i >= 0; i--) {
            if (i > 0 && (seglist[i].pathSegTypeAsLetter === 'M' || seglist[i].pathSegTypeAsLetter === 'm')) {
                lastM = i;
                break;
            }
        }

        if (lastM === 0) {
            return false;
        }

        for (var i = 0; i < seglist.length; i++) {
            var s = seglist[i];
            var command = s.pathSegTypeAsLetter;

            if (command === 'M' || command === 'm') {
                p = path.cloneNode();
                p.setAttribute('d', '');
                paths.push(p);
            }

            if (/[MLHVCSQTA]/.test(command)) {
                if ('x' in s) x = s.x;
                if ('y' in s) y = s.y;
                p.pathSegList.appendItem(s);
            } else {
                if ('x' in s) x += s.x;
                if ('y' in s) y += s.y;
                if (command === 'm') {
                    p.pathSegList.appendItem(path.createSVGPathSegMovetoAbs(x, y));
                } else {
                    if (command === 'Z' || command === 'z') {
                        x = x0;
                        y = y0;
                    }
                    p.pathSegList.appendItem(s);
                }
            }

            if (command === 'M' || command === 'm') {
                x0 = x;
                y0 = y;
            }
        }

        var addedPaths = [];
        for (var i = 0; i < paths.length; i++) {
            if (paths[i].pathSegList.numberOfItems > 1) {
                path.parentElement.insertBefore(paths[i], path);
                addedPaths.push(paths[i]);
            }
        }

        path.remove();
        return addedPaths;
    };

    SvgParser.prototype.recurse = function(element, func) {
        var children = Array.prototype.slice.call(element.childNodes);
        for (var i = 0; i < children.length; i++) {
            this.recurse(children[i], func);
        }

        func(element);
    };

    SvgParser.prototype.polygonify = function(element) {
        var poly = [];
        var i;

        switch (element.tagName) {
            case 'polygon':
            case 'polyline':
                for (i = 0; i < element.points.numberOfItems; i++) {
                    var point = element.points.getItem(i);
                    poly.push({ x: point.x, y: point.y });
                }
                break;

            case 'rect':
                var p1 = { x: parseFloat(element.getAttribute('x')) || 0, y: parseFloat(element.getAttribute('y')) || 0 };
                var p2 = { x: p1.x + parseFloat(element.getAttribute('width')), y: p1.y };
                var p3 = { x: p2.x, y: p1.y + parseFloat(element.getAttribute('height')) };
                var p4 = { x: p1.x, y: p3.y };

                poly.push(p1);
                poly.push(p2);
                poly.push(p3);
                poly.push(p4);
                break;

            case 'circle':
                var radius = parseFloat(element.getAttribute('r'));
                var cxa = parseFloat(element.getAttribute('cx'));
                var cya = parseFloat(element.getAttribute('cy'));
                var numa = Math.ceil((2 * Math.PI) / Math.acos(1 - (this.conf.tolerance / radius)));

                for (var i = 0; i < numa; i++) {
                    var theta = i * ((2 * Math.PI) / numa);
                    poly.push({ x: radius * Math.cos(theta) + cxa, y: radius * Math.sin(theta) + cya });
                }
                break;

            case 'ellipse':
                var rx = parseFloat(element.getAttribute('rx'));
                var ry = parseFloat(element.getAttribute('ry'));
                var maxradius = Math.max(rx, ry);
                var num = Math.ceil((2 * Math.PI) / Math.acos(1 - (this.conf.tolerance / maxradius)));
                var cx = parseFloat(element.getAttribute('cx'));
                var cy = parseFloat(element.getAttribute('cy'));

                for (var i = 0; i < num; i++) {
                    var theta = i * ((2 * Math.PI) / num);
                    poly.push({ x: rx * Math.cos(theta) + cx, y: ry * Math.sin(theta) + cy });
                }
                break;

            case 'path':
                var seglist = element.pathSegList;
                var firstCommand = seglist.getItem(0);
                var lastCommand = seglist.getItem(seglist.numberOfItems - 1);
                var x = 0, y = 0, x0 = 0, y0 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0, prevx = 0, prevy = 0, prevx1 = 0, prevy1 = 0, prevx2 = 0, prevy2 = 0;

                for (var i = 0; i < seglist.numberOfItems; i++) {
                    var s = seglist.getItem(i);
                    var command = s.pathSegTypeAsLetter;

                    prevx = x;
                    prevy = y;

                    prevx1 = x1;
                    prevy1 = y1;

                    prevx2 = x2;
                    prevy2 = y2;

                    if (/[MLHVCSQTA]/.test(command)) {
                        if ('x1' in s) x1 = s.x1;
                        if ('x2' in s) x2 = s.x2;
                        if ('y1' in s) y1 = s.y1;
                        if ('y2' in s) y2 = s.y2;
                        if ('x' in s) x = s.x;
                        if ('y' in s) y = s.y;
                    } else {
                        if ('x1' in s) x1 = x + s.x1;
                        if ('x2' in s) x2 = x + s.x2;
                        if ('y1' in s) y1 = y + s.y1;
                        if ('y2' in s) y2 = y + s.y2;
                        if ('x' in s) x += s.x;
                        if ('y' in s) y += s.y;
                    }

                    switch (command) {
                        case 'm':
                        case 'M':
                        case 'l':
                        case 'L':
                        case 'h':
                        case 'H':
                        case 'v':
                        case 'V':
                            poly.push({ x: x, y: y });
                            break;

                        case 't':
                        case 'T':
                            if (i > 0 && /[QqTt]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
                                x1 = prevx + (prevx - prevx1);
                                y1 = prevy + (prevy - prevy1);
                            } else {
                                x1 = prevx;
                                y1 = prevy;
                            }
                        case 'q':
                        case 'Q':
                            var pointlist = GeometryUtil.QuadraticBezier.linearize({ x: prevx, y: prevy }, { x: x, y: y }, { x: x1, y: y1 }, this.conf.tolerance);
                            pointlist.shift();
                            for (var j = 0; j < pointlist.length; j++) {
                                poly.push({ x: pointlist[j].x, y: pointlist[j].y });
                            }
                            break;

                        case 's':
                        case 'S':
                            if (i > 0 && /[CcSs]/.test(seglist.getItem(i - 1).pathSegTypeAsLetter)) {
                                x1 = prevx + (prevx - prevx2);
                                y1 = prevy + (prevy - prevy2);
                            } else {
                                x1 = prevx;
                                y1 = prevy;
                            }
                        case 'c':
                        case 'C':
                            var pointlista = GeometryUtil.CubicBezier.linearize({ x: prevx, y: prevy }, { x: x, y: y }, { x: x1, y: y1 }, { x: x2, y: y2 }, this.conf.tolerance);
                            pointlista.shift();
                            for (var j = 0; j < pointlista.length; j++) {
                                poly.push({ x: pointlista[j].x, y: pointlista[j].y });
                            }
                            break;

                        case 'a':
                        case 'A':
                            var pointlistb = GeometryUtil.Arc.linearize({ x: prevx, y: prevy }, { x: x, y: y }, s.r1, s.r2, s.angle, s.largeArcFlag, s.sweepFlag, this.conf.tolerance);
                            pointlistb.shift();
                            for (var j = 0; j < pointlistb.length; j++) {
                                poly.push({ x: pointlistb[j].x, y: pointlistb[j].y });
                            }
                            break;

                        case 'z':
                        case 'Z':
                            x = x0;
                            y = y0;
                            break;
                    }

                    if (command === 'M' || command === 'm') {
                        x0 = x;
                        y0 = y;
                    }
                }
                break;
        }

        while (poly.length > 0 && GeometryUtil.almostEqual(poly[0].x, poly[poly.length - 1].x, this.conf.toleranceSvg) && GeometryUtil.almostEqual(poly[0].y, poly[poly.length - 1].y, this.conf.toleranceSvg)) {
            poly.pop();
        }

        return poly;
    };

    var parser = new SvgParser();
    root.SvgParser = {
        config: parser.config.bind(parser),
        load: parser.load.bind(parser),
        getStyle: parser.getStyle.bind(parser),
        clean: parser.cleanInput.bind(parser),
        polygonify: parser.polygonify.bind(parser)
    };

}(window));

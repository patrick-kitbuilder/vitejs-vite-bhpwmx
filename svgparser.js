// Use strict mode for better error catching and performance optimizations
'use strict';

// Use ES6 module syntax instead of IIFE
export class SvgParser {
    constructor() {
        this.svg = null;
        this.svgRoot = null;
        this.allowedElements = ['svg', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'rect', 'line'];
        this.conf = {
            tolerance: 2,
            toleranceSvg: 0.005
        };
    }

    config(config) {
        this.conf.tolerance = config.tolerance;
    }

    load(svgString) {
        if (!svgString || typeof svgString !== 'string') {
            throw new Error('Invalid SVG string');
        }

        const parser = new DOMParser();
        const svg = parser.parseFromString(svgString, "image/svg+xml");

        this.svgRoot = null;

        if (svg) {
            this.svg = svg;
            // Use Array.from and find instead of for loop
            this.svgRoot = Array.from(svg.childNodes).find(child => child.tagName === 'svg');
        } else {
            throw new Error("Failed to parse SVG string");
        }

        if (!this.svgRoot) {
            throw new Error("SVG has no children");
        }
        return this.svgRoot;
    }

    cleanInput() {
        this.applyTransform(this.svgRoot);
        this.flatten(this.svgRoot);
        this.filter(this.allowedElements);
        this.recurse(this.svgRoot, this.splitPath);
        return this.svgRoot;
    }

    getStyle() {
        if (!this.svgRoot) {
            return false;
        }
        // Use Array.from and find instead of for loop
        return Array.from(this.svgRoot.childNodes).find(el => el.tagName === 'style') || false;
    }

    pathToAbsolute(path) {
        if (!path || path.tagName !== 'path') {
            throw new Error('Invalid path');
        }

        const seglist = path.pathSegList;
        let x = 0, y = 0, x0 = 0, y0 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;

        for (let i = 0; i < seglist.numberOfItems; i++) {
            const s = seglist.getItem(i);
            const command = s.pathSegTypeAsLetter;

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
            }

            switch (command) {
                case 'm': seglist.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i); break;
                case 'l': seglist.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i); break;
                case 'h': seglist.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i); break;
                case 'v': seglist.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i); break;
                case 'c': seglist.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i); break;
                case 's': seglist.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i); break;
                case 'q': seglist.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i); break;
                case 't': seglist.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i); break;
                case 'a': seglist.replaceItem(path.createSVGPathSegArcAbs(x, y, s.r1, s.r2, s.angle, s.largeArcFlag, s.sweepFlag), i); break;
                case 'z': case 'Z': x = x0; y = y0; break;
            }
            if (command === 'M' || command === 'm') {
                x0 = x;
                y0 = y;
            }
        }
    }

    // ... (other methods remain largely unchanged)

    polygonify(element) {
        const poly = [];

        switch (element.tagName) {
            case 'polygon':
            case 'polyline':
                poly.push(...Array.from(element.points).map(point => ({ x: point.x, y: point.y })));
                break;
            case 'rect':
                const x = parseFloat(element.getAttribute('x')) || 0;
                const y = parseFloat(element.getAttribute('y')) || 0;
                const width = parseFloat(element.getAttribute('width'));
                const height = parseFloat(element.getAttribute('height'));
                poly.push({ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height });
                break;
            case 'circle':
                const radius = parseFloat(element.getAttribute('r'));
                const cx = parseFloat(element.getAttribute('cx'));
                const cy = parseFloat(element.getAttribute('cy'));
                const num = Math.max(3, Math.ceil((2 * Math.PI) / Math.acos(1 - (this.conf.tolerance / radius))));
                for (let i = 0; i < num; i++) {
                    const theta = i * ((2 * Math.PI) / num);
                    poly.push({
                        x: radius * Math.cos(theta) + cx,
                        y: radius * Math.sin(theta) + cy
                    });
                }
                break;
            // ... (other cases remain largely unchanged)
        }

        // Remove last point if coincident with starting point
        while (poly.length > 0 &&
            GeometryUtil.almostEqual(poly[0].x, poly[poly.length - 1].x, this.conf.toleranceSvg) &&
            GeometryUtil.almostEqual(poly[0].y, poly[poly.length - 1].y, this.conf.toleranceSvg)) {
            poly.pop();
        }

        return poly;
    }
}

// Export an instance of SvgParser
export const svgParser = new SvgParser();
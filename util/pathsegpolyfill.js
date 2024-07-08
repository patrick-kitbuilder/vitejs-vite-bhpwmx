(() => {
    'use strict';
    if (!('SVGPathSeg' in window)) {
        // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGPathSeg
        window.SVGPathSeg = class {
            constructor(type, typeAsLetter, owningPathSegList) {
                this.pathSegType = type;
                this.pathSegTypeAsLetter = typeAsLetter;
                this._owningPathSegList = owningPathSegList;
            }

            _segmentChanged() {
                if (this._owningPathSegList)
                    this._owningPathSegList.segmentChanged(this);
            }
        }

        window.SVGPathSeg.PATHSEG_UNKNOWN = 0;
        window.SVGPathSeg.PATHSEG_CLOSEPATH = 1;
        window.SVGPathSeg.PATHSEG_MOVETO_ABS = 2;
        window.SVGPathSeg.PATHSEG_MOVETO_REL = 3;
        window.SVGPathSeg.PATHSEG_LINETO_ABS = 4;
        window.SVGPathSeg.PATHSEG_LINETO_REL = 5;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS = 6;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL = 7;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS = 8;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL = 9;
        window.SVGPathSeg.PATHSEG_ARC_ABS = 10;
        window.SVGPathSeg.PATHSEG_ARC_REL = 11;
        window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS = 12;
        window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL = 13;
        window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS = 14;
        window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL = 15;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS = 16;
        window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL = 17;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS = 18;
        window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL = 19;

        window.SVGPathSegClosePath = class extends window.SVGPathSeg {
            constructor(owningPathSegList) {
                super(window.SVGPathSeg.PATHSEG_CLOSEPATH, "z", owningPathSegList);
            }
            toString() { return "[object SVGPathSegClosePath]"; }
            _asPathString() { return this.pathSegTypeAsLetter; }
            clone() { return new window.SVGPathSegClosePath(undefined); }
        }

        window.SVGPathSegMovetoAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_MOVETO_ABS, "M", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegMovetoAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegMovetoAbs(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegMovetoRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_MOVETO_REL, "m", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegMovetoRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegMovetoRel(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_LINETO_ABS, "L", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegLinetoAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegLinetoAbs(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_LINETO_REL, "l", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegLinetoRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegLinetoRel(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoCubicAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x1, y1, x2, y2) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS, "C", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x1 = x1;
                this._y1 = y1;
                this._x2 = x2;
                this._y2 = y2;
            }
            toString() { return "[object SVGPathSegCurvetoCubicAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1} ${this._x2} ${this._y2} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoCubicAbs(undefined, this._x, this._y, this._x1, this._y1, this._x2, this._y2); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x1() { return this._x1; }
            set x1(x1) { this._x1 = x1; this._segmentChanged(); }
            get y1() { return this._y1; }
            set y1(y1) { this._y1 = y1; this._segmentChanged(); }
            get x2() { return this._x2; }
            set x2(x2) { this._x2 = x2; this._segmentChanged(); }
            get y2() { return this._y2; }
            set y2(y2) { this._y2 = y2; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoCubicRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x1, y1, x2, y2) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL, "c", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x1 = x1;
                this._y1 = y1;
                this._x2 = x2;
                this._y2 = y2;
            }
            toString() { return "[object SVGPathSegCurvetoCubicRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1} ${this._x2} ${this._y2} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoCubicRel(undefined, this._x, this._y, this._x1, this._y1, this._x2, this._y2); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x1() { return this._x1; }
            set x1(x1) { this._x1 = x1; this._segmentChanged(); }
            get y1() { return this._y1; }
            set y1(y1) { this._y1 = y1; this._segmentChanged(); }
            get x2() { return this._x2; }
            set x2(x2) { this._x2 = x2; this._segmentChanged(); }
            get y2() { return this._y2; }
            set y2(y2) { this._y2 = y2; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoQuadraticAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x1, y1) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS, "Q", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x1 = x1;
                this._y1 = y1;
            }
            toString() { return "[object SVGPathSegCurvetoQuadraticAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoQuadraticAbs(undefined, this._x, this._y, this._x1, this._y1); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x1() { return this._x1; }
            set x1(x1) { this._x1 = x1; this._segmentChanged(); }
            get y1() { return this._y1; }
            set y1(y1) { this._y1 = y1; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoQuadraticRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x1, y1) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL, "q", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x1 = x1;
                this._y1 = y1;
            }
            toString() { return "[object SVGPathSegCurvetoQuadraticRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x1} ${this._y1} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoQuadraticRel(undefined, this._x, this._y, this._x1, this._y1); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x1() { return this._x1; }
            set x1(x1) { this._x1 = x1; this._segmentChanged(); }
            get y1() { return this._y1; }
            set y1(y1) { this._y1 = y1; this._segmentChanged(); }
        }

        window.SVGPathSegArcAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, r1, r2, angle, largeArcFlag, sweepFlag) {
                super(window.SVGPathSeg.PATHSEG_ARC_ABS, "A", owningPathSegList);
                this._x = x;
                this._y = y;
                this._r1 = r1;
                this._r2 = r2;
                this._angle = angle;
                this._largeArcFlag = largeArcFlag;
                this._sweepFlag = sweepFlag;
            }
            toString() { return "[object SVGPathSegArcAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._r1} ${this._r2} ${this._angle} ${this._largeArcFlag ? "1" : "0"} ${this._sweepFlag ? "1" : "0"} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegArcAbs(undefined, this._x, this._y, this._r1, this._r2, this._angle, this._largeArcFlag, this._sweepFlag); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get r1() { return this._r1; }
            set r1(r1) { this._r1 = r1; this._segmentChanged(); }
            get r2() { return this._r2; }
            set r2(r2) { this._r2 = r2; this._segmentChanged(); }
            get angle() { return this._angle; }
            set angle(angle) { this._angle = angle; this._segmentChanged(); }
            get largeArcFlag() { return this._largeArcFlag; }
            set largeArcFlag(largeArcFlag) { this._largeArcFlag = largeArcFlag; this._segmentChanged(); }
            get sweepFlag() { return this._sweepFlag; }
            set sweepFlag(sweepFlag) { this._sweepFlag = sweepFlag; this._segmentChanged(); }
        }

        window.SVGPathSegArcRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, r1, r2, angle, largeArcFlag, sweepFlag) {
                super(window.SVGPathSeg.PATHSEG_ARC_REL, "a", owningPathSegList);
                this._x = x;
                this._y = y;
                this._r1 = r1;
                this._r2 = r2;
                this._angle = angle;
                this._largeArcFlag = largeArcFlag;
                this._sweepFlag = sweepFlag;
            }
            toString() { return "[object SVGPathSegArcRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._r1} ${this._r2} ${this._angle} ${this._largeArcFlag ? "1" : "0"} ${this._sweepFlag ? "1" : "0"} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegArcRel(undefined, this._x, this._y, this._r1, this._r2, this._angle, this._largeArcFlag, this._sweepFlag); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get r1() { return this._r1; }
            set r1(r1) { this._r1 = r1; this._segmentChanged(); }
            get r2() { return this._r2; }
            set r2(r2) { this._r2 = r2; this._segmentChanged(); }
            get angle() { return this._angle; }
            set angle(angle) { this._angle = angle; this._segmentChanged(); }
            get largeArcFlag() { return this._largeArcFlag; }
            set largeArcFlag(largeArcFlag) { this._largeArcFlag = largeArcFlag; this._segmentChanged(); }
            get sweepFlag() { return this._sweepFlag; }
            set sweepFlag(sweepFlag) { this._sweepFlag = sweepFlag; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoHorizontalAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x) {
                super(window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS, "H", owningPathSegList);
                this._x = x;
            }
            toString() { return "[object SVGPathSegLinetoHorizontalAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x}`; }
            clone() { return new window.SVGPathSegLinetoHorizontalAbs(undefined, this._x); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoHorizontalRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x) {
                super(window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL, "h", owningPathSegList);
                this._x = x;
            }
            toString() { return "[object SVGPathSegLinetoHorizontalRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x}`; }
            clone() { return new window.SVGPathSegLinetoHorizontalRel(undefined, this._x); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoVerticalAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, y) {
                super(window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS, "V", owningPathSegList);
                this._y = y;
            }
            toString() { return "[object SVGPathSegLinetoVerticalAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._y}`; }
            clone() { return new window.SVGPathSegLinetoVerticalAbs(undefined, this._y); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegLinetoVerticalRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, y) {
                super(window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL, "v", owningPathSegList);
                this._y = y;
            }
            toString() { return "[object SVGPathSegLinetoVerticalRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._y}`; }
            clone() { return new window.SVGPathSegLinetoVerticalRel(undefined, this._y); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoCubicSmoothAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x2, y2) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS, "S", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x2 = x2;
                this._y2 = y2;
            }
            toString() { return "[object SVGPathSegCurvetoCubicSmoothAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x2} ${this._y2} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoCubicSmoothAbs(undefined, this._x, this._y, this._x2, this._y2); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x2() { return this._x2; }
            set x2(x2) { this._x2 = x2; this._segmentChanged(); }
            get y2() { return this._y2; }
            set y2(y2) { this._y2 = y2; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoCubicSmoothRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y, x2, y2) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL, "s", owningPathSegList);
                this._x = x;
                this._y = y;
                this._x2 = x2;
                this._y2 = y2;
            }
            toString() { return "[object SVGPathSegCurvetoCubicSmoothRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x2} ${this._y2} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoCubicSmoothRel(undefined, this._x, this._y, this._x2, this._y2); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
            get x2() { return this._x2; }
            set x2(x2) { this._x2 = x2; this._segmentChanged(); }
            get y2() { return this._y2; }
            set y2(y2) { this._y2 = y2; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoQuadraticSmoothAbs = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS, "T", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegCurvetoQuadraticSmoothAbs]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoQuadraticSmoothAbs(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        window.SVGPathSegCurvetoQuadraticSmoothRel = class extends window.SVGPathSeg {
            constructor(owningPathSegList, x, y) {
                super(window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL, "t", owningPathSegList);
                this._x = x;
                this._y = y;
            }
            toString() { return "[object SVGPathSegCurvetoQuadraticSmoothRel]"; }
            _asPathString() { return `${this.pathSegTypeAsLetter} ${this._x} ${this._y}`; }
            clone() { return new window.SVGPathSegCurvetoQuadraticSmoothRel(undefined, this._x, this._y); }
            get x() { return this._x; }
            set x(x) { this._x = x; this._segmentChanged(); }
            get y() { return this._y; }
            set y(y) { this._y = y; this._segmentChanged(); }
        }

        // Add createSVGPathSeg* functions to SVGPathElement.
        // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGPathElement.
        SVGPathElement.prototype.createSVGPathSegClosePath = function () { return new window.SVGPathSegClosePath(undefined); }
        SVGPathElement.prototype.createSVGPathSegMovetoAbs = function (x, y) { return new window.SVGPathSegMovetoAbs(undefined, x, y); }
        SVGPathElement.prototype.createSVGPathSegMovetoRel = function (x, y) { return new window.SVGPathSegMovetoRel(undefined, x, y); }
        SVGPathElement.prototype.createSVGPathSegLinetoAbs = function (x, y) { return new window.SVGPathSegLinetoAbs(undefined, x, y); }
        SVGPathElement.prototype.createSVGPathSegLinetoRel = function (x, y) { return new window.SVGPathSegLinetoRel(undefined, x, y); }
        SVGPathElement.prototype.createSVGPathSegCurvetoCubicAbs = function (x, y, x1, y1, x2, y2) { return new window.SVGPathSegCurvetoCubicAbs(undefined, x, y, x1, y1, x2, y2); }
        SVGPathElement.prototype.createSVGPathSegCurvetoCubicRel = function (x, y, x1, y1, x2, y2) { return new window.SVGPathSegCurvetoCubicRel(undefined, x, y, x1, y1, x2, y2); }
        SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticAbs = function (x, y, x1, y1) { return new window.SVGPathSegCurvetoQuadraticAbs(undefined, x, y, x1, y1); }
        SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticRel = function (x, y, x1, y1) { return new window.SVGPathSegCurvetoQuadraticRel(undefined, x, y, x1, y1); }
        SVGPathElement.prototype.createSVGPathSegArcAbs = function (x, y, r1, r2, angle, largeArcFlag, sweepFlag) { return new window.SVGPathSegArcAbs(undefined, x, y, r1, r2, angle, largeArcFlag, sweepFlag); }
        SVGPathElement.prototype.createSVGPathSegArcRel = function (x, y, r1, r2, angle, largeArcFlag, sweepFlag) { return new window.SVGPathSegArcRel(undefined, x, y, r1, r2, angle, largeArcFlag, sweepFlag); }
        SVGPathElement.prototype.createSVGPathSegLinetoHorizontalAbs = function (x) { return new window.SVGPathSegLinetoHorizontalAbs(undefined, x); }
        SVGPathElement.prototype.createSVGPathSegLinetoHorizontalRel = function (x) { return new window.SVGPathSegLinetoHorizontalRel(undefined, x); }
        SVGPathElement.prototype.createSVGPathSegLinetoVerticalAbs = function (y) { return new window.SVGPathSegLinetoVerticalAbs(undefined, y); }
        SVGPathElement.prototype.createSVGPathSegLinetoVerticalRel = function (y) { return new window.SVGPathSegLinetoVerticalRel(undefined, y); }
        SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothAbs = function (x, y, x2, y2) { return new window.SVGPathSegCurvetoCubicSmoothAbs(undefined, x, y, x2, y2); }
        SVGPathElement.prototype.createSVGPathSegCurvetoCubicSmoothRel = function (x, y, x2, y2) { return new window.SVGPathSegCurvetoCubicSmoothRel(undefined, x, y, x2, y2); }
        SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothAbs = function (x, y) { return new window.SVGPathSegCurvetoQuadraticSmoothAbs(undefined, x, y); }
        SVGPathElement.prototype.createSVGPathSegCurvetoQuadraticSmoothRel = function (x, y) { return new window.SVGPathSegCurvetoQuadraticSmoothRel(undefined, x, y); }

        if (!("getPathSegAtLength" in SVGPathElement.prototype)) {
            // Add getPathSegAtLength to SVGPathElement.
            // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-__svg__SVGPathElement__getPathSegAtLength
            // This polyfill requires SVGPathElement.getTotalLength to implement the distance-along-a-path algorithm.
            SVGPathElement.prototype.getPathSegAtLength = function (distance) {
                if (distance === undefined || !Number.isFinite(distance))
                    throw "Invalid arguments.";

                const measurementElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                measurementElement.setAttribute("d", this.getAttribute("d"));
                let lastPathSegment = measurementElement.pathSegList.numberOfItems - 1;

                // If the path is empty, return 0.
                if (lastPathSegment <= 0)
                    return 0;

                do {
                    measurementElement.pathSegList.removeItem(lastPathSegment);
                    if (distance > measurementElement.getTotalLength())
                        break;
                    lastPathSegment--;
                } while (lastPathSegment > 0);
                return lastPathSegment;
            }
        }
    }

    // Checking for SVGPathSegList in window checks for the case of an implementation without the
    // SVGPathSegList API.
    // The second check for appendItem is specific to Firefox 59+ which removed only parts of the
    // SVGPathSegList API (e.g., appendItem). In this case we need to re-implement the entire API
    // so the polyfill data (i.e., _list) is used throughout.
    if (!("SVGPathSegList" in window) || !("appendItem" in window.SVGPathSegList.prototype)) {
        // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-InterfaceSVGPathSegList
        window.SVGPathSegList = function (pathElement) {
            this._pathElement = pathElement;
            this._list = this._parsePath(this._pathElement.getAttribute("d"));

            // Use a MutationObserver to catch changes to the path's "d" attribute.
            this._mutationObserverConfig = { "attributes": true, "attributeFilter": ["d"] };
            this._pathElementMutationObserver = new MutationObserver(this._updateListFromPathMutations.bind(this));
            this._pathElementMutationObserver.observe(this._pathElement, this._mutationObserverConfig);
        }

        window.SVGPathSegList.prototype = {
            classname: "SVGPathSegList",

            get numberOfItems() {
                this._checkPathSynchronizedToList();
                return this._list.length;
            },

            clear: function () {
                this._checkPathSynchronizedToList();
                this._list.forEach(function (pathSeg) {
                    pathSeg._owningPathSegList = null;
                });
                this._list = [];
                this._writeListToPath();
            },

            initialize: function (newItem) {
                this._checkPathSynchronizedToList();
                this._list = [newItem];
                newItem._owningPathSegList = this;
                this._writeListToPath();
                return newItem;
            },

            _checkValidIndex: function (index) {
                if (isNaN(index) || index < 0 || index >= this.numberOfItems)
                    throw "INDEX_SIZE_ERR";
            },

            getItem: function (index) {
                this._checkPathSynchronizedToList();
                this._checkValidIndex(index);
                return this._list[index];
            },

            insertItemBefore: function (newItem, index) {
                this._checkPathSynchronizedToList();
                // Spec: If the index is greater than or equal to numberOfItems, then the new item is appended to the end of the list.
                if (index > this.numberOfItems)
                    index = this.numberOfItems;
                if (newItem._owningPathSegList) {
                    // SVG2 spec says to make a copy.
                    newItem = newItem.clone();
                }
                this._list.splice(index, 0, newItem);
                newItem._owningPathSegList = this;
                this._writeListToPath();
                return newItem;
            },

            replaceItem: function (newItem, index) {
                this._checkPathSynchronizedToList();
                if (newItem._owningPathSegList) {
                    // SVG2 spec says to make a copy.
                    newItem = newItem.clone();
                }
                this._checkValidIndex(index);
                this._list[index] = newItem;
                newItem._owningPathSegList = this;
                this._writeListToPath();
                return newItem;
            },

            removeItem: function (index) {
                this._checkPathSynchronizedToList();
                this._checkValidIndex(index);
                let item = this._list[index];
                this._list.splice(index, 1);
                this._writeListToPath();
                return item;
            },

            appendItem: function (newItem) {
                this._checkPathSynchronizedToList();
                if (newItem._owningPathSegList) {
                    // SVG2 spec says to make a copy.
                    newItem = newItem.clone();
                }
                this._list.push(newItem);
                newItem._owningPathSegList = this;
                // TODO: Optimize this to just append to the existing attribute.
                this._writeListToPath();
                return newItem;
            },

            // This closely follows SVGPathParser::parsePath from Source/core/svg/SVGPathParser.cpp.
            _parsePath: function (string) {
                if (!string || string.length == 0)
                    return [];

                let owningPathSegList = this;

                let Builder = function () {
                    this.pathSegList = [];
                }

                Builder.prototype.appendSegment = function (pathSeg) {
                    this.pathSegList.push(pathSeg);
                }

                let Source = function (string) {
                    this._string = string;
                    this._currentIndex = 0;
                    this._endIndex = this._string.length;
                    this._previousCommand = window.SVGPathSeg.PATHSEG_UNKNOWN;

                    this._skipOptionalSpaces();
                }

                Source.prototype = {
                    _isCurrentSpace: function () {
                        let character = this._string[this._currentIndex];
                        return character <= " " && (character == " " || character == "\n" || character == "\t" || character == "\r" || character == "\f");
                    },

                    _skipOptionalSpaces: function () {
                        while (this._currentIndex < this._endIndex && this._isCurrentSpace())
                            this._currentIndex++;
                        return this._currentIndex < this._endIndex;
                    },

                    _skipOptionalSpacesOrDelimiter: function () {
                        if (this._currentIndex < this._endIndex && !this._isCurrentSpace() && this._string.charAt(this._currentIndex) != ",")
                            return false;
                        if (this._skipOptionalSpaces()) {
                            if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ",") {
                                this._currentIndex++;
                                this._skipOptionalSpaces();
                            }
                        }
                        return this._currentIndex < this._endIndex;
                    },

                    hasMoreData: function () {
                        return this._currentIndex < this._endIndex;
                    },

                    peekSegmentType: function () {
                        let lookahead = this._string[this._currentIndex];
                        return this._pathSegTypeFromChar(lookahead);
                    },

                    _pathSegTypeFromChar: function (lookahead) {
                        switch (lookahead) {
                            case "Z":
                            case "z":
                                return window.SVGPathSeg.PATHSEG_CLOSEPATH;
                            case "M":
                                return window.SVGPathSeg.PATHSEG_MOVETO_ABS;
                            case "m":
                                return window.SVGPathSeg.PATHSEG_MOVETO_REL;
                            case "L":
                                return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                            case "l":
                                return window.SVGPathSeg.PATHSEG_LINETO_REL;
                            case "C":
                                return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS;
                            case "c":
                                return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL;
                            case "Q":
                                return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS;
                            case "q":
                                return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL;
                            case "A":
                                return window.SVGPathSeg.PATHSEG_ARC_ABS;
                            case "a":
                                return window.SVGPathSeg.PATHSEG_ARC_REL;
                            case "H":
                                return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS;
                            case "h":
                                return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL;
                            case "V":
                                return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS;
                            case "v":
                                return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL;
                            case "S":
                                return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS;
                            case "s":
                                return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL;
                            case "T":
                                return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS;
                            case "t":
                                return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL;
                            default:
                                return window.SVGPathSeg.PATHSEG_UNKNOWN;
                        }
                    },

                    _nextCommandHelper: function (lookahead, previousCommand) {
                        // Check for remaining coordinates in the current command.
                        if ((lookahead == "+" || lookahead == "-" || lookahead == "." || (lookahead >= "0" && lookahead <= "9")) && previousCommand != window.SVGPathSeg.PATHSEG_CLOSEPATH) {
                            if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_ABS)
                                return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                            if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_REL)
                                return window.SVGPathSeg.PATHSEG_LINETO_REL;
                            return previousCommand;
                        }
                        return window.SVGPathSeg.PATHSEG_UNKNOWN;
                    },

                    initialCommandIsMoveTo: function () {
                        // If the path is empty it is still valid, so return true.
                        if (!this.hasMoreData())
                            return true;
                        let command = this.peekSegmentType();
                        // Path must start with moveTo.
                        return command == window.SVGPathSeg.PATHSEG_MOVETO_ABS || command == window.SVGPathSeg.PATHSEG_MOVETO_REL;
                    },

                    // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from Source/core/svg/SVGParserUtilities.cpp.
                    // Spec: https://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
                    _parseNumber: function () {
                        let exponent = 0;
                        let integer = 0;
                        let frac = 1;
                        let decimal = 0;
                        let sign = 1;
                        let expsign = 1;

                        let startIndex = this._currentIndex;

                        this._skipOptionalSpaces();

                        // Read the sign.
                        if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "+")
                            this._currentIndex++;
                        else if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "-") {
                            this._currentIndex++;
                            sign = -1;
                        }

                        if (this._currentIndex == this._endIndex || ((this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9") && this._string.charAt(this._currentIndex) != "."))
                            // The first character of a number must be one of [0-9+-.].
                            return undefined;

                        // Read the integer part, build right-to-left.
                        let startIntPartIndex = this._currentIndex;
                        while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9")
                            this._currentIndex++; // Advance to first non-digit.

                        if (this._currentIndex != startIntPartIndex) {
                            let scanIntPartIndex = this._currentIndex - 1;
                            let multiplier = 1;
                            while (scanIntPartIndex >= startIntPartIndex) {
                                integer += multiplier * (this._string.charAt(scanIntPartIndex--) - "0");
                                multiplier *= 10;
                            }
                        }

                        // Read the decimals.
                        if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ".") {
                            this._currentIndex++;

                            // There must be a least one digit following the .
                            if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                                return undefined;
                            while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                                frac *= 10;
                                decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
                                this._currentIndex += 1;
                            }
                        }

                        // Read the exponent part.
                        if (this._currentIndex != startIndex && this._currentIndex + 1 < this._endIndex && (this._string.charAt(this._currentIndex) == "e" || this._string.charAt(this._currentIndex) == "E") && (this._string.charAt(this._currentIndex + 1) != "x" && this._string.charAt(this._currentIndex + 1) != "m")) {
                            this._currentIndex++;

                            // Read the sign of the exponent.
                            if (this._string.charAt(this._currentIndex) == "+") {
                                this._currentIndex++;
                            } else if (this._string.charAt(this._currentIndex) == "-") {
                                this._currentIndex++;
                                expsign = -1;
                            }

                            // There must be an exponent.
                            if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                                return undefined;

                            while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                                exponent *= 10;
                                exponent += (this._string.charAt(this._currentIndex) - "0");
                                this._currentIndex++;
                            }
                        }

                        let number = integer + decimal;
                        number *= sign;

                        if (exponent)
                            number *= Math.pow(10, expsign * exponent);

                        if (startIndex == this._currentIndex)
                            return undefined;

                        this._skipOptionalSpacesOrDelimiter();

                        return number;
                    },

                    _parseArcFlag: function () {
                        if (this._currentIndex >= this._endIndex)
                            return undefined;
                        let flag = false;
                        let flagChar = this._string.charAt(this._currentIndex++);
                        if (flagChar == "0")
                            flag = false;
                        else if (flagChar == "1")
                            flag = true;
                        else
                            return undefined;

                        this._skipOptionalSpacesOrDelimiter();
                        return flag;
                    },

                    parseSegment: function () {
                        let lookahead = this._string[this._currentIndex];
                        let command = this._pathSegTypeFromChar(lookahead);
                        if (command == window.SVGPathSeg.PATHSEG_UNKNOWN) {
                            // Possibly an implicit command. Not allowed if this is the first command.
                            if (this._previousCommand == window.SVGPathSeg.PATHSEG_UNKNOWN)
                                return null;
                            command = this._nextCommandHelper(lookahead, this._previousCommand);
                            if (command == window.SVGPathSeg.PATHSEG_UNKNOWN)
                                return null;
                        } else {
                            this._currentIndex++;
                        }

                        this._previousCommand = command;

                        switch (command) {
                            case window.SVGPathSeg.PATHSEG_MOVETO_REL:
                                return new window.SVGPathSegMovetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_MOVETO_ABS:
                                return new window.SVGPathSegMovetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_REL:
                                return new window.SVGPathSegLinetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_ABS:
                                return new window.SVGPathSegLinetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL:
                                return new window.SVGPathSegLinetoHorizontalRel(owningPathSegList, this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS:
                                return new window.SVGPathSegLinetoHorizontalAbs(owningPathSegList, this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL:
                                return new window.SVGPathSegLinetoVerticalRel(owningPathSegList, this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS:
                                return new window.SVGPathSegLinetoVerticalAbs(owningPathSegList, this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_CLOSEPATH:
                                this._skipOptionalSpaces();
                                return new window.SVGPathSegClosePath(owningPathSegList);
                            case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoCubicRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                            case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoCubicAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                            case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
                                var points = { x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoCubicSmoothRel(owningPathSegList, points.x, points.y, points.x2, points.y2);
                            case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
                                var points = { x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoCubicSmoothAbs(owningPathSegList, points.x, points.y, points.x2, points.y2);
                            case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoQuadraticRel(owningPathSegList, points.x, points.y, points.x1, points.y1);
                            case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegCurvetoQuadraticAbs(owningPathSegList, points.x, points.y, points.x1, points.y1);
                            case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
                                return new window.SVGPathSegCurvetoQuadraticSmoothRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
                                return new window.SVGPathSegCurvetoQuadraticSmoothAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                            case window.SVGPathSeg.PATHSEG_ARC_REL:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegArcRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                            case window.SVGPathSeg.PATHSEG_ARC_ABS:
                                var points = { x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber() };
                                return new window.SVGPathSegArcAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                            default:
                                throw "Unknown path seg type."
                        }
                    }
                };

                let builder = new Builder();
                let source = new Source(string);

                if (!source.initialCommandIsMoveTo())
                    return [];
                while (source.hasMoreData()) {
                    let pathSeg = source.parseSegment();
                    if (!pathSeg)
                        return [];
                    builder.appendSegment(pathSeg);
                }

                return builder.pathSegList;
            }
        };

        window.SVGPathSegList.prototype._checkPathSynchronizedToList = function () {
            this._updateListFromPathMutations(this._pathElementMutationObserver.takeRecords());
        };

        window.SVGPathSegList.prototype._updateListFromPathMutations = function (mutationRecords) {
            if (!this._pathElement)
                return;
            let hasPathMutations = false;
            mutationRecords.forEach(function (record) {
                if (record.attributeName == "d")
                    hasPathMutations = true;
            });
            if (hasPathMutations)
                this._list = this._parsePath(this._pathElement.getAttribute("d"));
        };

        // Serialize the list and update the path's 'd' attribute.
        window.SVGPathSegList.prototype._writeListToPath = function () {
            this._pathElementMutationObserver.disconnect();
            this._pathElement.setAttribute("d", window.SVGPathSegList._pathSegArrayAsString(this._list));
            this._pathElementMutationObserver.observe(this._pathElement, this._mutationObserverConfig);
        };

        // When a path segment changes the list needs to be synchronized back to the path element.
        window.SVGPathSegList.prototype.segmentChanged = function (pathSeg) {
            this._writeListToPath();
        };

        window.SVGPathSegList._pathSegArrayAsString = function (pathSegArray) {
            let string = "";
            let first = true;
            pathSegArray.forEach(function (pathSeg) {
                if (first) {
                    first = false;
                    string += pathSeg._asPathString();
                } else {
                    string += " " + pathSeg._asPathString();
                }
            });
            return string;
        };

        // This closely follows SVGPathParser::parsePath from Source/core/svg/SVGPathParser.cpp.
        window.SVGPathSegList.prototype._parsePath = function (string) {
            if (!string || string.length == 0)
                return [];

            let owningPathSegList = this;

            let Builder = function () {
                this.pathSegList = [];
            };

            Builder.prototype.appendSegment = function (pathSeg) {
                this.pathSegList.push(pathSeg);
            };

            let Source = function (string) {
                this._string = string;
                this._currentIndex = 0;
                this._endIndex = this._string.length;
                this._previousCommand = window.SVGPathSeg.PATHSEG_UNKNOWN;
                this._skipOptionalSpaces();
            };

            Source.prototype = {
                _isCurrentSpace: function () {
                    let character = this._string[this._currentIndex];
                    return character <= " " && (character == " " || character == "\n" || character == "\t" || character == "\r" || character == "\f");
                },
                _skipOptionalSpaces: function () {
                    while (this._currentIndex < this._endIndex && this._isCurrentSpace())
                        this._currentIndex++;
                    return this._currentIndex < this._endIndex;
                },
                _skipOptionalSpacesOrDelimiter: function () {
                    if (this._currentIndex < this._endIndex && !this._isCurrentSpace() && this._string.charAt(this._currentIndex) != ",")
                        return false;
                    if (this._skipOptionalSpaces()) {
                        if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ",") {
                            this._currentIndex++;
                            this._skipOptionalSpaces();
                        }
                    }
                    return this._currentIndex < this._endIndex;
                },
                hasMoreData: function () {
                    return this._currentIndex < this._endIndex;
                },
                peekSegmentType: function () {
                    let lookahead = this._string[this._currentIndex];
                    return this._pathSegTypeFromChar(lookahead);
                },
                _pathSegTypeFromChar: function (lookahead) {
                    switch (lookahead) {
                        case "Z":
                        case "z":
                            return window.SVGPathSeg.PATHSEG_CLOSEPATH;
                        case "M":
                            return window.SVGPathSeg.PATHSEG_MOVETO_ABS;
                        case "m":
                            return window.SVGPathSeg.PATHSEG_MOVETO_REL;
                        case "L":
                            return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                        case "l":
                            return window.SVGPathSeg.PATHSEG_LINETO_REL;
                        case "C":
                            return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS;
                        case "c":
                            return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL;
                        case "Q":
                            return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS;
                        case "q":
                            return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL;
                        case "A":
                            return window.SVGPathSeg.PATHSEG_ARC_ABS;
                        case "a":
                            return window.SVGPathSeg.PATHSEG_ARC_REL;
                        case "H":
                            return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS;
                        case "h":
                            return window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL;
                        case "V":
                            return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS;
                        case "v":
                            return window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL;
                        case "S":
                            return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS;
                        case "s":
                            return window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL;
                        case "T":
                            return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS;
                        case "t":
                            return window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL;
                        default:
                            return window.SVGPathSeg.PATHSEG_UNKNOWN;
                    }
                },
                _nextCommandHelper: function (lookahead, previousCommand) {
                    // Check for remaining coordinates in the current command.
                    if ((lookahead == "+" || lookahead == "-" || lookahead == "." || (lookahead >= "0" && lookahead <= "9")) && previousCommand != window.SVGPathSeg.PATHSEG_CLOSEPATH) {
                        if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_ABS)
                            return window.SVGPathSeg.PATHSEG_LINETO_ABS;
                        if (previousCommand == window.SVGPathSeg.PATHSEG_MOVETO_REL)
                            return window.SVGPathSeg.PATHSEG_LINETO_REL;
                        return previousCommand;
                    }
                    return window.SVGPathSeg.PATHSEG_UNKNOWN;
                },
                initialCommandIsMoveTo: function () {
                    // If the path is empty it is still valid, so return true.
                    if (!this.hasMoreData())
                        return true;
                    let command = this.peekSegmentType();
                    // Path must start with moveTo.
                    return command == window.SVGPathSeg.PATHSEG_MOVETO_ABS || command == window.SVGPathSeg.PATHSEG_MOVETO_REL;
                },
                _parseNumber: function () {
                    let exponent = 0;
                    let integer = 0;
                    let frac = 1;
                    let decimal = 0;
                    let sign = 1;
                    let expsign = 1;

                    let startIndex = this._currentIndex;

                    this._skipOptionalSpaces();

                    // Read the sign.
                    if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "+")
                        this._currentIndex++;
                    else if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == "-") {
                        this._currentIndex++;
                        sign = -1;
                    }

                    if (this._currentIndex == this._endIndex || ((this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9") && this._string.charAt(this._currentIndex) != "."))
                        return undefined;

                    // Read the integer part, build right-to-left.
                    let startIntPartIndex = this._currentIndex;
                    while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9")
                        this._currentIndex++; // Advance to first non-digit.

                    if (this._currentIndex != startIntPartIndex) {
                        let scanIntPartIndex = this._currentIndex - 1;
                        let multiplier = 1;
                        while (scanIntPartIndex >= startIntPartIndex) {
                            integer += multiplier * (this._string.charAt(scanIntPartIndex--) - "0");
                            multiplier *= 10;
                        }
                    }

                    // Read the decimals.
                    if (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) == ".") {
                        this._currentIndex++;

                        // There must be a least one digit following the .
                        if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                            return undefined;
                        while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                            frac *= 10;
                            decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
                            this._currentIndex++;
                        }
                    }

                    // Read the exponent part.
                    if (this._currentIndex != startIndex && this._currentIndex + 1 < this._endIndex && (this._string.charAt(this._currentIndex) == "e" || this._string.charAt(this._currentIndex) == "E") && (this._string.charAt(this._currentIndex + 1) != "x" && this._string.charAt(this._currentIndex + 1) != "m")) {
                        this._currentIndex++;

                        // Read the sign of the exponent.
                        if (this._string.charAt(this._currentIndex) == "+") {
                            this._currentIndex++;
                        } else if (this._string.charAt(this._currentIndex) == "-") {
                            this._currentIndex++;
                            expsign = -1;
                        }

                        // There must be an exponent.
                        if (this._currentIndex >= this._endIndex || this._string.charAt(this._currentIndex) < "0" || this._string.charAt(this._currentIndex) > "9")
                            return undefined;

                        while (this._currentIndex < this._endIndex && this._string.charAt(this._currentIndex) >= "0" && this._string.charAt(this._currentIndex) <= "9") {
                            exponent *= 10;
                            exponent += (this._string.charAt(this._currentIndex) - "0");
                            this._currentIndex++;
                        }
                    }

                    let number = integer + decimal;
                    number *= sign;

                    if (exponent)
                        number *= Math.pow(10, expsign * exponent);

                    if (startIndex == this._currentIndex)
                        return undefined;

                    this._skipOptionalSpacesOrDelimiter();

                    return number;
                },
                _parseArcFlag: function () {
                    if (this._currentIndex >= this._endIndex)
                        return undefined;
                    let flag = false;
                    let flagChar = this._string.charAt(this._currentIndex++);
                    if (flagChar == "0")
                        flag = false;
                    else if (flagChar == "1")
                        flag = true;
                    else
                        return undefined;

                    this._skipOptionalSpacesOrDelimiter();
                    return flag;
                },
                parseSegment: function () {
                    let lookahead = this._string[this._currentIndex];
                    let command = this._pathSegTypeFromChar(lookahead);
                    if (command == window.SVGPathSeg.PATHSEG_UNKNOWN) {
                        // Possibly an implicit command. Not allowed if this is the first command.
                        if (this._previousCommand == window.SVGPathSeg.PATHSEG_UNKNOWN)
                            return null;
                        command = this._nextCommandHelper(lookahead, this._previousCommand);
                        if (command == window.SVGPathSeg.PATHSEG_UNKNOWN)
                            return null;
                    } else {
                        this._currentIndex++;
                    }

                    this._previousCommand = command;

                    switch (command) {
                        case window.SVGPathSeg.PATHSEG_MOVETO_REL:
                            return new window.SVGPathSegMovetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_MOVETO_ABS:
                            return new window.SVGPathSegMovetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_REL:
                            return new window.SVGPathSegLinetoRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_ABS:
                            return new window.SVGPathSegLinetoAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL:
                            return new window.SVGPathSegLinetoHorizontalRel(owningPathSegList, this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS:
                            return new window.SVGPathSegLinetoHorizontalAbs(owningPathSegList, this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL:
                            return new window.SVGPathSegLinetoVerticalRel(owningPathSegList, this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS:
                            return new window.SVGPathSegLinetoVerticalAbs(owningPathSegList, this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_CLOSEPATH:
                            this._skipOptionalSpaces();
                            return new window.SVGPathSegClosePath(owningPathSegList);
                        case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoCubicRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                        case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoCubicAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.x2, points.y2);
                        case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
                            var points = { x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoCubicSmoothRel(owningPathSegList, points.x, points.y, points.x2, points.y2);
                        case window.SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
                            var points = { x2: this._parseNumber(), y2: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoCubicSmoothAbs(owningPathSegList, points.x, points.y, points.x2, points.y2);
                        case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoQuadraticRel(owningPathSegList, points.x, points.y, points.x1, points.y1);
                        case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegCurvetoQuadraticAbs(owningPathSegList, points.x, points.y, points.x1, points.y1);
                        case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
                            return new window.SVGPathSegCurvetoQuadraticSmoothRel(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
                            return new window.SVGPathSegCurvetoQuadraticSmoothAbs(owningPathSegList, this._parseNumber(), this._parseNumber());
                        case window.SVGPathSeg.PATHSEG_ARC_REL:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegArcRel(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                        case window.SVGPathSeg.PATHSEG_ARC_ABS:
                            var points = { x1: this._parseNumber(), y1: this._parseNumber(), arcAngle: this._parseNumber(), arcLarge: this._parseArcFlag(), arcSweep: this._parseArcFlag(), x: this._parseNumber(), y: this._parseNumber() };
                            return new window.SVGPathSegArcAbs(owningPathSegList, points.x, points.y, points.x1, points.y1, points.arcAngle, points.arcLarge, points.arcSweep);
                        default:
                            throw "Unknown path seg type."
                    }
                }
            };

            let builder = new Builder();
            let source = new Source(string);

            if (!source.initialCommandIsMoveTo())
                return [];
            while (source.hasMoreData()) {
                let pathSeg = source.parseSegment();
                if (!pathSeg)
                    return [];
                builder.appendSegment(pathSeg);
            }

            return builder.pathSegList;
        };
    }
})();

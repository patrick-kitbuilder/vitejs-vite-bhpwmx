// matrix.js
(function(root) {
  'use strict';

  function Matrix(a, b, c, d, e, f) {
      this.a = a || 1;
      this.b = b || 0;
      this.c = c || 0;
      this.d = d || 1;
      this.e = e || 0;
      this.f = f || 0;
  }

  Matrix.prototype.multiply = function(matrix) {
      return new Matrix(
          this.a * matrix.a + this.c * matrix.b,
          this.b * matrix.a + this.d * matrix.b,
          this.a * matrix.c + this.c * matrix.d,
          this.b * matrix.c + this.d * matrix.d,
          this.a * matrix.e + this.c * matrix.f + this.e,
          this.b * matrix.e + this.d * matrix.f + this.f
      );
  };

  Matrix.prototype.inverse = function() {
      const det = this.a * this.d - this.b * this.c;
      return new Matrix(
          this.d / det,
          -this.b / det,
          -this.c / det,
          this.a / det,
          (this.c * this.f - this.d * this.e) / det,
          (this.b * this.e - this.a * this.f) / det
      );
  };

  Matrix.prototype.translate = function(tx, ty) {
      return this.multiply(new Matrix(1, 0, 0, 1, tx, ty));
  };

  Matrix.prototype.scale = function(sx, sy) {
      return this.multiply(new Matrix(sx, 0, 0, sy, 0, 0));
  };

  Matrix.prototype.rotate = function(angle, x, y) {
      x = x || 0;
      y = y || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return this.multiply(new Matrix(cos, sin, -sin, cos, x, y));
  };

  Matrix.prototype.skewX = function(angle) {
      return this.multiply(new Matrix(1, 0, Math.tan(angle), 1, 0, 0));
  };

  Matrix.prototype.skewY = function(angle) {
      return this.multiply(new Matrix(1, Math.tan(angle), 0, 1, 0, 0));
  };

  Matrix.prototype.decompose = function() {
      const scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
      const scaleY = (this.a * this.d - this.b * this.c) / scaleX;
      const skewX = Math.atan2(this.a * this.c + this.b * this.d, scaleX * scaleY);
      const rotation = Math.atan2(this.b, this.a);
      const translateX = this.e;
      const translateY = this.f;
      return {
          scaleX: scaleX,
          scaleY: scaleY,
          skewX: skewX,
          rotation: rotation,
          translateX: translateX,
          translateY: translateY
      };
  };

  Matrix.prototype.toArray = function() {
      return [this.a, this.b, this.c, this.d, this.e, this.f];
  };

  Matrix.prototype.applyToPoint = function(x, y) {
      return {
          x: this.a * x + this.c * y + this.e,
          y: this.b * x + this.d * y + this.f
      };
  };

  Matrix.prototype.applyToArray = function(points) {
      return points.map(point => this.applyToPoint(point.x, point.y));
  };

  root.Matrix = Matrix;

}(typeof window !== 'undefined' ? window : global));

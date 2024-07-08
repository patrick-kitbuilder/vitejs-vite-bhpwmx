class Matrix {
  constructor() {
      this.queue = [];   // list of matrices to apply
      this.cache = null; // combined matrix cache
  }

  combine(m1, m2) {
      return [
          m1[0] * m2[0] + m1[2] * m2[1],
          m1[1] * m2[0] + m1[3] * m2[1],
          m1[0] * m2[2] + m1[2] * m2[3],
          m1[1] * m2[2] + m1[3] * m2[3],
          m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
          m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
      ];
  }

  isIdentity() {
      if (!this.cache) {
          this.cache = this.toArray();
      }

      const m = this.cache;
      
      return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
  }

  matrix(m) {
      if (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0) {
          return this;
      }
      this.cache = null;
      this.queue.push(m);
      return this;
  }

  translate(tx, ty) {
      if (tx !== 0 || ty !== 0) {
          this.cache = null;
          this.queue.push([1, 0, 0, 1, tx, ty]);
      }
      return this;
  }

  scale(sx, sy) {
      if (sx !== 1 || sy !== 1) {
          this.cache = null;
          this.queue.push([sx, 0, 0, sy, 0, 0]);
      }
      return this;
  }

  rotate(angle, rx, ry) {
      let rad, cos, sin;

      if (angle !== 0) {
          this.translate(rx, ry);

          rad = angle * Math.PI / 180;
          cos = Math.cos(rad);
          sin = Math.sin(rad);

          this.queue.push([cos, sin, -sin, cos, 0, 0]);
          this.cache = null;

          this.translate(-rx, -ry);
      }
      return this;
  }

  skewX(angle) {
      if (angle !== 0) {
          this.cache = null;
          this.queue.push([1, 0, Math.tan(angle * Math.PI / 180), 1, 0, 0]);
      }
      return this;
  }

  skewY(angle) {
      if (angle !== 0) {
          this.cache = null;
          this.queue.push([1, Math.tan(angle * Math.PI / 180), 0, 1, 0, 0]);
      }
      return this;
  }

  toArray() {
      if (this.cache) {
          return this.cache;
      }

      if (!this.queue.length) {
          this.cache = [1, 0, 0, 1, 0, 0];
          return this.cache;
      }

      this.cache = this.queue[0];

      if (this.queue.length === 1) {
          return this.cache;
      }

      for (let i = 1; i < this.queue.length; i++) {
          this.cache = this.combine(this.cache, this.queue[i]);
      }

      return this.cache;
  }

  calc(x, y, isRelative) {
      if (!this.queue.length) { 
          return [x, y]; 
      }

      if (!this.cache) {
          this.cache = this.toArray();
      }

      const m = this.cache;

      return [
          x * m[0] + y * m[2] + (isRelative ? 0 : m[4]),
          x * m[1] + y * m[3] + (isRelative ? 0 : m[5])
      ];
  }
}

(typeof window !== 'undefined' ? window : self).Matrix = Matrix;
/*
 * figures.js — a tiny declarative SVG renderer for the nonverbal battery.
 *
 * A "figure" is { items: [shape, ...] } drawn in a 0 0 100 100 viewBox.
 * Shapes are plain objects so the item bank stays readable and diff-able:
 *
 *   { t: 'circle', x: 50, y: 50, s: 40, fill: 'solid', rot: 0 }
 *
 * Colors come from CSS custom properties so figures stay legible in both
 * light and dark themes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Figures = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var uid = 0;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    return node;
  }

  // --------------------------------------------------------------- shapes ---

  function regularPolygon(cx, cy, r, sides, startAngle) {
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = startAngle + (i * 2 * Math.PI) / sides;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  function starPoints(cx, cy, r, points) {
    var pts = [];
    var inner = r * 0.42;
    for (var i = 0; i < points * 2; i++) {
      var rad = i % 2 === 0 ? r : inner;
      var a = -Math.PI / 2 + (i * Math.PI) / points;
      pts.push((cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  var BUILDERS = {
    circle: function (s) {
      return el('circle', { cx: s.x, cy: s.y, r: s.s / 2 });
    },
    ellipse: function (s) {
      return el('ellipse', { cx: s.x, cy: s.y, rx: s.s / 2, ry: (s.h != null ? s.h : s.s * 0.6) / 2 });
    },
    square: function (s) {
      return el('rect', { x: s.x - s.s / 2, y: s.y - s.s / 2, width: s.s, height: s.s });
    },
    rect: function (s) {
      var w = s.w != null ? s.w : s.s;
      var h = s.h != null ? s.h : s.s * 0.6;
      return el('rect', { x: s.x - w / 2, y: s.y - h / 2, width: w, height: h });
    },
    triangle: function (s) {
      var r = s.s / 2;
      return el('polygon', { points: regularPolygon(s.x, s.y, r, 3, -Math.PI / 2) });
    },
    diamond: function (s) {
      var r = s.s / 2;
      return el('polygon', {
        points: [s.x + ',' + (s.y - r), (s.x + r) + ',' + s.y, s.x + ',' + (s.y + r), (s.x - r) + ',' + s.y].join(' ')
      });
    },
    pentagon: function (s) {
      return el('polygon', { points: regularPolygon(s.x, s.y, s.s / 2, 5, -Math.PI / 2) });
    },
    hexagon: function (s) {
      return el('polygon', { points: regularPolygon(s.x, s.y, s.s / 2, 6, -Math.PI / 2) });
    },
    octagon: function (s) {
      return el('polygon', { points: regularPolygon(s.x, s.y, s.s / 2, 8, -Math.PI / 8) });
    },
    trapezoid: function (s) {
      var w = s.s / 2, h = s.s / 2, top = w * 0.5;
      return el('polygon', {
        points: [
          (s.x - top) + ',' + (s.y - h), (s.x + top) + ',' + (s.y - h),
          (s.x + w) + ',' + (s.y + h), (s.x - w) + ',' + (s.y + h)
        ].join(' ')
      });
    },
    star: function (s) {
      return el('polygon', { points: starPoints(s.x, s.y, s.s / 2, s.points || 5) });
    },
    cross: function (s) {
      var r = s.s / 2, t = s.s / 6;
      var pts = [
        [s.x - t, s.y - r], [s.x + t, s.y - r], [s.x + t, s.y - t], [s.x + r, s.y - t],
        [s.x + r, s.y + t], [s.x + t, s.y + t], [s.x + t, s.y + r], [s.x - t, s.y + r],
        [s.x - t, s.y + t], [s.x - r, s.y + t], [s.x - r, s.y - t], [s.x - t, s.y - t]
      ];
      return el('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' ') });
    },
    arrow: function (s) {
      // Points up before rotation.
      var r = s.s / 2, t = s.s / 8;
      var pts = [
        [s.x, s.y - r], [s.x + r * 0.6, s.y - r * 0.1], [s.x + t, s.y - r * 0.1],
        [s.x + t, s.y + r], [s.x - t, s.y + r], [s.x - t, s.y - r * 0.1],
        [s.x - r * 0.6, s.y - r * 0.1]
      ];
      return el('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' ') });
    },
    line: function (s) {
      return el('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 });
    },
    dot: function (s) {
      return el('circle', { cx: s.x, cy: s.y, r: s.s != null ? s.s / 2 : 5 });
    },
    // Right triangle — the half-sheet left behind by a diagonal paper fold.
    rtri: function (s) {
      var w = s.w != null ? s.w : s.s;
      var h = s.h != null ? s.h : s.s;
      var x0 = s.x - w / 2, y0 = s.y - h / 2;
      var corner = s.corner || 'bl';
      var pts = {
        bl: [[x0, y0], [x0, y0 + h], [x0 + w, y0 + h]],
        br: [[x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]],
        tl: [[x0, y0], [x0 + w, y0], [x0, y0 + h]],
        tr: [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h]]
      }[corner];
      return el('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' ') });
    }
  };

  // ------------------------------------------------------------- rendering ---

  function halfClip(svg, shape) {
    var id = 'fclip' + (++uid);
    var defs = el('defs', {});
    var clip = el('clipPath', { id: id });
    var dir = shape.half || 'left';
    var box = { x: 0, y: 0, width: 100, height: 100 };
    if (dir === 'left') box = { x: 0, y: 0, width: shape.x, height: 100 };
    if (dir === 'right') box = { x: shape.x, y: 0, width: 100 - shape.x, height: 100 };
    if (dir === 'top') box = { x: 0, y: 0, width: 100, height: shape.y };
    if (dir === 'bottom') box = { x: 0, y: shape.y, width: 100, height: 100 - shape.y };
    clip.appendChild(el('rect', box));
    defs.appendChild(clip);
    svg.appendChild(defs);
    return id;
  }

  function drawShape(svg, shape) {
    var s = Object.assign({ x: 50, y: 50, s: 44, fill: 'none', rot: 0 }, shape);
    var builder = BUILDERS[s.t];
    if (!builder) throw new Error('Unknown figure shape: ' + s.t);

    var group = el('g', {});
    if (s.rot) group.setAttribute('transform', 'rotate(' + s.rot + ' ' + s.x + ' ' + s.y + ')');

    var outline = builder(s);
    outline.setAttribute('class', 'fig-shape fig-fill-' + (s.fill === 'half' ? 'none' : s.fill));
    if (s.t === 'line') outline.setAttribute('class', 'fig-shape fig-line' + (s.dash ? ' fig-dashed' : ''));
    if (s.t === 'dot') outline.setAttribute('class', 'fig-shape fig-fill-solid');
    group.appendChild(outline);

    if (s.fill === 'half') {
      var clipId = halfClip(svg, s);
      var filled = builder(s);
      filled.setAttribute('class', 'fig-shape fig-fill-solid');
      filled.setAttribute('clip-path', 'url(#' + clipId + ')');
      group.appendChild(filled);
    }

    svg.appendChild(group);
  }

  /** Render one figure into a fresh <svg> element. */
  function render(figure, opts) {
    opts = opts || {};
    var svg = el('svg', {
      viewBox: '0 0 100 100',
      class: 'fig' + (opts.className ? ' ' + opts.className : ''),
      role: 'img',
      'aria-label': (figure && figure.alt) || opts.alt || 'figure'
    });
    if (figure && figure.frame) {
      var frame = el('rect', { x: 2, y: 2, width: 96, height: 96, rx: 3 });
      frame.setAttribute('class', 'fig-shape fig-frame');
      svg.appendChild(frame);
    }
    (figure && figure.items ? figure.items : []).forEach(function (shape) {
      drawShape(svg, shape);
    });
    return svg;
  }

  // --------------------------------------------------------------- helpers ---
  // Authoring shortcuts used by the item bank.

  var F = {};

  /** A figure holding the given shapes. */
  F.fig = function (items, extra) {
    return Object.assign({ items: [].concat(items) }, extra || {});
  };

  /** One centered shape. */
  F.one = function (t, opts) {
    return F.fig([Object.assign({ t: t }, opts || {})], (opts || {}).figure);
  };

  /** `n` copies of a shape laid out in a row, or a 2x2 / 2x3 block. */
  F.many = function (n, t, opts) {
    opts = opts || {};
    var size = opts.s || (n <= 2 ? 30 : n <= 4 ? 26 : 20);
    var positions = LAYOUTS[n] || LAYOUTS[1];
    var items = positions.map(function (p) {
      return Object.assign({ t: t, x: p[0], y: p[1], s: size }, opts.shape || {}, { fill: opts.fill || 'none' });
    });
    return F.fig(items, opts.figure);
  };

  var LAYOUTS = {
    1: [[50, 50]],
    2: [[32, 50], [68, 50]],
    3: [[25, 50], [50, 50], [75, 50]],
    4: [[32, 32], [68, 32], [32, 68], [68, 68]],
    5: [[28, 32], [50, 32], [72, 32], [39, 68], [61, 68]],
    6: [[28, 32], [50, 32], [72, 32], [28, 68], [50, 68], [72, 68]]
  };

  /** An outer shape with a smaller shape nested inside it. */
  F.nested = function (outer, inner, opts) {
    opts = opts || {};
    return F.fig([
      { t: outer, x: 50, y: 50, s: 62, fill: opts.outerFill || 'none' },
      { t: inner, x: 50, y: 50, s: 26, fill: opts.innerFill || 'none' }
    ], opts.figure);
  };

  /**
   * A sheet of paper for the paper-folding subtest.
   * @param {Object} o
   * @param {Array}  o.rect  visible sheet as [cx, cy, w, h]
   * @param {Object} o.tri   instead of a rect, a right triangle: { corner: 'bl' }
   * @param {Array}  o.dash  fold lines as [x1, y1, x2, y2]
   * @param {Array}  o.holes punched holes as [x, y]
   */
  F.paper = function (o) {
    o = o || {};
    var items = [];

    if (o.tri) {
      items.push({
        t: 'rtri', x: 50, y: 50, w: o.tri.w || 76, h: o.tri.h || 76,
        corner: o.tri.corner || 'bl', fill: 'paper'
      });
    } else {
      var r = o.rect || [50, 50, 76, 76];
      items.push({ t: 'rect', x: r[0], y: r[1], w: r[2], h: r[3], fill: 'paper' });
    }

    (o.dash || []).forEach(function (d) {
      items.push({ t: 'line', x1: d[0], y1: d[1], x2: d[2], y2: d[3], dash: true });
    });
    (o.holes || []).forEach(function (h) {
      items.push({ t: 'dot', x: h[0], y: h[1], s: 11 });
    });
    return F.fig(items, { alt: o.alt });
  };

  /** Reflect a point across the vertical or horizontal midline, or the main diagonal. */
  F.mirror = function (pt, axis) {
    if (axis === 'v') return [100 - pt[0], pt[1]];
    if (axis === 'h') return [pt[0], 100 - pt[1]];
    return [pt[1], pt[0]]; // main diagonal y = x
  };

  return {
    render: render,
    F: F,
    LAYOUTS: LAYOUTS
  };
});

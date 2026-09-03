/*
 * pictograms.js — simple object drawings for the primary (K-2) picture battery.
 *
 * The primary levels of CogAT test verbal reasoning with pictures rather than
 * words, because the children taking them are not yet reliable readers. Picture
 * Analogies and Picture Classification therefore need recognisable everyday
 * objects, not the abstract shapes the nonverbal battery uses.
 *
 * Each entry is a figure spec in the same 0 0 100 100 viewBox as everything else,
 * plus the word it depicts. The word is what the examiner reads aloud and what
 * screen readers announce, so every drawing carries its own label.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatPictograms = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function fig(word, items) {
    return { word: word, alt: word, items: items };
  }

  function path(d, fill) { return { t: 'path', d: d, fill: fill || 'none' }; }
  function line(x1, y1, x2, y2) { return { t: 'line', x1: x1, y1: y1, x2: x2, y2: y2 }; }

  var P = {

    // ---- sky -------------------------------------------------------------
    sun: function () {
      var rays = [];
      for (var i = 0; i < 8; i++) {
        var a = (i * Math.PI) / 4;
        rays.push(line(50 + 26 * Math.cos(a), 50 + 26 * Math.sin(a),
                       50 + 38 * Math.cos(a), 50 + 38 * Math.sin(a)));
      }
      return fig('sun', [{ t: 'circle', x: 50, y: 50, s: 40 }].concat(rays));
    },
    moon: function () {
      return fig('moon', [path('M62 16 A38 38 0 1 0 62 84 A30 30 0 1 1 62 16 Z')]);
    },
    cloud: function () {
      return fig('cloud', [path('M28 66 A14 14 0 0 1 30 39 A18 18 0 0 1 64 34 A15 15 0 0 1 72 66 Z')]);
    },
    rain: function () {
      return fig('rain', [
        path('M28 50 A12 12 0 0 1 30 27 A16 16 0 0 1 62 23 A13 13 0 0 1 69 50 Z'),
        line(36, 60, 32, 76), line(50, 60, 46, 76), line(64, 60, 60, 76)
      ]);
    },

    // ---- plants ----------------------------------------------------------
    tree: function () {
      return fig('tree', [
        { t: 'circle', x: 50, y: 38, s: 48 },
        { t: 'rect', x: 50, y: 72, w: 12, h: 26 }
      ]);
    },
    leaf: function () {
      return fig('leaf', [
        path('M22 74 C22 38 46 20 76 20 C76 52 54 74 22 74 Z'),
        line(24, 76, 60, 40)
      ]);
    },
    flower: function () {
      var petals = [0, 1, 2, 3, 4].map(function (i) {
        var a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return { t: 'circle', x: 50 + 17 * Math.cos(a), y: 40 + 17 * Math.sin(a), s: 20 };
      });
      return fig('flower', petals.concat([
        { t: 'circle', x: 50, y: 40, s: 13 },
        line(50, 56, 50, 86)
      ]));
    },
    apple: function () {
      return fig('apple', [
        path('M50 30 C30 22 18 40 22 58 C26 78 40 86 50 78 C60 86 74 78 78 58 C82 40 70 22 50 30 Z'),
        line(50, 30, 50, 16), path('M50 20 C60 12 68 14 70 18 C64 26 56 26 50 20 Z')
      ]);
    },
    seed: function () {
      return fig('seed', [
        { t: 'ellipse', x: 50, y: 58, s: 26, h: 34 },
        path('M50 41 C50 26 60 20 68 20 C68 32 58 40 50 41 Z')
      ]);
    },

    // ---- animals ---------------------------------------------------------
    bird: function () {
      return fig('bird', [
        { t: 'ellipse', x: 44, y: 52, s: 48, h: 32 },
        { t: 'circle', x: 68, y: 34, s: 24 },
        path('M79 31 L94 37 L79 43 Z', 'solid'),
        path('M20 48 L6 40 L8 58 Z'),
        path('M34 46 C44 38 58 42 60 52 C50 58 38 56 34 46 Z'),
        { t: 'dot', x: 71, y: 30, s: 6 },
        line(40, 67, 37, 84), line(53, 67, 53, 84)
      ]);
    },
    nest: function () {
      return fig('nest', [
        { t: 'ellipse', x: 34, y: 44, s: 19, h: 24 },
        { t: 'ellipse', x: 50, y: 41, s: 19, h: 24 },
        { t: 'ellipse', x: 66, y: 44, s: 19, h: 24 },
        path('M10 50 C10 86 90 86 90 50 Z'),
        line(18, 58, 82, 58), line(24, 68, 76, 68)
      ]);
    },
    egg: function () {
      return fig('egg', [path('M50 12 C34 12 24 34 24 54 C24 74 36 88 50 88 C64 88 76 74 76 54 C76 34 66 12 50 12 Z')]);
    },
    fish: function () {
      return fig('fish', [
        path('M20 50 C34 28 66 28 78 50 C66 72 34 72 20 50 Z'),
        path('M78 50 L94 36 L94 64 Z'),
        { t: 'dot', x: 36, y: 44, s: 7 }
      ]);
    },
    cat: function () {
      return fig('cat', [
        { t: 'circle', x: 50, y: 46, s: 44 },
        path('M30 32 L26 12 L46 24 Z'), path('M70 32 L74 12 L54 24 Z'),
        { t: 'dot', x: 40, y: 44, s: 7 }, { t: 'dot', x: 60, y: 44, s: 7 },
        line(20, 54, 38, 58), line(20, 62, 38, 62), line(80, 54, 62, 58), line(80, 62, 62, 62),
        path('M44 58 L50 64 L56 58 Z', 'solid')
      ]);
    },
    dog: function () {
      return fig('dog', [
        { t: 'ellipse', x: 22, y: 54, s: 20, h: 42 },
        { t: 'ellipse', x: 78, y: 54, s: 20, h: 42 },
        { t: 'circle', x: 50, y: 46, s: 50 },
        { t: 'dot', x: 39, y: 40, s: 7 }, { t: 'dot', x: 61, y: 40, s: 7 },
        { t: 'ellipse', x: 50, y: 62, s: 30, h: 22 },
        { t: 'ellipse', x: 50, y: 55, s: 13, h: 9, fill: 'solid' },
        line(50, 60, 50, 68)
      ]);
    },
    bone: function () {
      return fig('bone', [
        { t: 'rect', x: 50, y: 50, w: 42, h: 14 },
        { t: 'circle', x: 26, y: 42, s: 20 }, { t: 'circle', x: 26, y: 58, s: 20 },
        { t: 'circle', x: 74, y: 42, s: 20 }, { t: 'circle', x: 74, y: 58, s: 20 }
      ]);
    },
    butterfly: function () {
      return fig('butterfly', [
        path('M50 50 C30 22 12 30 18 48 C22 62 40 62 50 50 Z'),
        path('M50 50 C70 22 88 30 82 48 C78 62 60 62 50 50 Z'),
        path('M50 50 C34 62 22 76 30 84 C40 90 48 70 50 50 Z'),
        path('M50 50 C66 62 78 76 70 84 C60 90 52 70 50 50 Z'),
        { t: 'ellipse', x: 50, y: 52, s: 8, h: 40, fill: 'solid' }
      ]);
    },

    // ---- buildings and things --------------------------------------------
    house: function () {
      return fig('house', [
        { t: 'rect', x: 50, y: 62, w: 52, h: 40 },
        path('M18 42 L50 16 L82 42 Z'),
        { t: 'rect', x: 50, y: 70, w: 14, h: 24 }
      ]);
    },
    door: function () {
      return fig('door', [
        { t: 'rect', x: 50, y: 50, w: 40, h: 72 },
        { t: 'dot', x: 64, y: 52, s: 7 }
      ]);
    },
    window: function () {
      return fig('window', [
        { t: 'rect', x: 50, y: 50, w: 56, h: 56 },
        line(50, 22, 50, 78), line(22, 50, 78, 50)
      ]);
    },
    key: function () {
      return fig('key', [
        { t: 'circle', x: 30, y: 42, s: 28 },
        { t: 'rect', x: 58, y: 42, w: 40, h: 9 },
        { t: 'rect', x: 68, y: 52, w: 8, h: 12 },
        { t: 'rect', x: 80, y: 52, w: 8, h: 12 }
      ]);
    },
    lock: function () {
      return fig('lock', [
        { t: 'rect', x: 50, y: 64, w: 48, h: 34 },
        path('M34 47 C34 24 66 24 66 47'),
        { t: 'dot', x: 50, y: 62, s: 9 }
      ]);
    },

    // ---- vehicles --------------------------------------------------------
    car: function () {
      return fig('car', [
        { t: 'rect', x: 50, y: 56, w: 64, h: 20 },
        path('M28 46 L38 30 L64 30 L72 46 Z'),
        { t: 'circle', x: 34, y: 72, s: 18 }, { t: 'circle', x: 66, y: 72, s: 18 }
      ]);
    },
    wheel: function () {
      return fig('wheel', [
        { t: 'circle', x: 50, y: 50, s: 60 }, { t: 'circle', x: 50, y: 50, s: 18 },
        line(50, 20, 50, 41), line(50, 59, 50, 80), line(20, 50, 41, 50), line(59, 50, 80, 50)
      ]);
    },
    boat: function () {
      return fig('boat', [
        path('M16 62 L84 62 L72 82 L28 82 Z'),
        line(50, 62, 50, 16),
        path('M50 20 L78 52 L50 52 Z')
      ]);
    },

    // ---- household -------------------------------------------------------
    cup: function () {
      return fig('cup', [
        path('M28 30 L34 78 L66 78 L72 30 Z'),
        path('M72 40 C88 40 88 62 70 62')
      ]);
    },
    spoon: function () {
      return fig('spoon', [
        { t: 'ellipse', x: 50, y: 30, s: 28, h: 34 },
        { t: 'rect', x: 50, y: 66, w: 8, h: 34 }
      ]);
    },
    book: function () {
      return fig('book', [
        { t: 'rect', x: 50, y: 50, w: 60, h: 46 },
        line(50, 27, 50, 73), line(30, 38, 44, 38), line(56, 38, 70, 38),
        line(30, 50, 44, 50), line(56, 50, 70, 50)
      ]);
    },
    clock: function () {
      return fig('clock', [
        { t: 'circle', x: 50, y: 50, s: 64 },
        line(50, 50, 50, 26), line(50, 50, 68, 58),
        { t: 'dot', x: 50, y: 50, s: 6 }
      ]);
    },
    chair: function () {
      return fig('chair', [
        { t: 'rect', x: 50, y: 52, w: 44, h: 8 },
        { t: 'rect', x: 30, y: 34, w: 8, h: 44 },
        line(34, 76, 34, 88), line(70, 56, 70, 88)
      ]);
    },
    lamp: function () {
      return fig('lamp', [
        path('M28 44 L40 18 L60 18 L72 44 Z'),
        line(50, 44, 50, 78),
        { t: 'rect', x: 50, y: 82, w: 36, h: 8 }
      ]);
    },
    pencil: function () {
      return fig('pencil', [
        path('M22 78 L30 54 L70 14 L84 28 L44 68 Z'),
        line(30, 54, 44, 68)
      ]);
    },
    scissors: function () {
      return fig('scissors', [
        line(30, 20, 66, 62), line(70, 20, 34, 62),
        { t: 'circle', x: 30, y: 72, s: 20 }, { t: 'circle', x: 70, y: 72, s: 20 }
      ]);
    },
    hammer: function () {
      return fig('hammer', [
        { t: 'rect', x: 50, y: 28, w: 52, h: 22 },
        { t: 'rect', x: 50, y: 64, w: 12, h: 46 }
      ]);
    },

    // ---- clothing --------------------------------------------------------
    shoe: function () {
      return fig('shoe', [
        path('M16 74 L16 46 L36 46 L52 60 L84 62 L84 74 Z'),
        line(24, 52, 32, 52)
      ]);
    },
    hat: function () {
      return fig('hat', [
        path('M30 56 L30 26 L70 26 L70 56 Z'),
        { t: 'rect', x: 50, y: 60, w: 68, h: 9 }
      ]);
    },
    ball: function () {
      return fig('ball', [
        { t: 'circle', x: 50, y: 50, s: 60 },
        path('M20 50 C34 34 66 34 80 50'), path('M20 50 C34 66 66 66 80 50')
      ]);
    },

    // ---- added to open up more picture analogies and classifications -----
    kennel: function () {
      return fig('kennel', [
        { t: 'rect', x: 50, y: 66, w: 60, h: 36 },
        path('M16 48 L50 20 L84 48 Z'),
        path('M38 84 L38 60 C38 50 62 50 62 60 L62 84 Z')
      ]);
    },
    paper: function () {
      return fig('paper', [
        { t: 'rect', x: 50, y: 50, w: 46, h: 62 },
        line(36, 34, 64, 34), line(36, 46, 64, 46), line(36, 58, 64, 58), line(36, 70, 54, 70)
      ]);
    },
    nail: function () {
      return fig('nail', [
        { t: 'rect', x: 50, y: 22, w: 40, h: 9 },
        path('M42 27 L58 27 L52 84 L50 90 L48 84 Z')
      ]);
    },
    sock: function () {
      return fig('sock', [
        path('M34 14 L62 14 L62 56 C62 70 84 70 84 82 L84 88 L52 88 C36 88 34 74 34 62 Z'),
        line(34, 26, 62, 26)
      ]);
    },
    glove: function () {
      return fig('glove', [
        path('M30 88 L30 46 C30 36 40 36 40 46 L40 30 C40 20 50 20 50 30 L50 28 C50 18 60 18 60 28 L60 34 C60 26 70 26 70 36 L70 66 C70 82 62 88 54 88 Z')
      ]);
    },
    banana: function () {
      return fig('banana', [
        path('M18 30 C18 62 40 82 76 78 C82 77 84 70 78 68 C48 66 30 48 28 28 C27 22 18 23 18 30 Z')
      ]);
    },
    pear: function () {
      return fig('pear', [
        path('M50 30 C38 30 34 42 38 52 C30 60 28 76 42 84 C50 89 60 87 64 80 C72 68 66 56 60 50 C62 40 60 30 50 30 Z'),
        line(50, 30, 52, 16)
      ]);
    },
    star: function () {
      return fig('star', [{ t: 'star', x: 50, y: 50, s: 68 }]);
    },
    bottle: function () {
      return fig('bottle', [
        path('M42 16 L58 16 L58 34 C58 40 68 44 68 54 L68 84 L32 84 L32 54 C32 44 42 40 42 34 Z'),
        line(32, 56, 68, 56)
      ]);
    }
  };

  var CACHE = {};

  /** @returns {{word:string, alt:string, items:Array}} a figure spec */
  function get(name) {
    if (!CACHE[name]) {
      if (!P[name]) throw new Error('Unknown pictogram: ' + name);
      CACHE[name] = P[name]();
    }
    return CACHE[name];
  }

  function names() { return Object.keys(P); }

  return { get: get, names: names };
});

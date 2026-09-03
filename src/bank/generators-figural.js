/*
 * generators-figural.js — item factories for the nonverbal battery.
 *
 * Figure Matrices, Figure Classification and Paper Folding are all rule-driven,
 * so the rule that generates an item also generates its walkthrough and the
 * explanation of every distractor.
 *
 * Paper folding is computed rather than hand-placed: folds are reflections, and
 * unfolding is those reflections applied in reverse with duplicates merged. A
 * punch that lands exactly on a fold line therefore reflects onto itself and
 * yields a single hole, which is the classic hard case and falls out of the
 * geometry instead of being special-cased.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../figures.js'), require('./generators.js'));
  } else {
    root.CogatGeneratorsFigural = factory(root.Figures, root.CogatGenerators);
  }
})(typeof self !== 'undefined' ? self : this, function (Figures, Gen) {
  'use strict';

  var F = Figures.F;
  var items = [];
  var multipleChoice = Gen.multipleChoice;
  var whyFor = Gen.whyFor;

  function push(i) { if (i) items.push(i); }
  function pick(fig) { return { fig: fig }; }
  function round2(n) { return Math.round(n * 100) / 100; }

  // Figure-building shorthands, shared with the hand-authored nonverbal items.
  function one(t, opts) { return F.one(t, Object.assign({ s: 46 }, opts || {})); }
  function many(n, t, opts) { return F.many(n, t, opts || {}); }
  function nest(outer, inner) { return F.nested(outer, inner); }
  function dotted(shape, dots) {
    return F.fig([{ t: shape, x: 50, y: 50, s: 62 }].concat(dots.map(function (d) {
      return { t: 'dot', x: d[0], y: d[1], s: 9 };
    })));
  }
  function split(shape) {
    return F.fig([
      { t: shape, x: 50, y: 50, s: 56 },
      { t: 'line', x1: 50, y1: 16, x2: 50, y2: 84 }
    ]);
  }

  var DOT_SPOTS = { 1: [[50, 50]], 2: [[38, 50], [62, 50]], 3: [[34, 50], [50, 50], [66, 50]] };

  // ========================================================= FIGURE MATRICES

  var SHAPES_A = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'star', 'pentagon'];

  /** 2x2: size changes across, shape changes down. */
  function matrixSize(shapeA, shapeB, suffix) {
    var id = 'fm-size-' + suffix;
    var correct = pick(one(shapeB, { s: 62 }));
    var mc = multipleChoice(id, correct, [
      pick(one(shapeB, { s: 24 })), pick(one(shapeA, { s: 62 })),
      pick(one(shapeB, { s: 62, fill: 'solid' })), pick(one('triangle', { s: 62 })),
      pick(one(shapeA, { s: 24 }))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -3.00,
      stem: { kind: 'matrix', cols: 2, cells: [
        one(shapeA, { s: 24 }), one(shapeA, { s: 62 }), one(shapeB, { s: 24 }), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'Only one thing changes as you move across a row.',
      walkthrough: [
        { title: 'Read across the top row', text: 'A small ' + shapeA + ' becomes a large ' + shapeA + '. The shape stays the same; only the size changes.' },
        { title: 'Read down the left column', text: 'A small ' + shapeA + ' becomes a small ' + shapeB + '. Only the shape changes; the size stays small.' },
        { title: 'Combine both rules', text: 'The missing cell is in the ' + shapeB + ' row and the large column, so it is a large ' + shapeB + ' with the same open outline.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(one(shapeB, { s: 24 })))] = 'The size did not grow.';
        w[JSON.stringify(pick(one(shapeA, { s: 62 })))] = 'That is the wrong shape for this row.';
        w[JSON.stringify(pick(one(shapeB, { s: 62, fill: 'solid' })))] = 'Shading never changes anywhere in the grid.';
        return w;
      })())
    };
  }

  /** 2x2: shading changes across, shape changes down. */
  function matrixFill(shapeA, shapeB, suffix) {
    var id = 'fm-fill-' + suffix;
    var correct = pick(one(shapeB, { fill: 'solid' }));
    var mc = multipleChoice(id, correct, [
      pick(one(shapeB)), pick(one(shapeA, { fill: 'solid' })),
      pick(one(shapeB, { fill: 'half' })), pick(one('circle', { fill: 'solid' })),
      pick(one(shapeA))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -2.60,
      stem: { kind: 'matrix', cols: 2, cells: [
        one(shapeA), one(shapeA, { fill: 'solid' }), one(shapeB), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'What happens to the inside of the figure across the row?',
      walkthrough: [
        { title: 'Read across the top row', text: 'An empty ' + shapeA + ' becomes a filled ' + shapeA + '. The rule is "fill it in".' },
        { title: 'Read down the left column', text: 'A ' + shapeA + ' becomes a ' + shapeB + '. The shape changes but the shading stays empty.' },
        { title: 'Combine both rules', text: 'The missing cell is a ' + shapeB + ' that has been filled in.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(one(shapeB)))] = 'That is unchanged from the cell to its left.';
        w[JSON.stringify(pick(one(shapeA, { fill: 'solid' })))] = 'That is the wrong shape for this row.';
        w[JSON.stringify(pick(one(shapeB, { fill: 'half' })))] = 'The grid only uses empty and fully filled, never half.';
        return w;
      })())
    };
  }

  /** 2x2: count changes across, shape changes down. */
  function matrixCount(shapeA, shapeB, suffix) {
    var id = 'fm-count-' + suffix;
    var correct = pick(many(2, shapeB));
    var mc = multipleChoice(id, correct, [
      pick(many(1, shapeB)), pick(many(3, shapeB)),
      pick(many(2, shapeA)), pick(many(2, 'triangle')), pick(many(1, shapeA))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -2.30,
      stem: { kind: 'matrix', cols: 2, cells: [
        many(1, shapeA), many(2, shapeA), many(1, shapeB), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'Count the objects in each cell.',
      walkthrough: [
        { title: 'Read across the top row', text: 'One ' + shapeA + ' becomes two. The count goes up by one.' },
        { title: 'Read down the left column', text: 'The shape changes from ' + shapeA + ' to ' + shapeB + ' while the count stays at one.' },
        { title: 'Combine both rules', text: 'The missing cell holds two ' + shapeB + 's.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(many(1, shapeB)))] = 'The count did not increase.';
        w[JSON.stringify(pick(many(3, shapeB)))] = 'The row goes 1 then 2, not 1 then 3.';
        w[JSON.stringify(pick(many(2, shapeA)))] = 'That is the wrong shape for this row.';
        return w;
      })())
    };
  }

  /** 2x2: inner and outer figures swap. */
  function matrixNest(outer, inner, other, suffix) {
    var id = 'fm-nest-' + suffix;
    var correct = pick(nest(other, inner));
    var mc = multipleChoice(id, correct, [
      pick(nest(inner, other)), pick(nest(other, outer)),
      pick(nest(outer, other)), pick(nest(other, other)), pick(nest(inner, outer))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -1.00,
      stem: { kind: 'matrix', cols: 2, cells: [
        nest(outer, inner), nest(inner, outer), nest(inner, other), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'Look at which figure is on the outside and which is on the inside.',
      walkthrough: [
        { title: 'Read across the top row', text: 'A ' + outer + ' holding a ' + inner + ' becomes a ' + inner + ' holding a ' + outer + '. The two figures swap places.' },
        { title: 'Confirm the rule', text: 'Nothing else changes — no new shapes appear and the shading stays open.' },
        { title: 'Apply it', text: 'The bottom-left cell is a ' + inner + ' holding a ' + other + ', so the missing cell is a ' + other + ' holding a ' + inner + '.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(nest(inner, other)))] = 'That is a copy of the cell to its left, unswapped.';
        w[JSON.stringify(pick(nest(other, outer)))] = 'The ' + outer + ' is not part of this row’s pair.';
        return w;
      })())
    };
  }

  /** 2x2: a dot mirrors left-to-right across, shape changes down. */
  function matrixMirror(shapeA, shapeB, suffix) {
    var id = 'fm-mirror-' + suffix;
    var correct = pick(dotted(shapeB, [[68, 32]]));
    var mc = multipleChoice(id, correct, [
      pick(dotted(shapeB, [[32, 68]])), pick(dotted(shapeB, [[32, 32]])),
      pick(dotted(shapeA, [[68, 32]])), pick(dotted(shapeB, [[68, 68]])),
      pick(dotted(shapeA, [[32, 32]]))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -0.20,
      stem: { kind: 'matrix', cols: 2, cells: [
        dotted(shapeA, [[32, 32]]), dotted(shapeA, [[68, 32]]), dotted(shapeB, [[32, 32]]), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'Track the small dot, not the big shape.',
      walkthrough: [
        { title: 'Read across the top row', text: 'The dot moves from the top-left corner to the top-right corner. The figure is flipped left-to-right, like a mirror.' },
        { title: 'Read down the left column', text: 'The ' + shapeA + ' becomes a ' + shapeB + ' and the dot stays in the top left. Only the outer shape changes.' },
        { title: 'Combine both rules', text: 'The missing cell is a ' + shapeB + ' with the dot mirrored across to the top right.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(dotted(shapeB, [[32, 68]])))] = 'The dot moved down instead of across — that is a top-to-bottom flip.';
        w[JSON.stringify(pick(dotted(shapeB, [[32, 32]])))] = 'The dot did not move at all.';
        w[JSON.stringify(pick(dotted(shapeB, [[68, 68]])))] = 'The dot moved both across and down, which is two flips instead of one.';
        return w;
      })())
    };
  }

  /** 3x3: quarter-turn rotation in both directions. */
  function matrixRotation(shape, suffix) {
    var id = 'fm-rot-' + suffix;
    var correct = pick(one(shape, { rot: 0 }));
    var mc = multipleChoice(id, correct, [
      pick(one(shape, { rot: 90 })), pick(one(shape, { rot: 180 })),
      pick(one(shape, { rot: 270 })), pick(one(shape, { rot: 45 })),
      pick(one(shape, { rot: 135 }))
    ]);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -0.50,
      stem: { kind: 'matrix', cols: 3, cells: [
        one(shape, { rot: 0 }), one(shape, { rot: 90 }), one(shape, { rot: 180 }),
        one(shape, { rot: 90 }), one(shape, { rot: 180 }), one(shape, { rot: 270 }),
        one(shape, { rot: 180 }), one(shape, { rot: 270 }), null
      ] },
      choices: mc.choices, answer: mc.answer,
      hint: 'Every step turns the figure the same amount in the same direction.',
      walkthrough: [
        { title: 'Read across the top row', text: 'Each step turns the figure a quarter turn clockwise.' },
        { title: 'Check the columns', text: 'Going down a column does the same quarter turn, so the rule holds in both directions.' },
        { title: 'Apply it', text: 'The cell before the gap has turned three quarter-turns from upright. One more brings it back to its starting position.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(one(shape, { rot: 270 })))] = 'That repeats the cell to its left with no turn at all.';
        w[JSON.stringify(pick(one(shape, { rot: 90 })))] = 'That is two quarter turns away, not one.';
        w[JSON.stringify(pick(one(shape, { rot: 45 })))] = 'The grid only ever uses quarter turns.';
        return w;
      })())
    };
  }

  /** 3x3: count across, shape down. */
  function matrixCount3(shapes, suffix) {
    var id = 'fm-count3-' + suffix;
    var last = shapes[2];
    var correct = pick(many(3, last));
    var mc = multipleChoice(id, correct, [
      pick(many(2, last)), pick(many(3, shapes[1])),
      pick(many(3, shapes[0])), pick(many(4, last)), pick(many(1, last))
    ]);
    if (!mc) return null;
    var cells = [];
    shapes.forEach(function (s) { [1, 2, 3].forEach(function (n) { cells.push(many(n, s)); }); });
    cells[8] = null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -1.40,
      stem: { kind: 'matrix', cols: 3, cells: cells },
      choices: mc.choices, answer: mc.answer,
      hint: 'One rule runs across the rows, a different rule runs down the columns.',
      walkthrough: [
        { title: 'Read across a row', text: 'Every row goes one object, two objects, three objects. The count is set by the column.' },
        { title: 'Read down a column', text: 'Every column goes ' + shapes.join(', ') + '. The shape is set by the row.' },
        { title: 'Combine both rules', text: 'The empty cell sits in the ' + last + ' row and the third column, so it holds three ' + last + 's.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(many(2, last)))] = 'Two belongs in the middle column.';
        w[JSON.stringify(pick(many(3, shapes[1])))] = 'That is the shape from the row above.';
        w[JSON.stringify(pick(many(4, last)))] = 'No cell in the grid holds four objects.';
        return w;
      })())
    };
  }

  /** 3x3: shading across, shape down. */
  function matrixFill3(shapes, suffix) {
    var id = 'fm-fill3-' + suffix;
    var last = shapes[2];
    var correct = pick(one(last, { fill: 'solid' }));
    var mc = multipleChoice(id, correct, [
      pick(one(last, { fill: 'half' })), pick(one(last)),
      pick(one(shapes[1], { fill: 'solid' })), pick(one(shapes[0], { fill: 'solid' })),
      pick(one(last, { fill: 'solid', s: 24 }))
    ]);
    if (!mc) return null;
    var cells = [];
    shapes.forEach(function (s) {
      ['none', 'half', 'solid'].forEach(function (f) { cells.push(one(s, { fill: f })); });
    });
    cells[8] = null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: -0.90,
      stem: { kind: 'matrix', cols: 3, cells: cells },
      choices: mc.choices, answer: mc.answer,
      hint: 'The shading fills up as you move right; the shape is fixed by the row.',
      walkthrough: [
        { title: 'Read across a row', text: 'Empty, then half filled, then completely filled. Shading is set by the column.' },
        { title: 'Read down a column', text: shapes.join(', ') + '. Shape is set by the row.' },
        { title: 'Combine both rules', text: 'The empty cell is in the ' + last + ' row and the fully-filled column: a solid ' + last + '.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(one(last, { fill: 'half' })))] = 'Half shading belongs in the middle column.';
        w[JSON.stringify(pick(one(last)))] = 'No shading belongs in the first column.';
        w[JSON.stringify(pick(one(shapes[1], { fill: 'solid' })))] = 'That is the shape from the row above.';
        return w;
      })())
    };
  }

  /** 3x3: count across, shading down — two abstract attributes at once. */
  function matrixCountFill3(shape, suffix) {
    var id = 'fm-cf3-' + suffix;
    var correct = pick(many(3, shape, { fill: 'solid' }));
    var mc = multipleChoice(id, correct, [
      pick(many(2, shape, { fill: 'solid' })), pick(many(3, shape, { fill: 'half' })),
      pick(many(3, shape)), pick(many(4, shape, { fill: 'solid' })),
      pick(many(1, shape, { fill: 'solid' }))
    ]);
    if (!mc) return null;
    var cells = [];
    ['none', 'half', 'solid'].forEach(function (f) {
      [1, 2, 3].forEach(function (n) { cells.push(many(n, shape, { fill: f })); });
    });
    cells[8] = null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: 0.60,
      stem: { kind: 'matrix', cols: 3, cells: cells },
      choices: mc.choices, answer: mc.answer,
      hint: 'The shape never changes. Two other things do.',
      walkthrough: [
        { title: 'Read across a row', text: 'The count goes one, two, three. The column sets how many.' },
        { title: 'Read down a column', text: 'The shading goes empty, half, solid. The row sets the shading.' },
        { title: 'Combine both rules', text: 'The empty cell is in the solid row and the three column: three solid ' + shape + 's.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(many(3, shape, { fill: 'half' })))] = 'Half shading belongs in the row above.';
        w[JSON.stringify(pick(many(2, shape, { fill: 'solid' })))] = 'Two belongs in the middle column.';
        w[JSON.stringify(pick(many(3, shape)))] = 'Empty shading belongs in the top row.';
        return w;
      })())
    };
  }

  var PAIRS = [['circle', 'square'], ['square', 'triangle'], ['triangle', 'hexagon'],
    ['hexagon', 'star'], ['circle', 'diamond'], ['diamond', 'pentagon'], ['star', 'circle'],
    ['pentagon', 'square'], ['square', 'hexagon'], ['triangle', 'diamond']];

  PAIRS.forEach(function (p, i) { push(matrixSize(p[0], p[1], String(i))); });
  PAIRS.forEach(function (p, i) { push(matrixFill(p[0], p[1], String(i))); });
  PAIRS.slice(0, 8).forEach(function (p, i) { push(matrixCount(p[0], p[1], String(i))); });
  [['square', 'circle', 'triangle'], ['circle', 'square', 'hexagon'], ['triangle', 'square', 'diamond'],
   ['hexagon', 'circle', 'square'], ['pentagon', 'triangle', 'circle']]
    .forEach(function (t, i) { push(matrixNest(t[0], t[1], t[2], String(i))); });
  PAIRS.slice(0, 6).forEach(function (p, i) { push(matrixMirror(p[0], p[1], String(i))); });
  ['arrow', 'trapezoid', 'triangle', 'cross', 'star'].forEach(function (s, i) { push(matrixRotation(s, String(i))); });
  [['circle', 'square', 'triangle'], ['square', 'triangle', 'hexagon'], ['circle', 'diamond', 'star'],
   ['hexagon', 'circle', 'pentagon']].forEach(function (t, i) { push(matrixCount3(t, String(i))); });
  [['circle', 'square', 'hexagon'], ['triangle', 'circle', 'diamond'], ['square', 'star', 'pentagon'],
   ['diamond', 'hexagon', 'circle']].forEach(function (t, i) { push(matrixFill3(t, String(i))); });
  ['circle', 'square', 'triangle', 'hexagon'].forEach(function (s, i) { push(matrixCountFill3(s, String(i))); });

  // =================================================== FIGURE CLASSIFICATION

  function classification(id, b, given, correct, distractors, hint, steps, whyPairs) {
    var mc = multipleChoice(id, correct, distractors);
    if (!mc) return null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-classification', b: round2(b),
      stem: { kind: 'figClass', given: given },
      choices: mc.choices, answer: mc.answer,
      hint: hint, walkthrough: steps,
      why: whyFor(mc, whyPairs)
    };
  }

  // All completely filled in.
  [['circle', 'triangle', 'star', 'square'], ['square', 'hexagon', 'diamond', 'circle'],
   ['pentagon', 'circle', 'cross', 'triangle'], ['star', 'diamond', 'square', 'hexagon']]
    .forEach(function (set, i) {
      var ans = pick(one(set[3], { fill: 'solid' }));
      push(classification('fc-solid-' + i, -2.90,
        set.slice(0, 3).map(function (s) { return one(s, { fill: 'solid' }); }), ans,
        [pick(one(set[3])), pick(one(set[0])), pick(one(set[1], { fill: 'half' })), pick(one(set[2])), pick(one('circle'))],
        'The three given shapes are all different, so the rule is not about shape.',
        [{ title: 'Rule out shape', text: 'A ' + set[0] + ', a ' + set[1] + ' and a ' + set[2] + ' have nothing in common as shapes, so shape cannot be the rule.' },
         { title: 'Look at the shading', text: 'All three are completely filled in.' },
         { title: 'Apply it', text: 'Only one choice is completely shaded.' }],
        (function () { var w = {}; w[JSON.stringify(pick(one(set[3])))] = 'Outline only, so it fails the shading rule.';
          w[JSON.stringify(pick(one(set[1], { fill: 'half' })))] = 'Half shaded, not completely filled.'; return w; })()));
    });

  // Exactly N dots inside.
  [1, 2, 3].forEach(function (n) {
    [['circle', 'square', 'triangle', 'hexagon'], ['square', 'hexagon', 'circle', 'pentagon']]
      .forEach(function (set, si) {
        var other = n === 1 ? 2 : n - 1;
        var ans = pick(dotted(set[3], DOT_SPOTS[n]));
        push(classification('fc-dots-' + n + '-' + si, -2.10 + 0.25 * n,
          set.slice(0, 3).map(function (s) { return dotted(s, DOT_SPOTS[n]); }), ans,
          [pick(dotted(set[3], DOT_SPOTS[other])), pick(one(set[3])),
           pick(dotted(set[0], DOT_SPOTS[3])), pick(dotted(set[1], DOT_SPOTS[other])),
           pick(dotted(set[2], DOT_SPOTS[1]))],
          'Count the small dots.',
          [{ title: 'Rule out shape', text: 'The three outer shapes are all different, so shape is not the rule.' },
           { title: 'Count what is inside', text: 'Each figure contains exactly ' + n + ' dot' + (n === 1 ? '' : 's') + '.' },
           { title: 'Apply it', text: 'Only one choice has exactly ' + n + '.' }],
          (function () { var w = {}; w[JSON.stringify(pick(one(set[3])))] = 'No dots at all.';
            w[JSON.stringify(pick(dotted(set[3], DOT_SPOTS[other])))] = other + ' dots, not ' + n + '.'; return w; })()));
      });
  });

  // Groups of N objects.
  [2, 3, 4].forEach(function (n) {
    [['circle', 'square', 'triangle', 'star'], ['square', 'triangle', 'hexagon', 'diamond']]
      .forEach(function (set, si) {
        var ans = pick(many(n, set[3]));
        push(classification('fc-count-' + n + '-' + si, -1.70 + 0.20 * n,
          set.slice(0, 3).map(function (s) { return many(n, s); }), ans,
          [pick(many(n + 1, set[3])), pick(many(Math.max(1, n - 1), set[3])),
           pick(many(n, set[0])), pick(many(1, set[3])), pick(many(n + 2, set[3]))],
          'The rule is about how many, not about what.',
          [{ title: 'Rule out shape', text: 'The shape changes in every given figure.' },
           { title: 'Count', text: 'Every given figure holds exactly ' + n + ' objects.' },
           { title: 'Apply it', text: 'Only one choice has a count of ' + n + ' with a shape that is new to the set.' }],
          (function () { var w = {}; w[JSON.stringify(pick(many(n + 1, set[3])))] = (n + 1) + ' objects, one too many.';
            w[JSON.stringify(pick(many(n, set[0])))] = 'The count is right, but this repeats a shape already in the set.'; return w; })()));
      });
  });

  // Half shaded.
  [['circle', 'square', 'hexagon', 'star'], ['triangle', 'diamond', 'circle', 'pentagon']]
    .forEach(function (set, i) {
      var ans = pick(one(set[3], { fill: 'half' }));
      push(classification('fc-half-' + i, -1.20,
        set.slice(0, 3).map(function (s) { return one(s, { fill: 'half' }); }), ans,
        [pick(one(set[3], { fill: 'solid' })), pick(one(set[3])), pick(one(set[0], { fill: 'solid' })),
         pick(one(set[1])), pick(one('circle', { fill: 'solid' }))],
        'How much of each figure is shaded?',
        [{ title: 'Rule out shape', text: 'The given shapes are all different, so shape is not the rule.' },
         { title: 'Look at the shading', text: 'Each figure is shaded on exactly one side of its centre line: half filled, half empty.' },
         { title: 'Apply it', text: 'Only one choice is part filled and part empty.' }],
        (function () { var w = {}; w[JSON.stringify(pick(one(set[3], { fill: 'solid' })))] = 'Completely filled, not half.';
          w[JSON.stringify(pick(one(set[3])))] = 'Completely empty, with nothing shaded.'; return w; })()));
    });

  // Divided by a line.
  [['square', 'circle', 'hexagon', 'triangle'], ['circle', 'triangle', 'diamond', 'square']]
    .forEach(function (set, i) {
      var ans = pick(split(set[3]));
      push(classification('fc-split-' + i, -0.40,
        set.slice(0, 3).map(split), ans,
        [pick(one(set[3])), pick(one(set[0])), pick(dotted(set[3], DOT_SPOTS[1])),
         pick(one(set[1], { fill: 'half' })), pick(one(set[2], { fill: 'solid' }))],
        'Look for something added to every one of the three figures.',
        [{ title: 'Rule out shape and shading', text: 'The outer shapes all differ, and none of them is shaded.' },
         { title: 'Look for what was added', text: 'Each figure has a single straight line running through it, dividing it into two halves.' },
         { title: 'Apply it', text: 'Only one choice has been divided by a line.' }],
        (function () { var w = {}; w[JSON.stringify(pick(one(set[3])))] = 'No dividing line.';
          w[JSON.stringify(pick(dotted(set[3], DOT_SPOTS[1])))] = 'A dot was added, not a line.';
          w[JSON.stringify(pick(one(set[1], { fill: 'half' })))] = 'Half shaded, which looks divided, but no line was drawn.'; return w; })()));
    });

  // Four straight sides.
  [['square', 'diamond', 'trapezoid'], ['diamond', 'trapezoid', 'square']].forEach(function (set, i) {
    var ans = pick(F.one('rect', { w: 56, h: 34 }));
    push(classification('fc-sides-' + i, -2.70,
      [one(set[0]), one(set[1]), one(set[2])], ans,
      [pick(one('triangle')), pick(one('pentagon')), pick(one('hexagon')), pick(one('circle')), pick(one('star'))],
      'Count the sides on each of the three given figures.',
      [{ title: 'Look for the shared feature', text: 'They differ in width and tilt, but each one has exactly four straight sides.' },
       { title: 'State the rule', text: 'Four-sided figures.' },
       { title: 'Apply it', text: 'Count the sides on each choice. Only one has exactly four.' }],
      (function () {
        var w = {};
        w[JSON.stringify(pick(one('triangle')))] = 'A triangle has three sides, one short of the rule.';
        w[JSON.stringify(pick(one('pentagon')))] = 'A pentagon has five sides, one too many.';
        w[JSON.stringify(pick(one('hexagon')))] = 'A hexagon has six sides, two too many.';
        w[JSON.stringify(pick(one('circle')))] = 'A circle has no straight sides at all.';
        w[JSON.stringify(pick(one('star')))] = 'A star has ten sides, nowhere near four.';
        return w;
      })()));
  });

  // Contains a smaller shape inside it.
  [['square', 'circle', 'triangle', 'hexagon'], ['circle', 'hexagon', 'square', 'pentagon']]
    .forEach(function (set, i) {
      var ans = pick(nest(set[3], 'circle'));
      push(classification('fc-nested-' + i, 0.00,
        [nest(set[0], 'circle'), nest(set[1], 'square'), nest(set[2], 'triangle')], ans,
        [pick(one(set[3])), pick(one(set[3], { fill: 'solid' })), pick(dotted(set[3], DOT_SPOTS[2])),
         pick(one(set[0])), pick(many(2, set[3]))],
        'Every given figure has something inside it — but what kind of something?',
        [{ title: 'Rule out shape', text: 'The outer shapes are all different, and so are the inner ones.' },
         { title: 'Name what they share', text: 'Every figure has one smaller closed shape drawn inside a larger one.' },
         { title: 'Apply it', text: 'Only one choice has a smaller shape nested inside a larger one.' }],
        (function () { var w = {}; w[JSON.stringify(pick(one(set[3])))] = 'Nothing inside it.';
          w[JSON.stringify(pick(dotted(set[3], DOT_SPOTS[2])))] = 'Dots inside, not a nested shape.'; return w; })()));
    });

  // A conjunctive rule: N dots AND completely filled.
  [1, 2].forEach(function (n) {
    var set = ['circle', 'square', 'triangle', 'hexagon'];
    var withDots = function (s) {
      return F.fig([{ t: s, x: 50, y: 50, s: 62, fill: 'solid' }].concat(DOT_SPOTS[n].map(function (d) {
        return { t: 'dot', x: d[0], y: d[1], s: 9 };
      })));
    };
    var plainDots = function (s, k) { return dotted(s, DOT_SPOTS[k]); };
    var ans = pick(withDots(set[3]));
    push(classification('fc-conj-' + n, 1.20 + 0.15 * n,
      set.slice(0, 3).map(withDots), ans,
      [pick(plainDots(set[3], n)), pick(one(set[3], { fill: 'solid' })),
       pick(plainDots(set[3], n === 1 ? 2 : 1)), pick(one(set[3])), pick(withDots(set[0]))],
      'Two things have to be true at once here, not one.',
      [{ title: 'Rule out shape', text: 'The three outer shapes are all different.' },
       { title: 'Find both features', text: 'Every given figure is completely filled in AND has exactly ' + n + ' dot' + (n === 1 ? '' : 's') + ' on it. Either feature alone is not enough.' },
       { title: 'Apply it', text: 'Only one choice satisfies both conditions at the same time.' }],
      (function () { var w = {};
        w[JSON.stringify(pick(plainDots(set[3], n)))] = 'The right number of dots, but the shape is not filled in.';
        w[JSON.stringify(pick(one(set[3], { fill: 'solid' })))] = 'Filled in, but it has no dots.';
        w[JSON.stringify(pick(withDots(set[0])))] = 'Both features are right, but this repeats a shape already in the set.';
        return w; })()));
  });

  // ============================================================ PAPER FOLDING

  var SHEET = { x0: 12, y0: 12, x1: 88, y1: 88 };

  /**
   * A fold is an axis plus the position of its crease. Creases are not always at
   * the centre of the sheet: folding a half-sheet in half again puts the second
   * crease at the middle of what is left, which is why the position is computed
   * from the region rather than assumed.
   */
  function planFolds(axes) {
    var r = { x0: SHEET.x0, y0: SHEET.y0, x1: SHEET.x1, y1: SHEET.y1, tri: null };
    var folds = [];
    axes.forEach(function (axis) {
      if (axis === 'd') {
        folds.push({ axis: 'd', at: null, region: Object.assign({}, r) });
        r = Object.assign({}, r, { tri: 'bl' });
      } else if (axis === 'v') {
        var at = (r.x0 + r.x1) / 2;
        folds.push({ axis: 'v', at: at, region: Object.assign({}, r) });
        r = Object.assign({}, r, { x0: at });
      } else {
        var atY = (r.y0 + r.y1) / 2;
        folds.push({ axis: 'h', at: atY, region: Object.assign({}, r) });
        r = Object.assign({}, r, { y0: atY });
      }
    });
    return { folds: folds, region: r };
  }

  function reflect(pt, fold) {
    if (fold.axis === 'v') return [2 * fold.at - pt[0], pt[1]];
    if (fold.axis === 'h') return [pt[0], 2 * fold.at - pt[1]];
    return [pt[1], pt[0]];               // main diagonal, y = x
  }

  function samePoint(a, b) { return Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5; }

  function mergePoints(list) {
    var out = [];
    list.forEach(function (p) {
      if (!out.some(function (q) { return samePoint(p, q); })) out.push(p);
    });
    return out;
  }

  /**
   * Undo the folds in reverse order. Each unfold mirrors every existing hole
   * across that fold's crease; a hole sitting on the crease maps to itself and so
   * stays a single hole.
   */
  function unfoldWith(holes, folds) {
    var out = holes.slice();
    for (var i = folds.length - 1; i >= 0; i--) {
      var f = folds[i];
      out = mergePoints(out.concat(out.map(function (p) { return reflect(p, f); })));
    }
    return out;
  }

  /** Convenience wrapper used by the tests: takes plain axis letters. */
  function unfold(holes, axes) {
    return unfoldWith(holes, planFolds(axes).folds);
  }

  function regionRect(r) {
    return [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, r.x1 - r.x0, r.y1 - r.y0];
  }

  function creaseLine(fold) {
    if (fold.axis === 'v') return [fold.at, fold.region.y0, fold.at, fold.region.y1];
    if (fold.axis === 'h') return [fold.region.x0, fold.at, fold.region.x1, fold.at];
    return [SHEET.x0, SHEET.y0, SHEET.x1, SHEET.y1];
  }

  var FOLD_TEXT = {
    v: 'Fold the left half onto the right',
    h: 'Fold the top half down onto the bottom',
    d: 'Fold the top-right corner down along the diagonal'
  };
  var MIRROR_TEXT = {
    v: 'left-to-right across the vertical crease',
    h: 'top-to-bottom across the horizontal crease',
    d: 'across the corner-to-corner diagonal'
  };

  function paperPanel(region, dash, holes) {
    if (region.tri) return F.paper({ tri: { corner: region.tri }, dash: dash, holes: holes });
    return F.paper({ rect: regionRect(region), dash: dash, holes: holes });
  }

  /** Every figure choice is wrapped as { fig }, the shape the renderer expects. */
  function sheetWithHoles(holes) { return pick(F.paper({ rect: regionRect(SHEET), holes: holes })); }

  /** Is a punch inside the region that is still visible after folding? */
  function inRegion(pt, r) {
    if (pt[0] < r.x0 - 0.5 || pt[0] > r.x1 + 0.5) return false;
    if (pt[1] < r.y0 - 0.5 || pt[1] > r.y1 + 0.5) return false;
    if (r.tri === 'bl' && pt[0] > pt[1] + 0.5) return false;   // below the diagonal only
    return true;
  }

  function makeFolding(id, axes, holes, b, opts) {
    opts = opts || {};
    var plan = planFolds(axes);
    var folds = plan.folds;

    // A punch has to land on the folded piece, or the item is nonsense.
    if (!holes.every(function (h) { return inRegion(h, plan.region); })) return null;

    var answer = unfoldWith(holes, folds);

    var figs = [];
    folds.forEach(function (f) {
      figs.push({ fig: paperPanel(f.region, [creaseLine(f)], []), caption: FOLD_TEXT[f.axis] });
    });
    figs.push({
      fig: paperPanel(plan.region, folds.map(creaseLine), holes),
      caption: 'Punch ' + holes.length + ' hole' + (holes.length === 1 ? '' : 's') +
        (opts.onFold ? ' on the folded edge' : '')
    });

    // Distractors, each wrong in one nameable way. Extras are supplied because
    // some collapse onto each other for particular fold sequences.
    var unused = ['v', 'h'].filter(function (a) { return axes.indexOf(a) === -1; });
    var otherAxis = unused.length ? unused[0] : (axes[axes.length - 1] === 'v' ? 'h' : 'v');
    var otherFold = { axis: otherAxis, at: 50 };

    var why_onfold = null;
    var noUnfold = holes.slice();
    var partial = folds.length > 1 ? unfoldWith(holes, folds.slice(1)) : null;
    var wrongAxis = mergePoints(holes.concat(holes.map(function (p) { return reflect(p, otherFold); })));
    var tooMany = mergePoints(answer.concat(answer.map(function (p) { return reflect(p, otherFold); })));
    var drifted = answer.map(function (p) { return [50 + (p[0] - 50) * 0.55, 50 + (p[1] - 50) * 0.55]; });
    var missingOne = answer.length > 1 ? answer.slice(0, answer.length - 1) : null;
    var extraOne = mergePoints(answer.concat([[50, 50]]));

    var candidates;
    if (opts.onFold) {
      // A punch on the crease unfolds to a single hole, so the generic
      // distractors all collapse onto it. The interesting wrong answers here are
      // the ones a student gets by applying the ordinary rule anyway.
      var axis = folds[0].axis;
      var naive = mergePoints(holes.concat(holes.map(function (p) {
        return reflect(p, { axis: axis, at: 50 });
      })).map(function (p) {
        // Nudge the pair off the crease so the "two holes" reading is visible.
        return axis === 'v' ? [p[0] === 50 ? 31 : p[0], p[1]] : [p[0], p[1] === 50 ? 31 : p[1]];
      }));
      var naivePair = holes.map(function (p) {
        return axis === 'v' ? [31, p[1]] : [p[0], 31];
      }).concat(holes.map(function (p) {
        return axis === 'v' ? [69, p[1]] : [p[0], 69];
      }));
      var crossPair = holes.map(function (p) {
        return axis === 'v' ? [p[0], 31] : [31, p[1]];
      }).concat(holes.map(function (p) {
        return axis === 'v' ? [p[0], 69] : [69, p[1]];
      }));
      var offCrease = holes.map(function (p) {
        return axis === 'v' ? [69, p[1]] : [p[0], 69];
      });
      var four = mergePoints(naivePair.concat(crossPair));
      candidates = [naivePair, crossPair, offCrease, four, naive];
      why_onfold = {
        naivePair: 'This is the usual answer for a punch away from the crease. Here the two half-holes meet and merge into one.',
        crossPair: 'Mirrored the wrong way entirely — that is not the direction the paper was folded.',
        offCrease: 'One hole, but placed off the crease rather than on it.',
        four: 'Four holes would need two folds, not one.'
      };
    } else {
      candidates = [noUnfold, partial, wrongAxis, tooMany, drifted, missingOne, extraOne]
        .filter(Boolean)
        .filter(function (set) { return set.length !== answer.length || !sameSet(set, answer); });
    }

    var mc = multipleChoice(id, sheetWithHoles(answer), candidates.map(function (h) { return sheetWithHoles(h); }));
    if (!mc) return null;

    var layers = Math.pow(2, folds.length);
    var expected = holes.length * layers;

    var steps = [
      { title: 'Count the layers', text: 'The paper was folded ' + folds.length + ' time' + (folds.length === 1 ? '' : 's') +
        ', so the punch went through ' + layers + ' layers. ' + holes.length + ' punch' + (holes.length === 1 ? '' : 'es') +
        ' × ' + layers + ' layers = ' + expected + ' holes' +
        (opts.onFold ? ' — unless a punch sits on a crease, which is exactly what happens here.' : '.') }
    ];
    if (opts.onFold) {
      steps.push({ title: 'Look at where the punch is', text: 'The hole is not out in the middle of the folded piece — it is sitting right on the folded edge. A punch on the crease takes a bite out of the fold itself, so each layer loses half a circle and the two halves are joined along the crease.' });
      steps.push({ title: 'Unfold it', text: 'Opening the paper brings the two half-bites together into one whole hole centred on the crease. The count is ' + answer.length + ', not ' + expected + '.' });
    } else {
      folds.slice().reverse().forEach(function (f, i) {
        steps.push({
          title: i === 0 ? 'Undo the last fold first' : 'Undo the next fold',
          text: 'Open the fold whose crease runs ' + (f.axis === 'v' ? 'up and down' : f.axis === 'h' ? 'across' : 'corner to corner') +
            '. Every hole gains a partner mirrored ' + MIRROR_TEXT[f.axis] + ', the same distance from the crease as the original.'
        });
      });
      steps.push({ title: 'Count the result', text: 'That leaves ' + answer.length + ' holes on the opened sheet.' });
    }

    var why = {};
    if (opts.onFold) {
      why[JSON.stringify(sheetWithHoles(candidates[0]))] = why_onfold.naivePair;
      why[JSON.stringify(sheetWithHoles(candidates[1]))] = why_onfold.crossPair;
      why[JSON.stringify(sheetWithHoles(candidates[2]))] = why_onfold.offCrease;
      why[JSON.stringify(sheetWithHoles(candidates[3]))] = why_onfold.four;
      return {
        id: id, battery: 'nonverbal', subtest: 'paper-folding', b: round2(b),
        stem: { kind: 'figSeq', figs: figs },
        choices: mc.choices, answer: mc.answer,
        hint: 'Where exactly is the punch? Look at how it sits relative to the crease.',
        walkthrough: steps,
        why: whyFor(mc, why)
      };
    }
    why[JSON.stringify(sheetWithHoles(noUnfold))] = 'That is the punched piece only — the paper was never unfolded.';
    if (partial) why[JSON.stringify(sheetWithHoles(partial))] = 'Only some of the folds were undone; at least one is still folded.';
    why[JSON.stringify(sheetWithHoles(wrongAxis))] = 'These are mirrored ' + MIRROR_TEXT[otherAxis] + ', but the paper was not folded that way.';
    why[JSON.stringify(sheetWithHoles(tooMany))] = 'Too many holes: that unfolds one more time than the paper was folded.';
    why[JSON.stringify(sheetWithHoles(drifted))] = 'The right number of holes, but each has drifted towards the centre. Every hole must keep its original distance from the crease.';
    if (missingOne) why[JSON.stringify(sheetWithHoles(missingOne))] = 'One hole short — every layer the punch passed through leaves a hole.';
    why[JSON.stringify(sheetWithHoles(extraOne))] = 'One hole too many: nothing was punched at the centre.';

    return {
      id: id, battery: 'nonverbal', subtest: 'paper-folding', b: round2(b),
      stem: { kind: 'figSeq', figs: figs },
      choices: mc.choices, answer: mc.answer,
      hint: opts.onFold
        ? 'Where exactly is the punch? Look at how it sits relative to the crease.'
        : 'Count the layers the punch goes through, then mirror each hole across each crease.',
      walkthrough: steps,
      why: whyFor(mc, why)
    };
  }

  function sameSet(a, b) {
    return a.length === b.length && a.every(function (p) {
      return b.some(function (q) { return samePoint(p, q); });
    });
  }

  // One vertical fold, one punch.
  [[69, 30], [69, 45], [78, 62], [60, 70], [80, 36], [66, 78]].forEach(function (h, i) {
    push(makeFolding('pf-v1-' + i, ['v'], [h], -2.60 + 0.05 * i));
  });
  // One horizontal fold, one punch.
  [[30, 69], [45, 69], [62, 78], [70, 60], [36, 80]].forEach(function (h, i) {
    push(makeFolding('pf-h1-' + i, ['h'], [h], -2.40 + 0.05 * i));
  });
  // One fold, two punches.
  [[[60, 30], [78, 70]], [[66, 26], [70, 62]], [[80, 40], [58, 74]], [[62, 34], [82, 66]]]
    .forEach(function (hs, i) { push(makeFolding('pf-v2-' + i, ['v'], hs, -1.80 + 0.08 * i)); });
  [[[30, 60], [70, 78]], [[26, 66], [62, 70]], [[40, 80], [74, 58]]]
    .forEach(function (hs, i) { push(makeFolding('pf-h2-' + i, ['h'], hs, -1.60 + 0.08 * i)); });
  // Diagonal fold, on its own.
  [[30, 66], [24, 58], [36, 78], [20, 70], [40, 82]].forEach(function (h, i) {
    push(makeFolding('pf-d1-' + i, ['d'], [h], -0.60 + 0.10 * i));
  });
  // Two folds, one punch.
  [[69, 69], [62, 78], [80, 62], [58, 66], [76, 80]].forEach(function (h, i) {
    push(makeFolding('pf-vh1-' + i, ['v', 'h'], [h], -0.90 + 0.10 * i));
  });
  // One fold, three punches.
  [[[58, 26], [72, 50], [82, 74]], [[64, 32], [78, 58], [60, 80]]]
    .forEach(function (hs, i) { push(makeFolding('pf-v3-' + i, ['v'], hs, 0.20 + 0.15 * i)); });
  // Two folds, two punches.
  [[[60, 62], [80, 80]], [[58, 78], [76, 60]], [[66, 68], [82, 84]]]
    .forEach(function (hs, i) { push(makeFolding('pf-vh2-' + i, ['v', 'h'], hs, 1.20 + 0.12 * i)); });
  // A punch that lands on the crease.
  [[50, 40], [50, 60], [50, 50]].forEach(function (h, i) {
    push(makeFolding('pf-onfold-v-' + i, ['v'], [h], 0.90 + 0.10 * i, { onFold: true }));
  });
  [[40, 50], [64, 50]].forEach(function (h, i) {
    push(makeFolding('pf-onfold-h-' + i, ['h'], [h], 1.05 + 0.10 * i, { onFold: true }));
  });

  // ------------------------------------------------- harder upper-level items ---
  // The secondary levels need figural items well above +0.9 on the ability scale.

  /** 3x3: rotation across, shading down — two attributes at once. */
  function matrixRotFill3(shape, suffix) {
    var id = 'fm-rf3-' + suffix;
    var correct = pick(one(shape, { rot: 180, fill: 'solid' }));
    var mc = multipleChoice(id, correct, [
      pick(one(shape, { rot: 90, fill: 'solid' })), pick(one(shape, { rot: 180, fill: 'half' })),
      pick(one(shape, { rot: 180 })), pick(one(shape, { rot: 270, fill: 'solid' })),
      pick(one(shape, { rot: 0, fill: 'solid' }))
    ]);
    if (!mc) return null;
    var cells = [];
    ['none', 'half', 'solid'].forEach(function (f) {
      [0, 90, 180].forEach(function (r) { cells.push(one(shape, { rot: r, fill: f })); });
    });
    cells[8] = null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: 1.15,
      stem: { kind: 'matrix', cols: 3, cells: cells },
      choices: mc.choices, answer: mc.answer,
      hint: 'The shape never changes. Two other things do, and they run in different directions.',
      walkthrough: [
        { title: 'Read across a row', text: 'The figure turns a quarter turn clockwise at each step. The column sets the rotation.' },
        { title: 'Read down a column', text: 'The shading fills up: empty, half, solid. The row sets the shading.' },
        { title: 'Combine both rules', text: 'The empty cell is in the solid row and the half-turn column, so it is a solid figure turned through two quarter turns.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(one(shape, { rot: 180, fill: 'half' })))] = 'The rotation is right but the shading belongs to the row above.';
        w[JSON.stringify(pick(one(shape, { rot: 90, fill: 'solid' })))] = 'The shading is right but the rotation belongs to the middle column.';
        w[JSON.stringify(pick(one(shape, { rot: 180 })))] = 'Unshaded, which belongs in the top row.';
        return w;
      })())
    };
  }

  /** 3x3: count, shading and shape all vary — three attributes to hold at once. */
  function matrixTriple3(shapes, suffix) {
    var id = 'fm-tri3-' + suffix;
    var last = shapes[2];
    var correct = pick(many(3, last, { fill: 'solid' }));
    var mc = multipleChoice(id, correct, [
      pick(many(3, last, { fill: 'half' })), pick(many(2, last, { fill: 'solid' })),
      pick(many(3, shapes[1], { fill: 'solid' })), pick(many(3, last)),
      pick(many(4, last, { fill: 'solid' }))
    ]);
    if (!mc) return null;
    var cells = [];
    var fills = ['none', 'half', 'solid'];
    shapes.forEach(function (sh, r) {
      [1, 2, 3].forEach(function (n, c) { cells.push(many(n, sh, { fill: fills[r] })); });
    });
    cells[8] = null;
    return {
      id: id, battery: 'nonverbal', subtest: 'figure-matrices', b: 1.60,
      stem: { kind: 'matrix', cols: 3, cells: cells },
      choices: mc.choices, answer: mc.answer,
      hint: 'Three things change here, not two. Take them one at a time.',
      walkthrough: [
        { title: 'Read across a row', text: 'The count goes one, two, three. The column sets how many.' },
        { title: 'Read down a column', text: 'Two things change together going down: the shape runs ' + shapes.join(', ') + ' and the shading runs empty, half, solid. The row sets both.' },
        { title: 'Combine all three', text: 'The empty cell is in the third row and third column, so it needs three ' + last + 's, filled in solid.' }
      ],
      why: whyFor(mc, (function () {
        var w = {};
        w[JSON.stringify(pick(many(3, last, { fill: 'half' })))] = 'Count and shape are right, but half shading belongs to the row above.';
        w[JSON.stringify(pick(many(2, last, { fill: 'solid' })))] = 'Shape and shading are right, but two belongs in the middle column.';
        w[JSON.stringify(pick(many(3, shapes[1], { fill: 'solid' })))] = 'Count and shading are right, but that is the shape from the row above.';
        return w;
      })())
    };
  }

  ['arrow', 'trapezoid', 'triangle', 'cross'].forEach(function (sh, i) { push(matrixRotFill3(sh, String(i))); });
  [['circle', 'square', 'triangle'], ['square', 'hexagon', 'star'], ['triangle', 'diamond', 'circle'],
   ['hexagon', 'pentagon', 'square']].forEach(function (t, i) { push(matrixTriple3(t, String(i))); });

  // Classification: the count of dots must match the count of sides.
  var SIDE_COUNT = { triangle: 3, square: 4, diamond: 4, pentagon: 5, hexagon: 6 };
  [['triangle', 'square', 'pentagon', 'hexagon'], ['square', 'pentagon', 'hexagon', 'triangle']]
    .forEach(function (set, i) {
      var ring = function (shape) {
        var n = SIDE_COUNT[shape];
        var dots = [];
        for (var k = 0; k < n; k++) {
          var a = -Math.PI / 2 + (k * 2 * Math.PI) / n;
          dots.push([50 + 17 * Math.cos(a), 50 + 17 * Math.sin(a)]);
        }
        return dotted(shape, dots);
      };
      var wrongCount = function (shape, n) {
        var dots = [];
        for (var k = 0; k < n; k++) {
          var a = -Math.PI / 2 + (k * 2 * Math.PI) / Math.max(n, 1);
          dots.push([50 + 17 * Math.cos(a), 50 + 17 * Math.sin(a)]);
        }
        return dotted(shape, dots);
      };
      var target = set[3];
      var ans = pick(ring(target));
      push(classification('fc-match-' + i, 2.05,
        set.slice(0, 3).map(ring), ans,
        [pick(wrongCount(target, SIDE_COUNT[target] + 1)), pick(wrongCount(target, SIDE_COUNT[target] - 1)),
         pick(one(target)), pick(wrongCount(target, 2)), pick(ring(set[0]))],
        'The dots and the shape are related to each other.',
        [{ title: 'Rule out the easy answers', text: 'The shapes differ, the shading is the same everywhere, and the number of dots differs from figure to figure — so no single one of those is the rule.' },
         { title: 'Compare the two counts', text: 'In each figure the number of dots is exactly the number of sides: three dots in the triangle, four in the square, five in the pentagon.' },
         { title: 'Apply it', text: 'The answer must carry exactly as many dots as its shape has sides.' }],
        (function () {
          var w = {};
          w[JSON.stringify(pick(wrongCount(target, SIDE_COUNT[target] + 1)))] = 'One dot too many for the number of sides.';
          w[JSON.stringify(pick(wrongCount(target, SIDE_COUNT[target] - 1)))] = 'One dot too few for the number of sides.';
          w[JSON.stringify(pick(one(target)))] = 'No dots at all.';
          w[JSON.stringify(pick(ring(set[0])))] = 'The rule holds, but this simply repeats a figure already in the set.';
          return w;
        })()));
    });

  // Classification: three features at once.
  [['circle', 'square', 'triangle', 'hexagon']].forEach(function (set, i) {
    var mk = function (sh) {
      return F.fig([
        { t: sh, x: 50, y: 50, s: 62, fill: 'half' },
        { t: 'dot', x: 38, y: 50, s: 9 }, { t: 'dot', x: 62, y: 50, s: 9 }
      ]);
    };
    var target = set[3];
    var ans = pick(mk(target));
    push(classification('fc-conj3-' + i, 2.30,
      set.slice(0, 3).map(mk), ans,
      [pick(dotted(target, DOT_SPOTS[2])), pick(one(target, { fill: 'half' })),
       pick(F.fig([{ t: target, x: 50, y: 50, s: 62, fill: 'solid' }, { t: 'dot', x: 38, y: 50, s: 9 }, { t: 'dot', x: 62, y: 50, s: 9 }])),
       pick(F.fig([{ t: target, x: 50, y: 50, s: 62, fill: 'half' }, { t: 'dot', x: 50, y: 50, s: 9 }])),
       pick(mk(set[0]))],
      'More than one thing has to be true at the same time.',
      [{ title: 'List what varies', text: 'The outer shape changes every time, so shape is not the rule.' },
       { title: 'List what does not', text: 'Every figure is half shaded AND carries exactly two dots. Neither feature alone picks out the set.' },
       { title: 'Apply it', text: 'The answer needs both: half shading and exactly two dots.' }],
      (function () {
        var w = {};
        w[JSON.stringify(pick(dotted(target, DOT_SPOTS[2])))] = 'Two dots, but the figure is not shaded.';
        w[JSON.stringify(pick(one(target, { fill: 'half' })))] = 'Half shaded, but there are no dots.';
        w[JSON.stringify(pick(F.fig([{ t: target, x: 50, y: 50, s: 62, fill: 'solid' }, { t: 'dot', x: 38, y: 50, s: 9 }, { t: 'dot', x: 62, y: 50, s: 9 }])))] = 'Two dots, but completely filled rather than half.';
        return w;
      })()));
  });

  // Paper folding: three folds, and two folds with several punches.
  [[76, 76], [80, 62], [74, 84], [84, 70]].forEach(function (h, i) {
    push(makeFolding('pf-vhv-' + i, ['v', 'h', 'v'], [h], 1.95 + 0.10 * i));
  });
  [[76, 76], [82, 60], [72, 82]].forEach(function (h, i) {
    push(makeFolding('pf-vhh-' + i, ['v', 'h', 'h'], [h], 2.10 + 0.10 * i));
  });
  [[[60, 62], [80, 80], [66, 84]], [[58, 70], [76, 62], [84, 82]]]
    .forEach(function (hs, i) { push(makeFolding('pf-vh3-' + i, ['v', 'h'], hs, 1.70 + 0.12 * i)); });
  [[[64, 30], [58, 52], [78, 70], [70, 84]]]
    .forEach(function (hs, i) { push(makeFolding('pf-v4-' + i, ['v'], hs, 1.45 + 0.10 * i)); });

  return { items: items, unfold: unfold, planFolds: planFolds, mergePoints: mergePoints };
});

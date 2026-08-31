/* Nonverbal battery: Figure Matrices, Figure Classification, Paper Folding. */
(function (root) {
  'use strict';
  var bank = root.CogatBank = root.CogatBank || { items: [], subtests: {} };
  var F = root.Figures.F;

  function subtest(meta) { bank.subtests[meta.id] = meta; }
  function add(items) { bank.items.push.apply(bank.items, items); }
  function pick(fig) { return { fig: fig }; }

  // Shorthand builders used throughout this bank.
  var one = function (t, opts) { return F.one(t, Object.assign({ s: 46 }, opts || {})); };
  var many = function (n, t, opts) { return F.many(n, t, opts || {}); };
  var nest = function (outer, inner) { return F.nested(outer, inner); };
  var dotted = function (shape, dots) {
    return F.fig([{ t: shape, x: 50, y: 50, s: 62 }].concat(dots.map(function (d) {
      return { t: 'dot', x: d[0], y: d[1], s: 9 };
    })));
  };
  var split = function (shape) {
    return F.fig([
      { t: shape, x: 50, y: 50, s: 56 },
      { t: 'line', x1: 50, y1: 16, x2: 50, y2: 84 }
    ]);
  };

  // ------------------------------------------------------- figure matrices ---

  subtest({
    id: 'figure-matrices',
    battery: 'nonverbal',
    name: 'Figure Matrices',
    blurb: 'A grid of figures follows a rule. Work out the rule and supply the missing cell.',
    directions: 'The figures in the grid change according to a rule. Choose the figure that belongs in the empty cell.',
    timePerItemSec: 50,
    strategy: [
      'Read across the top row first and say in words what changed: shape, size, shading, number, or direction.',
      'Then read down the left column and name that change too. The missing cell obeys both.',
      'Predict the answer before you look at the choices, so near-miss distractors cannot pull you off.'
    ]
  });

  add([
    {
      id: 'fm-01', battery: 'nonverbal', subtest: 'figure-matrices', b: -1.5,
      stem: { kind: 'matrix', cols: 2, cells: [
        one('circle', { s: 24 }), one('circle', { s: 62 }),
        one('square', { s: 24 }), null
      ] },
      choices: [
        pick(one('square', { s: 62 })),
        pick(one('square', { s: 24 })),
        pick(one('circle', { s: 62 })),
        pick(one('square', { s: 62, fill: 'solid' })),
        pick(one('triangle', { s: 62 }))
      ],
      answer: 0,
      hint: 'Only one thing changes as you move across a row.',
      walkthrough: [
        { title: 'Read across the top row', text: 'A small circle becomes a large circle. The shape stays the same; only the size changes.' },
        { title: 'Read down the left column', text: 'A small circle becomes a small square. Only the shape changes; the size stays small.' },
        { title: 'Combine both rules', text: 'The missing cell is in the square row and the large column, so it must be a large square with the same open outline.' }
      ],
      why: { 1: 'The size did not grow.', 2: 'The shape should be a square in this row.', 3: 'Shading never changes anywhere in the grid.', 4: 'A triangle appears nowhere in the grid.' }
    },
    {
      id: 'fm-02', battery: 'nonverbal', subtest: 'figure-matrices', b: -1.1,
      stem: { kind: 'matrix', cols: 2, cells: [
        one('triangle'), one('triangle', { fill: 'solid' }),
        one('star'), null
      ] },
      choices: [
        pick(one('star', { fill: 'solid' })),
        pick(one('star')),
        pick(one('triangle', { fill: 'solid' })),
        pick(one('star', { fill: 'half' })),
        pick(one('circle', { fill: 'solid' }))
      ],
      answer: 0,
      hint: 'What happens to the inside of the figure across the row?',
      walkthrough: [
        { title: 'Read across the top row', text: 'An empty triangle becomes a filled triangle. The rule is "fill it in".' },
        { title: 'Read down the left column', text: 'A triangle becomes a star. The shape changes but the shading stays empty.' },
        { title: 'Combine both rules', text: 'The missing cell is a star that has been filled in.' }
      ],
      why: { 1: 'That is unchanged from the cell to its left.', 2: 'The bottom row uses stars, not triangles.', 3: 'The grid only uses empty and fully filled, never half.', 4: 'A circle appears nowhere in the grid.' }
    },
    {
      id: 'fm-03', battery: 'nonverbal', subtest: 'figure-matrices', b: -0.8,
      stem: { kind: 'matrix', cols: 2, cells: [
        many(1, 'circle'), many(2, 'circle'),
        many(1, 'square'), null
      ] },
      choices: [
        pick(many(3, 'square')),
        pick(many(2, 'square')),
        pick(many(2, 'circle')),
        pick(many(1, 'square')),
        pick(many(2, 'triangle'))
      ],
      answer: 1,
      hint: 'Count the objects in each cell.',
      walkthrough: [
        { title: 'Read across the top row', text: 'One circle becomes two circles. The rule is "double the count", or simply "add one".' },
        { title: 'Read down the left column', text: 'One circle becomes one square: the shape changes, the count stays at one.' },
        { title: 'Combine both rules', text: 'The missing cell holds two squares.' }
      ],
      why: { 0: 'The top row goes 1 then 2, not 1 then 3.', 2: 'The bottom row uses squares.', 3: 'The count did not increase.', 4: 'Triangles appear nowhere in the grid.' }
    },
    {
      id: 'fm-04', battery: 'nonverbal', subtest: 'figure-matrices', b: 0.0,
      stem: { kind: 'matrix', cols: 2, cells: [
        nest('square', 'circle'), nest('circle', 'square'),
        nest('triangle', 'square'), null
      ] },
      choices: [
        pick(nest('square', 'triangle')),
        pick(nest('triangle', 'circle')),
        pick(nest('circle', 'triangle')),
        pick(nest('square', 'square')),
        pick(nest('triangle', 'square'))
      ],
      answer: 0,
      hint: 'Look at which figure is on the outside and which is on the inside.',
      walkthrough: [
        { title: 'Read across the top row', text: 'A square holding a circle becomes a circle holding a square. The two figures swap places.' },
        { title: 'Confirm the rule', text: 'Nothing else changes — no new shapes appear, and the shading stays open.' },
        { title: 'Apply it', text: 'The bottom-left cell is a triangle holding a square, so the missing cell is a square holding a triangle.' }
      ],
      why: { 1: 'A circle appears from nowhere; the pair must stay triangle and square.', 2: 'Same problem, with the circle now on the outside.', 3: 'Both figures are the same shape, so nothing was swapped.', 4: 'That is a copy of the cell to its left, unswapped.' }
    },
    {
      id: 'fm-05', battery: 'nonverbal', subtest: 'figure-matrices', b: 0.5,
      stem: { kind: 'matrix', cols: 3, cells: [
        many(1, 'circle'), many(2, 'circle'), many(3, 'circle'),
        many(1, 'square'), many(2, 'square'), many(3, 'square'),
        many(1, 'triangle'), many(2, 'triangle'), null
      ] },
      choices: [
        pick(many(2, 'triangle')),
        pick(many(3, 'square')),
        pick(many(3, 'triangle')),
        pick(many(4, 'triangle')),
        pick(many(3, 'circle'))
      ],
      answer: 2,
      hint: 'One rule runs across the rows, a different rule runs down the columns.',
      walkthrough: [
        { title: 'Read across a row', text: 'Every row goes one object, two objects, three objects. The count is set by the column.' },
        { title: 'Read down a column', text: 'Every column goes circle, square, triangle. The shape is set by the row.' },
        { title: 'Combine both rules', text: 'The empty cell sits in the triangle row and the third column, so it holds three triangles.' }
      ],
      why: { 0: 'Two triangles belong in the middle column.', 1: 'Squares belong in the row above.', 3: 'No cell in the grid holds four objects.', 4: 'Circles belong in the top row.' }
    },
    {
      id: 'fm-06', battery: 'nonverbal', subtest: 'figure-matrices', b: 0.8,
      stem: { kind: 'matrix', cols: 3, cells: [
        one('arrow', { rot: 0 }), one('arrow', { rot: 90 }), one('arrow', { rot: 180 }),
        one('arrow', { rot: 90 }), one('arrow', { rot: 180 }), one('arrow', { rot: 270 }),
        one('arrow', { rot: 180 }), one('arrow', { rot: 270 }), null
      ] },
      choices: [
        pick(one('arrow', { rot: 90 })),
        pick(one('arrow', { rot: 180 })),
        pick(one('arrow', { rot: 0 })),
        pick(one('arrow', { rot: 270 })),
        pick(one('arrow', { rot: 45 }))
      ],
      answer: 2,
      hint: 'Every step turns the arrow the same amount in the same direction.',
      walkthrough: [
        { title: 'Read across the top row', text: 'Up, then right, then down. Each step is a quarter turn clockwise.' },
        { title: 'Check the columns', text: 'Down the left column: up, right, down — the same quarter turn. The rule holds in both directions.' },
        { title: 'Apply it', text: 'The cell before the gap points left. One more quarter turn clockwise from left brings the arrow back to pointing up.' }
      ],
      why: { 0: 'Pointing right is two quarter turns away, not one.', 1: 'Pointing down would be a turn backwards.', 3: 'That repeats the cell to its left with no turn at all.', 4: 'The grid only ever uses quarter turns.' }
    },
    {
      id: 'fm-07', battery: 'nonverbal', subtest: 'figure-matrices', b: 1.1,
      stem: { kind: 'matrix', cols: 2, cells: [
        dotted('square', [[32, 32]]), dotted('square', [[68, 32]]),
        dotted('hexagon', [[32, 32]]), null
      ] },
      choices: [
        pick(dotted('hexagon', [[32, 68]])),
        pick(dotted('hexagon', [[68, 32]])),
        pick(dotted('hexagon', [[32, 32]])),
        pick(dotted('square', [[68, 32]])),
        pick(dotted('hexagon', [[68, 68]]))
      ],
      answer: 1,
      hint: 'Track the small dot, not the big shape.',
      walkthrough: [
        { title: 'Read across the top row', text: 'The dot moves from the top-left corner to the top-right corner. The figure is flipped left-to-right, like a mirror.' },
        { title: 'Read down the left column', text: 'The square becomes a hexagon and the dot stays in the top left. Only the outer shape changes.' },
        { title: 'Combine both rules', text: 'The missing cell is a hexagon with the dot mirrored across to the top right.' }
      ],
      why: { 0: 'The dot moved down instead of across — that is a top-to-bottom flip.', 2: 'The dot did not move at all.', 3: 'The bottom row uses hexagons.', 4: 'The dot moved both across and down, which is two flips instead of one.' }
    },
    {
      id: 'fm-08', battery: 'nonverbal', subtest: 'figure-matrices', b: 1.3,
      stem: { kind: 'matrix', cols: 3, cells: [
        one('circle'), one('circle', { fill: 'half' }), one('circle', { fill: 'solid' }),
        one('square'), one('square', { fill: 'half' }), one('square', { fill: 'solid' }),
        one('hexagon'), one('hexagon', { fill: 'half' }), null
      ] },
      choices: [
        pick(one('hexagon', { fill: 'half' })),
        pick(one('hexagon')),
        pick(one('square', { fill: 'solid' })),
        pick(one('hexagon', { fill: 'solid' })),
        pick(one('circle', { fill: 'solid' }))
      ],
      answer: 3,
      hint: 'The shading fills up as you move right; the shape is fixed by the row.',
      walkthrough: [
        { title: 'Read across a row', text: 'Empty, then half filled, then completely filled. Shading is set by the column.' },
        { title: 'Read down a column', text: 'Circle, square, hexagon. Shape is set by the row.' },
        { title: 'Combine both rules', text: 'The empty cell is in the hexagon row and the fully-filled column: a solid hexagon.' }
      ],
      why: { 0: 'Half shading belongs in the middle column.', 1: 'No shading belongs in the first column.', 2: 'Squares belong in the row above.', 4: 'Circles belong in the top row.' }
    }
  ]);

  // -------------------------------------------------- figure classification ---

  subtest({
    id: 'figure-classification',
    battery: 'nonverbal',
    name: 'Figure Classification',
    blurb: 'Three figures share a hidden rule. Pick the figure that follows the same rule.',
    directions: 'The three figures on the top row are alike in some way. Choose the figure that belongs with them.',
    timePerItemSec: 40,
    strategy: [
      'The three given figures are deliberately different in obvious ways — that is how you find the one feature they share.',
      'Check the usual suspects in order: number of sides, shading, how many small marks, symmetry, direction.',
      'Say the rule as a sentence before you look at the choices.'
    ]
  });

  add([
    {
      id: 'fc-01', battery: 'nonverbal', subtest: 'figure-classification', b: -1.2,
      stem: { kind: 'figClass', given: [one('square'), one('diamond'), F.one('rect', { w: 56, h: 34 })] },
      choices: [
        pick(one('triangle')),
        pick(one('hexagon')),
        pick(one('trapezoid')),
        pick(one('circle')),
        pick(one('pentagon'))
      ],
      answer: 2,
      hint: 'Count the sides on each of the three given figures.',
      walkthrough: [
        { title: 'Look for the shared feature', text: 'A square, a diamond and a rectangle look different in width and tilt, but each one has exactly four straight sides.' },
        { title: 'State the rule', text: 'Four-sided figures.' },
        { title: 'Apply it', text: 'Count the sides on each choice. The trapezoid is the only one with exactly four, even though it is not a shape that appears in the given set — the rule is about the count, not about matching a picture.' }
      ],
      why: { 0: 'A triangle has three sides, so it breaks the rule.', 1: 'A hexagon has six sides, two too many.', 3: 'A circle has no straight sides at all.', 4: 'A pentagon has five sides, one too many.' }
    },
    {
      id: 'fc-02', battery: 'nonverbal', subtest: 'figure-classification', b: -1.0,
      stem: { kind: 'figClass', given: [one('circle', { fill: 'solid' }), one('triangle', { fill: 'solid' }), one('star', { fill: 'solid' })] },
      choices: [
        pick(one('square')),
        pick(one('square', { fill: 'solid' })),
        pick(one('hexagon')),
        pick(one('star')),
        pick(one('circle'))
      ],
      answer: 1,
      hint: 'The three given shapes are all different, so the rule is not about shape.',
      walkthrough: [
        { title: 'Rule out shape', text: 'A circle, a triangle and a star have nothing in common as shapes, so shape cannot be the rule.' },
        { title: 'Look at the shading', text: 'All three are completely filled in.' },
        { title: 'Apply it', text: 'The filled square is the only choice that is completely shaded.' }
      ],
      why: { 0: 'The right shape family, but it is an outline rather than filled in.', 2: 'An outline, so it fails the shading rule.', 3: 'This copies the shape of one given figure instead of its shading — the shape was never the rule.', 4: 'An outline, so it fails the shading rule.' }
    },
    {
      id: 'fc-03', battery: 'nonverbal', subtest: 'figure-classification', b: -0.4,
      stem: { kind: 'figClass', given: [dotted('circle', [[50, 50]]), dotted('square', [[50, 50]]), dotted('triangle', [[50, 58]])] },
      choices: [
        pick(dotted('hexagon', [[38, 50], [62, 50]])),
        pick(dotted('hexagon', [[50, 50]])),
        pick(one('hexagon')),
        pick(dotted('circle', [[35, 50], [50, 50], [65, 50]])),
        pick(dotted('square', [[36, 40], [64, 40]]))
      ],
      answer: 1,
      hint: 'Count the small dots.',
      walkthrough: [
        { title: 'Rule out shape', text: 'The three outer shapes are a circle, a square and a triangle, so shape is not the rule.' },
        { title: 'Count what is inside', text: 'Each figure contains exactly one dot.' },
        { title: 'Apply it', text: 'The hexagon with a single dot is the only choice with exactly one.' }
      ],
      why: { 0: 'Two dots inside, and the rule is exactly one.', 2: 'No dots at all, so nothing was placed inside.', 3: 'Three dots inside, two too many.', 4: 'Two dots inside, one too many.' }
    },
    {
      id: 'fc-04', battery: 'nonverbal', subtest: 'figure-classification', b: 0.2,
      stem: { kind: 'figClass', given: [one('circle', { fill: 'half' }), one('square', { fill: 'half' }), one('hexagon', { fill: 'half' })] },
      choices: [
        pick(one('triangle', { fill: 'solid' })),
        pick(one('triangle')),
        pick(one('star', { fill: 'half' })),
        pick(one('diamond', { fill: 'solid' })),
        pick(one('circle'))
      ],
      answer: 2,
      hint: 'How much of each figure is shaded?',
      walkthrough: [
        { title: 'Rule out shape', text: 'Circle, square, hexagon — all different, so shape is not the rule.' },
        { title: 'Look at the shading', text: 'Each figure is shaded on exactly one side of its centre line: half filled, half empty.' },
        { title: 'Apply it', text: 'The half-shaded star is the only choice that is part filled and part empty.' }
      ],
      why: { 0: 'Completely filled in, so it is not part shaded and part empty.', 1: 'Completely empty, with nothing shaded at all.', 3: 'Completely filled in rather than half.', 4: 'Completely empty rather than half.' }
    },
    {
      id: 'fc-05', battery: 'nonverbal', subtest: 'figure-classification', b: 0.6,
      stem: { kind: 'figClass', given: [many(2, 'circle'), many(2, 'square'), many(2, 'triangle')] },
      choices: [
        pick(many(3, 'star')),
        pick(many(2, 'star')),
        pick(many(1, 'star')),
        pick(many(4, 'star')),
        pick(many(2, 'circle'))
      ],
      answer: 1,
      hint: 'The rule is about how many, not about what.',
      walkthrough: [
        { title: 'Rule out shape', text: 'Circles, squares and triangles — the shape changes every time.' },
        { title: 'Count', text: 'Every given figure holds exactly two objects.' },
        { title: 'Apply it', text: 'Two stars is the only choice with a count of two and a new shape, matching how the given set varies its shape while keeping the count fixed.' }
      ],
      why: { 0: 'Three objects, and every given figure holds two.', 2: 'A single object, one short of the rule.', 3: 'Four objects, twice as many as the rule allows.', 4: 'The count is right, but this simply repeats the first given figure instead of continuing the set with a new shape.' }
    },
    {
      id: 'fc-06', battery: 'nonverbal', subtest: 'figure-classification', b: 1.0,
      stem: { kind: 'figClass', given: [split('square'), split('circle'), split('hexagon')] },
      choices: [
        pick(one('triangle')),
        pick(split('triangle')),
        pick(one('square')),
        pick(dotted('circle', [[50, 50]])),
        pick(one('star', { fill: 'half' }))
      ],
      answer: 1,
      hint: 'Look for something added to every one of the three figures.',
      walkthrough: [
        { title: 'Rule out shape and shading', text: 'The outer shapes all differ, and none of them is shaded.' },
        { title: 'Look for what was added', text: 'Each figure has a single straight line running through it, dividing it into two halves.' },
        { title: 'Apply it', text: 'The triangle with a line drawn through it is the only choice that has been divided.' }
      ],
      why: { 0: 'A plain triangle with no dividing line drawn through it.', 2: 'A plain square with nothing added to it.', 3: 'Something was added, but it is a dot rather than a dividing line.', 4: 'Half shaded, which looks divided, but no line was actually drawn.' }
    }
  ]);

  // ---------------------------------------------------------- paper folding ---

  var SHEET = [50, 50, 76, 76];
  var RIGHT_HALF = [69, 50, 38, 76];
  var BOTTOM_HALF = [50, 69, 76, 38];
  var BR_QUARTER = [69, 69, 38, 38];
  var VFOLD = [50, 12, 50, 88];
  var HFOLD = [12, 50, 88, 50];

  subtest({
    id: 'paper-folding',
    battery: 'nonverbal',
    name: 'Paper Folding',
    blurb: 'A square of paper is folded, then punched. Choose how it looks unfolded.',
    directions: 'The pictures show a sheet of paper being folded and then punched with holes. Choose the picture that shows the sheet after it is unfolded.',
    timePerItemSec: 55,
    strategy: [
      'Count the layers the punch goes through: one fold means two layers, two folds mean four.',
      'The number of layers is the number of holes — unless a hole sits right on a fold line.',
      'Unfold one step at a time, mirroring each hole across the fold line you just opened.'
    ]
  });

  add([
    {
      id: 'pf-01', battery: 'nonverbal', subtest: 'paper-folding', b: -1.3,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [VFOLD] }), caption: 'Fold the left half onto the right' },
        { fig: F.paper({ rect: RIGHT_HALF, dash: [VFOLD], holes: [[69, 38]] }), caption: 'Punch one hole' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[69, 38]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 38], [69, 38]] })),
        pick(F.paper({ rect: SHEET, holes: [[69, 38], [69, 62]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 38]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 38], [69, 38], [31, 62], [69, 62]] }))
      ],
      answer: 1,
      hint: 'One fold means the punch went through two layers of paper.',
      walkthrough: [
        { title: 'Count the layers', text: 'The paper was folded once, so where the punch went through there were two layers. Two layers means two holes.' },
        { title: 'Unfold the fold', text: 'The fold line is the vertical centre line. Opening it swings the right half back over to the left.' },
        { title: 'Mirror the hole', text: 'The punched hole is on the right, so its partner appears at the same height on the left, the same distance from the fold line.' }
      ],
      why: { 0: 'Only the punched layer is shown; the second layer was forgotten.', 2: 'These holes are mirrored top-to-bottom, but the fold was left-to-right.', 3: 'This shows only the mirrored hole and drops the original.', 4: 'Four holes would need two folds, not one.' }
    },
    {
      id: 'pf-02', battery: 'nonverbal', subtest: 'paper-folding', b: -0.7,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [HFOLD] }), caption: 'Fold the top half down onto the bottom' },
        { fig: F.paper({ rect: BOTTOM_HALF, dash: [HFOLD], holes: [[36, 69], [64, 69]] }), caption: 'Punch two holes' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[36, 69], [64, 69]] })),
        pick(F.paper({ rect: SHEET, holes: [[36, 69], [64, 69], [36, 31], [64, 31]] })),
        pick(F.paper({ rect: SHEET, holes: [[36, 69], [64, 69], [36, 31]] })),
        pick(F.paper({ rect: SHEET, holes: [[36, 69], [64, 69], [64, 31]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 40], [31, 60], [69, 40], [69, 60]] }))
      ],
      answer: 1,
      hint: 'Two punches through two layers each.',
      walkthrough: [
        { title: 'Count the layers', text: 'One fold means two layers. Each of the two punches goes through both layers, so 2 punches × 2 layers = 4 holes.' },
        { title: 'Unfold the fold', text: 'The fold line is horizontal, across the middle. Opening it swings the bottom half up to the top.' },
        { title: 'Mirror each hole', text: 'Each punched hole gets a partner directly above it, the same distance above the fold line as the original is below it.' }
      ],
      why: { 0: 'The punched layer only — unfolding was skipped.', 2: 'One of the mirrored holes is missing; both punches go through both layers.', 3: 'Same problem, with the other mirrored hole missing.', 4: 'These are mirrored left-to-right, but the fold was top-to-bottom.' }
    },
    {
      id: 'pf-03', battery: 'nonverbal', subtest: 'paper-folding', b: 0.3,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [VFOLD] }), caption: 'Fold left onto right' },
        { fig: F.paper({ rect: RIGHT_HALF, dash: [VFOLD, HFOLD] }), caption: 'Then fold top down' },
        { fig: F.paper({ rect: BR_QUARTER, dash: [VFOLD, HFOLD], holes: [[69, 69]] }), caption: 'Punch one hole' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[69, 69]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 69], [69, 69]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 31], [69, 31], [31, 69], [69, 69]] })),
        pick(F.paper({ rect: SHEET, holes: [[36, 36], [64, 36], [36, 64], [64, 64]] })),
        pick(F.paper({ rect: SHEET, holes: [[50, 50]] }))
      ],
      answer: 2,
      hint: 'Two folds double the layers twice.',
      walkthrough: [
        { title: 'Count the layers', text: 'The first fold makes two layers; the second fold doubles that to four. One punch through four layers gives four holes.' },
        { title: 'Undo the second fold first', text: 'Unfold the horizontal fold: the hole in the bottom-right quarter gains a partner directly above it, in the top-right quarter.' },
        { title: 'Undo the first fold', text: 'Now unfold the vertical fold: both of those holes gain partners across on the left. The result is one hole in each of the four quarters, all the same distance from the centre.' }
      ],
      why: { 0: 'Only the punched layer.', 1: 'Only one fold was undone; the second is still folded.', 3: 'The right count, but every hole has drifted towards the centre. Each hole must stay exactly as far from the fold lines as the original punch was.', 4: 'A single centre hole would mean the punch landed on both fold lines at once.' }
    },
    {
      id: 'pf-04', battery: 'nonverbal', subtest: 'paper-folding', b: 0.9,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [[12, 12, 88, 88]] }), caption: 'Fold the top-right corner down along the diagonal' },
        { fig: F.paper({ tri: { corner: 'bl' }, dash: [[12, 12, 88, 88]], holes: [[30, 66]] }), caption: 'Punch one hole' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[30, 66]] })),
        pick(F.paper({ rect: SHEET, holes: [[30, 66], [66, 30]] })),
        pick(F.paper({ rect: SHEET, holes: [[30, 66], [70, 66]] })),
        pick(F.paper({ rect: SHEET, holes: [[30, 66], [30, 34]] })),
        pick(F.paper({ rect: SHEET, holes: [[30, 66], [66, 30], [30, 34], [66, 70]] }))
      ],
      answer: 1,
      hint: 'A fold line does not have to be vertical or horizontal — mirror across the line that is actually there.',
      walkthrough: [
        { title: 'Count the layers', text: 'It is still just one fold, so two layers and therefore two holes.' },
        { title: 'Find the fold line', text: 'The fold runs corner to corner, from the top-left down to the bottom-right. That diagonal is the mirror line.' },
        { title: 'Mirror across the diagonal', text: 'Reflecting across this diagonal swaps how far a point sits from the left edge with how far it sits from the top. The hole low on the left reappears high on the right, the same distance from the fold.' }
      ],
      why: { 0: 'The second layer was forgotten.', 2: 'Mirrored left-to-right, as if the fold had been vertical.', 3: 'Mirrored top-to-bottom, as if the fold had been horizontal.', 4: 'Four holes would need two folds.' }
    },
    {
      id: 'pf-05', battery: 'nonverbal', subtest: 'paper-folding', b: 1.4,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [VFOLD] }), caption: 'Fold the left half onto the right' },
        { fig: F.paper({ rect: RIGHT_HALF, dash: [VFOLD], holes: [[50, 50]] }), caption: 'Punch a hole on the folded edge' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[31, 50], [69, 50]] })),
        pick(F.paper({ rect: SHEET, holes: [[50, 50]] })),
        pick(F.paper({ rect: SHEET, holes: [[50, 31], [50, 69]] })),
        pick(F.paper({ rect: SHEET, holes: [[69, 50]] })),
        pick(F.paper({ rect: SHEET, holes: [[31, 50], [50, 50], [69, 50]] }))
      ],
      answer: 1,
      hint: 'Where exactly is the punch? Look at how it sits relative to the fold line.',
      walkthrough: [
        { title: 'Notice where the punch is', text: 'The hole is not out in the middle of the folded half — it is sitting right on the folded edge itself.' },
        { title: 'Think about the paper', text: 'A punch on the fold takes a bite out of the crease. Each layer loses half a circle, and the two halves are joined along the crease.' },
        { title: 'Unfold it', text: 'Opening the paper brings the two half-bites together into one whole hole, centred on the fold line. The answer is a single hole in the middle.' }
      ],
      why: { 0: 'This is the usual answer for a punch *away* from the fold; here the two holes would merge into one.', 2: 'Mirrored top-to-bottom, but the fold was vertical.', 3: 'Only one layer, and placed off the fold line rather than on it.', 4: 'Three holes cannot come from two layers.' }
    },
    {
      id: 'pf-06', battery: 'nonverbal', subtest: 'paper-folding', b: 1.0,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: SHEET, dash: [VFOLD] }), caption: 'Fold the left half onto the right' },
        { fig: F.paper({ rect: RIGHT_HALF, dash: [VFOLD], holes: [[60, 30], [78, 70]] }), caption: 'Punch two holes' }
      ] },
      choices: [
        pick(F.paper({ rect: SHEET, holes: [[60, 30], [78, 70]] })),
        pick(F.paper({ rect: SHEET, holes: [[60, 30], [40, 30], [78, 70], [22, 70]] })),
        pick(F.paper({ rect: SHEET, holes: [[60, 30], [40, 30], [78, 70], [40, 70]] })),
        pick(F.paper({ rect: SHEET, holes: [[60, 30], [60, 70], [78, 30], [78, 70]] })),
        pick(F.paper({ rect: SHEET, holes: [[60, 30], [40, 30], [78, 70]] }))
      ],
      answer: 1,
      hint: 'Mirror each hole separately, and keep its distance from the fold line.',
      walkthrough: [
        { title: 'Count the layers', text: 'One fold, two layers, two punches: 2 × 2 = 4 holes.' },
        { title: 'Mirror the first hole', text: 'The upper hole sits a short way right of the fold line, so its partner sits the same short way left of it, at the same height.' },
        { title: 'Mirror the second hole', text: 'The lower hole sits much further right, near the edge, so its partner lands much further left, near the opposite edge — at that hole’s own height, not the first one’s.' }
      ],
      why: { 0: 'Neither hole was mirrored.', 2: 'The second hole’s partner is at the wrong distance from the fold; each hole keeps its own distance.', 3: 'Mirrored top-to-bottom instead of left-to-right.', 4: 'The second hole was never mirrored.' }
    }
  ]);
})(typeof self !== 'undefined' ? self : this);

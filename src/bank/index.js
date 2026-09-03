/*
 * index.js — assembles every item pool and describes the eleven subtests.
 *
 * Nine subtests appear on any one form. The primary levels use Picture Analogies
 * and Picture Classification for the verbal battery; the upper levels use Verbal
 * Analogies and Verbal Classification. Sentence Completion appears on both.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./generators.js'), require('./generators-figural.js'),
      require('./verbal.js'), require('./primary.js'), require('../figures.js')
    );
  } else {
    root.CogatBank = factory(root.CogatGenerators, root.CogatGeneratorsFigural,
      root.CogatVerbalBank, root.CogatPrimaryBank, root.Figures);
  }
})(typeof self !== 'undefined' ? self : this, function (Gen, GenFig, Verbal, Primary, Figures) {
  'use strict';

  var F = Figures.F;

  var subtests = {
    'picture-analogies': {
      id: 'picture-analogies', battery: 'verbal', name: 'Picture Analogies', forms: ['primary'],
      blurb: 'Work out how the first two pictures go together, then find the picture that goes with the third one the same way.',
      directions: 'Look at the first two pictures. Decide how they go together. Then choose the picture that goes with the third picture in the same way.',
      strategy: [
        'Say out loud how the first two pictures go together: "a bird lives in a nest".',
        'Say the same sentence again with the third picture: "a dog lives in a ___".',
        'Watch for a choice that goes with the wrong picture in the pair.'
      ]
    },
    'picture-classification': {
      id: 'picture-classification', battery: 'verbal', name: 'Picture Classification', forms: ['primary'],
      blurb: 'Three pictures belong together. Find the one that belongs with them.',
      directions: 'The three pictures at the top go together in some way. Choose the picture that belongs with them.',
      strategy: [
        'Name out loud what the three pictures have in common.',
        'Make the rule as narrow as you can — "birds" tells you more than "animals".',
        'Check every choice against the rule before you decide.'
      ]
    },
    'verbal-analogies': {
      id: 'verbal-analogies', battery: 'verbal', name: 'Verbal Analogies', forms: ['upper'],
      blurb: 'Work out how the first pair of words is related, then apply the same relationship to the second pair.',
      directions: 'The first two words go together in a certain way. Choose the word that goes with the third word in the same way.',
      strategy: [
        'Say the relationship out loud as a sentence: "A cub is a young bear."',
        'Keep the direction of the sentence the same when you plug in the third word.',
        'If two answers both fit, make the sentence more specific until only one survives.'
      ]
    },
    'sentence-completion': {
      id: 'sentence-completion', battery: 'verbal', name: 'Sentence Completion', forms: ['primary', 'upper'],
      blurb: 'Choose the word that makes the whole sentence make sense, not just the words next to the blank.',
      directions: 'Read the sentence and choose the word that best fits the blank.',
      strategy: [
        'Read the whole sentence first and predict your own word before you look at the choices.',
        'Hunt for signal words: "although", "rather than", "because", "so" tell you whether the blank agrees with the rest of the sentence or contradicts it.',
        'Plug your choice back in and read the sentence again from the start.'
      ]
    },
    'verbal-classification': {
      id: 'verbal-classification', battery: 'verbal', name: 'Verbal Classification', forms: ['upper'],
      blurb: 'Three words belong to one group. Find the fourth word that belongs with them.',
      directions: 'The three words at the top are alike in some way. Choose the word that belongs with them.',
      strategy: [
        'Say what all three given words have in common in one short phrase.',
        'Make the rule as narrow as you can — "birds" is better than "animals".',
        'Reject any answer that names the whole category instead of a member of it.'
      ]
    },
    'number-analogies': {
      id: 'number-analogies', battery: 'quantitative', name: 'Number Analogies', forms: ['primary', 'upper'],
      blurb: 'Two complete number pairs show a rule. Use the same rule on the third pair.',
      directions: 'Study the first two pairs of numbers. Work out the rule, then choose the number that completes the third pair.',
      strategy: [
        'Ask "what did the first number have done to it?" — plus, minus, times, divide, or squared.',
        'Test your rule on the second pair before you use it. A rule that only fits one pair is not the rule.',
        'If a single operation fails, try two steps, such as "times 3, then add 1".'
      ]
    },
    'number-puzzles': {
      id: 'number-puzzles', battery: 'quantitative', name: 'Number Puzzles', forms: ['primary', 'upper'],
      blurb: 'Solve for the missing value. Some puzzles use a shape that stands for the same number every time it appears.',
      directions: 'Find the number that makes every statement true.',
      strategy: [
        'Finish any side of the equation that has no unknown in it first — turn it into a single number.',
        'When a shape appears, solve for the shape before you touch the "?".',
        'Substitute your answer back into every line to check it.'
      ]
    },
    'number-series': {
      id: 'number-series', battery: 'quantitative', name: 'Number Series', forms: ['primary', 'upper'],
      blurb: 'Find the pattern running through the list and continue it.',
      directions: 'Study the numbers. Choose the number that comes next.',
      strategy: [
        'Write the gaps between neighbouring numbers underneath the series first.',
        'If the gaps are equal, it is repeated addition. If the gaps grow steadily, look at the gaps between the gaps.',
        'If the numbers grow fast, check for multiplication, squares, or a "×n then ±k" rule.'
      ]
    },
    'figure-matrices': {
      id: 'figure-matrices', battery: 'nonverbal', name: 'Figure Matrices', forms: ['primary', 'upper'],
      blurb: 'A grid of figures follows a rule. Work out the rule and supply the missing cell.',
      directions: 'The figures in the grid change according to a rule. Choose the figure that belongs in the empty cell.',
      strategy: [
        'Read across the top row first and say in words what changed: shape, size, shading, number, or direction.',
        'Then read down the left column and name that change too. The missing cell obeys both.',
        'Predict the answer before you look at the choices, so near-miss distractors cannot pull you off.'
      ]
    },
    'figure-classification': {
      id: 'figure-classification', battery: 'nonverbal', name: 'Figure Classification', forms: ['primary', 'upper'],
      blurb: 'Three figures share a hidden rule. Pick the figure that follows the same rule.',
      directions: 'The three figures on the top row are alike in some way. Choose the figure that belongs with them.',
      strategy: [
        'The three given figures are deliberately different in obvious ways — that is how you find the one feature they share.',
        'Check the usual suspects in order: number of sides, shading, how many small marks, symmetry, direction.',
        'Say the rule as a sentence before you look at the choices.'
      ]
    },
    'paper-folding': {
      id: 'paper-folding', battery: 'nonverbal', name: 'Paper Folding', forms: ['primary', 'upper'],
      blurb: 'A square of paper is folded, then punched. Choose how it looks unfolded.',
      directions: 'The pictures show a sheet of paper being folded and then punched with holes. Choose the picture that shows the sheet after it is unfolded.',
      strategy: [
        'Count the layers the punch goes through: one fold means two layers, two folds mean four.',
        'The number of layers is the number of holes — unless a hole sits right on a fold line.',
        'Unfold one step at a time, mirroring each hole across the fold line you just opened.'
      ]
    }
  };

  // ------------------------------------------------------------- practice ---
  // Worked examples shown untimed before each timed section. Never scored.

  function pick(fig) { return { fig: fig }; }
  function one(t, o) { return F.one(t, Object.assign({ s: 46 }, o || {})); }
  function many(n, t) { return F.many(n, t, {}); }

  var practice = [
    {
      id: 'ns-prac-1', battery: 'quantitative', subtest: 'number-series', b: -3.6, practice: true,
      stem: { kind: 'series', values: [2, 4, 6, 8] }, choices: [9, 10, 11, 12, 14], answer: 1,
      hint: 'Write the gap between each pair of numbers.',
      walkthrough: [
        { title: 'How this works', text: 'Find the rule that gets you from each number to the next, then use it once more.' },
        { title: 'This example', text: 'Every gap is 2, so the next number is 8 + 2 = 10.' }
      ]
    },
    {
      id: 'ns-prac-2', battery: 'quantitative', subtest: 'number-series', b: -3.6, practice: true,
      stem: { kind: 'series', values: [20, 18, 16, 14] }, choices: [10, 11, 12, 13, 15], answer: 2,
      hint: 'The numbers are going down.',
      walkthrough: [
        { title: 'Check the direction', text: 'A series can go down as well as up. Find the gap first, then decide which way it runs.' },
        { title: 'This example', text: 'Each number is 2 less than the one before, so the next is 14 − 2 = 12.' }
      ]
    },
    {
      id: 'na-prac-1', battery: 'quantitative', subtest: 'number-analogies', b: -3.6, practice: true,
      stem: { kind: 'numAnalogy', pairs: [[2, 4], [3, 5], [6, null]] }, choices: [7, 8, 9, 10, 12], answer: 1,
      hint: 'What was done to the first number of each pair?',
      walkthrough: [
        { title: 'How this works', text: 'Find the rule that turns the first number of a pair into the second, check it on the second pair, then use it on the third.' },
        { title: 'This example', text: '2 + 2 = 4 and 3 + 2 = 5, so the rule is "add 2". 6 + 2 = 8.' }
      ]
    },
    {
      id: 'na-prac-2', battery: 'quantitative', subtest: 'number-analogies', b: -3.6, practice: true,
      stem: { kind: 'numAnalogy', pairs: [[2, 4], [5, 10], [7, null]] }, choices: [9, 12, 14, 16, 21], answer: 2,
      hint: 'How many times bigger is the second number?',
      walkthrough: [
        { title: 'Test the rule on both pairs', text: 'A rule that fits only the first pair is not the rule. Check it against the second before you use it.' },
        { title: 'This example', text: '2 × 2 = 4 and 5 × 2 = 10, so the rule is "double it". 7 × 2 = 14.' }
      ]
    },
    {
      id: 'np-prac-1', battery: 'quantitative', subtest: 'number-puzzles', b: -3.6, practice: true,
      stem: { kind: 'puzzle', lines: ['? + 2 = 5'] }, choices: [2, 3, 4, 7, 10], answer: 1,
      hint: 'Undo the addition.',
      walkthrough: [
        { title: 'How this works', text: 'Work out the number that makes the statement true.' },
        { title: 'This example', text: '5 − 2 = 3, and 3 + 2 = 5, so the answer is 3.' }
      ]
    },
    {
      id: 'np-prac-2', battery: 'quantitative', subtest: 'number-puzzles', b: -3.6, practice: true,
      stem: { kind: 'puzzle', lines: ['△ = 4', '? = △ + 3'] }, choices: [1, 5, 7, 12, 34], answer: 2,
      hint: 'Replace the shape with its value.',
      walkthrough: [
        { title: 'Solve for the shape first', text: 'When a shape appears, work out what number it stands for before you touch the question mark.' },
        { title: 'This example', text: 'The first line says the triangle is 4, so ? = 4 + 3 = 7.' }
      ]
    },
    {
      id: 'fm-prac-1', battery: 'nonverbal', subtest: 'figure-matrices', b: -3.6, practice: true,
      stem: { kind: 'matrix', cols: 2, cells: [one('circle', { s: 24 }), one('circle', { s: 62 }), one('square', { s: 24 }), null] },
      choices: [pick(one('square', { s: 62 })), pick(one('square', { s: 24 })), pick(one('circle', { s: 62 })),
        pick(one('triangle', { s: 62 })), pick(one('square', { s: 62, fill: 'solid' }))],
      answer: 0,
      hint: 'Only one thing changes as you move across a row.',
      walkthrough: [
        { title: 'How this works', text: 'Find what changes across the row and what changes down the column. The empty cell obeys both.' },
        { title: 'This example', text: 'Across, the figure gets bigger. Down, the shape changes to a square. So the answer is a large square.' }
      ]
    },
    {
      id: 'fm-prac-2', battery: 'nonverbal', subtest: 'figure-matrices', b: -3.6, practice: true,
      stem: { kind: 'matrix', cols: 2, cells: [one('triangle'), one('triangle', { fill: 'solid' }), one('circle'), null] },
      choices: [pick(one('circle')), pick(one('circle', { fill: 'solid' })), pick(one('triangle', { fill: 'solid' })),
        pick(one('square', { fill: 'solid' })), pick(one('circle', { fill: 'half' }))],
      answer: 1,
      hint: 'What happens to the inside of the figure?',
      walkthrough: [
        { title: 'Take one direction at a time', text: 'Name what changes across the row, then name what changes down the column, and only then combine them.' },
        { title: 'This example', text: 'Across, the figure gets filled in. Down, it becomes a circle. So the answer is a filled circle.' }
      ]
    },
    {
      id: 'fc-prac-1', battery: 'nonverbal', subtest: 'figure-classification', b: -3.6, practice: true,
      stem: { kind: 'figClass', given: [one('circle', { fill: 'solid' }), one('triangle', { fill: 'solid' }), one('star', { fill: 'solid' })] },
      choices: [pick(one('square')), pick(one('square', { fill: 'solid' })), pick(one('hexagon')),
        pick(one('star')), pick(one('circle'))],
      answer: 1,
      hint: 'The three given shapes are all different, so the rule is not about shape.',
      walkthrough: [
        { title: 'How this works', text: 'Find the one feature all three top figures share, then pick the choice that shares it.' },
        { title: 'This example', text: 'They are all completely filled in, so the filled square belongs with them.' }
      ]
    },
    {
      id: 'fc-prac-2', battery: 'nonverbal', subtest: 'figure-classification', b: -3.6, practice: true,
      stem: { kind: 'figClass', given: [many(2, 'circle'), many(2, 'square'), many(2, 'triangle')] },
      choices: [pick(many(3, 'star')), pick(many(2, 'star')), pick(many(1, 'star')),
        pick(many(4, 'star')), pick(many(3, 'circle'))],
      answer: 1,
      hint: 'Count the objects.',
      walkthrough: [
        { title: 'Rule out the obvious first', text: 'When the three shapes are all different, the rule is not about shape. Look at count, shading or what is inside.' },
        { title: 'This example', text: 'Every top figure holds exactly two objects, so two stars belongs with them.' }
      ]
    },
    {
      id: 'pf-prac-1', battery: 'nonverbal', subtest: 'paper-folding', b: -3.6, practice: true,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: [50, 50, 76, 76], dash: [[50, 12, 50, 88]] }), caption: 'Fold the left half onto the right' },
        { fig: F.paper({ rect: [69, 50, 38, 76], dash: [[50, 12, 50, 88]], holes: [[69, 40]] }), caption: 'Punch one hole' }
      ] },
      choices: [
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[69, 40]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[31, 40], [69, 40]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[69, 40], [69, 60]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[31, 40]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[31, 40], [69, 40], [31, 60], [69, 60]] }))
      ],
      answer: 1,
      hint: 'One fold means the punch went through two layers.',
      walkthrough: [
        { title: 'How this works', text: 'Count the layers the punch goes through, then mirror each hole back across every fold.' },
        { title: 'This example', text: 'One fold means two layers, so two holes. Opening the fold puts the second hole across from the first, the same distance from the fold line.' }
      ]
    },
    {
      id: 'pf-prac-2', battery: 'nonverbal', subtest: 'paper-folding', b: -3.6, practice: true,
      stem: { kind: 'figSeq', figs: [
        { fig: F.paper({ rect: [50, 50, 76, 76], dash: [[12, 50, 88, 50]] }), caption: 'Fold the top half down onto the bottom' },
        { fig: F.paper({ rect: [50, 69, 76, 38], dash: [[12, 50, 88, 50]], holes: [[40, 69]] }), caption: 'Punch one hole' }
      ] },
      choices: [
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[40, 69]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[40, 69], [60, 69]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[40, 31], [40, 69]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[40, 31]] })),
        pick(F.paper({ rect: [50, 50, 76, 76], holes: [[40, 31], [40, 69], [60, 31], [60, 69]] }))
      ],
      answer: 2,
      hint: 'The fold runs across, so the mirror runs up and down.',
      walkthrough: [
        { title: 'The crease sets the mirror', text: 'Holes mirror across the crease, so a fold running across the sheet moves holes up and down, not side to side.' },
        { title: 'This example', text: 'The fold is horizontal, so the second hole appears directly above the first, the same distance above the fold line as the original is below it.' }
      ]
    }
  ];

  var items = []
    .concat(Gen.items)
    .concat(GenFig.items)
    .concat(Verbal.items)
    .concat(Primary.items)
    .concat(practice);

  return { items: items, subtests: subtests };
});

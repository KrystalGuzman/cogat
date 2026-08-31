/* Quantitative battery: Number Analogies, Number Puzzles, Number Series. */
(function (root) {
  'use strict';
  var bank = root.CogatBank = root.CogatBank || { items: [], subtests: {} };

  function subtest(meta) { bank.subtests[meta.id] = meta; }
  function add(items) { bank.items.push.apply(bank.items, items); }

  subtest({
    id: 'number-analogies',
    battery: 'quantitative',
    name: 'Number Analogies',
    blurb: 'Two complete number pairs show a rule. Use the same rule on the third pair.',
    directions: 'Study the first two pairs of numbers. Work out the rule, then choose the number that completes the third pair.',
    timePerItemSec: 45,
    strategy: [
      'Ask "what did the first number have done to it?" — plus, minus, times, divide, or squared.',
      'Test your rule on the second pair before you use it. A rule that only fits one pair is not the rule.',
      'If a single operation fails, try two steps, such as "times 3, then add 1".'
    ]
  });

  add([
    {
      id: 'na-01', battery: 'quantitative', subtest: 'number-analogies', b: -1.4,
      stem: { kind: 'numAnalogy', pairs: [[2, 6], [4, 12], [5, null]] },
      choices: [8, 10, 15, 20, 25],
      answer: 2,
      hint: 'How many times bigger is the second number in each pair?',
      walkthrough: [
        { title: 'Look at pair 1', text: '2 becomes 6. That could be +4 or ×3.' },
        { title: 'Test on pair 2', text: '4 + 4 = 8, but the pair shows 12. 4 × 3 = 12 — so the rule is ×3, not +4.' },
        { title: 'Apply the rule', text: '5 × 3 = 15.' }
      ],
      why: { 0: 'That would be +3, which fails on the first pair.', 1: 'That is +5, which fits neither pair.', 3: 'That is ×4, which would make the first pair 2 → 8.', 4: 'That is ×5, too large for the rule.' }
    },
    {
      id: 'na-02', battery: 'quantitative', subtest: 'number-analogies', b: -1.2,
      stem: { kind: 'numAnalogy', pairs: [[10, 5], [18, 9], [24, null]] },
      choices: [6, 12, 14, 18, 20],
      answer: 1,
      hint: 'The second number is always smaller. By how much, proportionally?',
      walkthrough: [
        { title: 'Look at pair 1', text: '10 becomes 5. That is −5 or ÷2.' },
        { title: 'Test on pair 2', text: '18 − 5 = 13, but the pair shows 9. 18 ÷ 2 = 9 — the rule is ÷2.' },
        { title: 'Apply the rule', text: '24 ÷ 2 = 12.' }
      ],
      why: { 0: 'That is ÷4.', 2: 'That would be −10, which fails on pair 1.', 3: 'That is −6, inconsistent with both pairs.', 4: 'That is −4, which does not fit either pair.' }
    },
    {
      id: 'na-03', battery: 'quantitative', subtest: 'number-analogies', b: -1.0,
      stem: { kind: 'numAnalogy', pairs: [[9, 4], [12, 7], [20, null]] },
      choices: [10, 14, 15, 16, 25],
      answer: 2,
      hint: 'The gap between the two numbers of a pair is always the same.',
      walkthrough: [
        { title: 'Look at pair 1', text: '9 becomes 4: a drop of 5.' },
        { title: 'Test on pair 2', text: '12 − 5 = 7. Correct, so the rule is −5.' },
        { title: 'Apply the rule', text: '20 − 5 = 15.' }
      ],
      why: { 0: 'That is ÷2, which gives 4.5 for the first pair.', 1: 'That is −6, one too many.', 3: 'That is −4, one too few.', 4: 'That is larger than the first number, so the direction is wrong.' }
    },
    {
      id: 'na-04', battery: 'quantitative', subtest: 'number-analogies', b: -0.4,
      stem: { kind: 'numAnalogy', pairs: [[4, 16], [6, 36], [9, null]] },
      choices: [18, 27, 72, 81, 90],
      answer: 3,
      hint: 'Try multiplying the number by itself.',
      walkthrough: [
        { title: 'Look at pair 1', text: '4 becomes 16. That could be ×4 or 4 squared — the same thing here, which is a warning sign.' },
        { title: 'Test on pair 2', text: '6 × 4 = 24, but the pair shows 36. 6 × 6 = 36 — the rule is "square the number".' },
        { title: 'Apply the rule', text: '9 × 9 = 81.' }
      ],
      why: { 0: 'That is ×2.', 1: 'That is ×3.', 2: 'That is ×8, which fits neither pair.', 4: 'That is ×10.' }
    },
    {
      id: 'na-05', battery: 'quantitative', subtest: 'number-analogies', b: -0.6,
      stem: { kind: 'numAnalogy', pairs: [[12, 4], [21, 7], [33, null]] },
      choices: [8, 9, 11, 13, 30],
      answer: 2,
      hint: 'Try dividing.',
      walkthrough: [
        { title: 'Look at pair 1', text: '12 becomes 4. That is −8 or ÷3.' },
        { title: 'Test on pair 2', text: '21 − 8 = 13, but the pair shows 7. 21 ÷ 3 = 7 — the rule is ÷3.' },
        { title: 'Apply the rule', text: '33 ÷ 3 = 11.' }
      ],
      why: { 0: 'Neither ÷ nor − gives 8 from 33 under a consistent rule.', 1: 'That would require ÷ 3.67.', 3: 'That is what −20 would give, which fails on the earlier pairs.', 4: 'That is −3, not ÷3.' }
    },
    {
      id: 'na-06', battery: 'quantitative', subtest: 'number-analogies', b: 0.6,
      stem: { kind: 'numAnalogy', pairs: [[3, 10], [5, 16], [7, null]] },
      choices: [20, 21, 22, 24, 25],
      answer: 2,
      hint: 'One operation is not enough. Try multiplying and then adding.',
      walkthrough: [
        { title: 'Try one step', text: '3 → 10 is +7; but 5 + 7 = 12, not 16. A single addition fails.' },
        { title: 'Try two steps', text: '3 × 3 = 9, and 9 + 1 = 10. Test it: 5 × 3 = 15, and 15 + 1 = 16. The rule is ×3 then +1.' },
        { title: 'Apply the rule', text: '7 × 3 = 21, and 21 + 1 = 22.' }
      ],
      why: { 0: 'That is ×3 − 1.', 1: 'That is ×3 with no +1 — check the rule on both given pairs.', 3: 'That is ×3 + 3.', 4: 'That is ×3 + 4.' }
    },
    {
      id: 'na-07', battery: 'quantitative', subtest: 'number-analogies', b: 1.0,
      stem: { kind: 'numAnalogy', pairs: [[8, 3], [14, 6], [20, null]] },
      choices: [7, 8, 9, 10, 12],
      answer: 2,
      hint: 'Halve the number, then adjust.',
      walkthrough: [
        { title: 'Try one step', text: '8 → 3 is −5, but 14 − 5 = 9, not 6. Division alone fails too: 8 ÷ 3 is not whole.' },
        { title: 'Try two steps', text: 'Halve first: 8 ÷ 2 = 4, then −1 gives 3. Test it: 14 ÷ 2 = 7, then −1 gives 6. The rule is ÷2 then −1.' },
        { title: 'Apply the rule', text: '20 ÷ 2 = 10, and 10 − 1 = 9.' }
      ],
      why: { 0: 'That is ÷2 − 3.', 1: 'That is ÷2 − 2.', 3: 'That is ÷2 with the −1 forgotten.', 4: 'That is −8, which fails on both given pairs.' }
    },
    {
      id: 'na-08', battery: 'quantitative', subtest: 'number-analogies', b: 1.4,
      stem: { kind: 'numAnalogy', pairs: [[2, 5], [3, 10], [4, null]] },
      choices: [13, 15, 16, 17, 20],
      answer: 3,
      hint: 'The second numbers are just past a familiar sequence: 4, 9, 16.',
      walkthrough: [
        { title: 'Try one step', text: '2 → 5 is +3 or ×2.5; 3 → 10 is +7. Neither addition nor multiplication is consistent.' },
        { title: 'Look for squares', text: '2² = 4 and the answer is 5. 3² = 9 and the answer is 10. The rule is "square it, then add 1".' },
        { title: 'Apply the rule', text: '4² = 16, and 16 + 1 = 17.' }
      ],
      why: { 0: 'That is 4 × 3 + 1, a rule that fails on the first pair.', 1: 'That is 4² − 1.', 2: 'That is 4² with the +1 forgotten — the most common slip here.', 4: 'That is ×5, which fails on both given pairs.' }
    }
  ]);

  subtest({
    id: 'number-puzzles',
    battery: 'quantitative',
    name: 'Number Puzzles',
    blurb: 'Solve for the missing value. Some puzzles use a shape that stands for the same number every time it appears.',
    directions: 'Find the number that makes every statement true.',
    timePerItemSec: 50,
    strategy: [
      'Finish any side of the equation that has no unknown in it first — turn it into a single number.',
      'When a shape appears, solve for the shape before you touch the "?".',
      'Substitute your answer back into every line to check it.'
    ]
  });

  add([
    {
      id: 'np-01', battery: 'quantitative', subtest: 'number-puzzles', b: -1.6,
      stem: { kind: 'puzzle', lines: ['? + 4 = 11'] },
      choices: [5, 6, 7, 8, 15],
      answer: 2,
      hint: 'Undo the addition.',
      walkthrough: [
        { title: 'Isolate the unknown', text: 'To undo "+ 4", subtract 4 from both sides.' },
        { title: 'Compute', text: '? = 11 − 4 = 7.' },
        { title: 'Check', text: '7 + 4 = 11. Correct.' }
      ],
      why: { 4: 'That is 11 + 4; adding when you should subtract is the usual mistake here.' }
    },
    {
      id: 'np-02', battery: 'quantitative', subtest: 'number-puzzles', b: -1.1,
      stem: { kind: 'puzzle', lines: ['? − 8 = 15'] },
      choices: [7, 17, 21, 23, 25],
      answer: 3,
      hint: 'Undo the subtraction by adding.',
      walkthrough: [
        { title: 'Isolate the unknown', text: 'The unknown had 8 taken away from it, so add 8 back to both sides.' },
        { title: 'Compute', text: '? = 15 + 8 = 23.' },
        { title: 'Check', text: '23 − 8 = 15. Correct.' }
      ],
      why: { 0: 'That is 15 − 8, which subtracts when you should add.' }
    },
    {
      id: 'np-03', battery: 'quantitative', subtest: 'number-puzzles', b: -0.7,
      stem: { kind: 'puzzle', lines: ['9 + ? = 4 + 12'] },
      choices: [5, 7, 9, 16, 25],
      answer: 1,
      hint: 'Simplify the right side to one number first.',
      walkthrough: [
        { title: 'Finish the clean side', text: 'The right side has no unknown: 4 + 12 = 16.' },
        { title: 'Rewrite', text: 'The puzzle is now 9 + ? = 16.' },
        { title: 'Solve and check', text: '? = 16 − 9 = 7. Check: 9 + 7 = 16 and 4 + 12 = 16. Both sides match.' }
      ],
      why: { 3: 'That is the value of the right-hand side, not the missing addend.' }
    },
    {
      id: 'np-04', battery: 'quantitative', subtest: 'number-puzzles', b: -0.9,
      stem: { kind: 'puzzle', lines: ['△ = 5', '? = △ + 9'] },
      choices: [4, 13, 14, 15, 45],
      answer: 2,
      hint: 'Replace the triangle with its value.',
      walkthrough: [
        { title: 'Substitute', text: 'The first line tells you △ is 5 everywhere it appears.' },
        { title: 'Rewrite', text: '? = 5 + 9.' },
        { title: 'Compute', text: '? = 14.' }
      ],
      why: { 0: 'That is 9 − 5; the line says add, not subtract.', 4: 'That is 5 × 9.' }
    },
    {
      id: 'np-05', battery: 'quantitative', subtest: 'number-puzzles', b: -0.2,
      stem: { kind: 'puzzle', lines: ['? × 3 = 8 + 13'] },
      choices: [3, 5, 7, 9, 21],
      answer: 2,
      hint: 'Turn the right side into one number, then divide.',
      walkthrough: [
        { title: 'Finish the clean side', text: '8 + 13 = 21.' },
        { title: 'Rewrite', text: '? × 3 = 21.' },
        { title: 'Solve and check', text: '? = 21 ÷ 3 = 7. Check: 7 × 3 = 21. Correct.' }
      ],
      why: { 4: 'That is the right-hand total, which is what "?" gets multiplied up to, not "?" itself.' }
    },
    {
      id: 'np-06', battery: 'quantitative', subtest: 'number-puzzles', b: 0.3,
      stem: { kind: 'puzzle', lines: ['◻ + ◻ = 18', '? = ◻ + 6'] },
      choices: [9, 12, 15, 18, 24],
      answer: 2,
      hint: 'Two identical squares add to 18, so one square is worth half of that.',
      walkthrough: [
        { title: 'Solve for the shape', text: '◻ + ◻ is two of the same number, so 2 × ◻ = 18 and ◻ = 9.' },
        { title: 'Substitute', text: '? = 9 + 6.' },
        { title: 'Compute and check', text: '? = 15. Check line 1: 9 + 9 = 18. Correct.' }
      ],
      why: { 0: 'That is the value of ◻ itself; the question asks for ◻ + 6.', 4: 'That is 18 + 6, using the total instead of one square.' }
    },
    {
      id: 'np-07', battery: 'quantitative', subtest: 'number-puzzles', b: 0.8,
      stem: { kind: 'puzzle', lines: ['◻ = 7', '△ = ◻ + 2', '? = △ × 4'] },
      choices: [28, 30, 34, 36, 40],
      answer: 3,
      hint: 'Work down the lines one at a time; each one feeds the next.',
      walkthrough: [
        { title: 'Line 1', text: '◻ = 7.' },
        { title: 'Line 2', text: '△ = ◻ + 2 = 7 + 2 = 9.' },
        { title: 'Line 3', text: '? = △ × 4 = 9 × 4 = 36.' }
      ],
      why: { 0: 'That is 7 × 4 — the "+2" from line 2 was skipped.', 4: 'That is 10 × 4, adding 3 instead of 2.' }
    },
    {
      id: 'np-08', battery: 'quantitative', subtest: 'number-puzzles', b: 1.1,
      stem: { kind: 'puzzle', lines: ['? ÷ 4 = 20 − 13'] },
      choices: [7, 11, 24, 28, 33],
      answer: 3,
      hint: 'Simplify the right side, then undo the division by multiplying.',
      walkthrough: [
        { title: 'Finish the clean side', text: '20 − 13 = 7.' },
        { title: 'Rewrite', text: '? ÷ 4 = 7.' },
        { title: 'Solve and check', text: 'Undo ÷4 by multiplying: ? = 7 × 4 = 28. Check: 28 ÷ 4 = 7. Correct.' }
      ],
      why: { 0: 'That is the right-hand side, not the value that was divided.', 1: 'That is 7 + 4, adding instead of multiplying.' }
    },
    {
      id: 'np-09', battery: 'quantitative', subtest: 'number-puzzles', b: 1.5,
      stem: { kind: 'puzzle', lines: ['2 × ◯ = 14', '? = (◯ × ◯) − 9'] },
      choices: [5, 33, 40, 47, 49],
      answer: 2,
      hint: 'Find the circle first, then square it before subtracting.',
      walkthrough: [
        { title: 'Solve for the shape', text: '2 × ◯ = 14, so ◯ = 7.' },
        { title: 'Handle the brackets first', text: '◯ × ◯ = 7 × 7 = 49.' },
        { title: 'Finish', text: '? = 49 − 9 = 40.' }
      ],
      why: { 0: 'That is 14 − 9, using the total instead of ◯.', 1: 'That is (7 × 6) − 9.', 3: 'That is 7 + 49 − 9, or a doubled ◯ used somewhere.', 4: 'That is ◯ × ◯ with the "− 9" forgotten.' }
    }
  ]);

  subtest({
    id: 'number-series',
    battery: 'quantitative',
    name: 'Number Series',
    blurb: 'Find the pattern running through the list and continue it.',
    directions: 'Study the numbers. Choose the number that comes next.',
    timePerItemSec: 45,
    strategy: [
      'Write the gaps between neighbouring numbers underneath the series first.',
      'If the gaps are equal, it is repeated addition. If the gaps grow steadily, look at the gaps *between the gaps*.',
      'If the numbers grow fast, check for multiplication, squares, or a "×n then ±k" rule.'
    ]
  });

  add([
    {
      id: 'ns-01', battery: 'quantitative', subtest: 'number-series', b: -1.6,
      stem: { kind: 'series', values: [2, 4, 6, 8] },
      choices: [9, 10, 11, 12, 16],
      answer: 1,
      hint: 'Write the gap between each pair of numbers.',
      walkthrough: [
        { title: 'Find the gaps', text: '4 − 2 = 2, 6 − 4 = 2, 8 − 6 = 2. Every gap is 2.' },
        { title: 'Continue', text: 'Add 2 to the last number: 8 + 2 = 10.' }
      ],
      why: { 4: 'That is doubling, which would give 2, 4, 8, 16.' }
    },
    {
      id: 'ns-02', battery: 'quantitative', subtest: 'number-series', b: -1.2,
      stem: { kind: 'series', values: [20, 17, 14, 11] },
      choices: [6, 7, 8, 9, 10],
      answer: 2,
      hint: 'The series is going down. By how much each step?',
      walkthrough: [
        { title: 'Find the gaps', text: '20 − 17 = 3, 17 − 14 = 3, 14 − 11 = 3. The series drops by 3 each time.' },
        { title: 'Continue', text: '11 − 3 = 8.' }
      ],
      why: { 4: 'That is −1; check the gaps between the earlier numbers.' }
    },
    {
      id: 'ns-03', battery: 'quantitative', subtest: 'number-series', b: -0.9,
      stem: { kind: 'series', values: [3, 6, 12, 24] },
      choices: [30, 36, 42, 48, 60],
      answer: 3,
      hint: 'The gaps are growing fast — try multiplication instead.',
      walkthrough: [
        { title: 'Check the gaps', text: '+3, +6, +12. The gaps are not equal, so it is not simple addition.' },
        { title: 'Check the ratios', text: '6 ÷ 3 = 2, 12 ÷ 6 = 2, 24 ÷ 12 = 2. Every number doubles.' },
        { title: 'Continue', text: '24 × 2 = 48.' }
      ],
      why: { 1: 'That is +12, repeating the previous gap instead of doubling.' }
    },
    {
      id: 'ns-04', battery: 'quantitative', subtest: 'number-series', b: -0.2,
      stem: { kind: 'series', values: [1, 4, 9, 16] },
      choices: [20, 23, 24, 25, 32],
      answer: 3,
      hint: 'These are all the result of multiplying a number by itself.',
      walkthrough: [
        { title: 'Check the gaps', text: '+3, +5, +7 — the gaps grow by 2 each time, so the next gap is +9.' },
        { title: 'Recognise the pattern', text: 'These are the square numbers: 1², 2², 3², 4². The next is 5².' },
        { title: 'Continue', text: 'Both routes agree: 16 + 9 = 25, and 5 × 5 = 25.' }
      ],
      why: { 2: 'That repeats the previous gap of +8, but the gaps are growing.', 4: 'That is doubling, which does not fit the earlier numbers.' }
    },
    {
      id: 'ns-05', battery: 'quantitative', subtest: 'number-series', b: 0.1,
      stem: { kind: 'series', values: [81, 27, 9, 3] },
      choices: [0, 1, 2, 6, 9],
      answer: 1,
      hint: 'The numbers shrink by the same factor each time.',
      walkthrough: [
        { title: 'Check the ratios', text: '81 ÷ 27 = 3, 27 ÷ 9 = 3, 9 ÷ 3 = 3. Each number is a third of the one before it.' },
        { title: 'Continue', text: '3 ÷ 3 = 1.' }
      ],
      why: { 0: 'Dividing by 3 never reaches 0.', 2: 'That is −1, but the pattern is division.' }
    },
    {
      id: 'ns-06', battery: 'quantitative', subtest: 'number-series', b: 0.5,
      stem: { kind: 'series', values: [2, 3, 5, 8, 12] },
      choices: [15, 16, 17, 18, 20],
      answer: 2,
      hint: 'The gaps themselves form a simple series.',
      walkthrough: [
        { title: 'Find the gaps', text: '+1, +2, +3, +4.' },
        { title: 'Read the gaps as their own series', text: 'They are counting up, so the next gap must be +5.' },
        { title: 'Continue', text: '12 + 5 = 17.' }
      ],
      why: { 1: 'That repeats the previous gap of +4 instead of growing it.', 3: 'That uses a gap of +6, skipping 5.' }
    },
    {
      id: 'ns-07', battery: 'quantitative', subtest: 'number-series', b: 0.7,
      stem: { kind: 'series', values: [1, 1, 2, 3, 5] },
      choices: [6, 7, 8, 9, 10],
      answer: 2,
      hint: 'Each number is built from the two numbers before it.',
      walkthrough: [
        { title: 'The gaps do not repeat', text: '+0, +1, +1, +2 — no constant gap and no constant ratio.' },
        { title: 'Try adding neighbours', text: '1 + 1 = 2, 1 + 2 = 3, 2 + 3 = 5. Each number is the sum of the previous two.' },
        { title: 'Continue', text: '3 + 5 = 8.' }
      ],
      why: { 0: 'That is +1, which does not match the growing gaps.', 4: 'That is doubling the last term.' }
    },
    {
      id: 'ns-08', battery: 'quantitative', subtest: 'number-series', b: 1.2,
      stem: { kind: 'series', values: [5, 11, 23, 47] },
      choices: [59, 71, 84, 94, 95],
      answer: 4,
      hint: 'Each number is a bit more than double the one before.',
      walkthrough: [
        { title: 'Check the ratios', text: '11 ÷ 5 = 2.2, 23 ÷ 11 ≈ 2.09 — close to doubling but not exact.' },
        { title: 'Try double plus something', text: '5 × 2 = 10, and 10 + 1 = 11. Test it: 11 × 2 + 1 = 23, and 23 × 2 + 1 = 47. The rule is ×2 then +1.' },
        { title: 'Continue', text: '47 × 2 = 94, and 94 + 1 = 95.' }
      ],
      why: { 2: 'That is 47 + 37, using the previous gap instead of the rule.', 3: 'That is doubling with the +1 forgotten — the most common slip.' }
    },
    {
      id: 'ns-09', battery: 'quantitative', subtest: 'number-series', b: 1.4,
      stem: { kind: 'series', values: [1, 2, 6, 24] },
      choices: [48, 72, 96, 120, 144],
      answer: 3,
      hint: 'The multiplier changes at every step.',
      walkthrough: [
        { title: 'Check the ratios', text: '2 ÷ 1 = 2, 6 ÷ 2 = 3, 24 ÷ 6 = 4. The multiplier is not fixed.' },
        { title: 'Read the multipliers as a series', text: 'They go 2, 3, 4 — counting up. The next multiplier is 5.' },
        { title: 'Continue', text: '24 × 5 = 120.' }
      ],
      why: { 0: 'That is ×2.', 2: 'That is ×4, repeating the previous multiplier instead of increasing it.', 4: 'That is ×6, skipping 5.' }
    },
    {
      id: 'ns-10', battery: 'quantitative', subtest: 'number-series', b: 1.8,
      stem: { kind: 'series', values: [64, 32, 48, 24, 36] },
      choices: [12, 18, 24, 48, 54],
      answer: 1,
      hint: 'Two different operations take turns.',
      walkthrough: [
        { title: 'The gaps alternate in direction', text: 'Down, up, down, up. A single rule cannot do that, so look for two rules taking turns.' },
        { title: 'Name the two rules', text: '64 → 32 is ÷2. 32 → 48 is ×1.5. 48 → 24 is ÷2. 24 → 36 is ×1.5. The pattern is ÷2, ×1.5, ÷2, ×1.5, …' },
        { title: 'Continue', text: 'The last step was ×1.5, so the next step is ÷2: 36 ÷ 2 = 18.' }
      ],
      why: { 2: 'That applies ×1.5 twice in a row — the operations alternate.', 3: 'That repeats an earlier value rather than continuing the alternation.', 4: 'That is ×1.5, but it is the ÷2 step’s turn.' }
    }
  ]);
})(typeof self !== 'undefined' ? self : this);

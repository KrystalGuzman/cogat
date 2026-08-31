const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const S = require('../src/scoring.js');

function items(n, b, battery, subtest) {
  return Array.from({ length: n }, (_, i) => ({
    id: `${subtest}-${i}`, battery, subtest, b,
    choices: [0, 1, 2, 3, 4], answer: 0
  }));
}

function answerAll(list, correctCount) {
  const answers = {};
  list.forEach((it, i) => { answers[it.id] = i < correctCount ? it.answer : 1; });
  return answers;
}

test('normCdf matches known normal values', () => {
  assert.ok(Math.abs(S.normCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(S.normCdf(1.6449) - 0.95) < 1e-4);
  assert.ok(Math.abs(S.normCdf(-1.96) - 0.025) < 1e-4);
});

test('3PL probability respects the guessing floor and is monotonic', () => {
  assert.ok(Math.abs(S.pCorrect(-99, 0, 1, 0.2) - 0.2) < 1e-6);
  assert.ok(S.pCorrect(99, 0, 1, 0.2) > 0.999);
  assert.ok(S.pCorrect(0.5, 0, 1, 0.2) > S.pCorrect(-0.5, 0, 1, 0.2));
  // At theta === b the curve sits halfway between the floor and 1.
  assert.ok(Math.abs(S.pCorrect(0, 0, 1, 0.2) - 0.6) < 1e-6);
});

test('theta estimate rises with the number of correct answers', () => {
  const params = { b: 0, a: 1, c: 0.2 };
  const mk = (n, k) => Array.from({ length: n }, (_, i) => ({ ...params, correct: i < k }));
  const low = S.estimateTheta(mk(20, 4)).theta;
  const mid = S.estimateTheta(mk(20, 10)).theta;
  const high = S.estimateTheta(mk(20, 18)).theta;
  assert.ok(low < mid && mid < high, `${low} < ${mid} < ${high}`);
});

test('the response pattern matters, not just the raw count', () => {
  // Same raw score of 3 out of 5, two different patterns of misses.
  const bs = [-2, -1, 0, 1, 2];
  const mk = flags => bs.map((b, i) => ({ b, a: 1, c: 0.2, correct: !!flags[i] }));
  const missedHardest = S.estimateTheta(mk([1, 1, 1, 0, 0])).theta;
  const missedEasiest = S.estimateTheta(mk([0, 0, 1, 1, 1])).theta;
  assert.notStrictEqual(missedHardest, missedEasiest);
  // With a guessing floor, a miss on an easy item is strong evidence of low
  // ability, while a hit on a very hard item is partly discounted as a guess.
  assert.ok(missedHardest > missedEasiest,
    `missing the hardest items (${missedHardest}) should beat missing the easiest (${missedEasiest})`);
});

test('without a guessing floor the model reduces to Rasch, where raw score is sufficient', () => {
  const easy = [{ b: -2, a: 1, c: 0, correct: true }, { b: 2, a: 1, c: 0, correct: false }];
  const hard = [{ b: -2, a: 1, c: 0, correct: false }, { b: 2, a: 1, c: 0, correct: true }];
  assert.ok(Math.abs(S.estimateTheta(hard).theta - S.estimateTheta(easy).theta) < 1e-6);
});

test('standard error shrinks as more items are answered', () => {
  const mk = n => Array.from({ length: n }, () => ({ b: 0, a: 1, c: 0.2, correct: true }));
  assert.ok(S.estimateTheta(mk(30)).se < S.estimateTheta(mk(5)).se);
});

test('scale conversions are anchored correctly', () => {
  assert.strictEqual(S.thetaToSAS(0), 100);
  assert.strictEqual(S.thetaToSAS(1), 116);
  assert.strictEqual(S.thetaToSAS(-1), 84);
  assert.strictEqual(S.thetaToSAS(99), 160, 'SAS is clamped at the top');
  assert.strictEqual(S.thetaToSAS(-99), 50, 'SAS is clamped at the bottom');
  assert.strictEqual(S.thetaToPercentile(0), 50);
});

test('stanine boundaries follow the standard percentile cuts', () => {
  assert.strictEqual(S.percentileToStanine(1), 1);
  assert.strictEqual(S.percentileToStanine(3), 1);
  assert.strictEqual(S.percentileToStanine(4), 2);
  assert.strictEqual(S.percentileToStanine(50), 5);
  assert.strictEqual(S.percentileToStanine(76), 6);
  assert.strictEqual(S.percentileToStanine(77), 7);
  assert.strictEqual(S.percentileToStanine(96), 9);
  assert.strictEqual(S.percentileToStanine(99), 9);
});

test('age norms penalise being older than the grade median', () => {
  const grade = 3;
  const median = S.medianAgeMonths(grade);
  assert.strictEqual(S.ageAdjust(1, grade, median), 1);
  assert.ok(S.ageAdjust(1, grade, median + 12) < 1, 'older than peers scores lower on age norms');
  assert.ok(S.ageAdjust(1, grade, median - 12) > 1, 'younger than peers scores higher on age norms');
});

test('omitted answers are scored as incorrect', () => {
  const list = items(6, 0, 'verbal', 'verbal-analogies');
  const scoredBlank = S.scoreBattery(list, {}, { grade: 3 });
  const scoredWrong = S.scoreBattery(list, answerAll(list, 0), { grade: 3 });
  assert.strictEqual(scoredBlank.raw, 0);
  assert.strictEqual(scoredBlank.attempted, 0);
  assert.strictEqual(scoredBlank.possible, 6);
  assert.strictEqual(scoredBlank.sas, scoredWrong.sas);
});

test('scoreBattery reports a confidence band around the SAS', () => {
  const list = items(10, 0, 'verbal', 'verbal-analogies');
  const s = S.scoreBattery(list, answerAll(list, 7), { grade: 3 });
  assert.ok(s.sasBand[0] < s.sas && s.sas < s.sasBand[1]);
  assert.strictEqual(s.percentCorrect, 70);
});

test('composite is re-standardized rather than a plain SAS average', () => {
  // Three identical battery thetas of +1 should give a composite above a single
  // battery's SAS, because averaging correlated scales narrows the spread.
  const batteries = {
    verbal: { thetaAge: 1 }, quantitative: { thetaAge: 1 }, nonverbal: { thetaAge: 1 }
  };
  const c = S.composite(batteries, 3);
  assert.strictEqual(c.batteriesIncluded, 3);
  assert.ok(c.sas > S.thetaToSAS(1), `${c.sas} should exceed ${S.thetaToSAS(1)}`);
  assert.ok(c.sas < S.thetaToSAS(1.2));
});

test('composite handles a single battery without inflating it', () => {
  const c = S.composite({ verbal: { thetaAge: 1 } }, 3);
  assert.strictEqual(c.batteriesIncluded, 1);
  assert.strictEqual(c.sas, S.thetaToSAS(1));
});

test('ability profile: level scores give an A profile', () => {
  const p = S.abilityProfile({
    verbal: { sas: 110, stanine: 6 },
    quantitative: { sas: 112, stanine: 6 },
    nonverbal: { sas: 109, stanine: 6 }
  });
  assert.strictEqual(p.letter, 'A');
  assert.strictEqual(p.medianStanine, 6);
  assert.strictEqual(p.marks.length, 0);
  assert.strictEqual(p.label, '6A');
});

test('ability profile: one battery apart gives a B profile with a direction', () => {
  const p = S.abilityProfile({
    verbal: { sas: 128, stanine: 8 },
    quantitative: { sas: 110, stanine: 6 },
    nonverbal: { sas: 112, stanine: 6 }
  });
  assert.strictEqual(p.letter, 'B');
  assert.strictEqual(p.marks.length, 1);
  assert.strictEqual(p.marks[0].code, 'V+');
  assert.strictEqual(p.label, '6B (V+)');
});

test('ability profile: a strength plus a weakness gives a C profile', () => {
  const p = S.abilityProfile({
    verbal: { sas: 120, stanine: 8 },
    quantitative: { sas: 112, stanine: 7 },
    nonverbal: { sas: 104, stanine: 5 }
  });
  assert.strictEqual(p.letter, 'C');
  assert.ok(p.marks.some(m => m.code === 'V+'));
  assert.ok(p.marks.some(m => m.code === 'N-'));
});

test('ability profile: a 24-point spread gives an E profile', () => {
  const p = S.abilityProfile({
    verbal: { sas: 130, stanine: 9 },
    quantitative: { sas: 115, stanine: 7 },
    nonverbal: { sas: 100, stanine: 5 }
  });
  assert.strictEqual(p.letter, 'E');
  assert.strictEqual(p.spread, 30);
  assert.strictEqual(p.medianStanine, 7);
});

test('ability profile needs all three batteries', () => {
  const p = S.abilityProfile({ verbal: { sas: 110, stanine: 6 } });
  assert.strictEqual(p.available, false);
  assert.ok(p.reason.includes('three batteries'));
});

test('scoreSession splits by battery and totals correctly', () => {
  const list = [
    ...items(4, 0, 'verbal', 'verbal-analogies'),
    ...items(4, 0, 'quantitative', 'number-series'),
    ...items(4, 0, 'nonverbal', 'figure-matrices')
  ];
  const answers = {};
  list.forEach((it, i) => { answers[it.id] = i % 2 === 0 ? it.answer : 1; });

  const r = S.scoreSession({ items: list, answers, grade: 3, ageMonths: 102 });
  assert.deepStrictEqual(Object.keys(r.batteries).sort(), ['nonverbal', 'quantitative', 'verbal']);
  assert.strictEqual(r.totals.possible, 12);
  assert.strictEqual(r.totals.raw, 6);
  assert.strictEqual(r.subtests.length, 3);
  assert.ok(r.composite);
  assert.strictEqual(r.profile.available, true);
});

test('a perfect session outscores a failed one end to end', () => {
  const list = [
    ...items(4, 0, 'verbal', 'verbal-analogies'),
    ...items(4, 0, 'quantitative', 'number-series'),
    ...items(4, 0, 'nonverbal', 'figure-matrices')
  ];
  const perfect = {}, failed = {};
  list.forEach(it => { perfect[it.id] = it.answer; failed[it.id] = 1; });

  const hi = S.scoreSession({ items: list, answers: perfect, grade: 3 });
  const lo = S.scoreSession({ items: list, answers: failed, grade: 3 });
  assert.ok(hi.composite.sas > lo.composite.sas);
  assert.ok(hi.composite.apr > lo.composite.apr);
  assert.ok(hi.composite.stanine >= lo.composite.stanine);
});

test('subtestBreakdown records which items were missed', () => {
  const list = items(3, 0, 'verbal', 'verbal-analogies');
  const rows = S.subtestBreakdown(list, { [list[0].id]: 0 });
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].raw, 1);
  assert.strictEqual(rows[0].missedIds.length, 2);
});

test('USS separates grades that share the same ability estimate', () => {
  assert.ok(S.thetaToUSS(0, 8) > S.thetaToUSS(0, 3));
  assert.ok(S.thetaToUSS(1, 3) > S.thetaToUSS(0, 3));
});

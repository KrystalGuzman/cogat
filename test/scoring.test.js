const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const S = require('../src/scoring.js');

const G3 = Levels.gradeNorm(3);
const G8 = Levels.gradeNorm(8);

function items(n, b, battery, subtest) {
  return Array.from({ length: n }, (_, i) => ({
    id: `${subtest}-${i}`, battery, subtest, b, choices: [0, 1, 2, 3, 4], answer: 0
  }));
}

test('normCdf matches known normal values', () => {
  assert.ok(Math.abs(S.normCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(S.normCdf(1.6449) - 0.95) < 1e-4);
  assert.ok(Math.abs(S.normCdf(-1.96) - 0.025) < 1e-4);
});

test('3PL respects the guessing floor and is monotonic', () => {
  assert.ok(Math.abs(S.pCorrect(-99, 0, 1, 0.2) - 0.2) < 1e-6);
  assert.ok(S.pCorrect(99, 0, 1, 0.2) > 0.999);
  assert.ok(S.pCorrect(0.5, 0, 1, 0.2) > S.pCorrect(-0.5, 0, 1, 0.2));
  assert.ok(Math.abs(S.pCorrect(0, 0, 1, 0.2) - 0.6) < 1e-6);
});

test('item information peaks near the item difficulty', () => {
  const at = b => S.itemInformation(b, 0, 1, 0.2);
  assert.ok(at(0.3) > at(2), 'an item is most informative near its own difficulty');
  assert.ok(at(0.3) > at(-2));
});

test('the prior anchors the estimate to the right norm group', () => {
  const responses = Array.from({ length: 10 }, () => ({ b: 0, a: 1, c: 0.2, correct: true }));
  const low = S.estimateTheta(responses, G3).theta;
  const high = S.estimateTheta(responses, G8).theta;
  assert.ok(high > low, 'an older norm group pulls the estimate up');
});

test('theta rises with the number of correct answers', () => {
  const mk = (n, k) => Array.from({ length: n }, (_, i) => ({ b: G3.mean, a: 1, c: 0.2, correct: i < k }));
  const a = S.estimateTheta(mk(20, 4), G3).theta;
  const b = S.estimateTheta(mk(20, 10), G3).theta;
  const c = S.estimateTheta(mk(20, 18), G3).theta;
  assert.ok(a < b && b < c, `${a} < ${b} < ${c}`);
});

test('standard error shrinks as more items are answered', () => {
  const mk = n => Array.from({ length: n }, () => ({ b: G3.mean, a: 1, c: 0.2, correct: true }));
  assert.ok(S.estimateTheta(mk(60), G3).se < S.estimateTheta(mk(10), G3).se);
});

test('the response pattern matters, not just the raw count', () => {
  const bs = [-3, -2, -1, 0, 1];
  const mk = flags => bs.map((b, i) => ({ b, a: 1, c: 0.2, correct: !!flags[i] }));
  const missedHardest = S.estimateTheta(mk([1, 1, 1, 0, 0]), G3).theta;
  const missedEasiest = S.estimateTheta(mk([0, 0, 1, 1, 1]), G3).theta;
  assert.notStrictEqual(missedHardest, missedEasiest);
  assert.ok(missedHardest > missedEasiest,
    'with a guessing floor, missing easy items is the stronger evidence of low ability');
});

test('SAS is relative to the norm group, so grade changes the score', () => {
  // The same ability is average for grade 3 and well below average for grade 8.
  assert.strictEqual(S.thetaToSAS(G3.mean, G3), 100);
  assert.ok(S.thetaToSAS(G3.mean, G8) < 80);
  assert.strictEqual(S.thetaToSAS(G3.mean + 1, G3), 116);
  assert.strictEqual(S.thetaToSAS(G3.mean - 1, G3), 84);
  assert.strictEqual(S.thetaToSAS(99, G3), 160, 'clamped at the top');
  assert.strictEqual(S.thetaToSAS(-99, G3), 50, 'clamped at the bottom');
});

test('USS is absolute and does not depend on the norm group', () => {
  assert.strictEqual(S.thetaToUSS(G3.mean), S.thetaToUSS(G3.mean));
  assert.ok(S.thetaToUSS(G8.mean) > S.thetaToUSS(G3.mean),
    'an older grade median sits higher on the cross-grade scale');
  assert.ok(S.thetaToUSS(1) > S.thetaToUSS(0));
});

test('stanine boundaries follow the standard percentile cuts', () => {
  assert.strictEqual(S.percentileToStanine(1), 1);
  assert.strictEqual(S.percentileToStanine(3), 1);
  assert.strictEqual(S.percentileToStanine(4), 2);
  assert.strictEqual(S.percentileToStanine(50), 5);
  assert.strictEqual(S.percentileToStanine(76), 6);
  assert.strictEqual(S.percentileToStanine(77), 7);
  assert.strictEqual(S.percentileToStanine(96), 9);
});

test('age norms interpolate the same growth curve as grade norms', () => {
  const atGrade3Age = S.ageNorm(S.medianAgeMonths(3));
  assert.ok(Math.abs(atGrade3Age.mean - G3.mean) < 1e-9);
  assert.ok(S.ageNorm(S.medianAgeMonths(3) + 12).mean > atGrade3Age.mean,
    'a year older is measured against a higher-ability peer group');
});

test('age and grade percentiles diverge for a student off-age for their grade', () => {
  const list = items(12, Levels.gradeNorm(3).mean, 'verbal', 'verbal-analogies');
  const answers = {};
  list.forEach((it, i) => { answers[it.id] = i < 9 ? it.answer : 1; });

  const onAge = S.scoreSession({ items: list, answers, grade: 3, ageMonths: S.medianAgeMonths(3) });
  const old = S.scoreSession({ items: list, answers, grade: 3, ageMonths: S.medianAgeMonths(3) + 18 });

  assert.strictEqual(onAge.batteries.verbal.apr, onAge.batteries.verbal.gpr,
    'a student exactly at the grade median age gets matching percentiles');
  assert.ok(old.batteries.verbal.apr < old.batteries.verbal.gpr,
    'an older student compares worse against age peers than grade peers');
});

test('omitted answers are scored as incorrect', () => {
  const list = items(10, G3.mean, 'verbal', 'verbal-analogies');
  const norms = S.normsFor(3, S.medianAgeMonths(3));
  const blank = S.scoreBattery(list, {}, norms);
  const wrong = S.scoreBattery(list, Object.fromEntries(list.map(i => [i.id, 1])), norms);
  assert.strictEqual(blank.raw, 0);
  assert.strictEqual(blank.attempted, 0);
  assert.strictEqual(blank.sas, wrong.sas);
});

test('scoreBattery reports a confidence band and an SAS-scaled error', () => {
  const list = items(20, G3.mean, 'verbal', 'verbal-analogies');
  const answers = {};
  list.forEach((it, i) => { answers[it.id] = i < 14 ? it.answer : 1; });
  const s = S.scoreBattery(list, answers, S.normsFor(3, S.medianAgeMonths(3)));
  assert.ok(s.sasBand[0] < s.sas && s.sas < s.sasBand[1]);
  assert.ok(s.seSAS > 0 && s.seSAS < 30);
  assert.strictEqual(s.percentCorrect, 70);
});

test('composite is re-standardized rather than a plain average', () => {
  const norms = S.normsFor(3, S.medianAgeMonths(3));
  const t = G3.mean + 1;
  const c = S.composite({ verbal: { theta: t }, quantitative: { theta: t }, nonverbal: { theta: t } }, norms);
  assert.strictEqual(c.batteriesIncluded, 3);
  assert.ok(c.sas > S.thetaToSAS(t, norms.age), 'averaging correlated scales narrows the spread');
  assert.ok(c.sas < S.thetaToSAS(t + 0.25, norms.age));
});

test('composite of a single battery is not inflated', () => {
  const norms = S.normsFor(3, S.medianAgeMonths(3));
  const c = S.composite({ verbal: { theta: G3.mean + 1 } }, norms);
  assert.strictEqual(c.batteriesIncluded, 1);
  assert.strictEqual(c.sas, S.thetaToSAS(G3.mean + 1, norms.age));
});

// ------------------------------------------------------------- profiles ---

function battery(sas, seSAS, stanine) { return { sas, seSAS, stanine }; }

test('ability profile: level scores give an A profile', () => {
  const p = S.abilityProfile({
    verbal: battery(110, 5, 6), quantitative: battery(112, 5, 6), nonverbal: battery(109, 5, 6)
  });
  assert.strictEqual(p.letter, 'A');
  assert.strictEqual(p.marks.length, 0);
  assert.strictEqual(p.label, '6A');
  assert.ok(p.minDetectableDiff > 0, 'the report says how small a gap it could have detected');
});

test('ability profile: a difference inside measurement error is NOT called out', () => {
  // An 8-point gap used to be flagged by a fixed threshold. With a real standard
  // error of 6 SAS points it is well inside noise and must stay silent.
  const p = S.abilityProfile({
    verbal: battery(114, 6, 7), quantitative: battery(106, 6, 6), nonverbal: battery(106, 6, 6)
  });
  assert.strictEqual(p.letter, 'A', 'a gap smaller than measurement error is not a strength');
});

test('ability profile: a difference beyond measurement error gives B', () => {
  const p = S.abilityProfile({
    verbal: battery(120, 3, 8), quantitative: battery(110, 3, 6), nonverbal: battery(110, 3, 6)
  });
  assert.strictEqual(p.letter, 'B');
  assert.ok(p.spread < S.EXTREME_SAS_SPREAD, 'this fixture stays below the extreme threshold');
  assert.strictEqual(p.marks.length, 1);
  assert.strictEqual(p.marks[0].code, 'V+');
  assert.ok(p.marks[0].threshold > 0);
});

test('ability profile: precision changes what counts as significant', () => {
  const scores = { v: 120, q: 110, n: 110 };
  const precise = S.abilityProfile({
    verbal: battery(scores.v, 3, 8), quantitative: battery(scores.q, 3, 6), nonverbal: battery(scores.n, 3, 6)
  });
  const noisy = S.abilityProfile({
    verbal: battery(scores.v, 12, 8), quantitative: battery(scores.q, 12, 6), nonverbal: battery(scores.n, 12, 6)
  });
  assert.strictEqual(precise.letter, 'B', 'a precise test can resolve this gap');
  assert.strictEqual(noisy.letter, 'A', 'the same gap on a noisy test cannot be resolved');
  assert.ok(noisy.minDetectableDiff > precise.minDetectableDiff);
});

test('ability profile: a strength plus a weakness gives C', () => {
  const p = S.abilityProfile({
    verbal: battery(120, 4, 8), quantitative: battery(110, 4, 7), nonverbal: battery(100, 4, 5)
  });
  assert.strictEqual(p.letter, 'C');
  assert.ok(p.spread < S.EXTREME_SAS_SPREAD, 'a contrast that stops short of an extreme spread');
  assert.ok(p.marks.some(m => m.code === 'V+'));
  assert.ok(p.marks.some(m => m.code === 'N-'));
});

test('ability profile: a wide, significant spread gives E', () => {
  const p = S.abilityProfile({
    verbal: battery(132, 4, 9), quantitative: battery(112, 4, 7), nonverbal: battery(100, 4, 5)
  });
  assert.strictEqual(p.letter, 'E');
  assert.ok(p.spread >= S.EXTREME_SAS_SPREAD);
});

test('ability profile: a wide spread that is all noise is not called E', () => {
  const p = S.abilityProfile({
    verbal: battery(132, 20, 9), quantitative: battery(112, 20, 7), nonverbal: battery(100, 20, 5)
  });
  assert.strictEqual(p.letter, 'A', 'a spread the test cannot resolve is not an extreme profile');
});

test('ability profile needs all three batteries', () => {
  const p = S.abilityProfile({ verbal: battery(110, 5, 6) });
  assert.strictEqual(p.available, false);
  assert.ok(p.reason.includes('three batteries'));
});

test('scoreSession splits by battery and carries the level through', () => {
  const list = [
    ...items(6, G3.mean, 'verbal', 'verbal-analogies'),
    ...items(6, G3.mean, 'quantitative', 'number-series'),
    ...items(6, G3.mean, 'nonverbal', 'figure-matrices')
  ];
  const answers = {};
  list.forEach((it, i) => { answers[it.id] = i % 2 === 0 ? it.answer : 1; });

  const r = S.scoreSession({ items: list, answers, grade: 3, ageMonths: 102, level: '9', form: 'upper' });
  assert.deepStrictEqual(Object.keys(r.batteries).sort(), ['nonverbal', 'quantitative', 'verbal']);
  assert.strictEqual(r.totals.possible, 18);
  assert.strictEqual(r.totals.raw, 9);
  assert.strictEqual(r.level, '9');
  assert.strictEqual(r.form, 'upper');
  assert.ok(r.composite);
  assert.strictEqual(r.profile.available, true);
});

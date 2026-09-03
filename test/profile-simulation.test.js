/*
 * The ability profile is the most actionable-looking thing on the report, so it
 * is the easiest thing to get wrong: a short test will happily report strengths
 * and weaknesses that are pure noise. These tests simulate students with known
 * true abilities and check that the profile reports what is really there.
 *
 * They also pin the operating point documented against PROFILE_Z in scoring.js.
 * If the significance rule, the item pools, or the form lengths drift enough to
 * move these rates, that is a real change in what the report claims and should
 * be a deliberate decision rather than a silent one.
 */
const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const S = require('../src/scoring.js');
const Bank = require('../src/bank/index.js');

const GRADE = 3;
const level = Levels.levelForGrade(GRADE);
const items = Levels.buildTest(level, Bank).sections.flatMap(s => s.items);
const norm = Levels.gradeNorm(GRADE);
const AGE = S.medianAgeMonths(GRADE);
const N = 1500;

function makeRng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

/** Simulate one student whose true ability differs per battery. */
function simulate(rnd, offsets) {
  const answers = {};
  for (const it of items) {
    const theta = norm.mean + (offsets[it.battery] || 0);
    const c = 1 / it.choices.length;
    answers[it.id] = rnd() < S.pCorrect(theta, it.b, 1, c) ? it.answer : (it.answer + 1) % it.choices.length;
  }
  return S.scoreSession({ items, answers, grade: GRADE, ageMonths: AGE });
}

function tally(seed, offsets) {
  const rnd = makeRng(seed);
  const letters = {};
  const sas = [];
  for (let i = 0; i < N; i++) {
    const r = simulate(rnd, offsets);
    letters[r.profile.letter] = (letters[r.profile.letter] || 0) + 1;
    sas.push(r.batteries.verbal.sas);
  }
  const mean = sas.reduce((a, b) => a + b, 0) / N;
  const sd = Math.sqrt(sas.reduce((a, b) => a + (b - mean) ** 2, 0) / N);
  return { letters, mean, sd, rate: k => (letters[k] || 0) / N };
}

test('a student with genuinely level abilities is rarely told otherwise', () => {
  const t = tally(20240101, { verbal: 0, quantitative: 0, nonverbal: 0 });
  assert.ok(t.rate('A') >= 0.85,
    `only ${(t.rate('A') * 100).toFixed(0)}% of level students were correctly reported as "A"`);
  assert.ok(t.rate('E') <= 0.03,
    `${(t.rate('E') * 100).toFixed(0)}% of level students got a spurious "extreme difference" profile`);
});

test('a real difference is detected more often than not', () => {
  const t = tally(20240202, { verbal: 1.0, quantitative: 0, nonverbal: 0 });
  const detected = 1 - t.rate('A');
  assert.ok(detected >= 0.5,
    `a true one-SD verbal strength was detected only ${(detected * 100).toFixed(0)}% of the time`);
  // When it is detected it should be pointing at the verbal battery.
  const rnd = makeRng(3);
  let flagged = 0, verbalFlagged = 0;
  for (let i = 0; i < 300; i++) {
    const p = simulate(rnd, { verbal: 1.0, quantitative: 0, nonverbal: 0 }).profile;
    if (p.marks.length) {
      flagged++;
      if (p.marks.some(m => m.battery === 'verbal' && m.direction === 'strength')) verbalFlagged++;
    }
  }
  assert.ok(verbalFlagged / flagged > 0.9,
    `when a difference is flagged it should name the verbal battery, but only ${verbalFlagged}/${flagged} did`);
});

test('the report is precise enough to be worth reading', () => {
  const t = tally(20240303, { verbal: 0, quantitative: 0, nonverbal: 0 });
  assert.ok(Math.abs(t.mean - 100) < 3, `average student should score near 100, got ${t.mean.toFixed(1)}`);
  assert.ok(t.sd <= 7,
    `re-test spread of ±${t.sd.toFixed(1)} SAS is too wide for the scores to mean much`);
});

test('the scale does not run out of headroom for a strong student', () => {
  const answers = {};
  items.forEach(i => { answers[i.id] = i.answer; });
  const perfect = S.scoreSession({ items, answers, grade: GRADE, ageMonths: AGE });
  assert.ok(perfect.composite.sas >= 150,
    `a perfect score should reach the top of the scale, got ${perfect.composite.sas}`);

  // And the top of the range still separates students rather than flattening.
  const near = {};
  items.forEach((it, n) => { near[it.id] = n % 12 === 0 ? (it.answer + 1) % 5 : it.answer; });
  const strong = S.scoreSession({ items, answers: near, grade: GRADE, ageMonths: AGE });
  assert.ok(perfect.composite.sas - strong.composite.sas >= 5,
    'near-perfect and perfect should be distinguishable, not both pinned to the ceiling');
});

test('a weak student is separated from the floor too', () => {
  const rnd = makeRng(7);
  const low = simulate(rnd, { verbal: -1.5, quantitative: -1.5, nonverbal: -1.5 });
  const mid = simulate(rnd, { verbal: 0, quantitative: 0, nonverbal: 0 });
  assert.ok(low.composite.sas < mid.composite.sas - 15);
  assert.ok(low.composite.sas > 50, 'a weak student should not simply hit the floor');
});

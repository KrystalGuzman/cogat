const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const Bank = require('../src/bank/index.js');

test('every grade maps to exactly one level', () => {
  const seen = new Set();
  for (let g = 0; g <= 12; g++) {
    const lv = Levels.levelForGrade(g);
    assert.ok(lv, `grade ${g} has no level`);
    assert.ok(lv.grades.includes(g));
    seen.add(lv.id);
  }
  assert.strictEqual(seen.size, Levels.LEVELS.length, 'every level is reachable from some grade');
});

test('grades K-2 get the picture-based primary form, grade 3 up gets the upper form', () => {
  [0, 1, 2].forEach(g => assert.strictEqual(Levels.levelForGrade(g).form, 'primary', `grade ${g}`));
  for (let g = 3; g <= 12; g++) {
    assert.strictEqual(Levels.levelForGrade(g).form, 'upper', `grade ${g}`);
  }
});

test('ability grows monotonically across the grades', () => {
  for (let g = 1; g <= 12; g++) {
    assert.ok(Levels.GRADE_MEAN[g] > Levels.GRADE_MEAN[g - 1],
      `grade ${g} mean should exceed grade ${g - 1}`);
  }
});

test('form composition matches the published shape of the real test', () => {
  const upper = Levels.FORMS.upper;
  const primary = Levels.FORMS.primary;
  assert.strictEqual(upper.sections.length, 9, 'nine subtests');
  assert.strictEqual(primary.sections.length, 9);
  assert.strictEqual(upper.sections.reduce((n, s) => n + s.items, 0), 176);
  assert.strictEqual(primary.sections.reduce((n, s) => n + s.items, 0), 118);

  ['verbal', 'quantitative', 'nonverbal'].forEach(b => {
    assert.strictEqual(upper.sections.filter(s => s.battery === b).length, 3, `${b} has three subtests`);
    assert.strictEqual(primary.sections.filter(s => s.battery === b).length, 3);
  });

  upper.sections.forEach(s => {
    assert.ok(s.timeSec > 0, `${s.subtest} must be timed on the upper form`);
    assert.ok(s.practice > 0, `${s.subtest} must have practice items`);
  });
  primary.sections.forEach(s => {
    assert.strictEqual(s.timeSec, null, `${s.subtest} is teacher-paced on the primary form`);
  });
});

test('the primary form uses picture subtests and the upper form uses verbal ones', () => {
  const primarySubtests = Levels.FORMS.primary.sections.map(s => s.subtest);
  const upperSubtests = Levels.FORMS.upper.sections.map(s => s.subtest);
  assert.ok(primarySubtests.includes('picture-analogies'));
  assert.ok(primarySubtests.includes('picture-classification'));
  assert.ok(!primarySubtests.includes('verbal-analogies'));
  assert.ok(upperSubtests.includes('verbal-analogies'));
  assert.ok(upperSubtests.includes('verbal-classification'));
  assert.ok(!upperSubtests.includes('picture-analogies'));
});

test('every level assembles a complete test with no shortfalls', () => {
  for (const lv of Levels.LEVELS) {
    const t = Levels.buildTest(lv, Bank);
    assert.deepStrictEqual(t.shortfalls, [], `level ${lv.id} is short of items`);
    assert.strictEqual(t.totalItems, t.targetItems, `level ${lv.id} wrong length`);
    assert.strictEqual(t.sessions.length, 3, `level ${lv.id} should have three sessions`);
    t.sections.forEach(sec => {
      assert.ok(sec.practice.length > 0, `${lv.id}/${sec.subtest} has no practice items`);
      const ids = new Set(sec.items.map(i => i.id));
      assert.strictEqual(ids.size, sec.items.length, `${lv.id}/${sec.subtest} repeats an item`);
      assert.ok(sec.items.every(i => !i.practice), `${lv.id}/${sec.subtest} scored a practice item`);
    });
  }
});

test('levels are genuinely different tests, not the same items rescored', () => {
  const idsFor = lv => new Set(Levels.buildTest(lv, Bank).sections.flatMap(s => s.items.map(i => i.id)));
  const low = idsFor(Levels.levelById('9'));
  const high = idsFor(Levels.levelById('17/18'));
  const shared = [...low].filter(id => high.has(id)).length;
  assert.ok(shared < low.size * 0.75,
    `levels 9 and 17/18 share ${shared}/${low.size} items — they should differ substantially`);

  // Adjacent levels overlap heavily, as leveled forms do.
  const nine = idsFor(Levels.levelById('9'));
  const ten = idsFor(Levels.levelById('10'));
  const adjacent = [...nine].filter(id => ten.has(id)).length;
  assert.ok(adjacent > nine.size * 0.5, 'adjacent levels should share most items');
});

test('each level targets its own ability range', () => {
  let previous = -Infinity;
  for (const lv of Levels.LEVELS) {
    const items = Levels.buildTest(lv, Bank).sections.flatMap(s => s.items);
    const mean = items.reduce((n, i) => n + i.b, 0) / items.length;
    assert.ok(mean > previous, `level ${lv.id} should be harder than the one below it`);
    assert.ok(Math.abs(mean - lv.center) < 0.5,
      `level ${lv.id} mean difficulty ${mean.toFixed(2)} strays from its centre ${lv.center}`);
    previous = mean;
  }
});

test('selectItems returns a difficulty-ordered selection centred on the target', () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ id: 'x' + i, b: -3 + i * 0.15 }));
  const picked = Levels.selectItems(pool, 0, 10);
  assert.strictEqual(picked.length, 10);
  for (let i = 1; i < picked.length; i++) {
    assert.ok(picked[i].b >= picked[i - 1].b, 'items run easiest first');
  }
  const mean = picked.reduce((n, i) => n + i.b, 0) / picked.length;
  assert.ok(Math.abs(mean) < 0.4, `selection should centre near 0, got ${mean}`);
  assert.strictEqual(new Set(picked.map(i => i.id)).size, 10, 'no repeats');
});

test('selectItems degrades gracefully when the pool is too small', () => {
  const pool = [{ id: 'a', b: 0 }, { id: 'b', b: 1 }];
  assert.strictEqual(Levels.selectItems(pool, 0, 10).length, 2);
});

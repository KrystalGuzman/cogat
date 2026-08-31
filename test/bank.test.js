const test = require('node:test');
const assert = require('node:assert');

global.self = global;
global.Figures = require('../src/figures.js');
require('../src/bank/verbal.js');
require('../src/bank/quantitative.js');
require('../src/bank/nonverbal.js');

const bank = global.CogatBank;
const BATTERIES = ['verbal', 'quantitative', 'nonverbal'];

test('every subtest belongs to a known battery and carries teaching copy', () => {
  const ids = Object.keys(bank.subtests);
  assert.strictEqual(ids.length, 9, 'nine subtests, three per battery');
  for (const id of ids) {
    const s = bank.subtests[id];
    assert.strictEqual(s.id, id);
    assert.ok(BATTERIES.includes(s.battery), `${id} has battery ${s.battery}`);
    assert.ok(s.name && s.blurb && s.directions, `${id} is missing copy`);
    assert.ok(Array.isArray(s.strategy) && s.strategy.length >= 2, `${id} needs strategy tips`);
    assert.ok(s.timePerItemSec > 0);
  }
  for (const b of BATTERIES) {
    const count = ids.filter(id => bank.subtests[id].battery === b).length;
    assert.strictEqual(count, 3, `${b} should have three subtests`);
  }
});

test('every item is well formed', () => {
  const seen = new Set();
  for (const item of bank.items) {
    assert.ok(item.id, 'item needs an id');
    assert.ok(!seen.has(item.id), `duplicate item id ${item.id}`);
    seen.add(item.id);

    const meta = bank.subtests[item.subtest];
    assert.ok(meta, `${item.id} references unknown subtest ${item.subtest}`);
    assert.strictEqual(item.battery, meta.battery, `${item.id} battery disagrees with its subtest`);

    assert.ok(Array.isArray(item.choices) && item.choices.length >= 4, `${item.id} needs at least four choices`);
    assert.ok(Number.isInteger(item.answer), `${item.id} answer must be an index`);
    assert.ok(item.answer >= 0 && item.answer < item.choices.length, `${item.id} answer is out of range`);

    assert.strictEqual(typeof item.b, 'number', `${item.id} needs a difficulty`);
    assert.ok(item.b >= -3 && item.b <= 3, `${item.id} difficulty ${item.b} is out of range`);

    assert.ok(item.stem && item.stem.kind, `${item.id} needs a stem`);
    assert.ok(Array.isArray(item.walkthrough) && item.walkthrough.length >= 2,
      `${item.id} needs a multi-step walkthrough`);
    for (const step of item.walkthrough) {
      assert.ok(step.title && step.text, `${item.id} has an incomplete walkthrough step`);
    }
    assert.ok(item.hint, `${item.id} needs a hint`);
  }
});

test('distractor explanations point at real, wrong choices', () => {
  for (const item of bank.items) {
    if (!item.why) continue;
    for (const key of Object.keys(item.why)) {
      const idx = Number(key);
      assert.ok(Number.isInteger(idx) && idx >= 0 && idx < item.choices.length,
        `${item.id} explains a non-existent choice ${key}`);
      assert.notStrictEqual(idx, item.answer,
        `${item.id} explains away its own correct answer`);
      assert.ok(item.why[key].length > 10, `${item.id} choice ${key} needs a real explanation`);
    }
  }
});

test('text choices within an item are distinct', () => {
  for (const item of bank.items) {
    const textual = item.choices.filter(c => typeof c !== 'object');
    if (!textual.length) continue;
    const set = new Set(textual.map(String));
    assert.strictEqual(set.size, textual.length, `${item.id} repeats an answer choice`);
  }
});

test('each subtest spans a useful range of difficulty', () => {
  for (const id of Object.keys(bank.subtests)) {
    const items = bank.items.filter(i => i.subtest === id);
    assert.ok(items.length >= 6, `${id} has only ${items.length} items`);
    const bs = items.map(i => i.b);
    assert.ok(Math.max(...bs) - Math.min(...bs) >= 1.5,
      `${id} difficulty range is too narrow`);
  }
});

test('figure items build renderable specs', () => {
  const figureItems = bank.items.filter(i => i.battery === 'nonverbal');
  assert.ok(figureItems.length >= 18);

  const walk = spec => {
    assert.ok(spec && Array.isArray(spec.items), 'figure needs an items array');
    for (const shape of spec.items) {
      assert.ok(typeof shape.t === 'string', 'every shape needs a type');
    }
  };

  for (const item of figureItems) {
    for (const choice of item.choices) {
      assert.ok(choice.fig, `${item.id} nonverbal choices must be figures`);
      walk(choice.fig);
    }
    const s = item.stem;
    if (s.kind === 'matrix') {
      assert.ok(s.cols >= 2);
      assert.strictEqual(s.cells.filter(c => c === null).length, 1, `${item.id} needs exactly one empty cell`);
      assert.strictEqual(s.cells.length % s.cols, 0, `${item.id} grid is ragged`);
      s.cells.filter(Boolean).forEach(walk);
    } else if (s.kind === 'figClass') {
      assert.strictEqual(s.given.length, 3);
      s.given.forEach(walk);
    } else if (s.kind === 'figSeq') {
      assert.ok(s.figs.length >= 2);
      s.figs.forEach(p => walk(p.fig));
    } else {
      assert.fail(`${item.id} has unexpected stem kind ${s.kind}`);
    }
  }
});

test('paper-folding answers have a plausible hole count', () => {
  for (const item of bank.items.filter(i => i.subtest === 'paper-folding')) {
    const holes = item.choices[item.answer].fig.items.filter(s => s.t === 'dot').length;
    const folds = item.stem.figs.length - 1;
    assert.ok(holes >= 1 && holes <= Math.pow(2, folds) * 2,
      `${item.id} unfolds to ${holes} holes after ${folds} fold step(s)`);
  }
});

test('the full test is scoreable end to end with real items', () => {
  const S = require('../src/scoring.js');
  const answers = {};
  bank.items.forEach(i => { answers[i.id] = i.answer; });

  const perfect = S.scoreSession({ items: bank.items, answers, grade: 3, ageMonths: 102 });
  assert.strictEqual(perfect.totals.raw, bank.items.length);
  assert.ok(perfect.composite.sas > 130, `perfect run should be well above average, got ${perfect.composite.sas}`);
  assert.strictEqual(perfect.profile.available, true);
  assert.strictEqual(perfect.subtests.length, 9);

  const blank = S.scoreSession({ items: bank.items, answers: {}, grade: 3, ageMonths: 102 });
  assert.strictEqual(blank.totals.raw, 0);
  assert.ok(blank.composite.sas < 70);
});

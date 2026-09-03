const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const Figures = require('../src/figures.js');
const Pictograms = require('../src/pictograms.js');
const Bank = require('../src/bank/index.js');

const BATTERIES = ['verbal', 'quantitative', 'nonverbal'];
const scored = Bank.items.filter(i => !i.practice);
const practice = Bank.items.filter(i => i.practice);

test('every subtest is described and belongs to a real battery and form', () => {
  const ids = Object.keys(Bank.subtests);
  assert.strictEqual(ids.length, 11, 'eleven subtest types across the two forms');
  for (const id of ids) {
    const s = Bank.subtests[id];
    assert.strictEqual(s.id, id);
    assert.ok(BATTERIES.includes(s.battery), `${id} has battery ${s.battery}`);
    assert.ok(s.name && s.blurb && s.directions, `${id} is missing copy`);
    assert.ok(Array.isArray(s.strategy) && s.strategy.length >= 2, `${id} needs strategy tips`);
    assert.ok(Array.isArray(s.forms) && s.forms.length, `${id} belongs to no form`);
    s.forms.forEach(f => assert.ok(Levels.FORMS[f], `${id} references unknown form ${f}`));
  }
});

test('every form section has a matching subtest definition', () => {
  Object.values(Levels.FORMS).forEach(form => {
    form.sections.forEach(sec => {
      const meta = Bank.subtests[sec.subtest];
      assert.ok(meta, `${form.id} references unknown subtest ${sec.subtest}`);
      assert.strictEqual(meta.battery, sec.battery, `${sec.subtest} battery mismatch`);
      assert.ok(meta.forms.includes(form.id), `${sec.subtest} is not marked as part of the ${form.id} form`);
    });
  });
});

test('every item is well formed', () => {
  const seen = new Set();
  for (const item of Bank.items) {
    assert.ok(item.id, 'item needs an id');
    assert.ok(!seen.has(item.id), `duplicate item id ${item.id}`);
    seen.add(item.id);

    const meta = Bank.subtests[item.subtest];
    assert.ok(meta, `${item.id} references unknown subtest ${item.subtest}`);
    assert.strictEqual(item.battery, meta.battery, `${item.id} battery disagrees with its subtest`);

    assert.ok(Array.isArray(item.choices) && item.choices.length >= 4, `${item.id} needs at least four choices`);
    assert.ok(Number.isInteger(item.answer), `${item.id} answer must be an index`);
    assert.ok(item.answer >= 0 && item.answer < item.choices.length, `${item.id} answer out of range`);

    assert.strictEqual(typeof item.b, 'number', `${item.id} needs a difficulty`);
    assert.ok(item.b >= -4 && item.b <= 3, `${item.id} difficulty ${item.b} is out of range`);

    assert.ok(item.stem && item.stem.kind, `${item.id} needs a stem`);
    assert.ok(Array.isArray(item.walkthrough) && item.walkthrough.length >= 2,
      `${item.id} needs a multi-step walkthrough`);
    for (const step of item.walkthrough) {
      assert.ok(step.title && step.text, `${item.id} has an incomplete walkthrough step`);
    }
    if (!item.practice) assert.ok(item.hint, `${item.id} needs a hint`);
  }
});

test('answer choices within an item are distinct', () => {
  for (const item of Bank.items) {
    const keys = item.choices.map(c => (typeof c === 'object' ? JSON.stringify(c) : String(c)));
    assert.strictEqual(new Set(keys).size, keys.length, `${item.id} repeats an answer choice`);
  }
});

test('distractor explanations point at real, wrong choices', () => {
  for (const item of Bank.items) {
    if (!item.why) continue;
    for (const key of Object.keys(item.why)) {
      const idx = Number(key);
      assert.ok(Number.isInteger(idx) && idx >= 0 && idx < item.choices.length,
        `${item.id} explains a non-existent choice ${key}`);
      assert.notStrictEqual(idx, item.answer, `${item.id} explains away its own correct answer`);
      assert.ok(item.why[key].length > 10, `${item.id} choice ${key} needs a real explanation`);
    }
  }
});

test('each subtest pool spans enough difficulty to serve every level it appears on', () => {
  for (const id of Object.keys(Bank.subtests)) {
    const pool = scored.filter(i => i.subtest === id);
    const meta = Bank.subtests[id];
    const need = Math.max(...meta.forms.map(f =>
      Levels.FORMS[f].sections.filter(s => s.subtest === id).map(s => s.items)[0] || 0));
    assert.ok(pool.length >= need, `${id} pool of ${pool.length} cannot fill a section of ${need}`);

    const bs = pool.map(i => i.b);
    const centres = Levels.LEVELS
      .filter(lv => meta.forms.includes(lv.form))
      .map(lv => lv.center);
    assert.ok(Math.min(...bs) <= Math.min(...centres) + 0.4,
      `${id} has nothing easy enough for its lowest level`);
    assert.ok(Math.max(...bs) >= Math.max(...centres) - 0.1,
      `${id} has nothing hard enough for its highest level`);
  }
});

test('every subtest has practice items, and they are never scored', () => {
  for (const id of Object.keys(Bank.subtests)) {
    const mine = practice.filter(i => i.subtest === id);
    assert.ok(mine.length >= 2, `${id} needs at least two practice items, has ${mine.length}`);
    mine.forEach(i => assert.strictEqual(i.practice, true));
  }
  assert.ok(scored.every(i => !i.practice));
});

test('figure items build renderable specs', () => {
  const walk = spec => {
    assert.ok(spec && Array.isArray(spec.items), 'figure needs an items array');
    spec.items.forEach(shape => assert.ok(typeof shape.t === 'string', 'every shape needs a type'));
  };
  for (const item of Bank.items.filter(i => i.battery === 'nonverbal')) {
    item.choices.forEach(c => {
      assert.ok(c.fig, `${item.id} nonverbal choices must be wrapped figures`);
      walk(c.fig);
    });
    const s = item.stem;
    if (s.kind === 'matrix') {
      assert.strictEqual(s.cells.filter(c => c === null).length, 1, `${item.id} needs one empty cell`);
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

test('picture items use real pictograms and are all read aloud', () => {
  const names = new Set(Pictograms.names());
  const pictureItems = Bank.items.filter(i =>
    i.subtest === 'picture-analogies' || i.subtest === 'picture-classification');
  assert.ok(pictureItems.length >= 40);

  for (const item of pictureItems) {
    assert.ok(item.readAloud, `${item.id} must carry the examiner script`);
    item.choices.forEach(c => {
      assert.ok(c.fig && c.word, `${item.id} picture choices need a figure and a word`);
      assert.ok(names.has(c.word), `${item.id} uses unknown pictogram ${c.word}`);
    });
    const stemWords = item.stem.kind === 'pictureAnalogy'
      ? item.stem.pairs.flat().filter(Boolean).map(f => f.word)
      : item.stem.given.map(f => f.word);
    stemWords.forEach(w => assert.ok(names.has(w), `${item.id} stem uses unknown pictogram ${w}`));
    // The answer must not simply repeat a picture already shown in the stem.
    assert.ok(!stemWords.includes(item.choices[item.answer].word),
      `${item.id} answer repeats a picture from its own stem`);
  }
});

test('paper folding answers match the fold geometry', () => {
  const GenFig = require('../src/bank/generators-figural.js');
  const holesIn = choice => choice.fig.items.filter(s => s.t === 'dot').length;
  for (const item of Bank.items.filter(i => i.subtest === 'paper-folding' && !i.practice)) {
    const folds = item.stem.figs.length - 1;
    const punches = item.stem.figs[item.stem.figs.length - 1].fig.items.filter(s => s.t === 'dot').length;
    const holes = holesIn(item.choices[item.answer]);
    assert.ok(holes >= 1, `${item.id} unfolds to no holes`);
    assert.ok(holes <= punches * Math.pow(2, folds),
      `${item.id} unfolds to ${holes} holes, more than ${punches} punches through ${Math.pow(2, folds)} layers`);
  }
  // The geometry itself: a punch on the crease stays a single hole.
  assert.strictEqual(GenFig.unfold([[50, 50]], ['v']).length, 1);
  assert.strictEqual(GenFig.unfold([[69, 38]], ['v']).length, 2);
  assert.strictEqual(GenFig.unfold([[69, 69]], ['v', 'h']).length, 4);
  assert.strictEqual(GenFig.unfold([[76, 76]], ['v', 'h', 'v']).length, 8);
});

test('the pictogram library is complete and drawable', () => {
  const names = Pictograms.names();
  assert.ok(names.length >= 40, `only ${names.length} pictograms`);
  names.forEach(n => {
    const fig = Pictograms.get(n);
    assert.ok(fig.items.length > 0, `${n} draws nothing`);
    assert.strictEqual(fig.word, n, `${n} is mislabelled`);
    fig.items.forEach(s => assert.ok(typeof s.t === 'string', `${n} has a shapeless item`));
  });
});

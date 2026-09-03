/*
 * The primary levels are orally administered — a written sentence-completion
 * item is not a reasoning test for a child who cannot read the sentence — so
 * every item on those forms must produce a usable script, including its answer
 * choices. The upper levels must NOT read items aloud by default, because doing
 * so turns verbal reasoning into listening comprehension.
 */
const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const Bank = require('../src/bank/index.js');
const Speech = require('../src/speech.js');

test('every item on every primary form can be spoken', () => {
  for (const lv of Levels.LEVELS.filter(l => l.form === 'primary')) {
    const test_ = Levels.buildTest(lv, Bank);
    for (const section of test_.sections) {
      for (const item of section.items.concat(section.practice)) {
        const script = Speech.scriptFor(item);
        assert.ok(script && script.length > 20,
          `level ${lv.id} / ${item.id} has no usable script: "${script}"`);
      }
    }
  }
});

test('a non-reader hears the answer choices, not just the question', () => {
  const lv = Levels.levelForGrade(0);
  const sentence = Levels.buildTest(lv, Bank).sections
    .find(s => s.subtest === 'sentence-completion').items[0];

  const script = Speech.scriptFor(sentence);
  assert.match(script, /Listen to this sentence/);
  assert.match(script, /blank/, 'the blank is spoken, not shown');
  assert.match(script, /Your choices are/, 'the options are read out too');
  sentence.choices.forEach(c => {
    assert.ok(script.includes(String(c)), `choice "${c}" is never read aloud`);
  });
});

test('picture items keep their hand-written script and gain their word choices', () => {
  const item = Bank.items.find(i => i.subtest === 'picture-analogies' && !i.practice);
  const script = Speech.scriptFor(item);
  assert.ok(script.startsWith(item.readAloud),
    'the authored script leads, because it names things the markup cannot');
  item.choices.forEach(c => assert.ok(script.includes(c.word), `${c.word} is not read out`));
});

test('abstract figure choices are never named, which would give the answer away', () => {
  const item = Bank.items.find(i => i.subtest === 'figure-matrices' && !i.practice);
  const script = Speech.scriptFor(item);
  assert.ok(script.length > 20, 'the question is still described');
  assert.ok(!/Your choices are/.test(script),
    'unlabelled shapes must not be read out as a list');
  assert.strictEqual(Speech.choiceScript(item), '');
});

test('symbols are spoken the way an examiner says them', () => {
  assert.strictEqual(Speech.speakSymbols('? + 3 = 8'), 'blank plus 3 equals 8');
  assert.strictEqual(Speech.speakSymbols('△ = 5'), 'triangle equals 5');
  assert.strictEqual(Speech.speakSymbols('2 × ○ = 14'), '2 times circle equals 14');
  assert.strictEqual(Speech.speakSymbols('? ÷ 4 = 20 − 13'), 'blank divided by 4 equals 20 minus 13');
});

test('each stem kind produces a sensible spoken form', () => {
  const cases = [
    [{ stem: { kind: 'series', values: [2, 4, 6, 8] }, choices: [10] }, /Listen to these numbers: 2, 4, 6, 8\. What number comes next\?/],
    [{ stem: { kind: 'analogy', pairs: [['cub', 'bear'], ['puppy', '?']] }, choices: ['dog'] }, /cub goes with bear.*puppy goes with what\?/],
    [{ stem: { kind: 'numAnalogy', pairs: [[2, 6], [4, 12], [5, null]] }, choices: [15] }, /2 goes with 6\. 4 goes with 12\. 5 goes with what\?/],
    [{ stem: { kind: 'classification', given: ['robin', 'sparrow', 'eagle'] }, choices: ['hawk'] }, /robin, sparrow, eagle.*Which word belongs with them\?/],
    [{ stem: { kind: 'figSeq', figs: [] }, choices: [{ fig: {} }] }, /folded and then punched/]
  ];
  cases.forEach(([item, pattern]) => {
    assert.match(Speech.scriptFor(item), pattern);
  });
});

test('directions are speakable at every level, including the upper ones', () => {
  Object.keys(Bank.subtests).forEach(id => {
    const script = Speech.directionsScript(Bank.subtests[id]);
    assert.ok(script.startsWith(Bank.subtests[id].name), `${id} directions script is malformed`);
    assert.ok(script.length > 40, `${id} directions script is too short`);
  });
});

test('upper-level items are still speakable, for use as an accommodation', () => {
  // The app gates whether these are spoken; the script itself must exist so the
  // accommodation can be offered at all.
  const lv = Levels.levelForGrade(6);
  const sections = Levels.buildTest(lv, Bank).sections;
  const verbal = sections.find(s => s.subtest === 'verbal-analogies');
  assert.ok(Speech.scriptFor(verbal.items[0]).length > 20);
  const sc = sections.find(s => s.subtest === 'sentence-completion');
  assert.match(Speech.scriptFor(sc.items[0]), /Which word belongs in the blank\?/);
});

test('scripts stay in sync with the item, because they are derived from it', () => {
  const item = {
    stem: { kind: 'sentence', text: 'The sky is ____ today.' },
    choices: ['blue', 'loud', 'heavy', 'seven']
  };
  const script = Speech.scriptFor(item);
  assert.match(script, /The sky is blank today/);
  item.choices[0] = 'green';
  assert.match(Speech.scriptFor(item), /A, green/, 'a changed choice changes the script');
});

test('withChoices:false gives the question alone', () => {
  const item = { stem: { kind: 'series', values: [1, 2, 3] }, choices: [4, 5, 6, 7] };
  const full = Speech.scriptFor(item);
  const bare = Speech.scriptFor(item, { withChoices: false });
  assert.ok(full.includes('Your choices are'));
  assert.ok(!bare.includes('Your choices are'));
});

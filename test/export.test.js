const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const E = require('../src/export.js');
const S = require('../src/scoring.js');
global.Figures = require('../src/figures.js');
require('../src/bank/verbal.js');
require('../src/bank/quantitative.js');
require('../src/bank/nonverbal.js');
const bank = global.CogatBank;

function sampleRun(fraction = 0.7) {
  const answers = {};
  bank.items.forEach((it, i) => {
    answers[it.id] = i % 10 < fraction * 10 ? it.answer : (it.answer + 1) % it.choices.length;
  });
  const report = S.scoreSession({ items: bank.items, answers, grade: 3, ageMonths: 102 });
  report.label = 'Full practice test';
  report.elapsedSec = 1234.6;
  return {
    report, answers,
    payload: {
      report, label: 'Full practice test', grade: 3, ageMonths: 102,
      takenAt: '2026-08-31T10:00:00.000Z',
      itemIds: bank.items.map(i => i.id), answers
    }
  };
}

test('slugify produces safe, bounded filename fragments', () => {
  assert.strictEqual(E.slugify('Full practice test'), 'full-practice-test');
  assert.strictEqual(E.slugify('Verbal battery / 2026'), 'verbal-battery-2026');
  assert.strictEqual(E.slugify('   '), 'report');
  assert.strictEqual(E.slugify(null), 'report');
  assert.ok(E.slugify('x'.repeat(200)).length <= 48);
  assert.ok(!/[^a-z0-9-]/.test(E.slugify('Ünïcödé — ½ things!')));
});

test('filename embeds the label and the date it was taken', () => {
  const name = E.filename('Verbal battery', 'html', '2026-08-31T10:00:00.000Z');
  assert.match(name, /^cogat-report-verbal-battery-\d{4}-\d{2}-\d{2}\.html$/);
});

test('escapeHtml neutralises markup', () => {
  assert.strictEqual(E.escapeHtml('<script>"x"&y</script>'),
    '&lt;script&gt;&quot;x&quot;&amp;y&lt;/script&gt;');
});

test('wrapDocument produces a standalone document with inline styles', () => {
  const html = E.wrapDocument('My <report>', '<div class="cogat-doc">hi</div>');
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>My &lt;report&gt;</title>'), 'title is escaped');
  assert.ok(html.includes('<div class="cogat-doc">hi</div>'));
  assert.ok(html.includes('.cogat-doc'), 'stylesheet is inlined');
  assert.ok(!/<link\b/.test(html), 'must not reference external files');
  assert.ok(!/\bsrc=/.test(html), 'must not reference external scripts');
});

test('JSON export captures the scores and enough to rebuild the session', () => {
  const { payload, report } = sampleRun();
  const parsed = JSON.parse(E.toJSON(payload));

  assert.strictEqual(parsed.format, E.FORMAT);
  assert.strictEqual(parsed.version, E.FORMAT_VERSION);
  assert.deepStrictEqual(parsed.learner, { grade: 3, ageMonths: 102 });
  assert.strictEqual(parsed.takenAt, '2026-08-31T10:00:00.000Z');
  assert.strictEqual(parsed.elapsedSec, 1235, 'elapsed seconds are rounded');

  assert.strictEqual(parsed.scores.composite.sas, report.composite.sas);
  assert.strictEqual(parsed.scores.profile.label, report.profile.label);
  assert.deepStrictEqual(Object.keys(parsed.scores.batteries).sort(),
    ['nonverbal', 'quantitative', 'verbal']);
  assert.strictEqual(parsed.scores.batteries.verbal.sas, report.batteries.verbal.sas);
  assert.strictEqual(parsed.scores.subtests.length, 9);

  assert.strictEqual(parsed.itemIds.length, bank.items.length);
  assert.strictEqual(Object.keys(parsed.answers).length, bank.items.length);
  // Internal per-item detail is redundant with `answers` and stays out.
  assert.ok(!('detail' in parsed.scores.batteries.verbal));
});

test('a JSON export round-trips back to the same scores', () => {
  const { payload, report } = sampleRun();
  const parsed = E.parseSavedReport(E.toJSON(payload));
  assert.strictEqual(parsed.ok, true);

  const byId = new Map(bank.items.map(i => [i.id, i]));
  const items = parsed.data.itemIds.map(id => byId.get(id));
  assert.ok(items.every(Boolean), 'every saved id resolves against the bank');

  const rescored = S.scoreSession({
    items,
    answers: parsed.data.answers,
    grade: parsed.data.learner.grade,
    ageMonths: parsed.data.learner.ageMonths
  });
  assert.strictEqual(rescored.composite.sas, report.composite.sas);
  assert.strictEqual(rescored.totals.raw, report.totals.raw);
  assert.strictEqual(rescored.profile.label, report.profile.label);
});

test('parseSavedReport rejects files it cannot safely reopen', () => {
  assert.match(E.parseSavedReport('not json').error, /not valid JSON/);
  assert.match(E.parseSavedReport('null').error, /does not contain a report/);
  assert.match(E.parseSavedReport('{"format":"something-else"}').error, /not a CogAT practice report/);
  assert.match(
    E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 99, itemIds: ['a'], answers: {} })).error,
    /newer version/);
  assert.match(
    E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 1, answers: {} })).error,
    /does not list the questions/);
  assert.match(
    E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 1, itemIds: ['a'] })).error,
    /missing its answers/);
});

test('CSV has one header and a row per composite, battery and subtest', () => {
  const { report } = sampleRun();
  const names = { batteries: S.BATTERY_LABELS, subtests: {} };
  Object.keys(bank.subtests).forEach(id => { names.subtests[id] = bank.subtests[id].name; });

  const csv = E.toCSV(report, names);
  const lines = csv.trim().split('\r\n');
  assert.ok(lines.some(l => l.startsWith('composite,VQN composite,')), 'all three batteries make a VQN composite');

  assert.strictEqual(lines[0], E.CSV_COLUMNS.join(','));
  assert.strictEqual(lines.length, 1 + 1 + 3 + 9, 'header + composite + 3 batteries + 9 subtests');
  for (const line of lines) {
    assert.strictEqual(line.split(',').length, E.CSV_COLUMNS.length, `ragged row: ${line}`);
  }

  const verbal = lines.find(l => l.startsWith('battery,Verbal,'));
  const cells = verbal.split(',');
  assert.strictEqual(Number(cells[E.CSV_COLUMNS.indexOf('sas')]), report.batteries.verbal.sas);
  assert.strictEqual(Number(cells[E.CSV_COLUMNS.indexOf('stanine')]), report.batteries.verbal.stanine);
  assert.ok(lines.some(l => l.startsWith('subtest,Paper Folding,')));
});

test('CSV quotes cells that contain separators', () => {
  const report = {
    totals: { raw: 1, possible: 2 }, composite: null, batteries: {},
    subtests: [{ subtest: 'x', battery: 'verbal', raw: 1, possible: 2, percentCorrect: 50 }]
  };
  const csv = E.toCSV(report, { subtests: { x: 'Commas, and "quotes"' } });
  assert.ok(csv.includes('"Commas, and ""quotes"""'));
});

test('CSV copes with a single-battery report', () => {
  const items = bank.items.filter(i => i.battery === 'verbal');
  const answers = {};
  items.forEach(i => { answers[i.id] = i.answer; });
  const report = S.scoreSession({ items, answers, grade: 3, ageMonths: 102 });

  const lines = E.toCSV(report, { batteries: S.BATTERY_LABELS }).trim().split('\r\n');
  assert.strictEqual(lines.length, 1 + 1 + 1 + 3, 'header + composite + verbal + 3 subtests');
  assert.ok(!lines.some(l => l.startsWith('battery,Nonverbal')));
  // One battery is not a VQN composite and must not claim to be.
  assert.ok(lines.some(l => l.startsWith('composite,Composite,')), 'single battery composite is unlabelled as VQN');
  assert.ok(!lines.some(l => l.includes('VQN')));
});

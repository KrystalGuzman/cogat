const test = require('node:test');
const assert = require('node:assert');

global.self = global;
const E = require('../src/export.js');
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const S = require('../src/scoring.js');
const Bank = require('../src/bank/index.js');

const GRADE = 3;
const level = Levels.levelForGrade(GRADE);
const plan = Levels.buildTest(level, Bank);
const items = plan.sections.flatMap(s => s.items);

function sampleRun() {
  const answers = {};
  items.forEach((it, i) => { answers[it.id] = i % 4 ? it.answer : (it.answer + 1) % it.choices.length; });
  const report = S.scoreSession({
    items, answers, grade: GRADE, ageMonths: S.medianAgeMonths(GRADE),
    level: level.id, form: plan.form.id
  });
  report.label = level.label + ' — full test';
  report.elapsedSec = 4321.6;
  report.sectionLog = { 'verbal:verbal-analogies': { elapsedSec: 480, timeLimitSec: 600, timedOut: false } };
  return {
    report, answers,
    payload: {
      report, label: report.label, grade: GRADE, ageMonths: S.medianAgeMonths(GRADE),
      levelId: level.id, formId: plan.form.id, sectionLog: report.sectionLog,
      takenAt: '2026-08-31T10:00:00.000Z',
      itemIds: items.map(i => i.id), answers
    }
  };
}

test('slugify produces safe, bounded filename fragments', () => {
  assert.strictEqual(E.slugify('Level 13/14 — full test'), 'level-13-14-full-test');
  assert.strictEqual(E.slugify('   '), 'report');
  assert.strictEqual(E.slugify(null), 'report');
  assert.ok(E.slugify('x'.repeat(200)).length <= 48);
  assert.ok(!/[^a-z0-9-]/.test(E.slugify('Ünïcödé — ½ things!')));
});

test('filename embeds the label and the date it was taken', () => {
  assert.match(E.filename('Level 9 — full test', 'html', '2026-08-31T10:00:00.000Z'),
    /^cogat-report-level-9-full-test-\d{4}-\d{2}-\d{2}\.html$/);
});

test('escapeHtml neutralises markup', () => {
  assert.strictEqual(E.escapeHtml('<script>"x"&y</script>'),
    '&lt;script&gt;&quot;x&quot;&amp;y&lt;/script&gt;');
});

test('wrapDocument produces a standalone document with inline styles', () => {
  const html = E.wrapDocument('My <report>', '<div class="cogat-doc">hi</div>');
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>My &lt;report&gt;</title>'));
  assert.ok(html.includes('.cogat-doc'), 'stylesheet is inlined');
  assert.ok(!/<link\b/.test(html), 'must not reference external files');
  assert.ok(!/\bsrc=/.test(html), 'must not reference external scripts');
});

test('JSON export captures the scores, the level, and enough to rebuild the session', () => {
  const { payload, report } = sampleRun();
  const parsed = JSON.parse(E.toJSON(payload));

  assert.strictEqual(parsed.format, E.FORMAT);
  assert.strictEqual(parsed.version, E.FORMAT_VERSION);
  assert.deepStrictEqual(parsed.learner, { grade: GRADE, ageMonths: S.medianAgeMonths(GRADE) });
  assert.strictEqual(parsed.levelId, level.id);
  assert.strictEqual(parsed.formId, plan.form.id);
  assert.strictEqual(parsed.elapsedSec, 4322, 'elapsed seconds are rounded');

  assert.strictEqual(parsed.scores.composite.sas, report.composite.sas);
  assert.strictEqual(parsed.scores.profile.label, report.profile.label);
  assert.deepStrictEqual(Object.keys(parsed.scores.batteries).sort(),
    ['nonverbal', 'quantitative', 'verbal']);
  assert.strictEqual(parsed.scores.subtests.length, 9);
  assert.strictEqual(parsed.itemIds.length, items.length);
  assert.ok(!('detail' in parsed.scores.batteries.verbal));
  assert.ok(parsed.sectionLog, 'the per-subtest timing record travels with the report');
});

test('a JSON export round-trips back to the same scores', () => {
  const { payload, report } = sampleRun();
  const parsed = E.parseSavedReport(E.toJSON(payload));
  assert.strictEqual(parsed.ok, true);

  const byId = new Map(Bank.items.map(i => [i.id, i]));
  const restored = parsed.data.itemIds.map(id => byId.get(id));
  assert.ok(restored.every(Boolean), 'every saved id resolves against the bank');

  const rescored = S.scoreSession({
    items: restored, answers: parsed.data.answers,
    grade: parsed.data.learner.grade, ageMonths: parsed.data.learner.ageMonths,
    level: parsed.data.levelId
  });
  assert.strictEqual(rescored.composite.sas, report.composite.sas);
  assert.strictEqual(rescored.totals.raw, report.totals.raw);
  assert.strictEqual(rescored.profile.label, report.profile.label);
});

test('parseSavedReport rejects files it cannot safely reopen', () => {
  assert.match(E.parseSavedReport('not json').error, /not valid JSON/);
  assert.match(E.parseSavedReport('null').error, /does not contain a report/);
  assert.match(E.parseSavedReport('{"format":"something-else"}').error, /not a CogAT practice report/);
  assert.match(E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 99, itemIds: ['a'], answers: {} })).error, /newer version/);
  assert.match(E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 1, answers: {} })).error, /does not list the questions/);
  assert.match(E.parseSavedReport(JSON.stringify({ format: E.FORMAT, version: 1, itemIds: ['a'] })).error, /missing its answers/);
});

test('CSV has one header and a row per composite, battery and subtest', () => {
  const { report } = sampleRun();
  const names = { batteries: S.BATTERY_LABELS, subtests: {} };
  Object.keys(Bank.subtests).forEach(id => { names.subtests[id] = Bank.subtests[id].name; });

  const lines = E.toCSV(report, names).trim().split('\r\n');
  assert.strictEqual(lines[0], E.CSV_COLUMNS.join(','));
  assert.strictEqual(lines.length, 1 + 1 + 3 + 9, 'header + composite + 3 batteries + 9 subtests');
  lines.forEach(l => assert.strictEqual(l.split(',').length, E.CSV_COLUMNS.length, `ragged row: ${l}`));
  assert.ok(lines.some(l => l.startsWith('composite,VQN composite,')));

  const verbal = lines.find(l => l.startsWith('battery,Verbal,'));
  const cells = verbal.split(',');
  assert.strictEqual(Number(cells[E.CSV_COLUMNS.indexOf('sas')]), report.batteries.verbal.sas);
  assert.ok(lines.some(l => l.startsWith('subtest,Paper Folding,')));
});

test('CSV quotes cells that contain separators', () => {
  const report = {
    totals: { raw: 1, possible: 2 }, composite: null, batteries: {},
    subtests: [{ subtest: 'x', battery: 'verbal', raw: 1, possible: 2, percentCorrect: 50 }]
  };
  assert.ok(E.toCSV(report, { subtests: { x: 'Commas, and "quotes"' } })
    .includes('"Commas, and ""quotes"""'));
});

test('CSV copes with a single-battery report', () => {
  const verbalItems = items.filter(i => i.battery === 'verbal');
  const answers = {};
  verbalItems.forEach(i => { answers[i.id] = i.answer; });
  const report = S.scoreSession({ items: verbalItems, answers, grade: GRADE, ageMonths: S.medianAgeMonths(GRADE) });

  const lines = E.toCSV(report, { batteries: S.BATTERY_LABELS }).trim().split('\r\n');
  assert.strictEqual(lines.length, 1 + 1 + 1 + 3, 'header + composite + verbal + 3 subtests');
  assert.ok(lines.some(l => l.startsWith('composite,Composite,')), 'one battery is not a VQN composite');
  assert.ok(!lines.some(l => l.includes('VQN')));
});

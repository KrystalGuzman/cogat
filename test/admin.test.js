const test = require('node:test');
const assert = require('node:assert');

global.self = global;
// admin.js persists to localStorage; give it a minimal one.
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
const Levels = require('../src/levels.js');
global.CogatLevels = Levels;
const Bank = require('../src/bank/index.js');
const Admin = require('../src/admin.js');

function fresh(grade = 3) {
  Admin.clearSaved();
  return Admin.start({ grade, ageMonths: Levels.gradeNorm(grade).grade * 12 + 66, bank: Bank });
}

/** Drive the machine to completion, answering every question correctly. */
function runThrough(state, opts = {}) {
  let guard = 0;
  const visited = [];
  while (!Admin.isComplete(state) && guard++ < 200) {
    visited.push(state.phase);
    switch (state.phase) {
      case Admin.PHASE.SESSION_INTRO: Admin.beginDirections(state); break;
      case Admin.PHASE.DIRECTIONS: Admin.beginPractice(state); break;
      case Admin.PHASE.PRACTICE: Admin.finishPractice(state); break;
      case Admin.PHASE.READY: Admin.beginSection(state); break;
      case Admin.PHASE.TIMED:
        if (!opts.leaveBlank) {
          Admin.currentSection(state).items.forEach(i => { state.answers[i.id] = i.answer; });
        }
        Admin.submitSection(state, !!opts.timedOut);
        break;
      case Admin.PHASE.SECTION_DONE: Admin.advance(state); break;
      case Admin.PHASE.SESSION_DONE: Admin.nextSession(state); break;
      default: throw new Error('unexpected phase ' + state.phase);
    }
  }
  assert.ok(Admin.isComplete(state), 'administration did not finish');
  return visited;
}

test('a fresh administration starts at the first session intro', () => {
  const s = fresh(3);
  assert.strictEqual(s.phase, Admin.PHASE.SESSION_INTRO);
  assert.strictEqual(s.levelId, '9');
  assert.strictEqual(s.formId, 'upper');
  assert.strictEqual(s._sessions.length, 3);
  assert.deepStrictEqual(Admin.progress(s), { sectionsDone: 0, sectionsTotal: 9 });
});

test('each subtest runs directions, then practice, then the timed section', () => {
  const s = fresh(3);
  assert.strictEqual(s.phase, Admin.PHASE.SESSION_INTRO);
  Admin.beginDirections(s);
  assert.strictEqual(s.phase, Admin.PHASE.DIRECTIONS);
  Admin.beginPractice(s);
  assert.strictEqual(s.phase, Admin.PHASE.PRACTICE, 'practice comes before the scored section');
  assert.ok(Admin.currentSection(s).practice.length > 0);
  Admin.finishPractice(s);
  assert.strictEqual(s.phase, Admin.PHASE.READY);
  Admin.beginSection(s);
  assert.strictEqual(s.phase, Admin.PHASE.TIMED);
  assert.ok(s.sectionStartedAt > 0, 'the clock starts only when the section starts');
});

test('practice answers are kept apart from scored answers', () => {
  const s = fresh(3);
  Admin.beginDirections(s); Admin.beginPractice(s);
  const practiceItem = Admin.currentSection(s).practice[0];
  s.practiceAnswers[practiceItem.id] = 0;
  Admin.finishPractice(s); Admin.beginSection(s);
  Admin.submitSection(s, false);
  assert.deepStrictEqual(s.answers, {}, 'practice never leaks into the scored answers');
  assert.strictEqual(Admin.administeredItems(s).some(i => i.practice), false);
});

test('sections are timed separately and time does not carry over', () => {
  const s = fresh(3);
  const sections = s._sessions.flatMap(x => x.sections);
  sections.forEach(sec => {
    assert.strictEqual(sec.timeSec, 600, `${sec.subtest} should have its own limit`);
  });
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  const left = Admin.remainingSec(s);
  assert.ok(left > 595 && left <= 600, 'the clock starts full for this section only');
});

test('a closed section is recorded and cannot be reopened', () => {
  const s = fresh(3);
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  const section = Admin.currentSection(s);
  s.answers[section.items[0].id] = section.items[0].answer;
  const key = Admin.currentKey(s);
  Admin.submitSection(s, false);

  assert.ok(Admin.isSectionClosed(s, 0, 0));
  const log = s.sectionLog[key];
  assert.strictEqual(log.subtest, section.subtest);
  assert.strictEqual(log.answered, 1);
  assert.strictEqual(log.presented, section.items.length);
  assert.strictEqual(log.timedOut, false);
  assert.strictEqual(s.sectionStartedAt, null, 'the clock is stopped');

  // Advancing moves forward only; there is no route back to section 0.
  Admin.advance(s);
  assert.strictEqual(s.sectionIndex, 1);
  assert.strictEqual(s.phase, Admin.PHASE.DIRECTIONS);
});

test('running out of time closes the section and records it', () => {
  const s = fresh(3);
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  Admin.submitSection(s, true);
  assert.strictEqual(s.sectionLog[Object.keys(s.sectionLog)[0]].timedOut, true);
});

test('the whole administration is three sessions of three subtests', () => {
  const s = fresh(3);
  const visited = runThrough(s);
  assert.strictEqual(Object.keys(s.sectionLog).length, 9);
  assert.strictEqual(visited.filter(p => p === Admin.PHASE.SESSION_INTRO).length, 3);
  assert.strictEqual(visited.filter(p => p === Admin.PHASE.TIMED).length, 9);
  assert.strictEqual(visited.filter(p => p === Admin.PHASE.SESSION_DONE).length, 2,
    'a break is offered after the first two sessions');
  assert.strictEqual(Admin.administeredItems(s).length, 176);
});

test('a kindergarten administration is teacher-paced and read aloud', () => {
  const s = fresh(0);
  assert.strictEqual(s.levelId, '5/6');
  assert.strictEqual(s.formId, 'primary');
  assert.strictEqual(s.paced, 'teacher');
  assert.strictEqual(s.readAloud, true);
  s._sessions.flatMap(x => x.sections).forEach(sec => {
    assert.strictEqual(sec.timeSec, null, `${sec.subtest} must not be timed on the primary form`);
  });
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  assert.strictEqual(Admin.remainingSec(s), null, 'no countdown on a teacher-paced form');
  runThrough(s);
  assert.strictEqual(Admin.administeredItems(s).length, 118);
});

test('progress is saved and can be resumed', () => {
  const s = fresh(3);
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  const first = Admin.currentSection(s).items[0];
  s.answers[first.id] = first.answer;
  Admin.submitSection(s, false);
  Admin.advance(s);

  const restored = Admin.rehydrate(Admin.loadSaved(), Bank);
  assert.ok(restored, 'a saved administration can be restored');
  assert.strictEqual(restored.levelId, s.levelId);
  assert.strictEqual(restored.sectionIndex, 1);
  assert.strictEqual(restored.answers[first.id], first.answer);
  assert.strictEqual(Object.keys(restored.sectionLog).length, 1);
  assert.ok(restored._sessions.length, 'items are reattached on restore');
});

test('a section that was mid-flight restarts at its directions', () => {
  const s = fresh(3);
  Admin.beginDirections(s); Admin.beginPractice(s); Admin.finishPractice(s); Admin.beginSection(s);
  assert.strictEqual(s.phase, Admin.PHASE.TIMED);

  const restored = Admin.rehydrate(Admin.loadSaved(), Bank);
  assert.strictEqual(restored.phase, Admin.PHASE.DIRECTIONS,
    'a timer cannot be resumed honestly, so the subtest starts again from its directions');
});

test('rehydrate refuses data it cannot trust', () => {
  assert.strictEqual(Admin.rehydrate(null, Bank), null);
  assert.strictEqual(Admin.rehydrate({ version: 1 }, Bank), null);
  assert.strictEqual(Admin.rehydrate({ version: 2, levelId: 'nope' }, Bank), null);
});

test('the saved payload carries no item objects', () => {
  const s = fresh(3);
  const flat = Admin.serialisable(s);
  assert.ok(!('_sessions' in flat) && !('_plan' in flat) && !('_level' in flat),
    'items are rebuilt from the bank, never stored, so saved progress cannot go stale');
  assert.ok(JSON.stringify(flat).length < 4000, 'the saved payload stays small');
});

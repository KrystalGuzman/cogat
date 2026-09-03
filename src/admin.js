/*
 * admin.js — administering a leveled test the way CogAT is administered.
 *
 * The real test is not one long question list. It is:
 *
 *   three separate sessions, one per battery, normally taken on different days
 *     └─ three subtests per session, each of which runs
 *          directions (untimed)
 *          → worked practice questions (untimed, never scored)
 *          → the scored section under its own strict time limit
 *
 * Once a section is submitted it is closed: there is no going back to an earlier
 * subtest, and time left over in one subtest cannot be spent on another. Within a
 * section the student may move freely among that section's questions, as they can
 * within a page of the real booklet.
 *
 * The primary levels are teacher-paced rather than timed and are read aloud, so
 * sections carry no clock and every item exposes its examiner script.
 *
 * This module owns the state machine and the persistence. Rendering lives in
 * app.js, which reads the state this exposes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./levels.js'));
  } else {
    root.CogatAdmin = factory(root.CogatLevels);
  }
})(typeof self !== 'undefined' ? self : this, function (Levels) {
  'use strict';

  var STORE_PROGRESS = 'cogat.progress.v2';

  var PHASE = {
    SESSION_INTRO: 'session-intro',
    DIRECTIONS: 'directions',
    PRACTICE: 'practice',
    READY: 'ready',
    TIMED: 'timed',
    SECTION_DONE: 'section-done',
    SESSION_DONE: 'session-done',
    FINISHED: 'finished'
  };

  /**
   * Start a fresh administration.
   * @param {Object} opts { grade, ageMonths, bank, batteries? }
   */
  function start(opts) {
    var level = Levels.levelForGrade(opts.grade);
    var plan = Levels.buildTest(level, opts.bank);

    var sessions = plan.sessions;
    if (opts.batteries && opts.batteries.length) {
      sessions = sessions.filter(function (s) { return opts.batteries.indexOf(s.battery) !== -1; });
    }

    return {
      version: 2,
      grade: opts.grade,
      ageMonths: opts.ageMonths,
      levelId: level.id,
      formId: plan.form.id,
      paced: plan.form.paced,
      readAloud: !!plan.form.readAloud,
      batteries: sessions.map(function (s) { return s.battery; }),
      sessionIndex: 0,
      sectionIndex: 0,
      phase: PHASE.SESSION_INTRO,
      answers: {},
      practiceAnswers: {},
      // Per-section record: when it started, how long it ran, whether time ran out.
      sectionLog: {},
      startedAt: Date.now(),
      updatedAt: Date.now(),
      // Rebuilt from the bank on load rather than stored, so item text never
      // goes stale in a saved session.
      _sessions: sessions,
      _plan: plan,
      _level: level
    };
  }

  /** Reattach the item objects to a state restored from storage. */
  function rehydrate(saved, bank) {
    if (!saved || saved.version !== 2) return null;
    var level = Levels.levelById(saved.levelId);
    if (!level) return null;
    var plan = Levels.buildTest(level, bank);
    var sessions = plan.sessions.filter(function (s) {
      return !saved.batteries || saved.batteries.indexOf(s.battery) !== -1;
    });
    if (!sessions.length) return null;

    var state = Object.assign({}, saved);
    state._sessions = sessions;
    state._plan = plan;
    state._level = level;

    // A section that was mid-flight when the app closed restarts at its
    // directions rather than resuming a clock that has since run out.
    if (state.phase === PHASE.TIMED || state.phase === PHASE.READY) {
      state.phase = PHASE.DIRECTIONS;
    }
    return state;
  }

  // ------------------------------------------------------------- accessors ---

  function currentSession(state) { return state._sessions[state.sessionIndex] || null; }

  function currentSection(state) {
    var s = currentSession(state);
    return s ? s.sections[state.sectionIndex] || null : null;
  }

  function sectionKey(state, sessionIndex, sectionIndex) {
    return state._sessions[sessionIndex].battery + ':' +
      state._sessions[sessionIndex].sections[sectionIndex].subtest;
  }

  function currentKey(state) { return sectionKey(state, state.sessionIndex, state.sectionIndex); }

  /** Every scored item across the whole administration. */
  function allScoredItems(state) {
    var out = [];
    state._sessions.forEach(function (sess) {
      sess.sections.forEach(function (sec) { out = out.concat(sec.items); });
    });
    return out;
  }

  /** Items from sections that have actually been administered. */
  function administeredItems(state) {
    var out = [];
    state._sessions.forEach(function (sess, si) {
      sess.sections.forEach(function (sec, ci) {
        if (state.sectionLog[sectionKey(state, si, ci)]) out = out.concat(sec.items);
      });
    });
    return out;
  }

  function isSectionClosed(state, sessionIndex, sectionIndex) {
    return !!state.sectionLog[sectionKey(state, sessionIndex, sectionIndex)];
  }

  function progress(state) {
    var total = 0, done = 0;
    state._sessions.forEach(function (sess, si) {
      sess.sections.forEach(function (sec, ci) {
        total++;
        if (isSectionClosed(state, si, ci)) done++;
      });
    });
    return { sectionsDone: done, sectionsTotal: total };
  }

  // -------------------------------------------------------------- controls ---

  function beginDirections(state) {
    state.phase = PHASE.DIRECTIONS;
    return touch(state);
  }

  function beginPractice(state) {
    var section = currentSection(state);
    state.phase = section && section.practice.length ? PHASE.PRACTICE : PHASE.READY;
    return touch(state);
  }

  function finishPractice(state) {
    state.phase = PHASE.READY;
    return touch(state);
  }

  /** Start the clock. From here the section is live and cannot be paused. */
  function beginSection(state) {
    state.phase = PHASE.TIMED;
    state.sectionStartedAt = Date.now();
    state.itemIndex = 0;
    return touch(state);
  }

  function remainingSec(state) {
    var section = currentSection(state);
    if (!section || !section.timeSec) return null;          // teacher-paced
    var elapsed = (Date.now() - state.sectionStartedAt) / 1000;
    return Math.max(0, section.timeSec - elapsed);
  }

  /**
   * Close the current section. Once closed it cannot be reopened — that is the
   * whole point of section locking.
   */
  function submitSection(state, timedOut) {
    var section = currentSection(state);
    if (!section) return state;

    var elapsed = state.sectionStartedAt ? (Date.now() - state.sectionStartedAt) / 1000 : 0;
    var answered = section.items.filter(function (i) {
      return state.answers[i.id] !== undefined;
    }).length;

    state.sectionLog[currentKey(state)] = {
      battery: section.battery,
      subtest: section.subtest,
      timeLimitSec: section.timeSec,
      elapsedSec: Math.round(section.timeSec ? Math.min(elapsed, section.timeSec) : elapsed),
      timedOut: !!timedOut,
      answered: answered,
      presented: section.items.length,
      closedAt: Date.now()
    };

    state.sectionStartedAt = null;
    state.phase = PHASE.SECTION_DONE;
    return touch(state);
  }

  /** Move past the just-closed section, into the next one or the next session. */
  function advance(state) {
    var session = currentSession(state);
    if (state.sectionIndex < session.sections.length - 1) {
      state.sectionIndex++;
      state.phase = PHASE.DIRECTIONS;
    } else if (state.sessionIndex < state._sessions.length - 1) {
      state.phase = PHASE.SESSION_DONE;
    } else {
      state.phase = PHASE.FINISHED;
    }
    return touch(state);
  }

  function nextSession(state) {
    state.sessionIndex++;
    state.sectionIndex = 0;
    state.phase = PHASE.SESSION_INTRO;
    return touch(state);
  }

  function isComplete(state) { return state.phase === PHASE.FINISHED; }

  // ------------------------------------------------------------ persistence ---

  function touch(state) {
    state.updatedAt = Date.now();
    save(state);
    return state;
  }

  function serialisable(state) {
    var out = {};
    Object.keys(state).forEach(function (k) {
      if (k.charAt(0) !== '_') out[k] = state[k];
    });
    return out;
  }

  function save(state) {
    try {
      localStorage.setItem(STORE_PROGRESS, JSON.stringify(serialisable(state)));
    } catch (e) { /* private mode, or quota */ }
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_PROGRESS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSaved() {
    try { localStorage.removeItem(STORE_PROGRESS); } catch (e) { /* private mode */ }
  }

  return {
    PHASE: PHASE,
    STORE_PROGRESS: STORE_PROGRESS,
    start: start,
    rehydrate: rehydrate,
    currentSession: currentSession,
    currentSection: currentSection,
    currentKey: currentKey,
    sectionKey: sectionKey,
    allScoredItems: allScoredItems,
    administeredItems: administeredItems,
    isSectionClosed: isSectionClosed,
    progress: progress,
    beginDirections: beginDirections,
    beginPractice: beginPractice,
    finishPractice: finishPractice,
    beginSection: beginSection,
    remainingSec: remainingSec,
    submitSection: submitSection,
    advance: advance,
    nextSession: nextSession,
    isComplete: isComplete,
    serialisable: serialisable,
    save: save,
    loadSaved: loadSaved,
    clearSaved: clearSaved
  };
});

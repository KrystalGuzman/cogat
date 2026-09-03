/*
 * levels.js — CogAT level structure and test assembly.
 *
 * The real CogAT is not one test. It is a series of *leveled forms*, each
 * assigned by age and grade, and everyone taking a given level sees the same
 * items in the same order. It is not adaptive, and it has no basal/ceiling
 * rules (that is the WISC-V's model, not this one).
 *
 * Two form families:
 *   Primary (levels 5/6, 7, 8 — grades K-2) is picture-based, read aloud by the
 *     examiner, and teacher-paced rather than timed. Its verbal battery uses
 *     Picture Analogies and Picture Classification.
 *   Upper (levels 9 through 17/18 — grades 3-12) is print-based, independently
 *     read, and each subtest is separately and strictly timed. Its verbal
 *     battery uses Verbal Analogies and Verbal Classification.
 *
 * Item counts and time limits below mirror the published structure of Form 7/8
 * (176 items for the upper levels, 118 for primary, three ~30-minute sessions).
 * They are close approximations, not the publisher's exact specifications.
 *
 * ABILITY SCALE. Item difficulties (`b`) live on a single ABSOLUTE scale shared
 * by every level, in logits. A grade's norm group is a mean and SD on that same
 * scale, so a grade's SAS is computed relative to its own peers while the items
 * keep one fixed meaning. This is what makes a leveled test coherent: the same
 * item is hard for a second grader and easy for a tenth grader, and both get a
 * correctly normed score.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Median ability per grade on the absolute logit scale, and the within-grade
   * spread. Growth is fast in the early grades and tapers, as ability scales do.
   * Grade 0 is kindergarten.
   */
  var GRADE_MEAN = [-2.60, -2.00, -1.50, -1.00, -0.60, -0.30, 0.00, 0.25, 0.45, 0.60, 0.75, 0.85, 0.95];
  var GRADE_SD = 1.0;

  function gradeNorm(grade) {
    var g = Math.max(0, Math.min(12, Math.round(grade)));
    return { grade: g, mean: GRADE_MEAN[g], sd: GRADE_SD };
  }

  // ---------------------------------------------------------------- levels ---

  var LEVELS = [
    { id: '5/6', label: 'Level 5/6', grades: [0], form: 'primary' },
    { id: '7', label: 'Level 7', grades: [1], form: 'primary' },
    { id: '8', label: 'Level 8', grades: [2], form: 'primary' },
    { id: '9', label: 'Level 9', grades: [3], form: 'upper' },
    { id: '10', label: 'Level 10', grades: [4], form: 'upper' },
    { id: '11', label: 'Level 11', grades: [5], form: 'upper' },
    { id: '12', label: 'Level 12', grades: [6], form: 'upper' },
    { id: '13/14', label: 'Level 13/14', grades: [7, 8], form: 'upper' },
    { id: '15/16', label: 'Level 15/16', grades: [9, 10], form: 'upper' },
    { id: '17/18', label: 'Level 17/18', grades: [11, 12], form: 'upper' }
  ];

  // The ability the form targets: the median of the grades it serves.
  LEVELS.forEach(function (lv) {
    var means = lv.grades.map(function (g) { return GRADE_MEAN[g]; });
    lv.center = means.reduce(function (a, b) { return a + b; }, 0) / means.length;
  });

  function levelForGrade(grade) {
    var g = Math.max(0, Math.min(12, Math.round(grade)));
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].grades.indexOf(g) !== -1) return LEVELS[i];
    }
    return LEVELS[LEVELS.length - 1];
  }

  function levelById(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return null;
  }

  // ----------------------------------------------------------------- forms ---

  var BATTERY_ORDER = ['verbal', 'quantitative', 'nonverbal'];

  /**
   * Section specs per form family. `items` is the scored length, `practice` the
   * number of untimed example questions that precede it and do not count,
   * `timeSec` the strict limit (null = teacher-paced, as the primary levels are).
   */
  var FORMS = {
    primary: {
      id: 'primary',
      label: 'Primary',
      paced: 'teacher',
      readAloud: true,
      note: 'Picture-based and read aloud. Teacher-paced rather than timed, as the primary levels are administered.',
      sections: [
        { battery: 'verbal', subtest: 'picture-analogies', items: 14, practice: 2, timeSec: null },
        { battery: 'verbal', subtest: 'sentence-completion', items: 14, practice: 2, timeSec: null },
        { battery: 'verbal', subtest: 'picture-classification', items: 14, practice: 2, timeSec: null },
        { battery: 'quantitative', subtest: 'number-analogies', items: 14, practice: 2, timeSec: null },
        { battery: 'quantitative', subtest: 'number-puzzles', items: 12, practice: 2, timeSec: null },
        { battery: 'quantitative', subtest: 'number-series', items: 14, practice: 2, timeSec: null },
        { battery: 'nonverbal', subtest: 'figure-matrices', items: 14, practice: 2, timeSec: null },
        { battery: 'nonverbal', subtest: 'paper-folding', items: 10, practice: 2, timeSec: null },
        { battery: 'nonverbal', subtest: 'figure-classification', items: 12, practice: 2, timeSec: null }
      ]
    },
    upper: {
      id: 'upper',
      label: 'Upper',
      paced: 'timed',
      readAloud: false,
      note: 'Print-based and independently read. Each subtest is separately and strictly timed.',
      sections: [
        { battery: 'verbal', subtest: 'verbal-analogies', items: 24, practice: 2, timeSec: 600 },
        { battery: 'verbal', subtest: 'sentence-completion', items: 20, practice: 2, timeSec: 600 },
        { battery: 'verbal', subtest: 'verbal-classification', items: 20, practice: 2, timeSec: 600 },
        { battery: 'quantitative', subtest: 'number-analogies', items: 18, practice: 2, timeSec: 600 },
        { battery: 'quantitative', subtest: 'number-puzzles', items: 16, practice: 2, timeSec: 600 },
        { battery: 'quantitative', subtest: 'number-series', items: 18, practice: 2, timeSec: 600 },
        { battery: 'nonverbal', subtest: 'figure-matrices', items: 22, practice: 2, timeSec: 600 },
        { battery: 'nonverbal', subtest: 'paper-folding', items: 16, practice: 2, timeSec: 600 },
        { battery: 'nonverbal', subtest: 'figure-classification', items: 22, practice: 2, timeSec: 600 }
      ]
    }
  };

  function formForLevel(level) { return FORMS[level.form]; }

  function sectionsForBattery(form, battery) {
    return form.sections.filter(function (s) { return s.battery === battery; });
  }

  // ------------------------------------------------------------- assembly ---

  /**
   * Choose `count` items from a pool to target a level.
   *
   * Real leveled forms progress from easy to hard and are centred on the level's
   * expected ability, with adjacent levels sharing items. This reproduces that:
   * lay `count` difficulty targets across a window centred on the level, take
   * the nearest unused item to each, then order the result easy to hard.
   *
   * @param {Array} pool items carrying a numeric `b`
   * @param {number} center target ability for the level
   * @param {number} count how many items the section needs
   * @param {number} [halfWidth] half the difficulty window, in logits
   * @returns {Array} selected items, easiest first
   */
  function selectItems(pool, center, count, halfWidth) {
    var span = halfWidth == null ? 1.8 : halfWidth;
    var available = pool.slice().sort(function (a, b) { return a.b - b.b; });
    if (available.length <= count) return available;

    var used = {};
    var picked = [];
    for (var i = 0; i < count; i++) {
      var frac = count === 1 ? 0.5 : i / (count - 1);
      var target = center - span + 2 * span * frac;

      var bestIndex = -1;
      var bestDistance = Infinity;
      for (var j = 0; j < available.length; j++) {
        if (used[j]) continue;
        var d = Math.abs(available[j].b - target);
        if (d < bestDistance) { bestDistance = d; bestIndex = j; }
      }
      if (bestIndex === -1) break;
      used[bestIndex] = true;
      picked.push(available[bestIndex]);
    }

    return picked.sort(function (a, b) { return a.b - b.b; });
  }

  /**
   * Assemble the complete leveled test.
   *
   * @param {Object} level from levelForGrade()
   * @param {Object} bank { items: [...], subtests: {...} }
   * @returns {Object} { level, form, sessions: [...], totalItems, shortfalls }
   */
  function buildTest(level, bank) {
    var form = formForLevel(level);
    var shortfalls = [];

    var sections = form.sections.map(function (spec) {
      var pool = bank.items.filter(function (i) {
        return i.subtest === spec.subtest && !i.practice;
      });
      var practicePool = bank.items.filter(function (i) {
        return i.subtest === spec.subtest && i.practice;
      });

      var items = selectItems(pool, level.center, spec.items);
      if (items.length < spec.items) {
        shortfalls.push({
          subtest: spec.subtest, wanted: spec.items, got: items.length
        });
      }
      // Practice items are the easiest available: they teach the format, not the content.
      var practice = practicePool
        .slice().sort(function (a, b) { return a.b - b.b; })
        .slice(0, spec.practice);

      return {
        battery: spec.battery,
        subtest: spec.subtest,
        name: bank.subtests[spec.subtest].name,
        timeSec: spec.timeSec,
        items: items,
        practice: practice
      };
    });

    var sessions = BATTERY_ORDER.map(function (battery, i) {
      var mine = sections.filter(function (s) { return s.battery === battery; });
      return {
        battery: battery,
        index: i,
        sections: mine,
        itemCount: mine.reduce(function (n, s) { return n + s.items.length; }, 0),
        timeSec: mine.reduce(function (n, s) { return n + (s.timeSec || 0); }, 0)
      };
    }).filter(function (s) { return s.sections.length; });

    return {
      level: level,
      form: form,
      sessions: sessions,
      sections: sections,
      totalItems: sections.reduce(function (n, s) { return n + s.items.length; }, 0),
      targetItems: form.sections.reduce(function (n, s) { return n + s.items; }, 0),
      shortfalls: shortfalls
    };
  }

  return {
    GRADE_MEAN: GRADE_MEAN,
    GRADE_SD: GRADE_SD,
    BATTERY_ORDER: BATTERY_ORDER,
    LEVELS: LEVELS,
    FORMS: FORMS,
    gradeNorm: gradeNorm,
    levelForGrade: levelForGrade,
    levelById: levelById,
    formForLevel: formForLevel,
    sectionsForBattery: sectionsForBattery,
    selectItems: selectItems,
    buildTest: buildTest
  };
});

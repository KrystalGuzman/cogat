/*
 * generators.js — parameterized item factories for the quantitative and
 * nonverbal batteries.
 *
 * A real leveled CogAT form runs to 176 scored items, and every one of the ten
 * levels needs its own difficulty-appropriate selection. For the quantitative and
 * nonverbal batteries the items are systematic by nature — a number series really
 * is "a rule applied to a sequence", and its walkthrough really is "here is the
 * rule, here is the next term". These factories build those pools deterministically
 * and derive a correct walkthrough and per-distractor rationale from the same
 * parameters that generate the question.
 *
 * The verbal battery is hand-authored instead: analogies and sentence completion
 * turn on meaning, which does not come from a formula.
 *
 * Difficulties are on the absolute logit scale from levels.js — roughly -3.5 for
 * the easiest kindergarten material through +2.5 for the hardest twelfth-grade
 * material. Each family's base difficulty reflects how many reasoning steps the
 * item needs; the parameter terms adjust for arithmetic load within a family.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../figures.js'));
  } else {
    root.CogatGenerators = factory(root.Figures);
  }
})(typeof self !== 'undefined' ? self : this, function (Figures) {
  'use strict';

  var F = Figures.F;
  var items = [];

  // ---------------------------------------------------------------- utils ---

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function keyOf(v) { return typeof v === 'object' ? JSON.stringify(v) : String(v); }

  /**
   * Build a five-option multiple choice from a correct value plus candidate
   * distractors, deduplicated and deterministically ordered.
   * Returns null when there are not enough usable distractors, so the caller
   * can drop the item rather than ship a malformed one.
   */
  function multipleChoice(id, correct, candidates, valid) {
    var seen = {};
    seen[keyOf(correct)] = true;
    var distractors = [];
    for (var i = 0; i < candidates.length && distractors.length < 4; i++) {
      var c = candidates[i];
      if (c === null || c === undefined) continue;
      if (valid && !valid(c)) continue;
      var k = keyOf(c);
      if (seen[k]) continue;
      seen[k] = true;
      distractors.push(c);
    }
    if (distractors.length < 4) return null;

    var slot = hash(id) % 5;
    var choices = distractors.slice();
    choices.splice(slot, 0, correct);
    return { choices: choices, answer: slot };
  }

  /** Translate a value-keyed rationale map into one keyed by final choice index. */
  function whyFor(mc, pairs) {
    var why = {};
    Object.keys(pairs).forEach(function (raw) {
      var value = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
      var idx = choiceIndex(mc.choices, value);
      if (idx >= 0 && idx !== mc.answer) why[idx] = pairs[raw];
    });
    return why;
  }

  function choiceIndex(choices, value) {
    for (var i = 0; i < choices.length; i++) if (keyOf(choices[i]) === keyOf(value)) return i;
    return -1;
  }

  function push(item) { if (item) items.push(item); }
  var positiveInt = function (n) { return typeof n === 'number' && n > 0 && Number.isFinite(n); };

  // ============================================================ NUMBER SERIES

  /**
   * Each kind names the rule, produces the terms, and explains itself.
   * `b` is the absolute difficulty; the step counts drive it.
   */
  var SERIES = {
    add: {
      terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x += p.d; } return v; },
      b: function (p) { return -3.35 + 0.10 * p.d + 0.006 * p.start; },
      hint: 'Write the gap between each pair of numbers.',
      steps: function (p, v) {
        return [
          { title: 'Find the gaps', text: v.slice(0, 4).map(function (n, i) { return i ? (n + ' − ' + v[i - 1] + ' = ' + p.d) : null; }).filter(Boolean).join(', ') + '. Every gap is ' + p.d + '.' },
          { title: 'Continue', text: 'Add ' + p.d + ' to the last number: ' + v[3] + ' + ' + p.d + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[4] + p.d, v[4] - p.d, v[3] + p.d + 1, v[3] * 2, v[4] + 1]; },
      why: function (p, v) {
        var w = {};
        w[v[4] + p.d] = 'That is two steps on instead of one.';
        w[v[4] - p.d] = 'That repeats the last number in the list.';
        w[v[4] + 1] = 'The gap is ' + p.d + ', not ' + (p.d + 1) + '.';
        return w;
      }
    },

    sub: {
      terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x -= p.d; } return v; },
      b: function (p) { return -2.95 + 0.10 * p.d + 0.004 * p.start; },
      hint: 'The series is going down. By how much each step?',
      steps: function (p, v) {
        return [
          { title: 'Find the gaps', text: 'Each number is ' + p.d + ' less than the one before it.' },
          { title: 'Continue', text: v[3] + ' − ' + p.d + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[4] - p.d, v[4] + p.d, v[4] + 1, v[4] - 1, v[3] - 1]; },
      why: function (p, v) {
        var w = {};
        w[v[4] - p.d] = 'That is two steps on instead of one.';
        w[v[4] + p.d] = 'That repeats the last number in the list.';
        w[v[4] - 1] = 'The series drops by ' + p.d + ' each time, not by ' + (p.d + 1) + '.';
        return w;
      }
    },

    mul: {
      terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x *= p.r; } return v; },
      b: function (p) { return -1.95 + 0.30 * (p.r - 2) + 0.02 * p.start; },
      hint: 'The gaps are growing fast — try multiplication instead.',
      steps: function (p, v) {
        return [
          { title: 'Check the gaps', text: 'The gaps are ' + (v[1] - v[0]) + ', ' + (v[2] - v[1]) + ', ' + (v[3] - v[2]) + ' — not equal, so it is not simple addition.' },
          { title: 'Check the ratios', text: v[1] + ' ÷ ' + v[0] + ' = ' + p.r + ', and the same holds all the way along. Every number is multiplied by ' + p.r + '.' },
          { title: 'Continue', text: v[3] + ' × ' + p.r + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] + (v[3] - v[2]), v[4] + v[3], v[3] * (p.r + 1), v[4] - v[3], v[3] + p.r]; },
      why: function (p, v) {
        var w = {};
        w[v[3] + (v[3] - v[2])] = 'That repeats the previous gap instead of multiplying.';
        w[v[3] * (p.r + 1)] = 'That multiplies by ' + (p.r + 1) + '; check the ratio on the earlier pairs.';
        return w;
      }
    },

    div: {
      terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x = x / p.r; } return v; },
      b: function (p) { return -1.45 + 0.30 * (p.r - 2); },
      hint: 'The numbers shrink by the same factor each time.',
      steps: function (p, v) {
        return [
          { title: 'Check the ratios', text: v[0] + ' ÷ ' + v[1] + ' = ' + p.r + ', and the same holds along the list. Each number is a ' + (p.r === 2 ? 'half' : '1/' + p.r) + ' of the one before it.' },
          { title: 'Continue', text: v[3] + ' ÷ ' + p.r + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[4] - 1, v[4] + 1, v[3] - v[4], v[4] / p.r, v[3] - p.r]; },
      why: function (p, v) {
        var w = {};
        w[v[4] - 1] = 'That subtracts 1; the pattern is division.';
        w[v[4] / p.r] = 'That divides twice instead of once.';
        return w;
      }
    },

    squares: {
      terms: function (p) { var v = []; for (var i = 0; i < 5; i++) { var n = p.start + i; v.push(n * n); } return v; },
      b: function (p) { return -0.95 + 0.12 * p.start; },
      hint: 'These are all the result of multiplying a number by itself.',
      steps: function (p, v) {
        return [
          { title: 'Check the gaps', text: 'The gaps are ' + (v[1] - v[0]) + ', ' + (v[2] - v[1]) + ', ' + (v[3] - v[2]) + ' — they grow by 2 each time, so the next gap is ' + (v[4] - v[3]) + '.' },
          { title: 'Recognise the pattern', text: 'These are the square numbers: ' + p.start + '², ' + (p.start + 1) + '², ' + (p.start + 2) + '², ' + (p.start + 3) + '². The next is ' + (p.start + 4) + '².' },
          { title: 'Continue', text: 'Both routes agree: ' + v[3] + ' + ' + (v[4] - v[3]) + ' = ' + v[4] + ', and ' + (p.start + 4) + ' × ' + (p.start + 4) + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] + (v[3] - v[2]), v[3] * 2, v[4] + 1, v[4] - 2, v[3] + (p.start + 4)]; },
      why: function (p, v) {
        var w = {};
        w[v[3] + (v[3] - v[2])] = 'That repeats the previous gap, but the gaps are growing.';
        w[v[3] * 2] = 'That doubles the last term, which does not fit the earlier numbers.';
        return w;
      }
    },

    seconddiff: {
      terms: function (p) {
        var v = [], x = p.start, step = p.step;
        for (var i = 0; i < 5; i++) { v.push(x); x += step; step += p.grow; }
        return v;
      },
      b: function (p) { return -0.75 + 0.18 * p.grow + 0.05 * p.step; },
      hint: 'The gaps themselves form a simple series.',
      steps: function (p, v) {
        var gaps = [v[1] - v[0], v[2] - v[1], v[3] - v[2]];
        return [
          { title: 'Find the gaps', text: '+' + gaps.join(', +') + '.' },
          { title: 'Read the gaps as their own series', text: 'The gaps grow by ' + p.grow + ' each time, so the next gap is +' + (v[4] - v[3]) + '.' },
          { title: 'Continue', text: v[3] + ' + ' + (v[4] - v[3]) + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] + (v[3] - v[2]), v[4] + p.grow, v[4] - p.grow, v[3] * 2, v[4] + 1]; },
      why: function (p, v) {
        var w = {};
        w[v[3] + (v[3] - v[2])] = 'That repeats the previous gap instead of growing it.';
        w[v[4] + p.grow] = 'That grows the gap one step too far.';
        return w;
      }
    },

    fib: {
      terms: function (p) {
        var v = [p.a, p.b];
        for (var i = 2; i < 5; i++) v.push(v[i - 1] + v[i - 2]);
        return v;
      },
      b: function (p) { return 0.10 + 0.03 * p.a; },
      hint: 'Each number is built from the two numbers before it.',
      steps: function (p, v) {
        return [
          { title: 'No constant gap or ratio', text: 'The gaps are ' + (v[1] - v[0]) + ', ' + (v[2] - v[1]) + ', ' + (v[3] - v[2]) + ' and the ratios are not constant either.' },
          { title: 'Try adding neighbours', text: v[0] + ' + ' + v[1] + ' = ' + v[2] + ', and ' + v[1] + ' + ' + v[2] + ' = ' + v[3] + '. Each number is the sum of the previous two.' },
          { title: 'Continue', text: v[2] + ' + ' + v[3] + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] * 2, v[3] + v[2] + 1, v[3] + (v[3] - v[2]), v[4] + v[3], v[3] + 1]; },
      why: function (p, v) {
        var w = {};
        w[v[3] * 2] = 'That doubles the last term rather than adding the two before it.';
        w[v[3] + (v[3] - v[2])] = 'That continues the last gap, but the gaps are not constant.';
        return w;
      }
    },

    mulAdd: {
      terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x = x * p.m + p.k; } return v; },
      b: function (p) { return 0.75 + 0.22 * (p.m - 2) + 0.06 * Math.abs(p.k); },
      hint: 'Each number is a bit more than ' + '' + 'a multiple of the one before.',
      steps: function (p, v) {
        return [
          { title: 'Close to multiplying', text: v[1] + ' ÷ ' + v[0] + ' is about ' + (Math.round(v[1] / v[0] * 100) / 100) + ' — near ' + p.m + ' but not exact.' },
          { title: 'Try multiply then add', text: v[0] + ' × ' + p.m + ' = ' + (v[0] * p.m) + ', and ' + (v[0] * p.m) + ' + ' + p.k + ' = ' + v[1] + '. Test it: ' + v[1] + ' × ' + p.m + ' + ' + p.k + ' = ' + v[2] + '. The rule is ×' + p.m + ' then +' + p.k + '.' },
          { title: 'Continue', text: v[3] + ' × ' + p.m + ' = ' + (v[3] * p.m) + ', and ' + (v[3] * p.m) + ' + ' + p.k + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] * p.m, v[4] + p.k, v[3] * p.m - p.k, v[3] + (v[3] - v[2]), v[3] * (p.m + 1)]; },
      why: function (p, v) {
        var w = {};
        w[v[3] * p.m] = 'That multiplies but forgets the +' + p.k + ' — the most common slip here.';
        w[v[3] + (v[3] - v[2])] = 'That repeats the previous gap instead of applying the rule.';
        return w;
      }
    },

    altOps: {
      terms: function (p) {
        var v = [], x = p.start;
        for (var i = 0; i < 5; i++) { v.push(x); x = i % 2 === 0 ? x / p.down : x * p.up; }
        return v;
      },
      b: function (p) { return 1.35 + 0.15 * p.down; },
      hint: 'Two different operations take turns.',
      steps: function (p, v) {
        return [
          { title: 'The direction alternates', text: 'Down, up, down, up. A single rule cannot do that, so look for two rules taking turns.' },
          { title: 'Name the two rules', text: v[0] + ' → ' + v[1] + ' is ÷' + p.down + '. ' + v[1] + ' → ' + v[2] + ' is ×' + p.up + '. The pattern repeats: ÷' + p.down + ', ×' + p.up + ', ÷' + p.down + ', …' },
          { title: 'Continue', text: 'The last step was ×' + p.up + ', so the next is ÷' + p.down + ': ' + v[3] + ' ÷ ' + p.down + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [Math.round(v[3] * p.up), v[2], v[3] - v[4], Math.round(v[4] * p.up), v[4] + 2]; },
      why: function (p, v) {
        var w = {};
        w[Math.round(v[3] * p.up)] = 'That applies ×' + p.up + ' twice in a row; the operations alternate.';
        w[v[2]] = 'That repeats an earlier value instead of continuing the alternation.';
        return w;
      }
    },

    incMul: {
      terms: function (p) {
        var v = [], x = p.start, m = p.from;
        for (var i = 0; i < 5; i++) { v.push(x); x = x * m; m += 1; }
        return v;
      },
      b: function (p) { return 1.55 + 0.10 * p.from; },
      hint: 'The multiplier changes at every step.',
      steps: function (p, v) {
        return [
          { title: 'Check the ratios', text: v[1] + ' ÷ ' + v[0] + ' = ' + p.from + ', ' + v[2] + ' ÷ ' + v[1] + ' = ' + (p.from + 1) + ', ' + v[3] + ' ÷ ' + v[2] + ' = ' + (p.from + 2) + '. The multiplier is not fixed.' },
          { title: 'Read the multipliers as a series', text: 'They count up: ' + p.from + ', ' + (p.from + 1) + ', ' + (p.from + 2) + '. The next multiplier is ' + (p.from + 3) + '.' },
          { title: 'Continue', text: v[3] + ' × ' + (p.from + 3) + ' = ' + v[4] + '.' }
        ];
      },
      distractors: function (p, v) { return [v[3] * (p.from + 2), v[3] * (p.from + 4), v[3] * 2, v[4] + v[3], v[3] + v[2]]; },
      why: function (p, v) {
        var w = {};
        w[v[3] * (p.from + 2)] = 'That repeats the previous multiplier instead of increasing it.';
        w[v[3] * (p.from + 4)] = 'That skips a multiplier.';
        return w;
      }
    }
  };

  function makeSeries(kind, params, suffix) {
    var spec = SERIES[kind];
    var v = spec.terms(params);
    if (v.some(function (n) { return !Number.isInteger(n) || n <= 0 || n > 100000; })) return null;

    var id = 'ns-' + kind + '-' + suffix;
    var mc = multipleChoice(id, v[4], spec.distractors(params, v), function (n) {
      return Number.isInteger(n) && n > 0 && n <= 200000;
    });
    if (!mc) return null;

    return {
      id: id, battery: 'quantitative', subtest: 'number-series',
      b: Math.round(spec.b(params) * 100) / 100,
      stem: { kind: 'series', values: v.slice(0, 4) },
      choices: mc.choices, answer: mc.answer,
      hint: spec.hint,
      walkthrough: spec.steps(params, v),
      why: whyFor(mc, spec.why(params, v))
    };
  }

  [2, 3, 4, 5, 6, 7, 10].forEach(function (d) {
    [1, 2, 3, 5, 8].forEach(function (start, si) {
      push(makeSeries('add', { start: start, d: d }, d + '-' + si));
    });
  });
  [2, 3, 4, 5, 6, 9].forEach(function (d) {
    [40, 50, 60].forEach(function (start, si) {
      push(makeSeries('sub', { start: start, d: d }, d + '-' + si));
    });
  });
  [2, 3, 4].forEach(function (r) {
    [1, 2, 3, 5].forEach(function (start, si) {
      push(makeSeries('mul', { start: start, r: r }, r + '-' + si));
    });
  });
  [2, 3].forEach(function (r) {
    [64, 81, 96, 128].forEach(function (start, si) {
      push(makeSeries('div', { start: start, r: r }, r + '-' + si));
    });
  });
  [1, 2, 3, 4, 5].forEach(function (start) {
    push(makeSeries('squares', { start: start }, String(start)));
  });
  [1, 2, 3].forEach(function (grow) {
    [1, 2, 3].forEach(function (step) {
      [2, 4].forEach(function (start, si) {
        push(makeSeries('seconddiff', { start: start, step: step, grow: grow }, grow + '-' + step + '-' + si));
      });
    });
  });
  [[1, 1], [1, 2], [2, 3], [2, 5], [3, 4]].forEach(function (pair, i) {
    push(makeSeries('fib', { a: pair[0], b: pair[1] }, String(i)));
  });
  [2, 3].forEach(function (m) {
    [1, 2, 3].forEach(function (k) {
      [2, 5].forEach(function (start, si) {
        push(makeSeries('mulAdd', { start: start, m: m, k: k }, m + '-' + k + '-' + si));
      });
    });
  });
  [[64, 2, 3], [96, 2, 3], [128, 4, 3], [162, 3, 2]].forEach(function (p, i) {
    push(makeSeries('altOps', { start: p[0], down: p[1], up: p[2] }, String(i)));
  });
  [1, 2].forEach(function (start) {
    [2, 3].forEach(function (from) {
      push(makeSeries('incMul', { start: start, from: from }, start + '-' + from));
    });
  });

  // ========================================================= NUMBER ANALOGIES

  var ANALOGY = {
    add: {
      f: function (n, p) { return n + p.k; },
      b: function (p) { return -3.25 + 0.10 * p.k; },
      name: function (p) { return 'add ' + p.k; },
      hint: 'How much bigger is the second number in each pair?',
      firstGuess: function (p, a) { return 'That could be +' + p.k + ' or ×' + Math.round((a + p.k) / a * 10) / 10 + '.'; },
      distract: function (n, p) { return [n + p.k + 1, n + p.k - 1, n * p.k, n - p.k, n + 2 * p.k]; },
      why: function (n, p) {
        var w = {};
        w[n * p.k] = 'That multiplies by ' + p.k + ' instead of adding it.';
        w[n + 2 * p.k] = 'That adds ' + p.k + ' twice.';
        w[n - p.k] = 'That subtracts; the pairs get bigger, not smaller.';
        return w;
      }
    },
    sub: {
      f: function (n, p) { return n - p.k; },
      b: function (p) { return -2.85 + 0.10 * p.k; },
      name: function (p) { return 'subtract ' + p.k; },
      hint: 'The gap between the two numbers of a pair is always the same.',
      distract: function (n, p) { return [n - p.k - 1, n - p.k + 1, n + p.k, Math.round(n / 2), n - 2 * p.k]; },
      why: function (n, p) {
        var w = {};
        w[n + p.k] = 'That adds; the second number of each pair is smaller.';
        w[n - 2 * p.k] = 'That subtracts ' + p.k + ' twice.';
        return w;
      }
    },
    mul: {
      f: function (n, p) { return n * p.k; },
      b: function (p) { return -2.05 + 0.25 * (p.k - 2); },
      name: function (p) { return 'multiply by ' + p.k; },
      hint: 'How many times bigger is the second number in each pair?',
      distract: function (n, p) { return [n * (p.k + 1), n * (p.k - 1), n + p.k, n * p.k + 1, n * p.k - n]; },
      why: function (n, p) {
        var w = {};
        w[n + p.k] = 'That adds ' + p.k + ' instead of multiplying by it.';
        w[n * (p.k + 1)] = 'That multiplies by ' + (p.k + 1) + '; check the rule on both given pairs.';
        return w;
      }
    },
    div: {
      f: function (n, p) { return n / p.k; },
      b: function (p) { return -1.55 + 0.25 * (p.k - 2); },
      name: function (p) { return 'divide by ' + p.k; },
      hint: 'Try dividing.',
      distract: function (n, p) { return [n / p.k + 1, n / p.k - 1, n - p.k, n / (p.k + 1), n * p.k]; },
      why: function (n, p) {
        var w = {};
        w[n - p.k] = 'That subtracts ' + p.k + ' instead of dividing by it.';
        w[n / (p.k + 1)] = 'That divides by ' + (p.k + 1) + '.';
        return w;
      }
    },
    square: {
      f: function (n) { return n * n; },
      b: function () { return -0.65; },
      name: function () { return 'square the number'; },
      hint: 'Try multiplying the number by itself.',
      distract: function (n) { return [n * 2, n * 3, n * n + 1, n * n - n, n * 4]; },
      why: function (n) {
        var w = {};
        w[n * 2] = 'That doubles rather than squares.';
        w[n * 4] = 'That works only for the first pair; test any rule on the second pair too.';
        return w;
      }
    },
    mulAdd: {
      f: function (n, p) { return n * p.m + p.k; },
      b: function (p) { return 0.65 + 0.18 * (p.m - 2) + 0.06 * p.k; },
      name: function (p) { return 'multiply by ' + p.m + ' then add ' + p.k; },
      hint: 'One operation is not enough. Try multiplying and then adding.',
      distract: function (n, p) { return [n * p.m, n * p.m - p.k, n * p.m + p.k + 1, n + p.m + p.k, n * (p.m + 1) + p.k]; },
      why: function (n, p) {
        var w = {};
        w[n * p.m] = 'That is ×' + p.m + ' with the +' + p.k + ' forgotten.';
        w[n * p.m - p.k] = 'That subtracts ' + p.k + ' where the rule adds it.';
        return w;
      }
    },
    halfMinus: {
      f: function (n, p) { return n / 2 - p.k; },
      b: function (p) { return 0.95 + 0.08 * p.k; },
      name: function (p) { return 'halve it then subtract ' + p.k; },
      hint: 'Halve the number, then adjust.',
      distract: function (n, p) { return [n / 2, n / 2 - p.k - 1, n / 2 + p.k, n - p.k, Math.round(n / 3)]; },
      why: function (n, p) {
        var w = {};
        w[n / 2] = 'That halves it but forgets the −' + p.k + '.';
        w[n / 2 + p.k] = 'That adds ' + p.k + ' where the rule subtracts it.';
        return w;
      }
    },
    squarePlus: {
      f: function (n, p) { return n * n + p.k; },
      b: function (p) { return 1.45 + 0.06 * p.k; },
      name: function (p) { return 'square it then add ' + p.k; },
      hint: 'The second numbers are just past a familiar sequence of squares.',
      distract: function (n, p) { return [n * n, n * n - p.k, n * n + p.k + 1, n * 3 + p.k, n * n + 2 * p.k]; },
      why: function (n, p) {
        var w = {};
        w[n * n] = 'That squares it but forgets the +' + p.k + ' — the most common slip here.';
        w[n * n - p.k] = 'That subtracts where the rule adds.';
        return w;
      }
    }
  };

  function makeAnalogy(kind, params, seeds, suffix) {
    var spec = ANALOGY[kind];
    var pairs = seeds.map(function (n) { return [n, spec.f(n, params)]; });
    if (pairs.some(function (p) { return !Number.isInteger(p[1]) || p[1] <= 0 || p[1] > 100000; })) return null;

    var third = seeds[2];
    var correct = spec.f(third, params);
    var id = 'na-' + kind + '-' + suffix;
    var mc = multipleChoice(id, correct, spec.distract(third, params), function (n) {
      return Number.isInteger(n) && n > 0 && n <= 200000;
    });
    if (!mc) return null;

    return {
      id: id, battery: 'quantitative', subtest: 'number-analogies',
      b: Math.round(spec.b(params) * 100) / 100,
      stem: { kind: 'numAnalogy', pairs: [pairs[0], pairs[1], [third, null]] },
      choices: mc.choices, answer: mc.answer,
      hint: spec.hint,
      walkthrough: [
        { title: 'Look at the first pair', text: pairs[0][0] + ' becomes ' + pairs[0][1] + '. Several rules could do that, so do not commit yet.' },
        { title: 'Test on the second pair', text: 'Applying "' + spec.name(params) + '" to ' + pairs[1][0] + ' gives ' + pairs[1][1] + ', which matches. A rule that fits only one pair is not the rule.' },
        { title: 'Apply the rule', text: 'Applying "' + spec.name(params) + '" to ' + third + ' gives ' + correct + '.' }
      ],
      why: whyFor(mc, spec.why(third, params))
    };
  }

  [1, 2, 3, 5, 10].forEach(function (k) {
    [[2, 4, 6], [3, 5, 8], [4, 7, 9]].forEach(function (seeds, si) {
      push(makeAnalogy('add', { k: k }, seeds, k + '-' + si));
    });
  });
  [2, 3, 5, 7].forEach(function (k) {
    [[9, 12, 20], [15, 18, 24]].forEach(function (seeds, si) {
      push(makeAnalogy('sub', { k: k }, seeds, k + '-' + si));
    });
  });
  [2, 3, 4, 5].forEach(function (k) {
    [[2, 4, 5], [3, 6, 7], [4, 8, 9]].forEach(function (seeds, si) {
      push(makeAnalogy('mul', { k: k }, seeds, k + '-' + si));
    });
  });
  [2, 3, 4].forEach(function (k) {
    [[12, 24, 36], [20, 32, 48]].forEach(function (seeds, si) {
      push(makeAnalogy('div', { k: k }, seeds, k + '-' + si));
    });
  });
  [[3, 5, 7], [4, 6, 9], [2, 5, 8]].forEach(function (seeds, si) {
    push(makeAnalogy('square', {}, seeds, String(si)));
  });
  [2, 3].forEach(function (m) {
    [1, 2, 3].forEach(function (k) {
      [[3, 5, 7], [2, 4, 6]].forEach(function (seeds, si) {
        push(makeAnalogy('mulAdd', { m: m, k: k }, seeds, m + '-' + k + '-' + si));
      });
    });
  });
  [1, 2, 3].forEach(function (k) {
    [[8, 14, 20], [10, 16, 24]].forEach(function (seeds, si) {
      push(makeAnalogy('halfMinus', { k: k }, seeds, k + '-' + si));
    });
  });
  [1, 2, 3].forEach(function (k) {
    [[2, 3, 4], [3, 4, 5]].forEach(function (seeds, si) {
      push(makeAnalogy('squarePlus', { k: k }, seeds, k + '-' + si));
    });
  });

  // =========================================================== NUMBER PUZZLES

  function makePuzzle(id, b, lines, correct, distractors, hint, steps, why) {
    var mc = multipleChoice(id, correct, distractors, positiveInt);
    if (!mc) return null;
    return {
      id: id, battery: 'quantitative', subtest: 'number-puzzles',
      b: Math.round(b * 100) / 100,
      stem: { kind: 'puzzle', lines: lines },
      choices: mc.choices, answer: mc.answer,
      hint: hint, walkthrough: steps,
      why: whyFor(mc, why || {})
    };
  }

  // ? + a = t
  [[3, 8], [4, 11], [6, 15], [9, 17], [12, 30], [7, 21]].forEach(function (p, i) {
    var a = p[0], t = p[1], ans = t - a;
    var w = {}; w[t + a] = 'That adds when you should subtract — the usual mistake here.';
    push(makePuzzle('np-add-' + i, -3.30 + 0.02 * t, ['? + ' + a + ' = ' + t], ans,
      [t + a, ans + 1, ans - 1, a, t],
      'Undo the addition.',
      [{ title: 'Isolate the unknown', text: 'To undo "+ ' + a + '", subtract ' + a + ' from both sides.' },
       { title: 'Compute', text: '? = ' + t + ' − ' + a + ' = ' + ans + '.' },
       { title: 'Check', text: ans + ' + ' + a + ' = ' + t + '. Correct.' }], w));
  });

  // ? - a = t
  [[5, 9], [8, 15], [6, 22], [11, 24], [14, 31]].forEach(function (p, i) {
    var a = p[0], t = p[1], ans = t + a;
    var w = {}; w[t - a] = 'That subtracts when you should add.';
    push(makePuzzle('np-sub-' + i, -2.90 + 0.02 * t, ['? − ' + a + ' = ' + t], ans,
      [t - a, ans + 1, ans - 1, t, a],
      'Undo the subtraction by adding.',
      [{ title: 'Isolate the unknown', text: 'The unknown had ' + a + ' taken away, so add ' + a + ' back to both sides.' },
       { title: 'Compute', text: '? = ' + t + ' + ' + a + ' = ' + ans + '.' },
       { title: 'Check', text: ans + ' − ' + a + ' = ' + t + '. Correct.' }], w));
  });

  // b + ? = c + d
  [[9, 4, 12], [7, 5, 11], [13, 6, 20], [8, 9, 14], [15, 7, 19]].forEach(function (p, i) {
    var b0 = p[0], c = p[1], d = p[2], rhs = c + d, ans = rhs - b0;
    var w = {}; w[rhs] = 'That is the value of the right-hand side, not the missing addend.';
    push(makePuzzle('np-both-' + i, -2.25 + 0.02 * rhs, [b0 + ' + ? = ' + c + ' + ' + d], ans,
      [rhs, ans + 1, ans - 1, b0, d - c],
      'Simplify the side with no unknown first.',
      [{ title: 'Finish the clean side', text: 'The right side has no unknown: ' + c + ' + ' + d + ' = ' + rhs + '.' },
       { title: 'Rewrite', text: 'The puzzle is now ' + b0 + ' + ? = ' + rhs + '.' },
       { title: 'Solve and check', text: '? = ' + rhs + ' − ' + b0 + ' = ' + ans + '. Both sides come to ' + rhs + '.' }], w));
  });

  // shape = n ; ? = shape + m
  [['△', 5, 9], ['□', 7, 6], ['○', 8, 12], ['△', 12, 7], ['□', 9, 15]].forEach(function (p, i) {
    var sh = p[0], n = p[1], m = p[2], ans = n + m;
    var w = {}; w[n * m] = 'That multiplies where the line says add.';
    push(makePuzzle('np-shape1-' + i, -2.45 + 0.02 * ans, [sh + ' = ' + n, '? = ' + sh + ' + ' + m], ans,
      [n * m, Math.abs(m - n), ans + 1, ans - 1, n],
      'Replace the shape with its value.',
      [{ title: 'Substitute', text: 'The first line fixes ' + sh + ' at ' + n + ' everywhere it appears.' },
       { title: 'Rewrite', text: '? = ' + n + ' + ' + m + '.' },
       { title: 'Compute', text: '? = ' + ans + '.' }], w));
  });

  // ? x a = b + c
  [[3, 8, 13], [4, 9, 11], [5, 12, 13], [2, 7, 9], [6, 14, 16]].forEach(function (p, i) {
    var a = p[0], b0 = p[1], c = p[2], rhs = b0 + c;
    if (rhs % a !== 0) return;
    var ans = rhs / a;
    var w = {}; w[rhs] = 'That is the right-hand total, which is what "?" multiplies up to, not "?" itself.';
    push(makePuzzle('np-mul-' + i, -1.40 + 0.02 * rhs, ['? × ' + a + ' = ' + b0 + ' + ' + c], ans,
      [rhs, ans + 1, ans - 1, rhs - a, a],
      'Turn the right side into one number, then divide.',
      [{ title: 'Finish the clean side', text: b0 + ' + ' + c + ' = ' + rhs + '.' },
       { title: 'Rewrite', text: '? × ' + a + ' = ' + rhs + '.' },
       { title: 'Solve and check', text: '? = ' + rhs + ' ÷ ' + a + ' = ' + ans + '. Check: ' + ans + ' × ' + a + ' = ' + rhs + '.' }], w));
  });

  // shape + shape = n ; ? = shape + m
  [[18, 6], [14, 9], [22, 5], [16, 11], [24, 7]].forEach(function (p, i) {
    var n = p[0], m = p[1], sh = n / 2, ans = sh + m;
    var w = {}; w[sh] = 'That is the value of the shape itself; the question asks for the shape plus ' + m + '.';
    w[n + m] = 'That uses the total instead of one shape.';
    push(makePuzzle('np-shape2-' + i, -0.80 + 0.02 * n, ['□ + □ = ' + n, '? = □ + ' + m], ans,
      [sh, n + m, ans + 1, ans - 1, n],
      'Two identical squares add to ' + n + ', so one square is worth half of that.',
      [{ title: 'Solve for the shape', text: '□ + □ is two of the same number, so 2 × □ = ' + n + ' and □ = ' + sh + '.' },
       { title: 'Substitute', text: '? = ' + sh + ' + ' + m + '.' },
       { title: 'Compute and check', text: '? = ' + ans + '. Check line 1: ' + sh + ' + ' + sh + ' = ' + n + '.' }], w));
  });

  // square = n ; triangle = square + a ; ? = triangle x b
  [[7, 2, 4], [5, 3, 3], [6, 4, 2], [8, 1, 5], [9, 2, 3]].forEach(function (p, i) {
    var n = p[0], a = p[1], b0 = p[2], tri = n + a, ans = tri * b0;
    var w = {}; w[n * b0] = 'That skips the "+' + a + '" on the second line.';
    push(makePuzzle('np-chain-' + i, 0.30 + 0.02 * ans,
      ['□ = ' + n, '△ = □ + ' + a, '? = △ × ' + b0], ans,
      [n * b0, (n + a) * (b0 + 1), ans + b0, ans - b0, tri],
      'Work down the lines one at a time; each feeds the next.',
      [{ title: 'Line 1', text: '□ = ' + n + '.' },
       { title: 'Line 2', text: '△ = □ + ' + a + ' = ' + n + ' + ' + a + ' = ' + tri + '.' },
       { title: 'Line 3', text: '? = △ × ' + b0 + ' = ' + tri + ' × ' + b0 + ' = ' + ans + '.' }], w));
  });

  // ? / a = b - c
  [[4, 20, 13], [3, 18, 11], [5, 22, 14], [6, 25, 16], [4, 30, 21]].forEach(function (p, i) {
    var a = p[0], b0 = p[1], c = p[2], rhs = b0 - c, ans = rhs * a;
    var w = {}; w[rhs] = 'That is the right-hand side, not the value that was divided.';
    w[rhs + a] = 'That adds where you should multiply.';
    push(makePuzzle('np-div-' + i, 0.60 + 0.015 * ans, ['? ÷ ' + a + ' = ' + b0 + ' − ' + c], ans,
      [rhs, rhs + a, ans + a, ans - a, b0],
      'Simplify the right side, then undo the division by multiplying.',
      [{ title: 'Finish the clean side', text: b0 + ' − ' + c + ' = ' + rhs + '.' },
       { title: 'Rewrite', text: '? ÷ ' + a + ' = ' + rhs + '.' },
       { title: 'Solve and check', text: 'Undo ÷' + a + ' by multiplying: ? = ' + rhs + ' × ' + a + ' = ' + ans + '. Check: ' + ans + ' ÷ ' + a + ' = ' + rhs + '.' }], w));
  });

  // 2 x circle = n ; ? = circle x circle - m
  [[14, 9], [12, 5], [16, 11], [18, 20], [10, 7]].forEach(function (p, i) {
    var n = p[0], m = p[1], circ = n / 2, ans = circ * circ - m;
    if (ans <= 0) return;
    var w = {}; w[circ * circ] = 'That squares the circle but forgets the −' + m + '.';
    w[n - m] = 'That uses the total instead of the circle.';
    push(makePuzzle('np-sq-' + i, 1.30 + 0.01 * ans,
      ['2 × ○ = ' + n, '? = (○ × ○) − ' + m], ans,
      [circ * circ, n - m, ans + m, ans - m, circ],
      'Find the circle first, then square it before subtracting.',
      [{ title: 'Solve for the shape', text: '2 × ○ = ' + n + ', so ○ = ' + circ + '.' },
       { title: 'Handle the brackets first', text: '○ × ○ = ' + circ + ' × ' + circ + ' = ' + (circ * circ) + '.' },
       { title: 'Finish', text: '? = ' + (circ * circ) + ' − ' + m + ' = ' + ans + '.' }], w));
  });

  // ------------------------------------------------- harder upper-level items ---
  // The secondary levels (15/16 and 17/18) sit near +0.9 on the ability scale and
  // need items well above that to measure without a ceiling.

  // Series: multiply then subtract.
  SERIES.mulSub = {
    terms: function (p) { var v = [], x = p.start; for (var i = 0; i < 5; i++) { v.push(x); x = x * p.m - p.k; } return v; },
    b: function (p) { return 1.55 + 0.20 * (p.m - 2) + 0.05 * p.k; },
    hint: 'Each number is a little less than a multiple of the one before.',
    steps: function (p, v) {
      return [
        { title: 'Not quite multiplying', text: v[1] + ' ÷ ' + v[0] + ' is about ' + (Math.round(v[1] / v[0] * 100) / 100) + ' — close to ' + p.m + ' but short of it.' },
        { title: 'Try multiply then subtract', text: v[0] + ' × ' + p.m + ' = ' + (v[0] * p.m) + ', and ' + (v[0] * p.m) + ' − ' + p.k + ' = ' + v[1] + '. It holds for the next pair too, so the rule is ×' + p.m + ' then −' + p.k + '.' },
        { title: 'Continue', text: v[3] + ' × ' + p.m + ' = ' + (v[3] * p.m) + ', and ' + (v[3] * p.m) + ' − ' + p.k + ' = ' + v[4] + '.' }
      ];
    },
    distractors: function (p, v) { return [v[3] * p.m, v[4] + p.k, v[3] * p.m + p.k, v[3] + (v[3] - v[2]), v[3] * (p.m + 1)]; },
    why: function (p, v) {
      var w = {};
      w[v[3] * p.m] = 'That multiplies but forgets the −' + p.k + '.';
      w[v[3] * p.m + p.k] = 'That adds ' + p.k + ' where the rule subtracts it.';
      return w;
    }
  };

  // Series: the gaps themselves double.
  SERIES.gapDouble = {
    terms: function (p) {
      var v = [], x = p.start, gap = p.gap;
      for (var i = 0; i < 5; i++) { v.push(x); x += gap; gap *= 2; }
      return v;
    },
    b: function (p) { return 1.70 + 0.08 * p.gap; },
    hint: 'Look at the gaps, then look at what is happening to the gaps.',
    steps: function (p, v) {
      var g = [v[1] - v[0], v[2] - v[1], v[3] - v[2]];
      return [
        { title: 'Find the gaps', text: '+' + g.join(', +') + '. They are not equal and they are not growing by a fixed amount.' },
        { title: 'Read the gaps as their own series', text: 'Each gap is double the one before, so the next gap is +' + (v[4] - v[3]) + '.' },
        { title: 'Continue', text: v[3] + ' + ' + (v[4] - v[3]) + ' = ' + v[4] + '.' }
      ];
    },
    distractors: function (p, v) { return [v[3] + (v[3] - v[2]), v[3] * 2, v[4] + (v[4] - v[3]), v[3] + (v[3] - v[2]) * 3, v[4] - p.gap]; },
    why: function (p, v) {
      var w = {};
      w[v[3] + (v[3] - v[2])] = 'That repeats the previous gap instead of doubling it.';
      w[v[3] * 2] = 'That doubles the term rather than the gap.';
      return w;
    }
  };

  [3, 4].forEach(function (m) {
    [1, 2, 3].forEach(function (k) {
      [2, 3].forEach(function (start, si) {
        push(makeSeries('mulSub', { start: start, m: m, k: k }, m + '-' + k + '-' + si));
      });
    });
  });
  [1, 2, 3, 4].forEach(function (gap) {
    [1, 5].forEach(function (start, si) {
      push(makeSeries('gapDouble', { start: start, gap: gap }, gap + '-' + si));
    });
  });

  // Analogies: cube it, and multiply then subtract.
  ANALOGY.cube = {
    f: function (n) { return n * n * n; },
    b: function () { return 1.75; },
    name: function () { return 'multiply the number by itself three times'; },
    hint: 'Squaring is not enough here.',
    distract: function (n) { return [n * n, n * 3, n * n * n + 1, n * n * 2, n * 6]; },
    why: function (n) {
      var w = {};
      w[n * n] = 'That squares it; check the rule against the second pair.';
      w[n * 3] = 'That triples it rather than cubing it.';
      return w;
    }
  };
  ANALOGY.mulSub = {
    f: function (n, p) { return n * p.m - p.k; },
    b: function (p) { return 1.35 + 0.15 * (p.m - 2) + 0.05 * p.k; },
    name: function (p) { return 'multiply by ' + p.m + ' then subtract ' + p.k; },
    hint: 'Try multiplying and then taking something away.',
    distract: function (n, p) { return [n * p.m, n * p.m + p.k, n * (p.m + 1) - p.k, n - p.k, n * p.m - p.k - 1]; },
    why: function (n, p) {
      var w = {};
      w[n * p.m] = 'That is ×' + p.m + ' with the −' + p.k + ' forgotten.';
      w[n * p.m + p.k] = 'That adds ' + p.k + ' where the rule subtracts it.';
      return w;
    }
  };

  [[2, 3, 4], [2, 3, 5]].forEach(function (seeds, si) {
    push(makeAnalogy('cube', {}, seeds, String(si)));
  });
  [3, 4].forEach(function (m) {
    [1, 2, 3].forEach(function (k) {
      [[3, 5, 7], [4, 6, 8]].forEach(function (seeds, si) {
        push(makeAnalogy('mulSub', { m: m, k: k }, seeds, m + '-' + k + '-' + si));
      });
    });
  });

  // Puzzles: a two-shape system that has to be solved in the right order.
  [[3, 5, 23, 4], [2, 7, 25, 3], [4, 3, 27, 5], [5, 2, 24, 4]].forEach(function (p, i) {
    var a = p[0], b0 = p[1], total = p[2], mult = p[3];
    // a x SQUARE + b0 = total  ->  SQUARE = (total - b0) / a
    if ((total - b0) % a !== 0) return;
    var sq = (total - b0) / a;
    var ans = sq * mult;
    if (ans <= 0) return;
    var w = {};
    w[total] = 'That is the total from the first line, not the value being asked for.';
    w[sq] = 'That is the square itself; the last line multiplies it by ' + mult + '.';
    push(makePuzzle('np-sys-' + i, 1.60 + 0.01 * ans,
      ['(' + a + ' × □) + ' + b0 + ' = ' + total, '? = □ × ' + mult], ans,
      [total, sq, ans + mult, ans - mult, sq + mult],
      'Solve the first line for the square before you touch the second.',
      [{ title: 'Peel the first line apart', text: 'Take the ' + b0 + ' off both sides: ' + a + ' × □ = ' + total + ' − ' + b0 + ' = ' + (total - b0) + '.' },
       { title: 'Solve for the shape', text: '□ = ' + (total - b0) + ' ÷ ' + a + ' = ' + sq + '.' },
       { title: 'Use the second line', text: '? = ' + sq + ' × ' + mult + ' = ' + ans + '.' }], w));
  });

  // Puzzles: two shapes related to each other in both directions.
  [[5, 3, 2], [7, 2, 3], [6, 4, 2], [8, 3, 3]].forEach(function (p, i) {
    var circ = p[0], diff = p[1], mult = p[2];
    var tri = circ + diff;
    var total = circ + tri;
    var ans = tri * mult - circ;
    if (ans <= 0) return;
    var w = {};
    w[tri * mult] = 'That forgets to subtract the circle at the end.';
    w[total] = 'That is the sum from the first line, not the final expression.';
    push(makePuzzle('np-two-' + i, 1.85 + 0.01 * ans,
      ['○ + △ = ' + total, '△ = ○ + ' + diff, '? = (△ × ' + mult + ') − ○'], ans,
      [tri * mult, total, ans + circ, ans - circ, tri],
      'Two unknowns, two facts. Combine them before substituting.',
      [{ title: 'Combine the two facts', text: 'Replace △ in the first line: ○ + (○ + ' + diff + ') = ' + total + ', so 2 × ○ = ' + (total - diff) + ' and ○ = ' + circ + '.' },
       { title: 'Back-substitute', text: '△ = ○ + ' + diff + ' = ' + tri + '.' },
       { title: 'Evaluate the last line', text: '? = (' + tri + ' × ' + mult + ') − ' + circ + ' = ' + (tri * mult) + ' − ' + circ + ' = ' + ans + '.' }], w));
  });

  return {
    items: items,
    hash: hash,
    multipleChoice: multipleChoice,
    whyFor: whyFor,
    SERIES: SERIES,
    ANALOGY: ANALOGY
  };
});

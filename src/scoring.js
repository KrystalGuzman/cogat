/*
 * scoring.js — CogAT-style score evaluator.
 *
 * IMPORTANT: the official CogAT norm tables are proprietary. Everything here is a
 * transparent, documented *emulation* of the reporting pipeline so that practice
 * results are interpretable in familiar units. Numbers produced here are not
 * official CogAT scores and must not be used for placement decisions.
 *
 * Pipeline (mirrors how CogAT reports are built):
 *
 *   raw responses
 *     -> ability estimate (theta) via a 3-parameter-logistic IRT model,
 *        estimated by EAP (expected a posteriori) over a quadrature grid
 *     -> Universal Scale Score (USS), an emulated cross-grade scale
 *     -> Standard Age Score (SAS), normalized to mean 100 / SD 16
 *     -> Age Percentile Rank (APR) and Age Stanine (1-9)
 *     -> VQN composite (average of the three battery scales, re-standardized)
 *     -> Ability Profile (median stanine + A/B/C/E pattern letter)
 *
 * Item difficulties (b) in the item bank are expressed on the grade-normative
 * theta scale, where theta ~ N(0, 1) for the target grade. Guessing (c) defaults
 * to 1 / (number of answer choices).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatScoring = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SAS_MEAN = 100;
  var SAS_SD = 16;
  var SAS_MIN = 50;
  var SAS_MAX = 160;

  // Typical published inter-battery correlation for V / Q / N.
  var BATTERY_R = 0.66;

  // Ability-profile thresholds (approximations of the confidence-band rules
  // used on real CogAT profile narratives).
  var SIGNIFICANT_SAS_DIFF = 8;   // relative strength / weakness
  var EXTREME_SAS_SPREAD = 24;    // "E" profile

  // Older-in-grade students score a little higher against *grade* norms; age
  // norms remove that edge. Roughly 0.12 SD of ability per year of age.
  var AGE_SLOPE_PER_YEAR = 0.12;

  var BATTERIES = ['verbal', 'quantitative', 'nonverbal'];

  var BATTERY_LABELS = {
    verbal: 'Verbal',
    quantitative: 'Quantitative',
    nonverbal: 'Nonverbal'
  };

  var BATTERY_CODE = { verbal: 'V', quantitative: 'Q', nonverbal: 'N' };

  // ---------------------------------------------------------------- math ---

  function erf(x) {
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    var a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var t = 1 / (1 + p * x);
    var y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  function normCdf(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // Quadrature grid for the EAP integral.
  var GRID = (function () {
    var g = [];
    for (var t = -4; t <= 4.0001; t += 0.05) g.push(Math.round(t * 1000) / 1000);
    return g;
  })();

  var GRID_PRIOR_LOG = GRID.map(function (t) { return -0.5 * t * t; });

  // ------------------------------------------------------------------ IRT ---

  /**
   * 3PL probability of a correct response.
   * @param {number} theta ability
   * @param {number} b item difficulty
   * @param {number} a item discrimination
   * @param {number} c pseudo-guessing lower asymptote
   */
  function pCorrect(theta, b, a, c) {
    if (a == null) a = 1;
    if (c == null) c = 0;
    var z = a * (theta - b);
    // Guard against overflow for extreme grids.
    var logistic = z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
    return c + (1 - c) * logistic;
  }

  function itemParams(item) {
    var nChoices = (item && item.choices && item.choices.length) || 4;
    return {
      b: item && typeof item.b === 'number' ? item.b : 0,
      a: item && typeof item.a === 'number' ? item.a : 1,
      c: item && typeof item.c === 'number' ? item.c : 1 / nChoices
    };
  }

  /**
   * EAP ability estimate.
   * @param {Array<{b:number,a:number,c:number,correct:boolean}>} responses
   * @returns {{theta:number, se:number, n:number, nCorrect:number}|null}
   */
  function estimateTheta(responses) {
    if (!responses || !responses.length) return null;

    var logLik = new Array(GRID.length);
    var i, j, r, p, maxLog = -Infinity;

    for (i = 0; i < GRID.length; i++) {
      var sum = GRID_PRIOR_LOG[i];
      for (j = 0; j < responses.length; j++) {
        r = responses[j];
        p = pCorrect(GRID[i], r.b, r.a, r.c);
        p = clamp(p, 1e-9, 1 - 1e-9);
        sum += r.correct ? Math.log(p) : Math.log(1 - p);
      }
      logLik[i] = sum;
      if (sum > maxLog) maxLog = sum;
    }

    var wSum = 0, tSum = 0, t2Sum = 0;
    for (i = 0; i < GRID.length; i++) {
      var w = Math.exp(logLik[i] - maxLog);
      wSum += w;
      tSum += w * GRID[i];
      t2Sum += w * GRID[i] * GRID[i];
    }

    var theta = tSum / wSum;
    var variance = Math.max(t2Sum / wSum - theta * theta, 1e-6);

    var nCorrect = 0;
    for (j = 0; j < responses.length; j++) if (responses[j].correct) nCorrect++;

    return {
      theta: theta,
      se: Math.sqrt(variance),
      n: responses.length,
      nCorrect: nCorrect
    };
  }

  // --------------------------------------------------------------- scales ---

  /** Emulated Universal Scale Score: a cross-grade scale anchored by grade. */
  function thetaToUSS(theta, grade) {
    var g = typeof grade === 'number' ? grade : 5;
    var base = 118 + 5.5 * g;
    return Math.round(base + 9 * theta);
  }

  function thetaToSAS(theta) {
    return Math.round(clamp(SAS_MEAN + SAS_SD * theta, SAS_MIN, SAS_MAX));
  }

  function thetaToPercentile(theta) {
    var pct = normCdf(theta) * 100;
    return clamp(Math.round(pct), 1, 99);
  }

  var STANINE_CUTS = [4, 11, 23, 40, 60, 77, 89, 96];

  function percentileToStanine(pct) {
    for (var i = 0; i < STANINE_CUTS.length; i++) {
      if (pct < STANINE_CUTS[i]) return i + 1;
    }
    return 9;
  }

  /** Median age in months for a grade at mid-year (K = grade 0). */
  function medianAgeMonths(grade) {
    return 66 + 12 * (typeof grade === 'number' ? grade : 5);
  }

  /**
   * Convert a grade-normative theta to an age-normative theta.
   * A student older than the grade median is compared against older peers, so
   * the same performance yields a slightly lower age-based score.
   */
  function ageAdjust(theta, grade, ageMonths) {
    if (typeof ageMonths !== 'number' || !isFinite(ageMonths)) return theta;
    var deltaYears = (ageMonths - medianAgeMonths(grade)) / 12;
    return theta - AGE_SLOPE_PER_YEAR * deltaYears;
  }

  // --------------------------------------------------------------- report ---

  /**
   * Score one battery.
   * @param {Array} items items presented (must carry id / b / a / c / answer)
   * @param {Object} answers map of itemId -> selected choice index
   * @param {{grade:number, ageMonths:number}} profile
   */
  function scoreBattery(items, answers, profile) {
    profile = profile || {};
    var grade = typeof profile.grade === 'number' ? profile.grade : 5;

    var responses = [];
    var detail = [];
    var attempted = 0;

    (items || []).forEach(function (item) {
      var params = itemParams(item);
      var selected = answers && Object.prototype.hasOwnProperty.call(answers, item.id)
        ? answers[item.id] : null;
      var answered = selected !== null && selected !== undefined;
      var correct = answered && selected === item.answer;
      if (answered) attempted++;
      // Omitted items are scored as incorrect, matching CogAT's number-right scoring.
      responses.push({ b: params.b, a: params.a, c: params.c, correct: !!correct });
      detail.push({
        id: item.id,
        subtest: item.subtest,
        b: params.b,
        selected: answered ? selected : null,
        answer: item.answer,
        correct: !!correct,
        answered: answered
      });
    });

    var est = estimateTheta(responses);
    if (!est) return null;

    var thetaGrade = est.theta;
    var thetaAge = ageAdjust(thetaGrade, grade, profile.ageMonths);

    var sas = thetaToSAS(thetaAge);
    var apr = thetaToPercentile(thetaAge);
    var gpr = thetaToPercentile(thetaGrade);

    return {
      raw: est.nCorrect,
      possible: responses.length,
      attempted: attempted,
      percentCorrect: responses.length ? Math.round((est.nCorrect / responses.length) * 100) : 0,
      theta: thetaGrade,
      thetaAge: thetaAge,
      se: est.se,
      uss: thetaToUSS(thetaAge, grade),
      sas: sas,
      sasBand: [
        thetaToSAS(thetaAge - est.se),
        thetaToSAS(thetaAge + est.se)
      ],
      apr: apr,
      gpr: gpr,
      stanine: percentileToStanine(apr),
      detail: detail
    };
  }

  /**
   * Composite of 1-3 battery results. Averaging correlated scales shrinks the
   * spread, so the mean is re-standardized before conversion — otherwise the
   * composite would systematically look closer to 100 than it should.
   */
  function composite(batteryResults, grade) {
    var thetas = [];
    Object.keys(batteryResults).forEach(function (key) {
      var r = batteryResults[key];
      if (r) thetas.push(r.thetaAge);
    });
    if (!thetas.length) return null;

    var k = thetas.length;
    var mean = thetas.reduce(function (a, b) { return a + b; }, 0) / k;
    var sdOfMean = Math.sqrt((1 + (k - 1) * BATTERY_R) / k);
    var z = mean / sdOfMean;

    return {
      batteriesIncluded: k,
      theta: z,
      uss: thetaToUSS(mean, grade),
      sas: thetaToSAS(z),
      apr: thetaToPercentile(z),
      stanine: percentileToStanine(thetaToPercentile(z))
    };
  }

  function median(values) {
    var s = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  /**
   * CogAT ability profile: a median stanine plus a pattern letter.
   *   A — all three batteries at about the same level
   *   B — one battery is a relative strength (+) or weakness (-)
   *   C — a contrast: at least one strength AND one weakness
   *   E — an extreme difference (>= 24 SAS points between the highest and lowest)
   */
  function abilityProfile(batteryResults) {
    var present = BATTERIES.filter(function (bat) { return batteryResults[bat]; });
    if (present.length < 3) {
      return {
        available: false,
        reason: 'An ability profile needs all three batteries (Verbal, Quantitative, Nonverbal).'
      };
    }

    var sasValues = present.map(function (bat) { return batteryResults[bat].sas; });
    var stanines = present.map(function (bat) { return batteryResults[bat].stanine; });
    var mean = sasValues.reduce(function (a, b) { return a + b; }, 0) / sasValues.length;
    var spread = Math.max.apply(null, sasValues) - Math.min.apply(null, sasValues);

    var marks = [];
    present.forEach(function (bat, i) {
      var diff = sasValues[i] - mean;
      if (Math.abs(diff) >= SIGNIFICANT_SAS_DIFF) {
        marks.push({
          battery: bat,
          code: BATTERY_CODE[bat] + (diff > 0 ? '+' : '-'),
          direction: diff > 0 ? 'strength' : 'weakness',
          diff: Math.round(diff)
        });
      }
    });

    var hasStrength = marks.some(function (m) { return m.direction === 'strength'; });
    var hasWeakness = marks.some(function (m) { return m.direction === 'weakness'; });

    var letter;
    if (spread >= EXTREME_SAS_SPREAD) letter = 'E';
    else if (!marks.length) letter = 'A';
    else if (hasStrength && hasWeakness) letter = 'C';
    else letter = 'B';

    var med = Math.round(median(stanines));
    var label = med + letter + (marks.length ? ' (' + marks.map(function (m) { return m.code; }).join(' ') + ')' : '');

    return {
      available: true,
      medianStanine: med,
      letter: letter,
      marks: marks,
      spread: spread,
      label: label,
      description: profileDescription(letter, marks, med)
    };
  }

  function profileDescription(letter, marks, medianStanine) {
    var level = medianStanine <= 3 ? 'below the average range'
      : medianStanine <= 6 ? 'in the average range'
      : 'above the average range';

    var names = marks.map(function (m) {
      return BATTERY_LABELS[m.battery] + ' (' + (m.direction === 'strength' ? 'strength' : 'weakness') + ')';
    }).join(', ');

    if (letter === 'A') {
      return 'Scores across the three batteries were about the same, ' + level + '. ' +
        'Reasoning strength is evenly balanced, so instruction does not need to lean on one channel.';
    }
    if (letter === 'B') {
      return 'One battery stands apart from the other two: ' + names + '. Overall performance is ' + level +
        '. Lessons can lead with the stronger channel and give extra scaffolding in the weaker one.';
    }
    if (letter === 'C') {
      return 'A contrast pattern — ' + names + '. Overall performance is ' + level +
        '. The gap is large enough to shape how new material is introduced.';
    }
    return 'An extreme difference of at least ' + EXTREME_SAS_SPREAD + ' SAS points separates the highest and ' +
      'lowest batteries (' + (names || 'across batteries') + '). Overall performance is ' + level +
      '. Very uneven profiles are worth re-testing before acting on them.';
  }

  function interpretSAS(sas) {
    if (sas >= 132) return 'Very high';
    if (sas >= 120) return 'Above average';
    if (sas >= 112) return 'High average';
    if (sas >= 89) return 'Average';
    if (sas >= 81) return 'Low average';
    if (sas >= 69) return 'Below average';
    return 'Very low';
  }

  /**
   * Full report.
   * @param {Object} opts
   * @param {Array}  opts.items every item that was presented
   * @param {Object} opts.answers itemId -> selected index
   * @param {number} opts.grade 0 = kindergarten
   * @param {number} [opts.ageMonths]
   */
  function scoreSession(opts) {
    opts = opts || {};
    var items = opts.items || [];
    var answers = opts.answers || {};
    var grade = typeof opts.grade === 'number' ? opts.grade : 5;
    var profile = { grade: grade, ageMonths: opts.ageMonths };

    var byBattery = {};
    items.forEach(function (item) {
      (byBattery[item.battery] = byBattery[item.battery] || []).push(item);
    });

    var batteries = {};
    BATTERIES.forEach(function (bat) {
      if (byBattery[bat] && byBattery[bat].length) {
        batteries[bat] = scoreBattery(byBattery[bat], answers, profile);
      }
    });

    var subtests = subtestBreakdown(items, answers);

    return {
      grade: grade,
      ageMonths: opts.ageMonths,
      batteries: batteries,
      composite: composite(batteries, grade),
      profile: abilityProfile(batteries),
      subtests: subtests,
      totals: {
        raw: BATTERIES.reduce(function (sum, b) { return sum + (batteries[b] ? batteries[b].raw : 0); }, 0),
        possible: BATTERIES.reduce(function (sum, b) { return sum + (batteries[b] ? batteries[b].possible : 0); }, 0)
      }
    };
  }

  /** Per-subtest correct counts — too few items each for a scaled score. */
  function subtestBreakdown(items, answers) {
    var map = {};
    (items || []).forEach(function (item) {
      var key = item.subtest;
      if (!map[key]) {
        map[key] = { subtest: key, battery: item.battery, raw: 0, possible: 0, missedIds: [] };
      }
      map[key].possible++;
      var selected = answers && Object.prototype.hasOwnProperty.call(answers, item.id) ? answers[item.id] : null;
      if (selected === item.answer) map[key].raw++;
      else map[key].missedIds.push(item.id);
    });
    return Object.keys(map).map(function (k) {
      var s = map[k];
      s.percentCorrect = s.possible ? Math.round((s.raw / s.possible) * 100) : 0;
      return s;
    });
  }

  return {
    BATTERIES: BATTERIES,
    BATTERY_LABELS: BATTERY_LABELS,
    SAS_MEAN: SAS_MEAN,
    SAS_SD: SAS_SD,
    SIGNIFICANT_SAS_DIFF: SIGNIFICANT_SAS_DIFF,
    EXTREME_SAS_SPREAD: EXTREME_SAS_SPREAD,
    pCorrect: pCorrect,
    estimateTheta: estimateTheta,
    normCdf: normCdf,
    thetaToSAS: thetaToSAS,
    thetaToUSS: thetaToUSS,
    thetaToPercentile: thetaToPercentile,
    percentileToStanine: percentileToStanine,
    medianAgeMonths: medianAgeMonths,
    ageAdjust: ageAdjust,
    scoreBattery: scoreBattery,
    composite: composite,
    abilityProfile: abilityProfile,
    interpretSAS: interpretSAS,
    subtestBreakdown: subtestBreakdown,
    scoreSession: scoreSession
  };
});

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
 *     -> ability estimate (theta) on a single ABSOLUTE cross-level scale, via a
 *        3-parameter-logistic IRT model estimated by EAP
 *     -> Universal Scale Score (USS), a linear map of that absolute scale
 *     -> Standard Age Score (SAS), theta re-expressed against the norm group for
 *        the student's AGE (mean 100 / SD 16); the grade percentile uses the
 *        norm group for their GRADE instead
 *     -> Age Percentile Rank (APR), Grade Percentile Rank (GPR), Age Stanine
 *     -> VQN composite (average of the three batteries, re-standardized)
 *     -> Ability Profile (median stanine + A/B/C/E pattern letter)
 *
 * WHY AN ABSOLUTE SCALE. A leveled test only makes sense if a given item has one
 * fixed difficulty and the *norm group* moves with the student. Item difficulties
 * (`b`) are therefore in logits on one scale shared by every level, and a grade
 * or age supplies a mean and SD on that same scale. A second grader and a tenth
 * grader answering the same item are compared against different peers, which is
 * exactly what a leveled, age-normed test does.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./levels.js'));
  } else {
    root.CogatScoring = factory(root.CogatLevels);
  }
})(typeof self !== 'undefined' ? self : this, function (Levels) {
  'use strict';

  var SAS_MEAN = 100;
  var SAS_SD = 16;
  var SAS_MIN = 50;
  var SAS_MAX = 160;

  // Typical published inter-battery correlation for V / Q / N.
  var BATTERY_R = 0.66;

  /*
   * Ability-profile significance.
   *
   * A battery counts as a relative strength or weakness when its distance from
   * the student's own three-battery average is larger than the measurement error
   * of that distance. PROFILE_Z sets the confidence required, and the choice is a
   * real trade-off. Simulating 3,000 students per condition on the Level 9 form
   * gives:
   *
   *     z     level student correctly called "A"   true 1-SD difference detected
   *     1.28                64%                              87%
   *     1.645               81%                              74%
   *     1.96                91%                              61%
   *     2.24                96%                              48%
   *
   * 1.96 is chosen deliberately: reporting a strength or weakness that is not
   * really there sends a family off chasing a phantom, which is worse than
   * staying silent about a real one that the subtest breakdown will still hint
   * at. test/profile-simulation.test.js measures the false-positive rate and
   * fails if this constant drifts away from that operating point.
   */
  var PROFILE_Z = 1.96;

  // An "E" profile additionally requires a gap this wide in SAS points.
  var EXTREME_SAS_SPREAD = 24;

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

  // Quadrature grid for the EAP integral, wide enough for every level.
  var GRID = (function () {
    var g = [];
    for (var t = -6; t <= 6.0001; t += 0.05) g.push(Math.round(t * 1000) / 1000);
    return g;
  })();

  // ------------------------------------------------------------------ IRT ---

  /**
   * 3PL probability of a correct response.
   * @param {number} theta ability on the absolute scale
   * @param {number} b item difficulty on the same scale
   * @param {number} a item discrimination
   * @param {number} c pseudo-guessing lower asymptote
   */
  function pCorrect(theta, b, a, c) {
    if (a == null) a = 1;
    if (c == null) c = 0;
    var z = a * (theta - b);
    var logistic = z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
    return c + (1 - c) * logistic;
  }

  /** Fisher information contributed by one 3PL item at a given ability. */
  function itemInformation(theta, b, a, c) {
    if (a == null) a = 1;
    if (c == null) c = 0;
    var p = clamp(pCorrect(theta, b, a, c), 1e-9, 1 - 1e-9);
    var num = a * a * Math.pow(p - c, 2) * (1 - p);
    var den = p * Math.pow(1 - c, 2);
    return num / den;
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
   * EAP ability estimate on the absolute scale.
   * @param {Array<{b,a,c,correct}>} responses
   * @param {{mean:number, sd:number}} [prior] norm group the student belongs to
   */
  function estimateTheta(responses, prior) {
    if (!responses || !responses.length) return null;
    var mean = prior && typeof prior.mean === 'number' ? prior.mean : 0;
    var sd = prior && typeof prior.sd === 'number' ? prior.sd : 1;

    var logLik = new Array(GRID.length);
    var i, j, r, p, maxLog = -Infinity;

    for (i = 0; i < GRID.length; i++) {
      var z = (GRID[i] - mean) / sd;
      var sum = -0.5 * z * z;
      for (j = 0; j < responses.length; j++) {
        r = responses[j];
        p = clamp(pCorrect(GRID[i], r.b, r.a, r.c), 1e-9, 1 - 1e-9);
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

  /** Emulated Universal Scale Score: one linear map of the absolute scale. */
  function thetaToUSS(theta) {
    return Math.round(150 + 20 * theta);
  }

  /** Express an absolute ability against a norm group. */
  function thetaToSAS(theta, norm) {
    var z = norm ? (theta - norm.mean) / norm.sd : theta;
    return Math.round(clamp(SAS_MEAN + SAS_SD * z, SAS_MIN, SAS_MAX));
  }

  function thetaToPercentile(theta, norm) {
    var z = norm ? (theta - norm.mean) / norm.sd : theta;
    return clamp(Math.round(normCdf(z) * 100), 1, 99);
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
   * The norm group for an age, by interpolating the same growth curve the grade
   * norms come from. This is why the age and grade percentiles differ: a student
   * old for their grade is measured against a higher-ability peer group.
   */
  function ageNorm(ageMonths) {
    var means = Levels.GRADE_MEAN;
    var gradeEquivalent = (ageMonths - 66) / 12;
    var lo = Math.floor(gradeEquivalent);
    var frac = gradeEquivalent - lo;

    var mean;
    if (lo < 0) {
      // Extrapolate below kindergarten using the first interval's slope.
      mean = means[0] + gradeEquivalent * (means[1] - means[0]);
    } else if (lo >= means.length - 1) {
      var last = means.length - 1;
      mean = means[last] + (gradeEquivalent - last) * (means[last] - means[last - 1]);
    } else {
      mean = means[lo] + frac * (means[lo + 1] - means[lo]);
    }
    return { mean: mean, sd: Levels.GRADE_SD, ageMonths: ageMonths };
  }

  function normsFor(grade, ageMonths) {
    var gradeN = Levels.gradeNorm(grade);
    var ageN = typeof ageMonths === 'number' && isFinite(ageMonths)
      ? ageNorm(ageMonths)
      : { mean: gradeN.mean, sd: gradeN.sd, ageMonths: medianAgeMonths(grade) };
    return { grade: gradeN, age: ageN };
  }

  // --------------------------------------------------------------- report ---

  /**
   * Score one battery.
   * @param {Array} items items presented
   * @param {Object} answers itemId -> selected choice index
   * @param {Object} norms from normsFor()
   */
  function scoreBattery(items, answers, norms) {
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
        id: item.id, subtest: item.subtest, b: params.b,
        selected: answered ? selected : null, answer: item.answer,
        correct: !!correct, answered: answered
      });
    });

    // The prior is the age norm group: that is the population the score describes.
    var est = estimateTheta(responses, norms.age);
    if (!est) return null;

    var theta = est.theta;
    var sasSe = SAS_SD * est.se / norms.age.sd;

    return {
      raw: est.nCorrect,
      possible: responses.length,
      attempted: attempted,
      percentCorrect: responses.length ? Math.round((est.nCorrect / responses.length) * 100) : 0,
      theta: theta,
      se: est.se,
      seSAS: sasSe,
      uss: thetaToUSS(theta),
      sas: thetaToSAS(theta, norms.age),
      sasBand: [
        thetaToSAS(theta - est.se, norms.age),
        thetaToSAS(theta + est.se, norms.age)
      ],
      apr: thetaToPercentile(theta, norms.age),
      gpr: thetaToPercentile(theta, norms.grade),
      stanine: percentileToStanine(thetaToPercentile(theta, norms.age)),
      detail: detail
    };
  }

  /**
   * Composite of 1-3 battery results. Averaging correlated scales shrinks the
   * spread, so the mean is re-standardized before conversion — otherwise the
   * composite would systematically look closer to 100 than it should.
   */
  function composite(batteryResults, norms) {
    var thetas = [];
    Object.keys(batteryResults).forEach(function (key) {
      var r = batteryResults[key];
      if (r) thetas.push(r.theta);
    });
    if (!thetas.length) return null;

    var k = thetas.length;
    var mean = thetas.reduce(function (a, b) { return a + b; }, 0) / k;
    var sdOfMean = Math.sqrt((1 + (k - 1) * BATTERY_R) / k);
    var effectiveNorm = { mean: norms.age.mean, sd: norms.age.sd * sdOfMean };
    var gradeNormEff = { mean: norms.grade.mean, sd: norms.grade.sd * sdOfMean };

    return {
      batteriesIncluded: k,
      theta: mean,
      uss: thetaToUSS(mean),
      sas: thetaToSAS(mean, effectiveNorm),
      apr: thetaToPercentile(mean, effectiveNorm),
      gpr: thetaToPercentile(mean, gradeNormEff),
      stanine: percentileToStanine(thetaToPercentile(mean, effectiveNorm))
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
   *   E — an extreme difference, at least EXTREME_SAS_SPREAD SAS points
   *
   * A battery is called out only when its distance from the student's own
   * three-battery average exceeds the measurement error of that distance. With
   * three batteries the deviation of one from the mean of all three is
   * (2/3)x_i - (1/3)x_j - (1/3)x_k, so its error variance is
   * (4 V_i + V_j + V_k) / 9. Using the real per-battery standard errors keeps
   * short tests from inventing strengths and weaknesses that are not there.
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
    var variances = present.map(function (bat) {
      var se = batteryResults[bat].seSAS;
      return se * se;
    });
    var stanines = present.map(function (bat) { return batteryResults[bat].stanine; });
    var mean = sasValues.reduce(function (a, b) { return a + b; }, 0) / sasValues.length;
    var spread = Math.max.apply(null, sasValues) - Math.min.apply(null, sasValues);

    var marks = [];
    var thresholds = [];
    present.forEach(function (bat, i) {
      var others = variances.filter(function (_, j) { return j !== i; });
      var seDiff = Math.sqrt((4 * variances[i] + others[0] + others[1]) / 9);
      var threshold = PROFILE_Z * seDiff;
      thresholds.push(threshold);

      var diff = sasValues[i] - mean;
      if (Math.abs(diff) >= threshold) {
        marks.push({
          battery: bat,
          code: BATTERY_CODE[bat] + (diff > 0 ? '+' : '-'),
          direction: diff > 0 ? 'strength' : 'weakness',
          diff: Math.round(diff),
          threshold: Math.round(threshold)
        });
      }
    });

    var hasStrength = marks.some(function (m) { return m.direction === 'strength'; });
    var hasWeakness = marks.some(function (m) { return m.direction === 'weakness'; });

    var letter;
    if (marks.length && spread >= EXTREME_SAS_SPREAD) letter = 'E';
    else if (!marks.length) letter = 'A';
    else if (hasStrength && hasWeakness) letter = 'C';
    else letter = 'B';

    var med = Math.round(median(stanines));
    var label = med + letter + (marks.length ? ' (' + marks.map(function (m) { return m.code; }).join(' ') + ')' : '');

    // The smallest gap this administration could have detected at all.
    var minDetectable = Math.round(Math.min.apply(null, thresholds));

    return {
      available: true,
      medianStanine: med,
      letter: letter,
      marks: marks,
      spread: spread,
      minDetectableDiff: minDetectable,
      label: label,
      description: profileDescription(letter, marks, med, minDetectable)
    };
  }

  function profileDescription(letter, marks, medianStanine, minDetectable) {
    var level = medianStanine <= 3 ? 'below the average range'
      : medianStanine <= 6 ? 'in the average range'
      : 'above the average range';

    var names = marks.map(function (m) {
      return BATTERY_LABELS[m.battery] + ' (' + (m.direction === 'strength' ? 'strength' : 'weakness') + ')';
    }).join(', ');

    if (letter === 'A') {
      return 'No battery differed from the other two by more than measurement error, and overall performance is ' +
        level + '. On this administration a gap smaller than about ' + minDetectable + ' SAS points could not be ' +
        'told apart from noise, so "level" here means "no difference large enough to detect", not "identical".';
    }
    if (letter === 'B') {
      return 'One battery stands apart from the other two: ' + names + '. Overall performance is ' + level +
        '. Lessons can lead with the stronger channel and give extra scaffolding in the weaker one.';
    }
    if (letter === 'C') {
      return 'A contrast pattern — ' + names + '. Overall performance is ' + level +
        '. The gap is larger than measurement error in both directions, so it is worth shaping instruction around.';
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
   * @param {Array}  opts.items every scored item that was presented
   * @param {Object} opts.answers itemId -> selected index
   * @param {number} opts.grade 0 = kindergarten
   * @param {number} [opts.ageMonths]
   */
  function scoreSession(opts) {
    opts = opts || {};
    var items = opts.items || [];
    var answers = opts.answers || {};
    var grade = typeof opts.grade === 'number' ? opts.grade : 5;
    var norms = normsFor(grade, opts.ageMonths);

    var byBattery = {};
    items.forEach(function (item) {
      (byBattery[item.battery] = byBattery[item.battery] || []).push(item);
    });

    var batteries = {};
    BATTERIES.forEach(function (bat) {
      if (byBattery[bat] && byBattery[bat].length) {
        batteries[bat] = scoreBattery(byBattery[bat], answers, norms);
      }
    });

    return {
      grade: grade,
      ageMonths: opts.ageMonths,
      level: opts.level || null,
      form: opts.form || null,
      norms: norms,
      batteries: batteries,
      composite: composite(batteries, norms),
      profile: abilityProfile(batteries),
      subtests: subtestBreakdown(items, answers),
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
    PROFILE_Z: PROFILE_Z,
    EXTREME_SAS_SPREAD: EXTREME_SAS_SPREAD,
    pCorrect: pCorrect,
    itemInformation: itemInformation,
    estimateTheta: estimateTheta,
    normCdf: normCdf,
    thetaToSAS: thetaToSAS,
    thetaToUSS: thetaToUSS,
    thetaToPercentile: thetaToPercentile,
    percentileToStanine: percentileToStanine,
    medianAgeMonths: medianAgeMonths,
    ageNorm: ageNorm,
    normsFor: normsFor,
    scoreBattery: scoreBattery,
    composite: composite,
    abilityProfile: abilityProfile,
    interpretSAS: interpretSAS,
    subtestBreakdown: subtestBreakdown,
    scoreSession: scoreSession
  };
});

/*
 * export.js — saving a score report.
 *
 * Four destinations, all offline and dependency-free:
 *   - a self-contained HTML document
 *   - the browser's print dialog (which is also "Save as PDF")
 *   - JSON, which this app can load back in
 *   - CSV, for a spreadsheet
 *
 * The saved document gets its own stylesheet (DOC_CSS) rather than the app's.
 * That is deliberate, not a copy: a page destined for paper or for a standalone
 * file wants a light-only, chrome-free, print-paginated design, and the app's
 * stylesheet cannot be read at runtime from a file:// origin anyway. The markup
 * builders are shared with the on-screen report, so only presentation differs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CogatExport = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FORMAT = 'cogat-practice-report';
  var FORMAT_VERSION = 1;

  var DOC_CSS = [
    '@page { margin: 14mm; }',
    '.cogat-doc {',
    '  --ink: #14181f; --dim: #5b6675; --line: #d9dee6; --soft: #f2f4f7;',
    '  --accent: #2f5fd0; --good: #1a7f4b; --bad: #b3261e;',
    '  color: var(--ink); background: #fff; max-width: 820px; margin: 0 auto; padding: 24px 20px 40px;',
    '  font: 13px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
    '}',
    '.cogat-doc * { box-sizing: border-box; }',
    '.cogat-doc h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -.01em; }',
    '.cogat-doc h2 { font-size: 15px; margin: 0 0 10px; padding-bottom: 5px; border-bottom: 2px solid var(--ink); }',
    '.cogat-doc h3 { font-size: 13px; margin: 0 0 4px; }',
    '.cogat-doc p { margin: 0 0 8px; }',

    '.cogat-doc .doc-head { border-bottom: 3px solid var(--ink); padding-bottom: 12px; margin-bottom: 18px; }',
    '.cogat-doc .doc-meta { color: var(--dim); font-size: 12px; }',
    '.cogat-doc .doc-meta span { margin-right: 14px; white-space: nowrap; }',
    '.cogat-doc .doc-section { margin-bottom: 22px; }',

    '.cogat-doc .doc-summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }',
    '.cogat-doc .doc-stat { border: 1px solid var(--line); border-radius: 7px; padding: 9px 14px; min-width: 108px; background: var(--soft); }',
    '.cogat-doc .doc-stat .v { font-size: 21px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }',
    '.cogat-doc .doc-stat .k { font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--dim); margin-top: 3px; }',
    '.cogat-doc .doc-stat.lead { background: var(--accent); border-color: var(--accent); color: #fff; }',
    '.cogat-doc .doc-stat.lead .k { color: rgba(255,255,255,.85); }',

    '.cogat-doc table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 12px; }',
    '.cogat-doc th, .cogat-doc td { text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--line); }',
    '.cogat-doc th:first-child, .cogat-doc td:first-child { text-align: left; }',
    '.cogat-doc thead th { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--dim); border-bottom: 1.5px solid var(--ink); }',

    '.cogat-doc .doc-profile-tag { display: inline-block; font-size: 19px; font-weight: 700; padding: 4px 13px; border: 2px solid var(--accent); color: var(--accent); border-radius: 7px; margin-bottom: 8px; }',
    '.cogat-doc .doc-marks { margin-top: 6px; }',
    '.cogat-doc .doc-mark { display: inline-block; font-size: 11px; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--line); margin: 0 6px 5px 0; }',
    '.cogat-doc .doc-mark.up { color: var(--good); border-color: var(--good); }',
    '.cogat-doc .doc-mark.down { color: var(--bad); border-color: var(--bad); }',

    '.cogat-doc dl { margin: 0; font-size: 11.5px; color: var(--dim); }',
    '.cogat-doc dt { font-weight: 650; color: var(--ink); margin-top: 7px; }',
    '.cogat-doc dd { margin: 1px 0 0; }',

    /* Answer review, reusing the app's stem and choice markup. */
    '.cogat-doc .doc-item { border-top: 1px solid var(--line); padding: 12px 0; page-break-inside: avoid; break-inside: avoid; }',
    '.cogat-doc .doc-item-head { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 8px; }',
    '.cogat-doc .doc-tag { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--dim); }',
    '.cogat-doc .doc-tag.ok { color: var(--good); border-color: var(--good); }',
    '.cogat-doc .doc-tag.no { color: var(--bad); border-color: var(--bad); }',
    '.cogat-doc .doc-tag.skip { color: #8a5a00; border-color: #8a5a00; }',
    '.cogat-doc .spacer { flex: 1; }',

    '.cogat-doc .stem { margin: 5px 0 12px; }',
    '.cogat-doc .analogy, .cogat-doc .wordset, .cogat-doc .series { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; font-size: 14px; }',
    '.cogat-doc .analogy .pair, .cogat-doc .wordset span, .cogat-doc .series span { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--soft); }',
    '.cogat-doc .analogy .sep, .cogat-doc .analogy .arrow { color: var(--dim); border: 0; background: none; padding: 0; }',
    '.cogat-doc .blankmark, .cogat-doc .series span.q { color: var(--accent); font-weight: 700; }',
    '.cogat-doc .sentence { font-size: 14px; line-height: 1.7; }',
    '.cogat-doc .sentence .blank { display: inline-block; min-width: 82px; border-bottom: 2px solid var(--accent); }',
    '.cogat-doc .puzzle-lines { display: flex; flex-direction: column; gap: 5px; }',
    '.cogat-doc .puzzle-lines code { font: inherit; font-size: 14px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--soft); align-self: flex-start; }',

    '.cogat-doc .matrix { display: inline-grid; gap: 4px; padding: 5px; background: var(--soft); border-radius: 7px; }',
    '.cogat-doc .matrix .cell, .cogat-doc .figclass .cell { width: 62px; height: 62px; display: grid; place-items: center; background: #fff; border: 1px solid var(--line); border-radius: 5px; }',
    '.cogat-doc .figclass { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }',
    '.cogat-doc .matrix .cell.empty, .cogat-doc .figclass .cell.q { border-style: dashed; border-color: var(--accent); }',
    '.cogat-doc .matrix .cell.empty::after, .cogat-doc .figclass .cell.q::after { content: "?"; color: var(--accent); font-size: 20px; font-weight: 700; }',
    '.cogat-doc .figseq { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px; }',
    '.cogat-doc .figseq .panel { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 96px; }',
    '.cogat-doc .figseq .panel .frame { width: 80px; height: 80px; display: grid; place-items: center; background: var(--soft); border: 1px solid var(--line); border-radius: 5px; }',
    '.cogat-doc .figseq .caption { font-size: 9.5px; color: var(--dim); text-align: center; line-height: 1.3; }',
    '.cogat-doc .seq-arrow { align-self: center; margin-top: 26px; color: var(--dim); }',

    '.cogat-doc .choices { display: grid; gap: 6px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }',
    '.cogat-doc .choices-fig { grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); }',
    '.cogat-doc .choice { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 6px; background: #fff; font: inherit; color: var(--ink); text-align: left; }',
    '.cogat-doc .choices-fig .choice { flex-direction: column; gap: 4px; }',
    '.cogat-doc .choice .key { flex: none; width: 20px; height: 20px; border-radius: 4px; display: grid; place-items: center; font-size: 10px; font-weight: 700; border: 1px solid var(--line); color: var(--dim); }',
    '.cogat-doc .choice.correct { border-color: var(--good); background: #e2f4ea; }',
    '.cogat-doc .choice.correct .key { background: var(--good); border-color: var(--good); color: #fff; }',
    '.cogat-doc .choice.wrong { border-color: var(--bad); background: #fbe6e4; }',
    '.cogat-doc .choice.wrong .key { background: var(--bad); border-color: var(--bad); color: #fff; }',
    '.cogat-doc .figbox { width: 62px; height: 62px; padding: 4px; display: grid; place-items: center; }',

    '.cogat-doc .walkthrough { margin-top: 10px; }',
    '.cogat-doc .walkthrough h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--dim); }',
    '.cogat-doc .walkthrough ol { margin: 0; padding-left: 0; list-style: none; counter-reset: step; }',
    '.cogat-doc .walkthrough li { counter-increment: step; position: relative; padding: 0 0 9px 30px; }',
    '.cogat-doc .walkthrough li::before { content: counter(step); position: absolute; left: 0; top: 1px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; font-size: 10px; font-weight: 700; background: var(--accent); color: #fff; }',
    '.cogat-doc .walkthrough .step-title { font-weight: 650; }',
    '.cogat-doc .walkthrough .step-body { color: var(--dim); }',

    '.cogat-doc .fig { width: 100%; height: 100%; display: block; overflow: visible; }',
    '.cogat-doc .fig-shape { stroke: var(--ink); stroke-width: 2.4; vector-effect: non-scaling-stroke; }',
    '.cogat-doc .fig-fill-none { fill: none; }',
    '.cogat-doc .fig-fill-solid { fill: var(--ink); }',
    '.cogat-doc .fig-fill-paper { fill: #fff; }',
    '.cogat-doc .fig-frame { fill: none; stroke: var(--line); }',
    '.cogat-doc .fig-line { stroke: var(--ink); fill: none; }',
    '.cogat-doc .fig-dashed { stroke-dasharray: 5 4; stroke: var(--dim); }',

    '.cogat-doc .doc-foot { margin-top: 26px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--dim); font-size: 10.5px; }',
    '.cogat-doc .page-break { page-break-before: always; break-before: page; }',
    '@media print { .cogat-doc { padding: 0; max-width: none; } }'
  ].join('\n');

  // ---------------------------------------------------------------- files ---

  function slugify(text) {
    return String(text || 'report').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'report';
  }

  /** cogat-report-full-practice-test-2026-08-31.html */
  function filename(label, ext, when) {
    var d = when ? new Date(when) : new Date();
    var stamp = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
    return 'cogat-report-' + slugify(label) + '-' + stamp + '.' + ext;
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Wrap already-built body markup in a standalone HTML document. */
  function wrapDocument(title, bodyHtml) {
    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + escapeHtml(title) + '</title>',
      '<style>',
      'html, body { margin: 0; padding: 0; background: #fff; }',
      DOC_CSS,
      '</style>',
      '</head>',
      '<body>',
      bodyHtml,
      '</body>',
      '</html>'
    ].join('\n');
  }

  // ----------------------------------------------------------------- JSON ---

  function trimBattery(b) {
    if (!b) return null;
    return {
      raw: b.raw, possible: b.possible, attempted: b.attempted,
      percentCorrect: b.percentCorrect,
      theta: round(b.thetaAge, 4), se: round(b.se, 4),
      uss: b.uss, sas: b.sas, sasBand: b.sasBand,
      agePercentile: b.apr, gradePercentile: b.gpr, stanine: b.stanine
    };
  }

  function round(n, places) {
    if (typeof n !== 'number') return n;
    var f = Math.pow(10, places);
    return Math.round(n * f) / f;
  }

  /**
   * @param {Object} payload { report, label, grade, ageMonths, itemIds, answers, takenAt }
   * @returns {string} pretty-printed JSON that toJSON's own importer accepts
   */
  function toJSON(payload) {
    var r = payload.report;
    var batteries = {};
    Object.keys(r.batteries || {}).forEach(function (k) {
      batteries[k] = trimBattery(r.batteries[k]);
    });

    return JSON.stringify({
      format: FORMAT,
      version: FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      takenAt: payload.takenAt ? new Date(payload.takenAt).toISOString() : null,
      label: payload.label,
      learner: { grade: payload.grade, ageMonths: payload.ageMonths },
      timedOut: !!r.timedOut,
      elapsedSec: r.elapsedSec != null ? Math.round(r.elapsedSec) : null,
      scores: {
        totals: r.totals,
        composite: r.composite ? {
          batteriesIncluded: r.composite.batteriesIncluded,
          uss: r.composite.uss, sas: r.composite.sas,
          agePercentile: r.composite.apr, stanine: r.composite.stanine
        } : null,
        profile: r.profile && r.profile.available ? {
          label: r.profile.label, medianStanine: r.profile.medianStanine,
          letter: r.profile.letter, spread: r.profile.spread,
          marks: r.profile.marks, description: r.profile.description
        } : null,
        batteries: batteries,
        subtests: (r.subtests || []).map(function (s) {
          return {
            subtest: s.subtest, battery: s.battery,
            raw: s.raw, possible: s.possible, percentCorrect: s.percentCorrect,
            missedIds: s.missedIds
          };
        })
      },
      // Enough to reconstruct and re-score the session on import.
      itemIds: payload.itemIds,
      answers: payload.answers
    }, null, 2);
  }

  /**
   * Validate a parsed JSON export before trusting it.
   * @returns {{ok:boolean, error?:string, data?:Object}}
   */
  function parseSavedReport(text) {
    var data;
    try { data = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'That file is not valid JSON.' }; }

    if (!data || typeof data !== 'object') return { ok: false, error: 'That file does not contain a report.' };
    if (data.format !== FORMAT) {
      return { ok: false, error: 'That file is not a CogAT practice report (its format is "' + (data.format || 'unknown') + '").' };
    }
    if (data.version > FORMAT_VERSION) {
      return { ok: false, error: 'That report was saved by a newer version of this app (format version ' + data.version + ').' };
    }
    if (!Array.isArray(data.itemIds) || !data.itemIds.length) {
      return { ok: false, error: 'That report does not list the questions it used, so it cannot be reopened.' };
    }
    if (!data.answers || typeof data.answers !== 'object') {
      return { ok: false, error: 'That report is missing its answers.' };
    }
    return { ok: true, data: data };
  }

  // ------------------------------------------------------------------ CSV ---

  function csvCell(value) {
    if (value === null || value === undefined) return '';
    var s = String(value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  var CSV_COLUMNS = [
    'section', 'name', 'battery', 'raw', 'possible', 'percent_correct',
    'uss', 'sas', 'sas_low', 'sas_high', 'age_percentile', 'grade_percentile', 'stanine'
  ];

  /**
   * One tidy table: a `section` column distinguishes composite, battery and
   * subtest rows so the whole report drops into a spreadsheet as a single sheet.
   */
  function toCSV(report, names) {
    names = names || {};
    var rows = [CSV_COLUMNS];

    if (report.composite) {
      var c = report.composite;
      var compositeName = c.batteriesIncluded === 3 ? 'VQN composite' : 'Composite';
      rows.push(['composite', compositeName, '', report.totals.raw, report.totals.possible,
        report.totals.possible ? Math.round(report.totals.raw / report.totals.possible * 100) : '',
        c.uss, c.sas, '', '', c.apr, '', c.stanine]);
    }

    ['verbal', 'quantitative', 'nonverbal'].forEach(function (key) {
      var b = report.batteries[key];
      if (!b) return;
      rows.push(['battery', names.batteries && names.batteries[key] || key, key,
        b.raw, b.possible, b.percentCorrect, b.uss, b.sas,
        b.sasBand[0], b.sasBand[1], b.apr, b.gpr, b.stanine]);
    });

    (report.subtests || []).forEach(function (s) {
      rows.push(['subtest', names.subtests && names.subtests[s.subtest] || s.subtest, s.battery,
        s.raw, s.possible, s.percentCorrect, '', '', '', '', '', '', '']);
    });

    return rows.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }

  return {
    FORMAT: FORMAT,
    FORMAT_VERSION: FORMAT_VERSION,
    DOC_CSS: DOC_CSS,
    CSV_COLUMNS: CSV_COLUMNS,
    slugify: slugify,
    filename: filename,
    escapeHtml: escapeHtml,
    wrapDocument: wrapDocument,
    download: download,
    toJSON: toJSON,
    parseSavedReport: parseSavedReport,
    toCSV: toCSV
  };
});

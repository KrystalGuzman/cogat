/* app.js — screens, navigation and rendering for the practice app. */
(function () {
  'use strict';

  var Scoring = window.CogatScoring;
  var Bank = window.CogatBank;
  var Figures = window.Figures;

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var STORE_PROFILE = 'cogat.profile.v1';
  var STORE_HISTORY = 'cogat.history.v1';

  var BATTERY_ORDER = ['verbal', 'quantitative', 'nonverbal'];
  var SUBTEST_ORDER = [
    'verbal-analogies', 'sentence-completion', 'verbal-classification',
    'number-analogies', 'number-puzzles', 'number-series',
    'figure-matrices', 'figure-classification', 'paper-folding'
  ];

  var app = document.getElementById('app');
  var timerEl = document.getElementById('timer');
  var homeBtn = document.getElementById('btn-home');

  var state = {
    screen: 'home',
    profile: loadProfile(),
    session: null,
    practice: null,
    report: null
  };

  var tickHandle = null;

  // ------------------------------------------------------------- storage ---

  function loadProfile() {
    var fallback = { grade: 3, ageYears: 8, ageExtraMonths: 6 };
    try {
      var raw = localStorage.getItem(STORE_PROFILE);
      return raw ? Object.assign(fallback, JSON.parse(raw)) : fallback;
    } catch (e) { return fallback; }
  }

  function saveProfile() {
    try { localStorage.setItem(STORE_PROFILE, JSON.stringify(state.profile)); } catch (e) { /* private mode */ }
  }

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORE_HISTORY) || '[]'); } catch (e) { return []; }
  }

  function saveHistoryEntry(entry) {
    try {
      var list = loadHistory();
      list.unshift(entry);
      localStorage.setItem(STORE_HISTORY, JSON.stringify(list.slice(0, 12)));
    } catch (e) { /* private mode */ }
  }

  function ageMonths() {
    return state.profile.ageYears * 12 + state.profile.ageExtraMonths;
  }

  // ---------------------------------------------------------------- DOM ----

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    });
    [].concat(children === undefined ? [] : children).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function mount(nodes) {
    clear(app);
    [].concat(nodes).forEach(function (n) { if (n) app.appendChild(n); });
    window.scrollTo(0, 0);
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    return m + ':' + String(sec % 60).padStart(2, '0');
  }

  // ---------------------------------------------------------- item lookup ---

  function itemsForSubtest(id) {
    return Bank.items.filter(function (i) { return i.subtest === id; });
  }

  function itemsForBattery(battery) {
    var out = [];
    SUBTEST_ORDER.forEach(function (s) {
      if (Bank.subtests[s].battery === battery) out = out.concat(itemsForSubtest(s));
    });
    return out;
  }

  function allItems() {
    var out = [];
    BATTERY_ORDER.forEach(function (b) { out = out.concat(itemsForBattery(b)); });
    return out;
  }

  function timeBudget(items) {
    return items.reduce(function (sum, i) {
      return sum + (Bank.subtests[i.subtest].timePerItemSec || 45);
    }, 0);
  }

  // ------------------------------------------------------- stem rendering ---

  function figBox(fig, cls) {
    return h('div', { class: cls || 'figbox' }, [Figures.render(fig)]);
  }

  function renderStem(item) {
    var s = item.stem;

    if (s.kind === 'analogy') {
      var parts = [];
      s.pairs.forEach(function (pair, i) {
        if (i) parts.push(h('span', { class: 'sep', text: ':' }));
        parts.push(h('span', { class: 'pair' }, [
          h('span', { text: pair[0] }),
          h('span', { class: 'arrow', text: '→' }),
          pair[1] === '?' || pair[1] === null
            ? h('span', { class: 'blankmark', text: '?' })
            : h('span', { text: pair[1] })
        ]));
      });
      return h('div', { class: 'stem analogy' }, parts);
    }

    if (s.kind === 'numAnalogy') {
      var np = [];
      s.pairs.forEach(function (pair, i) {
        if (i) np.push(h('span', { class: 'sep', text: ':' }));
        np.push(h('span', { class: 'pair' }, [
          h('span', { text: String(pair[0]) }),
          h('span', { class: 'arrow', text: '→' }),
          pair[1] === null
            ? h('span', { class: 'blankmark', text: '?' })
            : h('span', { text: String(pair[1]) })
        ]));
      });
      return h('div', { class: 'stem analogy' }, np);
    }

    if (s.kind === 'sentence') {
      var pieces = s.text.split('____');
      return h('div', { class: 'stem sentence' }, [
        document.createTextNode(pieces[0]),
        h('span', { class: 'blank' }),
        document.createTextNode(pieces[1] || '')
      ]);
    }

    if (s.kind === 'classification') {
      return h('div', { class: 'stem' }, [
        h('div', { class: 'wordset' }, s.given.map(function (w) {
          return h('span', { text: w });
        }).concat([h('span', { class: 'blankmark', text: '?' })]))
      ]);
    }

    if (s.kind === 'puzzle') {
      return h('div', { class: 'stem puzzle-lines' }, s.lines.map(function (line) {
        return h('code', { text: line });
      }));
    }

    if (s.kind === 'series') {
      return h('div', { class: 'stem series' }, s.values.map(function (v) {
        return h('span', { text: String(v) });
      }).concat([h('span', { class: 'q', text: '?' })]));
    }

    if (s.kind === 'matrix') {
      var grid = h('div', { class: 'matrix', style: 'grid-template-columns: repeat(' + s.cols + ', auto)' },
        s.cells.map(function (cell) {
          return cell
            ? h('div', { class: 'cell' }, [Figures.render(cell)])
            : h('div', { class: 'cell empty' });
        }));
      return h('div', { class: 'stem' }, [grid]);
    }

    if (s.kind === 'figClass') {
      return h('div', { class: 'stem' }, [
        h('div', { class: 'figclass' }, s.given.map(function (f) {
          return h('div', { class: 'cell' }, [Figures.render(f)]);
        }).concat([h('div', { class: 'cell q' })]))
      ]);
    }

    if (s.kind === 'figSeq') {
      var panels = [];
      s.figs.forEach(function (p, i) {
        if (i) panels.push(h('span', { class: 'seq-arrow', text: '→' }));
        panels.push(h('div', { class: 'panel' }, [
          h('div', { class: 'frame' }, [Figures.render(p.fig)]),
          p.caption ? h('div', { class: 'caption', text: p.caption }) : null
        ]));
      });
      return h('div', { class: 'stem' }, [h('div', { class: 'figseq' }, panels)]);
    }

    return h('div', { class: 'stem', text: '(unrenderable item)' });
  }

  function isFigureChoice(choice) {
    return choice && typeof choice === 'object' && choice.fig;
  }

  /**
   * @param {Object} item
   * @param {number|null} selected
   * @param {Function} onPick
   * @param {Object} [reveal] { correct: true } to colour in the right/wrong answers
   */
  function renderChoices(item, selected, onPick, reveal) {
    var figures = isFigureChoice(item.choices[0]);
    var wrap = h('div', { class: 'choices' + (figures ? ' choices-fig' : '') });

    item.choices.forEach(function (choice, i) {
      var cls = 'choice';
      if (selected === i) cls += ' selected';
      if (reveal) {
        if (i === item.answer) cls = 'choice correct';
        else if (selected === i) cls = 'choice wrong';
      }
      var body = figures
        ? figBox(choice.fig)
        : h('span', { class: 'label', text: String(choice) });

      wrap.appendChild(h('button', {
        class: cls,
        type: 'button',
        disabled: !!reveal,
        'aria-pressed': selected === i ? 'true' : 'false',
        onclick: function () { if (!reveal) onPick(i); }
      }, [h('span', { class: 'key', text: LETTERS[i] }), body]));
    });

    return wrap;
  }

  function renderWalkthrough(item, selected) {
    var kids = [h('h3', { text: 'How to solve it' })];
    kids.push(h('ol', {}, item.walkthrough.map(function (step) {
      return h('li', {}, [
        h('div', { class: 'step-title', text: step.title }),
        h('div', { class: 'step-body', text: step.text })
      ]);
    })));

    var note = item.why && selected !== null && selected !== undefined
      && selected !== item.answer && item.why[selected];
    if (note) {
      kids.push(h('p', { class: 'step-body' }, [
        h('strong', { text: 'Why ' + LETTERS[selected] + ' does not work: ' }),
        document.createTextNode(note)
      ]));
    }
    return h('div', { class: 'walkthrough' }, kids);
  }

  // ---------------------------------------------------------- home screen ---

  function gradeLabel(g) { return g === 0 ? 'Kindergarten' : 'Grade ' + g; }

  function renderHome() {
    stopTimer();
    timerEl.hidden = true;
    homeBtn.hidden = true;

    var intro = h('div', { class: 'card' }, [
      h('h1', { text: 'CogAT-style practice and score evaluator' }),
      h('p', { class: 'lede', text: 'Nine subtests across the three classic batteries — Verbal, Quantitative and Nonverbal — with a full score report and a worked walkthrough for every single question.' })
    ]);

    var setup = h('div', { class: 'card card-tight' }, [
      h('h3', { text: 'Who is testing?' }),
      h('div', { class: 'setup-row' }, [
        h('div', { class: 'field' }, [
          h('label', { for: 'grade', text: 'Grade level' }),
          (function () {
            var sel = h('select', { id: 'grade', onchange: function (e) {
              state.profile.grade = Number(e.target.value); saveProfile();
            } });
            for (var g = 0; g <= 12; g++) {
              sel.appendChild(h('option', {
                value: g, text: gradeLabel(g), selected: g === state.profile.grade
              }));
            }
            return sel;
          })()
        ]),
        h('div', { class: 'field' }, [
          h('label', { for: 'ageY', text: 'Age (years)' }),
          h('input', {
            id: 'ageY', type: 'number', min: 4, max: 19, value: state.profile.ageYears,
            onchange: function (e) { state.profile.ageYears = Number(e.target.value) || 8; saveProfile(); }
          })
        ]),
        h('div', { class: 'field' }, [
          h('label', { for: 'ageM', text: '+ months' }),
          h('input', {
            id: 'ageM', type: 'number', min: 0, max: 11, value: state.profile.ageExtraMonths,
            onchange: function (e) {
              state.profile.ageExtraMonths = Math.min(11, Math.max(0, Number(e.target.value) || 0));
              saveProfile();
            }
          })
        ])
      ]),
      h('p', { class: 'lede', style: 'margin-top:12px;font-size:.86rem',
        text: 'Grade sets which norm group the raw score is compared against. Age is used to separate the age-based score (SAS / APR) from the grade-based percentile.' })
    ]);

    var full = allItems();
    var modes = h('div', { class: 'card' }, [
      h('h2', { text: 'Choose a mode' }),
      h('div', { class: 'mode-grid' }, [
        h('button', { class: 'mode-card', type: 'button', onclick: function () { startTest(full, 'Full practice test'); } }, [
          h('h3', { text: 'Full practice test' }),
          h('p', { text: 'All nine subtests, timed and scored end to end. Produces the complete report with battery scores, the VQN composite and an ability profile.' }),
          h('span', { class: 'meta', text: full.length + ' questions · about ' + Math.round(timeBudget(full) / 60) + ' minutes' })
        ])
      ].concat(BATTERY_ORDER.map(function (b) {
        var items = itemsForBattery(b);
        return h('button', { class: 'mode-card', type: 'button', onclick: function () {
          startTest(items, Scoring.BATTERY_LABELS[b] + ' battery');
        } }, [
          h('h3', { text: Scoring.BATTERY_LABELS[b] + ' battery' }),
          h('p', { text: batteryBlurb(b) }),
          h('span', { class: 'meta', text: items.length + ' questions · about ' + Math.round(timeBudget(items) / 60) + ' minutes' })
        ]);
      })))
    ]);

    var practice = h('div', { class: 'card' }, [
      h('h2', { text: 'Practice one subtest' }),
      h('p', { class: 'lede', text: 'Untimed. Take a hint when you want one, then check your answer and read the full walkthrough before moving on.' }),
      h('div', { class: 'mode-grid' }, SUBTEST_ORDER.map(function (id) {
        var meta = Bank.subtests[id];
        return h('button', { class: 'mode-card', type: 'button', onclick: function () { startPractice(id); } }, [
          h('h3', { text: meta.name }),
          h('p', { text: meta.blurb }),
          h('span', { class: 'meta', text: Scoring.BATTERY_LABELS[meta.battery] + ' · ' + itemsForSubtest(id).length + ' questions' })
        ]);
      }))
    ]);

    var history = loadHistory();
    var historyCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Recent results' }),
      history.length
        ? h('ul', { class: 'history' }, history.map(function (entry) {
            return h('li', {}, [
              h('strong', { text: entry.label }),
              h('span', { class: 'pill', text: entry.raw + '/' + entry.possible + ' correct' }),
              entry.sas ? h('span', { class: 'pill', text: 'SAS ' + entry.sas }) : null,
              entry.profile ? h('span', { class: 'pill', text: 'Profile ' + entry.profile }) : null,
              h('span', { class: 'spacer' }),
              h('span', { class: 'when', text: new Date(entry.at).toLocaleString() })
            ]);
          }))
        : h('p', { class: 'empty', text: 'No completed tests yet.' })
    ]);

    mount([intro, setup, modes, practice, historyCard, scoringExplainer()]);
  }

  function batteryBlurb(b) {
    if (b === 'verbal') return 'Verbal Analogies, Sentence Completion and Verbal Classification — reasoning with words and meaning.';
    if (b === 'quantitative') return 'Number Analogies, Number Puzzles and Number Series — reasoning with quantity and relationships between numbers.';
    return 'Figure Matrices, Figure Classification and Paper Folding — reasoning with shapes, with no words or numbers involved.';
  }

  // ---------------------------------------------------------- test screen ---

  function startTest(items, label) {
    state.session = {
      label: label,
      items: items,
      index: 0,
      answers: {},
      flagged: {},
      startedAt: Date.now(),
      limitSec: timeBudget(items)
    };
    state.screen = 'test';
    homeBtn.hidden = false;
    startTimer();
    renderTest();
  }

  function startTimer() {
    stopTimer();
    timerEl.hidden = false;
    tick();
    tickHandle = setInterval(tick, 500);
  }

  function stopTimer() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
  }

  function remainingSec() {
    var s = state.session;
    if (!s) return 0;
    return s.limitSec - (Date.now() - s.startedAt) / 1000;
  }

  function tick() {
    var left = remainingSec();
    timerEl.textContent = fmtTime(left);
    timerEl.classList.toggle('is-low', left <= 60);
    if (left <= 0) {
      stopTimer();
      finishTest(true);
    }
  }

  function renderTest() {
    var s = state.session;
    var item = s.items[s.index];
    var meta = Bank.subtests[item.subtest];
    var selected = s.answers[item.id] === undefined ? null : s.answers[item.id];

    var head = h('div', {}, [
      h('div', { class: 'qhead' }, [
        h('span', { class: 'subtest', text: meta.name }),
        h('span', { class: 'count', text: 'Question ' + (s.index + 1) + ' of ' + s.items.length }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'count', text: Scoring.BATTERY_LABELS[meta.battery] })
      ]),
      h('div', { class: 'progress' }, [
        h('span', { style: 'width:' + ((s.index + 1) / s.items.length * 100) + '%' })
      ])
    ]);

    var card = h('div', { class: 'card' }, [
      h('div', { class: 'directions', text: meta.directions }),
      renderStem(item),
      renderChoices(item, selected, function (i) {
        s.answers[item.id] = i;
        if (s.index < s.items.length - 1) { s.index++; renderTest(); }
        else renderTest();
      }),
      h('div', { class: 'navbar' }, [
        h('button', { class: 'btn', type: 'button', disabled: s.index === 0,
          onclick: function () { s.index--; renderTest(); } }, ['← Back']),
        h('button', {
          class: 'btn' + (s.flagged[item.id] ? ' btn-primary' : ''), type: 'button',
          onclick: function () { s.flagged[item.id] = !s.flagged[item.id]; renderTest(); }
        }, [s.flagged[item.id] ? '⚑ Flagged' : '⚐ Flag for review']),
        h('button', { class: 'btn', type: 'button',
          onclick: function () { delete s.answers[item.id]; renderTest(); },
          disabled: selected === null }, ['Clear']),
        h('span', { class: 'spacer' }),
        s.index < s.items.length - 1
          ? h('button', { class: 'btn', type: 'button', onclick: function () { s.index++; renderTest(); } }, ['Skip →'])
          : null,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { confirmFinish(); } }, ['Finish and score'])
      ]),
      h('div', { class: 'dotnav' }, s.items.map(function (it, i) {
        var cls = 'dot';
        if (s.answers[it.id] !== undefined) cls += ' answered';
        if (i === s.index) cls += ' current';
        if (s.flagged[it.id]) cls += ' flagged';
        return h('button', {
          class: cls, type: 'button', title: Bank.subtests[it.subtest].name + ' · question ' + (i + 1),
          text: String(i + 1), onclick: function () { s.index = i; renderTest(); }
        });
      }))
    ]);

    mount([head, card]);
  }

  function confirmFinish() {
    var s = state.session;
    var unanswered = s.items.filter(function (i) { return s.answers[i.id] === undefined; }).length;
    if (unanswered && !window.confirm(unanswered + ' question' + (unanswered === 1 ? '' : 's') +
      ' left unanswered. Unanswered questions are scored as incorrect. Finish anyway?')) return;
    finishTest(false);
  }

  function finishTest(timedOut) {
    stopTimer();
    timerEl.hidden = true;
    var s = state.session;

    state.report = Scoring.scoreSession({
      items: s.items,
      answers: s.answers,
      grade: state.profile.grade,
      ageMonths: ageMonths()
    });
    state.report.timedOut = timedOut;
    state.report.label = s.label;
    state.report.elapsedSec = Math.min(s.limitSec, (Date.now() - s.startedAt) / 1000);

    var comp = state.report.composite;
    saveHistoryEntry({
      at: Date.now(),
      label: s.label,
      raw: state.report.totals.raw,
      possible: state.report.totals.possible,
      sas: comp ? comp.sas : null,
      profile: state.report.profile.available ? state.report.profile.label : null
    });

    state.screen = 'results';
    renderResults();
  }

  // ------------------------------------------------------- results screen ---

  function renderResults() {
    var r = state.report;
    var comp = r.composite;

    var hero = h('div', { class: 'card' }, [
      h('h1', { text: 'Score report' }),
      h('p', { class: 'lede', text: r.label + ' · ' + gradeLabel(r.grade) + ' · age ' +
        Math.floor(r.ageMonths / 12) + 'y ' + (r.ageMonths % 12) + 'm' +
        (r.timedOut ? ' · time expired' : '') }),
      h('div', { class: 'score-hero' }, [
        comp ? h('div', { class: 'bignum' }, [
          document.createTextNode(String(comp.sas)),
          h('small', { text: (comp.batteriesIncluded === 3 ? 'VQN composite' : 'Composite') + ' SAS' })
        ]) : null,
        h('div', { class: 'stat-grid', style: 'flex:1;min-width:260px' }, [
          stat(r.totals.raw + ' / ' + r.totals.possible, 'Raw score'),
          comp ? stat(ordinal(comp.apr), 'Age percentile') : null,
          comp ? stat(String(comp.stanine), 'Stanine') : null,
          comp ? stat(Scoring.interpretSAS(comp.sas), 'Band') : null
        ])
      ])
    ]);

    var rows = BATTERY_ORDER.filter(function (b) { return r.batteries[b]; }).map(function (b) {
      var s = r.batteries[b];
      return h('tr', {}, [
        h('td', { text: Scoring.BATTERY_LABELS[b] }),
        h('td', { text: s.raw + '/' + s.possible }),
        h('td', { text: String(s.uss) }),
        h('td', { text: String(s.sas) }),
        h('td', { text: s.sasBand[0] + '–' + s.sasBand[1] }),
        h('td', { text: ordinal(s.apr) }),
        h('td', { text: ordinal(s.gpr) }),
        h('td', { text: String(s.stanine) }),
        h('td', {}, [h('div', { class: 'bar' }, [h('span', { style: 'width:' + s.apr + '%' })])])
      ]);
    });

    var table = h('div', { class: 'card' }, [
      h('h2', { text: 'Battery scores' }),
      h('div', { class: 'table-scroll' }, [
        h('table', { class: 'scores' }, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: 'Battery' }), h('th', { text: 'Raw' }), h('th', { text: 'USS' }),
            h('th', { text: 'SAS' }), h('th', { text: '±1 SEM' }), h('th', { text: 'Age %ile' }),
            h('th', { text: 'Grade %ile' }), h('th', { text: 'Stanine' }), h('th', { text: '' })
          ])]),
          h('tbody', {}, rows)
        ])
      ])
    ]);

    var prof = r.profile;
    var profileCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Ability profile' }),
      prof.available
        ? h('div', {}, [
            h('div', { class: 'pillrow' }, [h('span', { class: 'profile-tag', text: prof.label })]),
            h('p', { text: prof.description }),
            prof.marks.length
              ? h('div', { class: 'pillrow' }, prof.marks.map(function (m) {
                  return h('span', { class: 'pill ' + (m.direction === 'strength' ? 'up' : 'down'),
                    text: Scoring.BATTERY_LABELS[m.battery] + ' ' + (m.diff > 0 ? '+' : '') + m.diff + ' SAS vs. own average' });
                }))
              : h('p', { class: 'lede', text: 'No battery differed from the three-battery average by ' + Scoring.SIGNIFICANT_SAS_DIFF + ' SAS points or more.' })
          ])
        : h('p', { class: 'empty', text: prof.reason })
    ]);

    var subtestCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Subtest breakdown' }),
      h('p', { class: 'lede', text: 'Individual subtests are far too short for a scaled score. Read these as a rough map of where the misses clustered, not as abilities in their own right.' }),
      h('div', { class: 'table-scroll' }, [
        h('table', { class: 'scores' }, [
          h('thead', {}, [h('tr', {}, [
            h('th', { text: 'Subtest' }), h('th', { text: 'Battery' }),
            h('th', { text: 'Correct' }), h('th', { text: '%' }), h('th', { text: '' })
          ])]),
          h('tbody', {}, SUBTEST_ORDER.filter(function (id) {
            return r.subtests.some(function (s) { return s.subtest === id; });
          }).map(function (id) {
            var s = r.subtests.filter(function (x) { return x.subtest === id; })[0];
            return h('tr', {}, [
              h('td', { text: Bank.subtests[id].name }),
              h('td', { text: Scoring.BATTERY_LABELS[s.battery] }),
              h('td', { text: s.raw + '/' + s.possible }),
              h('td', { text: s.percentCorrect + '%' }),
              h('td', {}, [h('div', { class: 'bar' }, [h('span', { style: 'width:' + s.percentCorrect + '%' })])])
            ]);
          }))
        ])
      ])
    ]);

    var actions = h('div', { class: 'card' }, [
      h('div', { class: 'btn-row' }, [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { state.screen = 'review'; renderReview(); } }, ['Review every question']),
        h('button', { class: 'btn', type: 'button', onclick: function () {
          startTest(state.session.items, state.session.label);
        } }, ['Retake this test']),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Back to menu'])
      ])
    ]);

    mount([hero, table, profileCard, subtestCard, actions, scoringExplainer()]);
  }

  function stat(value, key) {
    return h('div', { class: 'stat' }, [
      h('div', { class: 'v', text: String(value) }),
      h('div', { class: 'k', text: key })
    ]);
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  // -------------------------------------------------------- review screen ---

  function renderReview() {
    var s = state.session;

    var items = s.items.map(function (item) {
      var selected = s.answers[item.id];
      var answered = selected !== undefined;
      var correct = answered && selected === item.answer;

      return h('div', { class: 'review-item' }, [
        h('div', { class: 'review-head' }, [
          h('span', { class: 'tag', text: Bank.subtests[item.subtest].name }),
          h('span', {
            class: 'tag ' + (correct ? 'ok' : answered ? 'no' : 'skip'),
            text: correct ? 'Correct' : answered ? 'Incorrect' : 'Not answered'
          }),
          h('span', { class: 'spacer' }),
          h('span', { class: 'tag', text: 'Answer ' + LETTERS[item.answer] })
        ]),
        renderStem(item),
        renderChoices(item, answered ? selected : null, function () {}, { correct: true }),
        renderWalkthrough(item, answered ? selected : null)
      ]);
    });

    mount([
      h('div', { class: 'card' }, [
        h('h1', { text: 'Answer review' }),
        h('p', { class: 'lede', text: 'Every question with the correct answer marked in green, your answer in red where it differed, and the reasoning laid out step by step.' }),
        h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn', type: 'button', onclick: function () { state.screen = 'results'; renderResults(); } }, ['← Back to score report']),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Menu'])
        ])
      ]),
      h('div', { class: 'card' }, items)
    ]);
  }

  // ------------------------------------------------------ practice screen ---

  function startPractice(subtestId) {
    state.practice = {
      subtestId: subtestId,
      items: itemsForSubtest(subtestId),
      index: 0,
      selected: null,
      checked: false,
      hintShown: false,
      correctCount: 0,
      seen: 0
    };
    state.screen = 'practice';
    stopTimer();
    timerEl.hidden = true;
    homeBtn.hidden = false;
    renderPractice();
  }

  function renderPractice() {
    var p = state.practice;
    var meta = Bank.subtests[p.subtestId];
    var item = p.items[p.index];

    var head = h('div', { class: 'card card-tight' }, [
      h('div', { class: 'qhead' }, [
        h('span', { class: 'subtest', text: meta.name }),
        h('span', { class: 'count', text: 'Question ' + (p.index + 1) + ' of ' + p.items.length }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'count', text: p.seen ? p.correctCount + ' of ' + p.seen + ' correct so far' : 'Untimed practice' })
      ]),
      h('div', { class: 'progress' }, [
        h('span', { style: 'width:' + ((p.index + 1) / p.items.length * 100) + '%' })
      ])
    ]);

    var strategy = h('div', { class: 'strategy' }, [
      h('h3', { text: 'How this subtest works' }),
      h('p', { style: 'margin-bottom:.6em', text: meta.blurb }),
      h('ul', {}, meta.strategy.map(function (line) { return h('li', { text: line }); }))
    ]);

    var body = [
      strategy,
      h('div', { class: 'directions', text: meta.directions }),
      renderStem(item),
      renderChoices(item, p.selected, function (i) {
        p.selected = i;
        renderPractice();
      }, p.checked ? { correct: true } : null)
    ];

    if (p.hintShown && !p.checked && item.hint) {
      body.push(h('div', { class: 'hintbox' }, [h('strong', { text: 'Hint: ' }), document.createTextNode(item.hint)]));
    }

    if (p.checked) {
      var correct = p.selected === item.answer;
      body.push(h('div', { class: 'feedback ' + (correct ? 'ok' : 'no') }, [
        h('div', { class: 'verdict', text: correct ? 'Correct' : 'Not quite — the answer is ' + LETTERS[item.answer] }),
        renderWalkthrough(item, p.selected)
      ]));
    }

    var nav = [];
    if (!p.checked) {
      if (item.hint && !p.hintShown) {
        nav.push(h('button', { class: 'btn', type: 'button', onclick: function () { p.hintShown = true; renderPractice(); } }, ['Show a hint']));
      }
      nav.push(h('button', {
        class: 'btn', type: 'button',
        onclick: function () { p.checked = true; p.seen++; renderPractice(); }
      }, ['Show me how it is solved']));
      nav.push(h('span', { class: 'spacer' }));
      nav.push(h('button', {
        class: 'btn btn-primary', type: 'button', disabled: p.selected === null,
        onclick: function () {
          p.checked = true;
          p.seen++;
          if (p.selected === item.answer) p.correctCount++;
          renderPractice();
        }
      }, ['Check answer']));
    } else {
      nav.push(h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Menu']));
      nav.push(h('span', { class: 'spacer' }));
      if (p.index < p.items.length - 1) {
        nav.push(h('button', {
          class: 'btn btn-primary', type: 'button',
          onclick: function () {
            p.index++; p.selected = null; p.checked = false; p.hintShown = false;
            renderPractice();
          }
        }, ['Next question →']));
      } else {
        nav.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startPractice(p.subtestId); } }, ['Start over']));
      }
    }
    body.push(h('div', { class: 'navbar' }, nav));

    mount([head, h('div', { class: 'card' }, body)]);
  }

  // ------------------------------------------------------------ explainer ---

  function scoringExplainer() {
    var d = h('details', { class: 'explain card' });
    d.appendChild(h('summary', { text: 'How these scores are calculated (and what they are not)' }));
    d.appendChild(h('div', {}, [
      h('p', { text: 'The official CogAT norm tables are proprietary, so this tool re-creates the reporting pipeline with an open, documented model rather than published norms. The shape of the report matches a real one; the numbers are an estimate produced by this project.' }),
      h('dl', {}, [
        h('dt', { text: 'Raw score' }),
        h('dd', { text: 'Number of questions answered correctly. Omitted questions count as incorrect, as they do on the real test.' }),

        h('dt', { text: 'Ability estimate' }),
        h('dd', { text: 'Every question carries a difficulty value. Rather than simply counting correct answers, the model asks which ability level best explains this exact pattern of hits and misses, using a three-parameter logistic IRT model with a guessing floor of 1 divided by the number of choices. Two students with the same raw score can therefore land in different places: because the model allows for lucky guesses on the hardest questions, missing several easy ones pulls the estimate down further than missing the hardest ones does.' }),

        h('dt', { text: 'USS — Universal Scale Score' }),
        h('dd', { text: 'An emulated cross-grade scale, anchored so that scores from different grades sit on one continuum and growth can be tracked over time.' }),

        h('dt', { text: 'SAS — Standard Age Score' }),
        h('dd', { text: 'The ability estimate expressed on a scale with a mean of 100 and a standard deviation of 16, compared against test-takers of the same age. The ±1 SEM column is the confidence band: a re-test would usually land somewhere inside it, so treat scores inside that range as equivalent.' }),

        h('dt', { text: 'Age percentile vs. grade percentile' }),
        h('dd', { text: 'The age percentile compares the student against others of the same age; the grade percentile compares against others in the same grade. They differ because a student can be young or old for their grade — which is exactly why both appear on a real report.' }),

        h('dt', { text: 'Stanine' }),
        h('dd', { text: 'A 1–9 band derived from the percentile. 4 to 6 is the average range and covers roughly the middle half of all students.' }),

        h('dt', { text: 'VQN composite' }),
        h('dd', { text: 'The average of the three batteries. Because the batteries are correlated, averaging them narrows the spread, so the average is re-standardized before conversion — otherwise every composite would drift towards 100.' }),

        h('dt', { text: 'Ability profile' }),
        h('dd', { text: 'The median stanine plus a letter: A when the three batteries are level, B when one stands apart, C when one is a relative strength and another a relative weakness, and E when the highest and lowest are at least ' + Scoring.EXTREME_SAS_SPREAD + ' SAS points apart. A battery counts as a relative strength or weakness when it sits at least ' + Scoring.SIGNIFICANT_SAS_DIFF + ' SAS points from the student’s own three-battery average.' })
      ]),
      h('p', { text: 'This test is short. A real CogAT battery uses many more items, which is what makes its scores stable enough for placement decisions. Use these results to find topics worth practising — not to predict a real score.' })
    ]));
    return d;
  }

  // ----------------------------------------------------------- navigation ---

  function goHome() {
    if (state.screen === 'test' && !window.confirm('Leave this test? Your progress will be lost.')) return;
    stopTimer();
    state.screen = 'home';
    state.session = null;
    state.practice = null;
    renderHome();
  }

  homeBtn.addEventListener('click', goHome);
  document.getElementById('brand').addEventListener('click', goHome);

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    var idx = LETTERS.indexOf(e.key.toUpperCase());
    var numeric = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : -1;
    var choiceIndex = idx >= 0 ? idx : numeric;

    if (state.screen === 'test') {
      var s = state.session;
      var item = s.items[s.index];
      if (choiceIndex >= 0 && choiceIndex < item.choices.length) {
        e.preventDefault();
        s.answers[item.id] = choiceIndex;
        if (s.index < s.items.length - 1) s.index++;
        renderTest();
      } else if (e.key === 'ArrowRight' && s.index < s.items.length - 1) {
        s.index++; renderTest();
      } else if (e.key === 'ArrowLeft' && s.index > 0) {
        s.index--; renderTest();
      }
    } else if (state.screen === 'practice') {
      var p = state.practice;
      var pItem = p.items[p.index];
      if (!p.checked && choiceIndex >= 0 && choiceIndex < pItem.choices.length) {
        e.preventDefault();
        p.selected = choiceIndex;
        renderPractice();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!p.checked && p.selected !== null) {
          p.checked = true; p.seen++;
          if (p.selected === pItem.answer) p.correctCount++;
          renderPractice();
        } else if (p.checked && p.index < p.items.length - 1) {
          p.index++; p.selected = null; p.checked = false; p.hintShown = false;
          renderPractice();
        }
      }
    }
  });

  window.addEventListener('beforeunload', function (e) {
    if (state.screen === 'test') { e.preventDefault(); e.returnValue = ''; }
  });

  renderHome();
})();

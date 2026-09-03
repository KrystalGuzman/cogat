/* app.js — screens and navigation.
 *
 * Two distinct modes live here and are deliberately kept apart:
 *
 *   The test  — administered the way CogAT is: three battery sessions, each of
 *               three subtests, each running directions → untimed practice →
 *               a separately timed, section-locked block. Driven by admin.js.
 *   Practice  — untimed drilling of a single subtest with hints and full
 *               walkthroughs. This is the teaching mode and is never scored.
 */
(function () {
  'use strict';

  var Scoring = window.CogatScoring;
  var Bank = window.CogatBank;
  var Levels = window.CogatLevels;
  var Admin = window.CogatAdmin;
  var Figures = window.Figures;
  var Exporter = window.CogatExport;
  var Speech = window.CogatSpeech;
  var PHASE = Admin.PHASE;

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var STORE_PROFILE = 'cogat.profile.v2';
  var STORE_HISTORY = 'cogat.history.v2';
  var HISTORY_LIMIT = 12;

  var BATTERY_ORDER = ['verbal', 'quantitative', 'nonverbal'];
  var SUBTEST_ORDER = [
    'picture-analogies', 'verbal-analogies', 'sentence-completion',
    'picture-classification', 'verbal-classification',
    'number-analogies', 'number-puzzles', 'number-series',
    'figure-matrices', 'paper-folding', 'figure-classification'
  ];

  var app = document.getElementById('app');
  var timerEl = document.getElementById('timer');
  var homeBtn = document.getElementById('btn-home');

  var state = {
    screen: 'home',
    profile: loadProfile(),
    test: null,          // admin.js state
    drill: null,         // untimed subtest practice
    report: null,
    session: null,       // the scored session behind the current report
    readAloud: false,           // speak each question automatically
    accommodateReadAloud: false // upper levels only; changes what is measured
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
      localStorage.setItem(STORE_HISTORY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
    } catch (e) { /* private mode, or quota */ }
  }

  function clearHistory() {
    try { localStorage.removeItem(STORE_HISTORY); } catch (e) { /* private mode */ }
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
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function fmtMinutes(sec) {
    return Math.round(sec / 60) + ' min';
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function gradeLabel(g) { return g === 0 ? 'Kindergarten' : 'Grade ' + g; }

  // ------------------------------------------------------------- speech ----
  // The primary levels are read aloud by the examiner. Where the browser offers
  // speech synthesis the app can play that script; the text is always shown too,
  // so nothing depends on the audio working.

  var speechAvailable = typeof window.speechSynthesis !== 'undefined';

  function speak(text) {
    if (!speechAvailable || !text) return;
    try {
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) { /* speech is a convenience, never a requirement */ }
  }

  function stopSpeech() {
    if (speechAvailable) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  }

  /**
   * Is this item meant to be spoken? Always on the primary levels, which are
   * orally administered; on the upper levels only when the read-aloud
   * accommodation has been switched on.
   */
  function speechEnabled() {
    if (state.test) return state.test.readAloud || state.test.accommodateReadAloud;
    var level = Levels.levelForGrade(state.profile.grade);
    return Levels.formForLevel(level).readAloud || state.accommodateReadAloud;
  }

  function readAloudBar(item) {
    if (!speechEnabled()) return null;
    var script = Speech.scriptFor(item);
    if (!script) return null;
    return h('div', { class: 'readaloud' }, [
      h('button', {
        class: 'btn btn-quiet', type: 'button', title: 'Read this question aloud',
        onclick: function () { speak(script); }
      }, [speechAvailable ? '🔊 Read aloud' : '🔊']),
      h('span', { class: 'readaloud-text', text: script })
    ]);
  }

  function speakItem(item) {
    if (!state.readAloud || !speechEnabled()) return;
    var script = Speech.scriptFor(item);
    if (script) speak(script);
  }

  // ---------------------------------------------------------- item lookup ---

  function itemsForSubtest(id) {
    return Bank.items.filter(function (i) { return i.subtest === id && !i.practice; });
  }

  function subtestsForForm(formId) {
    return SUBTEST_ORDER.filter(function (id) {
      return Bank.subtests[id].forms.indexOf(formId) !== -1;
    });
  }

  // ------------------------------------------------------- stem rendering ---

  function figBox(fig, cls) {
    return h('div', { class: cls || 'figbox' }, [Figures.render(fig)]);
  }

  function pictureCell(fig, cls) {
    return h('div', { class: cls || 'pcell' }, [
      figBox(fig, 'figbox'),
      fig.word ? h('span', { class: 'pword', text: fig.word }) : null
    ]);
  }

  function renderStem(item) {
    var s = item.stem;

    if (s.kind === 'analogy' || s.kind === 'numAnalogy') {
      var parts = [];
      s.pairs.forEach(function (pair, i) {
        if (i) parts.push(h('span', { class: 'sep', text: ':' }));
        parts.push(h('span', { class: 'pair' }, [
          h('span', { text: String(pair[0]) }),
          h('span', { class: 'arrow', text: '→' }),
          (pair[1] === '?' || pair[1] === null)
            ? h('span', { class: 'blankmark', text: '?' })
            : h('span', { text: String(pair[1]) })
        ]));
      });
      return h('div', { class: 'stem analogy' }, parts);
    }

    if (s.kind === 'pictureAnalogy') {
      var pp = [];
      s.pairs.forEach(function (pair, i) {
        if (i) pp.push(h('span', { class: 'sep', text: ':' }));
        pp.push(h('span', { class: 'ppair' }, [
          pictureCell(pair[0]),
          h('span', { class: 'arrow', text: '→' }),
          pair[1] ? pictureCell(pair[1]) : h('div', { class: 'pcell q' })
        ]));
      });
      return h('div', { class: 'stem panalogy' }, pp);
    }

    if (s.kind === 'pictureClass') {
      return h('div', { class: 'stem' }, [
        h('div', { class: 'pclass' }, s.given.map(function (f) { return pictureCell(f); })
          .concat([h('div', { class: 'pcell q' })]))
      ]);
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
        h('div', { class: 'wordset' }, s.given.map(function (w) { return h('span', { text: w }); })
          .concat([h('span', { class: 'blankmark', text: '?' })]))
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
      return h('div', { class: 'stem' }, [
        h('div', { class: 'matrix', style: 'grid-template-columns: repeat(' + s.cols + ', auto)' },
          s.cells.map(function (cell) {
            return cell ? h('div', { class: 'cell' }, [Figures.render(cell)])
              : h('div', { class: 'cell empty' });
          }))
      ]);
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
        ? h('div', { class: 'choice-fig' }, [
            figBox(choice.fig),
            choice.word ? h('span', { class: 'pword', text: choice.word }) : null
          ])
        : h('span', { class: 'label', text: String(choice) });

      wrap.appendChild(h('button', {
        class: cls, type: 'button', disabled: !!reveal,
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

  function renderHome() {
    stopTimer();
    stopSpeech();
    timerEl.hidden = true;
    homeBtn.hidden = true;
    state.test = null;
    state.drill = null;

    var level = Levels.levelForGrade(state.profile.grade);
    var plan = Levels.buildTest(level, Bank);
    var saved = Admin.loadSaved();
    var resumable = saved && Admin.rehydrate(saved, Bank);

    var intro = h('div', { class: 'card' }, [
      h('h1', { text: 'CogAT-style practice test' }),
      h('p', { class: 'lede', text: 'A leveled cognitive abilities test administered the way the real one is — three battery sessions, each of three separately timed subtests — with a full score report and a worked walkthrough for every question.' })
    ]);

    var setup = h('div', { class: 'card' }, [
      h('h2', { text: 'Who is testing?' }),
      h('div', { class: 'setup-row' }, [
        h('div', { class: 'field' }, [
          h('label', { for: 'grade', text: 'Grade level' }),
          (function () {
            var sel = h('select', { id: 'grade', onchange: function (e) {
              state.profile.grade = Number(e.target.value); saveProfile(); renderHome();
            } });
            for (var g = 0; g <= 12; g++) {
              sel.appendChild(h('option', { value: g, text: gradeLabel(g), selected: g === state.profile.grade }));
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
      h('div', { class: 'levelcard' }, [
        h('div', {}, [
          h('div', { class: 'levelcard-name', text: level.label }),
          h('div', { class: 'levelcard-form', text: plan.form.label + ' form · ' + plan.totalItems + ' questions · ' +
            plan.sessions.length + ' sessions' })
        ]),
        h('p', { class: 'levelcard-note', text: plan.form.note })
      ]),
      h('p', { class: 'lede', style: 'font-size:.86rem', text:
        'Grade decides which level you are given, and levels differ in the questions themselves — not just in how they are scored. ' +
        'Age is used separately, to compare against peers of the same age for the SAS and age percentile.' })
    ]);

    var actions = [];
    if (resumable) {
      var p = Admin.progress(resumable);
      actions.push(h('div', { class: 'resume' }, [
        h('div', {}, [
          h('strong', { text: 'Test in progress' }),
          h('div', { class: 'lede', style: 'margin:2px 0 0', text:
            Levels.levelById(resumable.levelId).label + ' · ' + p.sectionsDone + ' of ' + p.sectionsTotal +
            ' subtests finished · started ' + new Date(resumable.startedAt).toLocaleDateString() })
        ]),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
          state.test = resumable; state.screen = 'test'; homeBtn.hidden = false; renderTest();
        } }, ['Resume']),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
          if (window.confirm('Discard the test in progress and start over?')) { Admin.clearSaved(); renderHome(); }
        } }, ['Discard'])
      ]));
    }

    actions.push(h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () { startTest(); } },
        [resumable ? 'Start a new test' : 'Begin the test']),
      h('span', { class: 'lede', text: 'About ' + fmtMinutes(plan.sessions.reduce(function (n, s) { return n + s.timeSec; }, 0)) +
        ' of testing time' + (plan.form.paced === 'teacher' ? ' (untimed — teacher-paced)' : ', split across ' + plan.sessions.length + ' sessions') })
    ]));

    var testCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Take the test' }),
      h('p', { class: 'lede', text: 'Each session covers one battery and is meant to be taken in one sitting. Sessions can be spread over several days — your progress is saved on this device.' }),
      h('ol', { class: 'flowlist' }, [
        h('li', { text: 'Directions for the subtest, untimed.' }),
        h('li', { text: 'Worked practice questions, untimed and never scored.' }),
        h('li', { text: plan.form.paced === 'teacher'
          ? 'The subtest itself, at the student’s own pace.'
          : 'The subtest itself, under its own strict time limit. Once it is submitted it cannot be reopened.' })
      ])
    ].concat(actions));

    var drillCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Practice one subtest' }),
      h('p', { class: 'lede', text: 'Untimed and never scored. Take a hint when you want one, then check your answer and read the full walkthrough. Questions are drawn at this student’s level.' }),
      h('div', { class: 'mode-grid' }, subtestsForForm(plan.form.id).map(function (id) {
        var meta = Bank.subtests[id];
        return h('button', { class: 'mode-card', type: 'button', onclick: function () { startDrill(id); } }, [
          h('h3', { text: meta.name }),
          h('p', { text: meta.blurb }),
          h('span', { class: 'meta', text: Scoring.BATTERY_LABELS[meta.battery] + ' · ' + itemsForSubtest(id).length + ' questions in the pool' })
        ]);
      }))
    ]);

    mount([intro, setup, testCard, drillCard, historyCard(), scoringExplainer()]);
  }

  // ============================================================ THE TEST ===

  function startTest() {
    if (Admin.loadSaved() && !window.confirm('Starting a new test discards the one already in progress. Continue?')) return;
    Admin.clearSaved();
    state.test = Admin.start({ grade: state.profile.grade, ageMonths: ageMonths(), bank: Bank });
    state.screen = 'test';
    homeBtn.hidden = false;
    renderTest();
  }

  function renderTest() {
    var t = state.test;
    switch (t.phase) {
      case PHASE.SESSION_INTRO: return renderSessionIntro();
      case PHASE.DIRECTIONS: return renderDirections();
      case PHASE.PRACTICE: return renderPractice();
      case PHASE.READY: return renderReady();
      case PHASE.TIMED: return renderSection();
      case PHASE.SECTION_DONE: return renderSectionDone();
      case PHASE.SESSION_DONE: return renderSessionDone();
      case PHASE.FINISHED: return finishTest();
    }
  }

  function testHeader(extra) {
    var t = state.test;
    var session = Admin.currentSession(t);
    var p = Admin.progress(t);
    return h('div', { class: 'card card-tight' }, [
      h('div', { class: 'qhead' }, [
        h('span', { class: 'tag', text: 'Session ' + (t.sessionIndex + 1) + ' of ' + t._sessions.length }),
        h('span', { class: 'subtest', text: Scoring.BATTERY_LABELS[session.battery] + ' Battery' }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'count', text: Levels.levelById(t.levelId).label })
      ]),
      h('div', { class: 'progress' }, [
        h('span', { style: 'width:' + (p.sectionsDone / p.sectionsTotal * 100) + '%' })
      ]),
      extra
    ]);
  }

  function renderSessionIntro() {
    stopTimer();
    timerEl.hidden = true;
    var t = state.test;
    var session = Admin.currentSession(t);
    var teacherPaced = t.paced === 'teacher';

    mount([
      testHeader(),
      h('div', { class: 'card' }, [
        h('h1', { text: 'Session ' + (t.sessionIndex + 1) + ': ' + Scoring.BATTERY_LABELS[session.battery] + ' Battery' }),
        h('p', { class: 'lede', text: 'This session has ' + session.sections.length + ' subtests and ' +
          session.itemCount + ' questions' + (teacherPaced ? '. There is no time limit.' : ', taking about ' + fmtMinutes(session.timeSec) + '.') }),
        h('ul', { class: 'sectionlist' }, session.sections.map(function (sec) {
          return h('li', {}, [
            h('span', { class: 'sectionlist-name', text: sec.name }),
            h('span', { class: 'spacer' }),
            h('span', { class: 'count', text: sec.items.length + ' questions' +
              (sec.timeSec ? ' · ' + fmtMinutes(sec.timeSec) : ' · untimed') })
          ]);
        })),
        h('div', { class: 'notice' }, [
          h('strong', { text: 'Before you start: ' }),
          document.createTextNode(teacherPaced
            ? 'Each question is read aloud. Work through the session in one sitting if you can; your progress is saved either way.'
            : 'Each subtest is timed separately and closes when you submit it. You cannot return to a subtest once it is finished, and time left over in one subtest does not carry to the next.')
        ]),
        speechAvailable && t.readAloud ? h('label', { class: 'checkline' }, [
          h('input', { type: 'checkbox', checked: state.readAloud,
            onchange: function (e) { state.readAloud = e.target.checked; } }),
          h('span', { text: 'Read each question aloud automatically' })
        ]) : null,
        speechAvailable && !t.readAloud ? h('div', { class: 'accommodation' }, [
          h('label', { class: 'checkline' }, [
            h('input', {
              type: 'checkbox', checked: t.accommodateReadAloud,
              onchange: function (e) {
                t.accommodateReadAloud = e.target.checked;
                if (!e.target.checked) state.readAloud = false;
                Admin.save(t);
                renderTest();
              }
            }),
            h('span', { text: 'Read questions aloud (accommodation)' })
          ]),
          h('p', { class: 'accommodation-note', text:
            'From Level 9 upward the student reads the questions themselves; only the directions are read aloud. ' +
            'Switching this on changes what the Verbal battery measures — reasoning through reading becomes listening ' +
            'comprehension — so the score report will record that it was used.' }),
          t.accommodateReadAloud ? h('label', { class: 'checkline', style: 'margin-top:8px' }, [
            h('input', { type: 'checkbox', checked: state.readAloud,
              onchange: function (e) { state.readAloud = e.target.checked; } }),
            h('span', { text: 'Also read each question aloud automatically, without pressing the button' })
          ]) : null
        ]) : null,
        h('div', { class: 'btn-row', style: 'margin-top:16px' }, [
          h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () {
            Admin.beginDirections(t); renderTest();
          } }, ['Start this session']),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Save and exit'])
        ])
      ])
    ]);
  }

  function renderDirections() {
    stopTimer();
    timerEl.hidden = true;
    var t = state.test;
    var section = Admin.currentSection(t);
    var meta = Bank.subtests[section.subtest];

    mount([
      testHeader(),
      h('div', { class: 'card' }, [
        h('div', { class: 'tag', text: 'Subtest ' + (t.sectionIndex + 1) + ' of ' + Admin.currentSession(t).sections.length }),
        h('h1', { text: meta.name }),
        h('p', { class: 'directions-big', text: meta.directions }),
        speechAvailable ? h('div', { class: 'btn-row', style: 'margin-bottom:14px' }, [
          h('button', { class: 'btn btn-quiet', type: 'button',
            onclick: function () { speak(Speech.directionsScript(meta)); } }, ['🔊 Read the directions aloud'])
        ]) : null,
        h('div', { class: 'strategy' }, [
          h('h3', { text: 'How this subtest works' }),
          h('ul', {}, meta.strategy.map(function (line) { return h('li', { text: line }); }))
        ]),
        h('div', { class: 'statline' }, [
          h('span', {}, [h('strong', { text: String(section.items.length) }), document.createTextNode(' questions')]),
          h('span', {}, [h('strong', { text: section.timeSec ? fmtMinutes(section.timeSec) : 'Untimed' }),
            document.createTextNode(section.timeSec ? ' time limit' : ' — work at your own pace')]),
          h('span', {}, [h('strong', { text: String(section.practice.length) }), document.createTextNode(' practice questions first')])
        ]),
        h('div', { class: 'btn-row', style: 'margin-top:16px' }, [
          h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () {
            Admin.beginPractice(t); renderTest();
          } }, [section.practice.length ? 'Try the practice questions' : 'Continue']),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Save and exit'])
        ])
      ])
    ]);
  }

  function renderPractice() {
    stopTimer();
    timerEl.hidden = true;
    var t = state.test;
    var section = Admin.currentSection(t);
    var meta = Bank.subtests[section.subtest];

    if (t.practiceIndex === undefined) t.practiceIndex = 0;
    var item = section.practice[t.practiceIndex];
    var selected = t.practiceAnswers[item.id];
    var checked = t.practiceChecked === item.id;

    if (!checked) speakItem(item);

    var body = [
      h('div', { class: 'tag ok', text: 'Practice question ' + (t.practiceIndex + 1) + ' of ' + section.practice.length + ' — not scored' }),
      h('div', { class: 'directions', text: meta.directions }),
      readAloudBar(item),
      renderStem(item),
      renderChoices(item, selected === undefined ? null : selected, function (i) {
        t.practiceAnswers[item.id] = i;
        renderTest();
      }, checked ? { correct: true } : null)
    ];

    if (checked) {
      var correct = selected === item.answer;
      body.push(h('div', { class: 'feedback ' + (correct ? 'ok' : 'no') }, [
        h('div', { class: 'verdict', text: correct ? 'That is right.' : 'Not quite — the answer is ' + LETTERS[item.answer] + '.' }),
        renderWalkthrough(item, selected)
      ]));
    }

    var nav = [];
    if (!checked) {
      nav.push(h('button', {
        class: 'btn btn-primary', type: 'button', disabled: selected === undefined,
        onclick: function () { t.practiceChecked = item.id; renderTest(); }
      }, ['Check my answer']));
      nav.push(h('button', { class: 'btn', type: 'button', onclick: function () {
        t.practiceChecked = item.id; renderTest();
      } }, ['Show me the answer']));
    } else if (t.practiceIndex < section.practice.length - 1) {
      nav.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
        t.practiceIndex++; t.practiceChecked = null; renderTest();
      } }, ['Next practice question →']));
    } else {
      nav.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
        t.practiceIndex = 0; t.practiceChecked = null;
        Admin.finishPractice(t); renderTest();
      } }, ['Done — go to the subtest']));
    }

    mount([testHeader(), h('div', { class: 'card' }, body.concat([h('div', { class: 'navbar' }, nav)]))]);
  }

  function renderReady() {
    stopTimer();
    timerEl.hidden = true;
    var t = state.test;
    var section = Admin.currentSection(t);
    var meta = Bank.subtests[section.subtest];

    mount([
      testHeader(),
      h('div', { class: 'card centred' }, [
        h('h1', { text: meta.name }),
        h('p', { class: 'lede', text: section.items.length + ' questions' +
          (section.timeSec ? ' · ' + fmtMinutes(section.timeSec) : ' · no time limit') }),
        section.timeSec
          ? h('div', { class: 'notice warn' }, [
              h('strong', { text: 'The timer starts as soon as you begin. ' }),
              document.createTextNode('You can move between questions inside this subtest, but once you submit it you cannot come back, and any time left over does not carry over.')
            ])
          : h('div', { class: 'notice' }, [document.createTextNode('Take as long as you need. Each question is read aloud.')]),
        h('div', { class: 'btn-row centred-row' }, [
          h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () {
            Admin.beginSection(t); startTimer(); renderTest();
          } }, [section.timeSec ? 'Start — begin timing' : 'Start']),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Save and exit'])
        ])
      ])
    ]);
  }

  function renderSection() {
    var t = state.test;
    var section = Admin.currentSection(t);
    var meta = Bank.subtests[section.subtest];
    var item = section.items[t.itemIndex];
    var selected = t.answers[item.id] === undefined ? null : t.answers[item.id];

    speakItem(item);

    var answeredCount = section.items.filter(function (i) { return t.answers[i.id] !== undefined; }).length;

    var card = h('div', { class: 'card' }, [
      h('div', { class: 'qhead' }, [
        h('span', { class: 'subtest', text: meta.name }),
        h('span', { class: 'count', text: 'Question ' + (t.itemIndex + 1) + ' of ' + section.items.length }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'count', text: answeredCount + ' answered' })
      ]),
      h('div', { class: 'progress' }, [
        h('span', { style: 'width:' + ((t.itemIndex + 1) / section.items.length * 100) + '%' })
      ]),
      h('div', { class: 'directions', text: meta.directions }),
      readAloudBar(item),
      renderStem(item),
      renderChoices(item, selected, function (i) {
        t.answers[item.id] = i;
        Admin.save(t);
        if (t.itemIndex < section.items.length - 1) t.itemIndex++;
        renderTest();
      }),
      h('div', { class: 'navbar' }, [
        h('button', { class: 'btn', type: 'button', disabled: t.itemIndex === 0,
          onclick: function () { t.itemIndex--; renderTest(); } }, ['← Back']),
        h('button', { class: 'btn', type: 'button', disabled: selected === null,
          onclick: function () { delete t.answers[item.id]; Admin.save(t); renderTest(); } }, ['Clear']),
        h('span', { class: 'spacer' }),
        t.itemIndex < section.items.length - 1
          ? h('button', { class: 'btn', type: 'button', onclick: function () { t.itemIndex++; renderTest(); } }, ['Skip →'])
          : null,
        h('button', { class: 'btn btn-primary', type: 'button', onclick: confirmSubmitSection }, ['Finish this subtest'])
      ]),
      h('div', { class: 'dotnav' }, section.items.map(function (it, i) {
        var cls = 'dot';
        if (t.answers[it.id] !== undefined) cls += ' answered';
        if (i === t.itemIndex) cls += ' current';
        return h('button', { class: cls, type: 'button', text: String(i + 1),
          onclick: function () { t.itemIndex = i; renderTest(); } });
      }))
    ]);

    mount([testHeader(), card]);
  }

  function confirmSubmitSection() {
    var t = state.test;
    var section = Admin.currentSection(t);
    var unanswered = section.items.filter(function (i) { return t.answers[i.id] === undefined; }).length;
    var msg = (unanswered ? unanswered + ' question' + (unanswered === 1 ? '' : 's') +
      ' still unanswered, and unanswered questions are scored as incorrect.\n\n' : '') +
      'Finish this subtest? You will not be able to return to it.';
    if (!window.confirm(msg)) return;
    stopTimer();
    Admin.submitSection(t, false);
    renderTest();
  }

  function renderSectionDone() {
    stopTimer();
    timerEl.hidden = true;
    stopSpeech();
    var t = state.test;
    var log = t.sectionLog[Admin.currentKey(t)];
    var session = Admin.currentSession(t);
    var isLastInSession = t.sectionIndex >= session.sections.length - 1;

    mount([
      testHeader(),
      h('div', { class: 'card centred' }, [
        h('h1', { text: Bank.subtests[log.subtest].name + ' complete' }),
        h('div', { class: 'statline centred-row' }, [
          h('span', {}, [h('strong', { text: log.answered + ' / ' + log.presented }), document.createTextNode(' answered')]),
          log.timeLimitSec ? h('span', {}, [h('strong', { text: fmtTime(log.elapsedSec) }), document.createTextNode(' of ' + fmtMinutes(log.timeLimitSec) + ' used')]) : null,
          log.timedOut ? h('span', { class: 'warn-text', text: 'Time expired' }) : null
        ]),
        h('p', { class: 'lede', text: 'Scores are not shown until the whole test is finished, as on the real test.' }),
        h('div', { class: 'btn-row centred-row' }, [
          h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () {
            Admin.advance(t); renderTest();
          } }, [isLastInSession ? 'Finish this session' : 'Go to the next subtest']),
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Save and exit'])
        ])
      ])
    ]);
  }

  function renderSessionDone() {
    stopTimer();
    timerEl.hidden = true;
    var t = state.test;
    var justFinished = t._sessions[t.sessionIndex];
    var next = t._sessions[t.sessionIndex + 1];

    mount([
      testHeader(),
      h('div', { class: 'card centred' }, [
        h('h1', { text: Scoring.BATTERY_LABELS[justFinished.battery] + ' Battery complete' }),
        h('p', { class: 'lede', text: 'That is session ' + (t.sessionIndex + 1) + ' of ' + t._sessions.length + ' done.' }),
        h('div', { class: 'notice' }, [
          h('strong', { text: 'Take a break. ' }),
          document.createTextNode('The real test puts each battery in its own session, often on a different day. Your progress is saved on this device, so you can close this and come back to the ' +
            Scoring.BATTERY_LABELS[next.battery] + ' Battery whenever you are ready.')
        ]),
        h('div', { class: 'btn-row centred-row' }, [
          h('button', { class: 'btn btn-primary btn-big', type: 'button', onclick: function () {
            Admin.nextSession(t); renderTest();
          } }, ['Start the ' + Scoring.BATTERY_LABELS[next.battery] + ' Battery now']),
          h('button', { class: 'btn', type: 'button', onclick: goHome }, ['Stop here — resume later'])
        ])
      ])
    ]);
  }

  // ------------------------------------------------------------- timing ----

  function startTimer() {
    stopTimer();
    var section = Admin.currentSection(state.test);
    if (!section || !section.timeSec) { timerEl.hidden = true; return; }
    timerEl.hidden = false;
    tick();
    tickHandle = setInterval(tick, 500);
  }

  function stopTimer() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
  }

  function tick() {
    var left = Admin.remainingSec(state.test);
    if (left === null) { timerEl.hidden = true; return; }
    timerEl.textContent = fmtTime(left);
    timerEl.classList.toggle('is-low', left <= 60);
    if (left <= 0) {
      stopTimer();
      Admin.submitSection(state.test, true);
      renderTest();
    }
  }

  // ======================================================== SCORING & REPORT

  function finishTest() {
    stopTimer();
    stopSpeech();
    timerEl.hidden = true;
    var t = state.test;

    var items = Admin.administeredItems(t);
    state.session = {
      label: Levels.levelById(t.levelId).label + ' — full test',
      items: items,
      answers: t.answers,
      levelId: t.levelId,
      formId: t.formId,
      sectionLog: t.sectionLog,
      startedAt: t.startedAt
    };

    state.report = Scoring.scoreSession({
      items: items,
      answers: t.answers,
      grade: t.grade,
      ageMonths: t.ageMonths,
      level: t.levelId,
      form: t.formId
    });
    state.report.label = state.session.label;
    state.report.sectionLog = t.sectionLog;
    state.report.readAloudUsed = !!t.readAloud;
    state.report.accommodatedReadAloud = !!t.accommodateReadAloud;
    state.report.takenAt = t.startedAt;
    state.report.elapsedSec = Object.keys(t.sectionLog).reduce(function (n, k) {
      return n + (t.sectionLog[k].elapsedSec || 0);
    }, 0);

    var comp = state.report.composite;
    saveHistoryEntry({
      at: Date.now(),
      label: state.report.label,
      levelId: t.levelId,
      formId: t.formId,
      raw: state.report.totals.raw,
      possible: state.report.totals.possible,
      sas: comp ? comp.sas : null,
      profile: state.report.profile.available ? state.report.profile.label : null,
      grade: t.grade,
      ageMonths: t.ageMonths,
      itemIds: items.map(function (i) { return i.id; }),
      answers: t.answers,
      sectionLog: t.sectionLog,
      accommodatedReadAloud: !!t.accommodateReadAloud
    });

    Admin.clearSaved();
    state.test = null;
    state.screen = 'results';
    homeBtn.hidden = false;
    renderResults();
  }

  // -------------------------------------------------- reopening a report ---

  function reopenReport(saved) {
    var byId = {};
    Bank.items.forEach(function (i) { byId[i.id] = i; });

    var missing = [];
    var items = [];
    (saved.itemIds || []).forEach(function (id) {
      if (byId[id]) items.push(byId[id]); else missing.push(id);
    });
    if (!items.length) {
      return { ok: false, error: 'None of the questions in that report exist in the current question bank.' };
    }

    var grade = typeof saved.grade === 'number' ? saved.grade : (saved.learner && saved.learner.grade);
    var months = typeof saved.ageMonths === 'number' ? saved.ageMonths : (saved.learner && saved.learner.ageMonths);
    var levelId = saved.levelId || (saved.scores && saved.scores.levelId);
    var levelObj = levelId ? Levels.levelById(levelId) : null;
    var formId = saved.formId || (levelObj ? levelObj.form : null);

    state.session = {
      label: saved.label || 'Saved report',
      items: items,
      answers: saved.answers || {},
      levelId: levelId,
      sectionLog: saved.sectionLog || null,
      startedAt: saved.takenAt ? new Date(saved.takenAt).getTime() : (saved.at || Date.now())
    };

    state.report = Scoring.scoreSession({
      items: items,
      answers: state.session.answers,
      grade: typeof grade === 'number' ? grade : state.profile.grade,
      ageMonths: typeof months === 'number' ? months : ageMonths(),
      level: levelId,
      form: formId
    });
    state.report.label = state.session.label;
    state.report.takenAt = state.session.startedAt;
    state.report.elapsedSec = saved.elapsedSec || 0;
    state.report.sectionLog = saved.sectionLog || null;
    state.report.reopened = true;
    state.report.missingItems = missing;
    state.report.accommodatedReadAloud = !!saved.accommodatedReadAloud;

    stopTimer();
    timerEl.hidden = true;
    homeBtn.hidden = false;
    state.screen = 'results';
    renderResults();
    return { ok: true, missing: missing };
  }

  function openReportFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = Exporter.parseSavedReport(String(reader.result));
      if (!parsed.ok) { window.alert(parsed.error); return; }
      var result = reopenReport(parsed.data);
      if (!result.ok) window.alert(result.error);
    };
    reader.onerror = function () { window.alert('That file could not be read.'); };
    reader.readAsText(file);
  }

  // ------------------------------------------------------- results screen ---

  function stat(value, key) {
    return h('div', { class: 'stat' }, [
      h('div', { class: 'v', text: String(value) }),
      h('div', { class: 'k', text: key })
    ]);
  }

  function renderResults() {
    var r = state.report;
    var comp = r.composite;
    var levelLabel = r.level ? (Levels.levelById(r.level) || {}).label : null;

    var hero = h('div', { class: 'card' }, [
      h('h1', { text: 'Score report' }),
      h('p', { class: 'lede', text: [
        levelLabel, gradeLabel(r.grade),
        'age ' + Math.floor(r.ageMonths / 12) + 'y ' + (r.ageMonths % 12) + 'm'
      ].filter(Boolean).join(' · ') }),
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
      ]),
      r.accommodatedReadAloud ? h('div', { class: 'notice warn' }, [
        h('strong', { text: 'Read-aloud accommodation used. ' }),
        document.createTextNode('The questions were read aloud, which this level does not normally do. ' +
          'On the Verbal battery that changes what is measured — reasoning through reading becomes listening ' +
          'comprehension — so the Verbal score in particular is not comparable to a standard administration.')
      ]) : null,
      r.reopened ? h('p', { class: 'lede', text: 'Reopened from a saved report.' +
        (r.missingItems && r.missingItems.length
          ? ' ' + r.missingItems.length + ' question(s) are no longer in the question bank and were left out, so these scores may differ slightly from the original.' : '') }) : null
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
          h('thead', {}, [h('tr', {}, ['Battery', 'Raw', 'USS', 'SAS', '±1 SEM', 'Age %ile', 'Grade %ile', 'Stanine', '']
            .map(function (t) { return h('th', { text: t }); }))]),
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
                    text: Scoring.BATTERY_LABELS[m.battery] + ' ' + (m.diff > 0 ? '+' : '') + m.diff +
                      ' SAS vs. own average (needs ±' + m.threshold + ')' });
                }))
              : null,
            h('p', { class: 'lede', style: 'font-size:.86rem', text:
              'A battery is only called a strength or a weakness when it sits further from this student’s own three-battery ' +
              'average than measurement error can explain. On this administration the smallest gap that could be told apart ' +
              'from noise is about ' + prof.minDetectableDiff + ' SAS points.' })
          ])
        : h('p', { class: 'empty', text: prof.reason })
    ]);

    var subtestCard = h('div', { class: 'card' }, [
      h('h2', { text: 'Subtest breakdown' }),
      h('p', { class: 'lede', text: 'Individual subtests are too short for a scaled score of their own. Read these as a map of where the misses clustered, not as abilities in their own right.' }),
      h('div', { class: 'table-scroll' }, [
        h('table', { class: 'scores' }, [
          h('thead', {}, [h('tr', {}, ['Subtest', 'Battery', 'Correct', '%', 'Time used', ''].map(function (t) {
            return h('th', { text: t });
          }))]),
          h('tbody', {}, SUBTEST_ORDER.filter(function (id) {
            return r.subtests.some(function (s) { return s.subtest === id; });
          }).map(function (id) {
            var s = r.subtests.filter(function (x) { return x.subtest === id; })[0];
            var log = r.sectionLog ? r.sectionLog[s.battery + ':' + id] : null;
            return h('tr', {}, [
              h('td', { text: Bank.subtests[id].name }),
              h('td', { text: Scoring.BATTERY_LABELS[s.battery] }),
              h('td', { text: s.raw + '/' + s.possible }),
              h('td', { text: s.percentCorrect + '%' }),
              h('td', { text: log ? (log.timeLimitSec ? fmtTime(log.elapsedSec) + ' / ' + fmtMinutes(log.timeLimitSec) : '—') + (log.timedOut ? ' ⏱' : '') : '—' }),
              h('td', {}, [h('div', { class: 'bar' }, [h('span', { style: 'width:' + s.percentCorrect + '%' })])])
            ]);
          }))
        ])
      ]),
      r.sectionLog && Object.keys(r.sectionLog).some(function (k) { return r.sectionLog[k].timedOut; })
        ? h('p', { class: 'lede', text: '⏱ marks a subtest where the time limit ran out before every question was reached.' })
        : null
    ]);

    var actions = h('div', { class: 'card' }, [
      h('div', { class: 'btn-row' }, [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { state.screen = 'review'; renderReview(); } }, ['Review every question']),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Back to menu'])
      ])
    ]);

    mount([hero, table, profileCard, subtestCard, saveCard(), actions, scoringExplainer()]);
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
          h('span', { class: 'tag ' + (correct ? 'ok' : answered ? 'no' : 'skip'),
            text: correct ? 'Correct' : answered ? 'Incorrect' : 'Not answered' }),
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

  // ================================================== PRACTICE (UNTIMED) ===

  function startDrill(subtestId) {
    var level = Levels.levelForGrade(state.profile.grade);
    var pool = itemsForSubtest(subtestId);
    var items = Levels.selectItems(pool, level.center, Math.min(12, pool.length));
    state.drill = {
      subtestId: subtestId, items: items, index: 0,
      selected: null, checked: false, hintShown: false,
      correctCount: 0, seen: 0
    };
    state.screen = 'drill';
    stopTimer();
    timerEl.hidden = true;
    homeBtn.hidden = false;
    renderDrill();
  }

  function renderDrill() {
    var p = state.drill;
    var meta = Bank.subtests[p.subtestId];
    var item = p.items[p.index];

    var head = h('div', { class: 'card card-tight' }, [
      h('div', { class: 'qhead' }, [
        h('span', { class: 'subtest', text: meta.name }),
        h('span', { class: 'count', text: 'Question ' + (p.index + 1) + ' of ' + p.items.length }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'count', text: p.seen ? p.correctCount + ' of ' + p.seen + ' correct so far' : 'Untimed practice' })
      ]),
      h('div', { class: 'progress' }, [h('span', { style: 'width:' + ((p.index + 1) / p.items.length * 100) + '%' })])
    ]);

    var body = [
      h('div', { class: 'strategy' }, [
        h('h3', { text: 'How this subtest works' }),
        h('p', { style: 'margin-bottom:.6em', text: meta.blurb }),
        h('ul', {}, meta.strategy.map(function (line) { return h('li', { text: line }); }))
      ]),
      h('div', { class: 'directions', text: meta.directions }),
      readAloudBar(item),
      renderStem(item),
      renderChoices(item, p.selected, function (i) { p.selected = i; renderDrill(); },
        p.checked ? { correct: true } : null)
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
        nav.push(h('button', { class: 'btn', type: 'button', onclick: function () { p.hintShown = true; renderDrill(); } }, ['Show a hint']));
      }
      nav.push(h('button', { class: 'btn', type: 'button', onclick: function () {
        p.checked = true; p.seen++; renderDrill();
      } }, ['Show me how it is solved']));
      nav.push(h('span', { class: 'spacer' }));
      nav.push(h('button', {
        class: 'btn btn-primary', type: 'button', disabled: p.selected === null,
        onclick: function () {
          p.checked = true; p.seen++;
          if (p.selected === item.answer) p.correctCount++;
          renderDrill();
        }
      }, ['Check answer']));
    } else {
      nav.push(h('button', { class: 'btn btn-quiet', type: 'button', onclick: goHome }, ['Menu']));
      nav.push(h('span', { class: 'spacer' }));
      if (p.index < p.items.length - 1) {
        nav.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
          p.index++; p.selected = null; p.checked = false; p.hintShown = false; renderDrill();
        } }, ['Next question →']));
      } else {
        nav.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startDrill(p.subtestId); } }, ['Start over']));
      }
    }
    body.push(h('div', { class: 'navbar' }, nav));

    mount([head, h('div', { class: 'card' }, body)]);
  }

  // ---------------------------------------------------------- saved results ---

  function historyCard() {
    var history = loadHistory();
    var fileInput = h('input', {
      type: 'file', accept: '.json,application/json', id: 'open-report', class: 'visually-hidden',
      onchange: function (e) {
        var file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (file) openReportFile(file);
      }
    });

    return h('div', { class: 'card' }, [
      h('h2', { text: 'Saved results' }),
      history.length
        ? h('ul', { class: 'history' }, history.map(function (entry) {
            var reopenable = Array.isArray(entry.itemIds) && entry.itemIds.length && entry.answers;
            return h('li', {}, [
              h('strong', { text: entry.label }),
              h('span', { class: 'pill', text: entry.raw + '/' + entry.possible + ' correct' }),
              entry.sas ? h('span', { class: 'pill', text: 'SAS ' + entry.sas }) : null,
              entry.profile ? h('span', { class: 'pill', text: 'Profile ' + entry.profile }) : null,
              h('span', { class: 'spacer' }),
              h('span', { class: 'when', text: new Date(entry.at).toLocaleString() }),
              reopenable
                ? h('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
                    var result = reopenReport(entry);
                    if (!result.ok) window.alert(result.error);
                  } }, ['Open report'])
                : h('span', { class: 'when', text: '(summary only)' })
            ]);
          }))
        : h('p', { class: 'empty', text: 'No completed tests yet.' }),
      h('div', { class: 'btn-row', style: 'margin-top:14px' }, [
        fileInput,
        h('button', { class: 'btn', type: 'button', onclick: function () { fileInput.click(); } }, ['Open a saved report file…']),
        history.length
          ? h('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
              if (window.confirm('Clear the list of saved results on this device? Files you have already downloaded are not affected.')) {
                clearHistory(); renderHome();
              }
            } }, ['Clear list'])
          : null
      ]),
      h('p', { class: 'lede', style: 'margin:10px 0 0;font-size:.84rem', text:
        'Results are kept in this browser only, and the most recent ' + HISTORY_LIMIT + ' are retained. ' +
        'Download a report to keep it permanently or move it to another device.' })
    ]);
  }

  // ------------------------------------------------- saved-report document ---

  var SCORE_GLOSSARY = [
    { term: 'Level and form',
      text: 'CogAT is a series of leveled tests, not one test. A student is given the level for their age and grade, and the levels differ in the questions themselves. The primary levels (kindergarten through grade 2) are picture-based and read aloud; from grade 3 upward the test is read independently.' },
    { term: 'Raw score',
      text: 'Number of questions answered correctly. Omitted questions count as incorrect, as they do on the real test.' },
    { term: 'Ability estimate',
      text: 'Every question carries a difficulty on one absolute scale shared by all the levels. Rather than simply counting correct answers, the model asks which ability level best explains this exact pattern of hits and misses, using a three-parameter logistic IRT model with a guessing floor of 1 divided by the number of choices. Two students with the same raw score can therefore land in different places.' },
    { term: 'USS — Universal Scale Score',
      text: 'That absolute ability expressed on a single cross-grade scale, so scores from different levels sit on one continuum and growth can be tracked from year to year.' },
    { term: 'SAS — Standard Age Score',
      text: 'The same ability compared against the norm group for the student’s age, on a scale with a mean of 100 and a standard deviation of 16. The ±1 SEM column is the confidence band: a re-test would usually land somewhere inside it, so treat scores inside that range as equivalent.' },
    { term: 'Age percentile vs. grade percentile',
      text: 'The age percentile compares the student against others of the same age; the grade percentile compares against others in the same grade. They differ because a student can be young or old for their grade — which is exactly why both appear on a real report.' },
    { term: 'Stanine',
      text: 'A 1–9 band derived from the percentile. 4 to 6 is the average range and covers roughly the middle half of all students.' },
    { term: 'VQN composite',
      text: 'The average of the three batteries. Because the batteries are correlated, averaging them narrows the spread, so the average is re-standardized before conversion — otherwise every composite would drift towards 100.' },
    { term: 'Ability profile',
      text: 'The median stanine plus a letter: A when the three batteries are level, B when one stands apart, C when one is a relative strength and another a relative weakness, and E when the highest and lowest are at least ' + Scoring.EXTREME_SAS_SPREAD + ' SAS points apart. A battery is only marked when its distance from the student’s own three-battery average is larger than the measurement error of that distance, so a short test cannot invent strengths that are not there.' }
  ];

  var SCORE_CAVEAT = 'The official CogAT norm tables are proprietary, so this tool re-creates the reporting pipeline with an ' +
    'open, documented model rather than published norms. The structure of the test and of the report follows the real one; the ' +
    'numbers are an estimate produced by this project. Use these results to find topics worth practising, not to predict a real ' +
    'score or to make placement decisions.';

  function flatten(lists) { return lists.reduce(function (a, b) { return a.concat(b); }, []); }

  function scoringExplainer() {
    var d = h('details', { class: 'explain card' });
    d.appendChild(h('summary', { text: 'How this test is built and scored (and what it is not)' }));
    d.appendChild(h('div', {}, [
      h('p', { text: SCORE_CAVEAT }),
      h('dl', {}, flatten(SCORE_GLOSSARY.map(function (entry) {
        return [h('dt', { text: entry.term }), h('dd', { text: entry.text })];
      })))
    ]));
    return d;
  }

  function docStat(value, key, lead) {
    return h('div', { class: 'doc-stat' + (lead ? ' lead' : '') }, [
      h('div', { class: 'v', text: String(value) }),
      h('div', { class: 'k', text: key })
    ]);
  }

  function buildReportDocument(includeReview) {
    var r = state.report;
    var s = state.session;
    var comp = r.composite;
    var taken = r.takenAt || (s && s.startedAt) || Date.now();
    var levelLabel = r.level ? (Levels.levelById(r.level) || {}).label : null;

    var doc = h('div', { class: 'cogat-doc' });

    doc.appendChild(h('div', { class: 'doc-head' }, [
      h('h1', { text: 'CogAT-Style Practice — Score Report' }),
      h('div', { class: 'doc-meta' }, [
        levelLabel ? h('span', { text: levelLabel }) : null,
        h('span', { text: gradeLabel(r.grade) }),
        h('span', { text: 'Age ' + Math.floor(r.ageMonths / 12) + 'y ' + (r.ageMonths % 12) + 'm' }),
        h('span', { text: 'Taken ' + new Date(taken).toLocaleDateString() }),
        r.elapsedSec >= 60 ? h('span', { text: 'Testing time ' + fmtMinutes(r.elapsedSec) }) : null
      ])
    ]));

    if (r.accommodatedReadAloud) {
      doc.appendChild(h('div', { class: 'doc-section' }, [
        h('p', { class: 'doc-flag', text:
          'Read-aloud accommodation used. The questions were read aloud, which this level does not normally do. ' +
          'On the Verbal battery that changes what is measured, so the Verbal score is not comparable to a ' +
          'standard administration.' })
      ]));
    }

    var summary = h('div', { class: 'doc-summary' });
    if (comp) summary.appendChild(docStat(comp.sas, (comp.batteriesIncluded === 3 ? 'VQN composite' : 'Composite') + ' SAS', true));
    summary.appendChild(docStat(r.totals.raw + ' / ' + r.totals.possible, 'Raw score'));
    if (comp) {
      summary.appendChild(docStat(ordinal(comp.apr), 'Age percentile'));
      summary.appendChild(docStat(comp.stanine, 'Stanine'));
      summary.appendChild(docStat(Scoring.interpretSAS(comp.sas), 'Band'));
    }
    doc.appendChild(h('div', { class: 'doc-section' }, [summary]));

    doc.appendChild(h('div', { class: 'doc-section' }, [
      h('h2', { text: 'Battery scores' }),
      h('table', {}, [
        h('thead', {}, [h('tr', {}, ['Battery', 'Raw', 'USS', 'SAS', '±1 SEM', 'Age %ile', 'Grade %ile', 'Stanine']
          .map(function (t) { return h('th', { text: t }); }))]),
        h('tbody', {}, BATTERY_ORDER.filter(function (b) { return r.batteries[b]; }).map(function (b) {
          var x = r.batteries[b];
          return h('tr', {}, [
            h('td', { text: Scoring.BATTERY_LABELS[b] }), h('td', { text: x.raw + '/' + x.possible }),
            h('td', { text: String(x.uss) }), h('td', { text: String(x.sas) }),
            h('td', { text: x.sasBand[0] + '–' + x.sasBand[1] }), h('td', { text: ordinal(x.apr) }),
            h('td', { text: ordinal(x.gpr) }), h('td', { text: String(x.stanine) })
          ]);
        }))
      ])
    ]));

    var prof = r.profile;
    doc.appendChild(h('div', { class: 'doc-section' }, [
      h('h2', { text: 'Ability profile' }),
      prof.available
        ? h('div', {}, [
            h('div', { class: 'doc-profile-tag', text: prof.label }),
            h('p', { text: prof.description }),
            prof.marks.length
              ? h('div', { class: 'doc-marks' }, prof.marks.map(function (m) {
                  return h('span', { class: 'doc-mark ' + (m.direction === 'strength' ? 'up' : 'down'),
                    text: Scoring.BATTERY_LABELS[m.battery] + ' ' + (m.diff > 0 ? '+' : '') + m.diff + ' SAS vs. own average' });
                }))
              : null,
            h('p', { text: 'The smallest difference this administration could tell apart from measurement error is about ' +
              prof.minDetectableDiff + ' SAS points.' })
          ])
        : h('p', { text: prof.reason })
    ]));

    doc.appendChild(h('div', { class: 'doc-section' }, [
      h('h2', { text: 'Subtest breakdown' }),
      h('p', { text: 'Individual subtests are too short for a scaled score of their own. Read these as a map of where the misses clustered, not as abilities in their own right.' }),
      h('table', {}, [
        h('thead', {}, [h('tr', {}, ['Subtest', 'Battery', 'Correct', '%', 'Time used']
          .map(function (t) { return h('th', { text: t }); }))]),
        h('tbody', {}, SUBTEST_ORDER.filter(function (id) {
          return r.subtests.some(function (x) { return x.subtest === id; });
        }).map(function (id) {
          var x = r.subtests.filter(function (y) { return y.subtest === id; })[0];
          var log = r.sectionLog ? r.sectionLog[x.battery + ':' + id] : null;
          return h('tr', {}, [
            h('td', { text: Bank.subtests[id].name }),
            h('td', { text: Scoring.BATTERY_LABELS[x.battery] }),
            h('td', { text: x.raw + '/' + x.possible }),
            h('td', { text: x.percentCorrect + '%' }),
            h('td', { text: log && log.timeLimitSec ? fmtTime(log.elapsedSec) + ' / ' + fmtMinutes(log.timeLimitSec) + (log.timedOut ? ' (expired)' : '') : '—' })
          ]);
        }))
      ])
    ]));

    doc.appendChild(h('div', { class: 'doc-section' }, [
      h('h2', { text: 'How this test is built and scored' }),
      h('p', { text: SCORE_CAVEAT }),
      h('dl', {}, flatten(SCORE_GLOSSARY.map(function (entry) {
        return [h('dt', { text: entry.term }), h('dd', { text: entry.text })];
      })))
    ]));

    if (includeReview && s) {
      doc.appendChild(h('div', { class: 'doc-section page-break' }, [
        h('h2', { text: 'Answer review' }),
        h('p', { text: 'Every question with the correct answer marked, the answer given, and the reasoning step by step.' })
      ].concat(s.items.map(function (item) {
        var selected = s.answers[item.id];
        var answered = selected !== undefined;
        var correct = answered && selected === item.answer;
        return h('div', { class: 'doc-item' }, [
          h('div', { class: 'doc-item-head' }, [
            h('span', { class: 'doc-tag', text: Bank.subtests[item.subtest].name }),
            h('span', { class: 'doc-tag ' + (correct ? 'ok' : answered ? 'no' : 'skip'),
              text: correct ? 'Correct' : answered ? 'Incorrect' : 'Not answered' }),
            h('span', { class: 'spacer' }),
            h('span', { class: 'doc-tag', text: 'Answer ' + LETTERS[item.answer] })
          ]),
          renderStem(item),
          renderChoices(item, answered ? selected : null, function () {}, { correct: true }),
          renderWalkthrough(item, answered ? selected : null)
        ]);
      }))));
    }

    doc.appendChild(h('div', { class: 'doc-foot', text:
      'Generated by an independent CogAT-style practice tool. CogAT® is a registered trademark of its publisher; ' +
      'this project is not affiliated with or endorsed by them. The official norm tables are proprietary, so these scores ' +
      'come from an open approximation and are not official CogAT scores.' }));

    return doc;
  }

  // ------------------------------------------------------------- saving ---

  function reportPayload() {
    var s = state.session;
    return {
      report: state.report,
      label: state.report.label,
      grade: state.report.grade,
      ageMonths: state.report.ageMonths,
      levelId: state.report.level,
      formId: state.report.form,
      sectionLog: state.report.sectionLog,
      takenAt: state.report.takenAt || (s && s.startedAt),
      itemIds: s ? s.items.map(function (i) { return i.id; }) : [],
      answers: s ? s.answers : {}
    };
  }

  function saveAsHtml(includeReview) {
    var doc = buildReportDocument(includeReview);
    Exporter.download(
      Exporter.filename(state.report.label, 'html', state.report.takenAt),
      Exporter.wrapDocument('CogAT Practice Report — ' + state.report.label, doc.outerHTML),
      'text/html'
    );
  }

  function saveAsJson() {
    Exporter.download(
      Exporter.filename(state.report.label, 'json', state.report.takenAt),
      Exporter.toJSON(reportPayload()),
      'application/json'
    );
  }

  function saveAsCsv() {
    var subtestNames = {};
    Object.keys(Bank.subtests).forEach(function (id) { subtestNames[id] = Bank.subtests[id].name; });
    Exporter.download(
      Exporter.filename(state.report.label, 'csv', state.report.takenAt),
      Exporter.toCSV(state.report, { batteries: Scoring.BATTERY_LABELS, subtests: subtestNames }),
      'text/csv'
    );
  }

  function printReport(includeReview) {
    var area = document.getElementById('print-area');
    clear(area);
    area.appendChild(buildReportDocument(includeReview));
    document.body.classList.add('is-printing');

    var done = function () {
      document.body.classList.remove('is-printing');
      clear(area);
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(function () { if (document.body.classList.contains('is-printing')) done(); }, 60000);
  }

  function saveCard() {
    var includeReview = { value: true };
    var checkbox = h('input', {
      type: 'checkbox', id: 'inc-review', checked: true,
      onchange: function (e) { includeReview.value = e.target.checked; }
    });
    var count = state.session ? state.session.items.length : 0;

    return h('div', { class: 'card' }, [
      h('h2', { text: 'Save this report' }),
      h('p', { class: 'lede', text: 'Everything is generated in your browser — nothing is uploaded anywhere.' }),
      h('label', { class: 'checkline', for: 'inc-review' }, [
        checkbox,
        h('span', { text: 'Include the answer review — all ' + count + ' questions with the correct answers and full walkthroughs' })
      ]),
      h('div', { class: 'btn-row', style: 'margin-top:14px' }, [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { printReport(includeReview.value); } }, ['🖨 Print / Save as PDF']),
        h('button', { class: 'btn', type: 'button', onclick: function () { saveAsHtml(includeReview.value); } }, ['Download HTML']),
        h('button', { class: 'btn', type: 'button', onclick: saveAsJson }, ['Download JSON']),
        h('button', { class: 'btn', type: 'button', onclick: saveAsCsv }, ['Download CSV'])
      ]),
      h('p', { class: 'lede', style: 'margin:12px 0 0;font-size:.84rem', text:
        'HTML is a single self-contained file you can email or open on any device. JSON can be loaded back into this app from the menu to reopen the full report. CSV holds the score tables for a spreadsheet.' })
    ]);
  }

  // ----------------------------------------------------------- navigation ---

  function goHome() {
    if (state.screen === 'test' && state.test && state.test.phase === PHASE.TIMED) {
      if (!window.confirm('A timed subtest is running. Leaving now abandons this subtest — its answers so far are kept, but the clock does not pause. Leave anyway?')) return;
    }
    stopTimer();
    stopSpeech();
    state.screen = 'home';
    renderHome();
  }

  homeBtn.addEventListener('click', goHome);
  document.getElementById('brand').addEventListener('click', goHome);

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    var idx = LETTERS.indexOf(e.key.toUpperCase());
    var numeric = /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : -1;
    var choiceIndex = idx >= 0 ? idx : numeric;

    if (state.screen === 'test' && state.test && state.test.phase === PHASE.TIMED) {
      var t = state.test;
      var section = Admin.currentSection(t);
      var item = section.items[t.itemIndex];
      if (choiceIndex >= 0 && choiceIndex < item.choices.length) {
        e.preventDefault();
        t.answers[item.id] = choiceIndex;
        Admin.save(t);
        if (t.itemIndex < section.items.length - 1) t.itemIndex++;
        renderTest();
      } else if (e.key === 'ArrowRight' && t.itemIndex < section.items.length - 1) {
        t.itemIndex++; renderTest();
      } else if (e.key === 'ArrowLeft' && t.itemIndex > 0) {
        t.itemIndex--; renderTest();
      }
    } else if (state.screen === 'drill') {
      var p = state.drill;
      var dItem = p.items[p.index];
      if (!p.checked && choiceIndex >= 0 && choiceIndex < dItem.choices.length) {
        e.preventDefault(); p.selected = choiceIndex; renderDrill();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!p.checked && p.selected !== null) {
          p.checked = true; p.seen++;
          if (p.selected === dItem.answer) p.correctCount++;
          renderDrill();
        } else if (p.checked && p.index < p.items.length - 1) {
          p.index++; p.selected = null; p.checked = false; p.hintShown = false; renderDrill();
        }
      }
    }
  });

  window.addEventListener('beforeunload', function (e) {
    if (state.screen === 'test' && state.test && state.test.phase === PHASE.TIMED) {
      e.preventDefault(); e.returnValue = '';
    }
  });

  // The saved-report stylesheet is only needed for printing; the HTML export
  // carries its own copy inline.
  (function injectPrintStyles() {
    var style = document.createElement('style');
    style.media = 'print';
    style.textContent = Exporter.DOC_CSS;
    document.head.appendChild(style);
  })();

  renderHome();
})();

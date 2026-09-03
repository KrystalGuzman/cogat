# CogAT Practice Test &amp; Score Evaluator

A leveled cognitive abilities practice test modelled on the **Cognitive Abilities Test (CogAT)**,
administered the way the real one is, with a full score report and a worked walkthrough for every
question.

No build step, no runtime dependencies. Open `index.html` in a browser and it runs.

> **Not an official test.** CogAT&reg; is a registered trademark of its publisher. This project is
> independent and unaffiliated. The official norm tables are proprietary, so the scores here come
> from an open, documented model — good for finding what to practise, not for predicting a real
> score or making placement decisions.

---

## Running it

```bash
open index.html          # works straight from the filesystem
npm run serve            # or over HTTP at localhost:8080
npm test                 # 83 unit tests, no dependencies
```

Only the tests need Node (18+). The app is plain browser JavaScript loaded with `<script>` tags, so
`file://` works with no CORS problems.

---

## It is a leveled test, not one test

CogAT is a series of leveled forms assigned by age and grade. A student is given the level for their
age, and **the levels differ in the questions themselves**, not merely in how the answers are scored.
This project reproduces that.

| Level | Grade | Form | Administration |
| --- | --- | --- | --- |
| 5/6, 7, 8 | K–2 | **Primary** — Picture Analogies, Sentence Completion, Picture Classification | Picture-based, read aloud, teacher-paced |
| 9, 10, 11, 12 | 3–6 | **Upper** — Verbal Analogies, Sentence Completion, Verbal Classification | Print, read independently, separately timed |
| 13/14, 15/16, 17/18 | 7–12 | Upper | Print, separately timed |

Both forms share the Quantitative battery (Number Analogies, Number Puzzles, Number Series) and the
Nonverbal battery (Figure Matrices, Paper Folding, Figure Classification).

A primary form runs to **118 scored questions** and an upper form to **176**, matching the published
shape of Form 7/8. Every one of the ten levels assembles a complete form from a shared pool of
**566 scored items**, selected and ordered by difficulty around that level's target ability.
Adjacent levels overlap heavily and distant ones barely at all, which is how leveled forms are
actually built.

## Administered the way CogAT is

The test is not one long question list:

```
three sessions, one per battery, normally taken on different days
  └─ three subtests per session, each running
       directions (untimed)
       → worked practice questions (untimed, never scored)
       → the scored section under its own strict time limit
```

- **Section locking.** Once a subtest is submitted it is closed. There is no route back, and time
  left over in one subtest cannot be spent on another.
- **Per-subtest timing.** Each upper-level subtest gets its own 10-minute clock. Running out closes
  the section and is recorded on the report.
- **Free movement inside a section**, as within a page of the real booklet.
- **Sessions can be spread over days.** Progress is saved on the device and can be resumed. A
  section interrupted mid-clock restarts at its directions, because a timer cannot be resumed
  honestly.
- **Primary levels are teacher-paced and read aloud.** See below.

Keyboard: `A`–`E` or `1`–`5` to answer, arrow keys to move within a section.

### Reading aloud

"Verbal" in CogAT means reasoning *with words*; it does not mean the test is spoken. Oral
administration is a separate axis, and it splits by level:

| | Directions | Questions |
| --- | --- | --- |
| **Primary (K–2)** | read aloud | **read aloud** — the children are not yet readers |
| **Upper (3–12)** | read aloud | read independently by the student |

So the primary levels are unusable without speech: a written sentence-completion item is not a test
of reasoning for someone who cannot read the sentence, and neither are its written answer choices.
Every primary item is therefore spoken in full, choices included, with the script also shown on
screen so nothing depends on the audio working.

On the upper levels, reading the items aloud would change what is being measured — verbal reasoning
through reading becomes listening comprehension. It is offered there only as an explicit
**accommodation**, off by default, and using it is recorded and printed on the score report.

Scripts are **derived from each item** by `src/speech.js` rather than stored beside it, so they
cannot drift out of sync with the question. Symbols are spoken the way an examiner says them
(`? + 3 = 8` → "blank plus 3 equals 8"), and unlabelled abstract shapes are deliberately never read
out, since naming them would give the answer away.

There is also a separate **practice mode** — untimed, never scored, one subtest at a time, with
hints and full walkthroughs, drawing questions at the student's own level.

---

## How the score evaluator works

Implemented in [`src/scoring.js`](src/scoring.js) and covered by tests.

**1. One absolute ability scale.** A leveled test only coheres if an item has one fixed difficulty
and the *norm group* moves with the student. Item difficulties live in logits on a single scale
shared by every level; a grade or an age supplies a mean and standard deviation on that same scale.
A second grader and a tenth grader answering the same item are therefore compared against different
peers — which is exactly what a leveled, age-normed test does.

**2. Ability estimate.** Responses are fitted with a three-parameter logistic model,

```
P(correct | θ) = c + (1 − c) / (1 + e^(−a(θ − b)))
```

with a guessing floor of `c = 1 / (number of choices)`, estimated by EAP over a quadrature grid with
the age norm group as the prior. Omitted items score as incorrect, matching number-right scoring.

**3. Scales.**

| Score | Meaning |
| --- | --- |
| **Raw** | Number correct. |
| **USS** | Universal Scale Score — the absolute ability on one cross-grade scale, so growth can be tracked year to year. |
| **SAS** | Standard Age Score, mean 100 / SD 16 against same-age peers, reported with a ±1 SEM band. |
| **APR / GPR** | Age and grade percentile ranks. They differ when a student is young or old for their grade, because the age norm interpolates the same growth curve at a different point. |
| **Stanine** | 1–9, from the standard percentile cuts (4, 11, 23, 40, 60, 77, 89, 96). |

**4. VQN composite.** Averaging three correlated batteries narrows the spread, so the mean is
re-standardized by `√((1 + (k−1)r) / k)` with r ≈ 0.66 before conversion — without that step every
composite would drift toward 100.

**5. Ability profile.** A median stanine plus a pattern letter: **A** level, **B** one battery
apart, **C** a strength *and* a weakness, **E** an extreme spread of 24+ SAS points.

A battery is only marked when its distance from the student's own three-battery average exceeds the
**measurement error of that distance** — with three batteries, the deviation of one from the mean of
all three has error variance `(4Vᵢ + Vⱼ + Vₖ)/9`. The report also states the smallest gap it could
have detected at all.

The confidence threshold is a deliberate trade-off, measured by simulating 3,000 students per
condition on the Level 9 form:

| z | level student correctly called "A" | true 1-SD difference detected |
| --- | --- | --- |
| 1.28 | 64% | 87% |
| 1.645 | 81% | 74% |
| **1.96 (chosen)** | **91%** | **61%** |
| 2.24 | 96% | 48% |

1.96 is chosen because reporting a strength that is not there sends a family chasing a phantom,
which is worse than staying quiet about a real one the subtest breakdown will still hint at.
`test/profile-simulation.test.js` measures these rates and fails if they drift.

### What the numbers are worth

At full form length the battery SEM is roughly **±5.6 to ±7.5 SAS points**, against about ±4–5 for
the real test. A perfect score reaches SAS 159 and the top of the range still separates students
rather than flattening against a ceiling. Individual subtests remain too short for a scaled score of
their own and are reported only as a map of where misses clustered.

---

## Saving a report

Every report can be saved four ways, all generated in the browser with nothing uploaded. A checkbox
decides whether the answer review travels with it.

| Format | What it is for |
| --- | --- |
| **Print / Save as PDF** | A paginated document layout with no app chrome. |
| **HTML** | One self-contained file — styles and figures inlined, opens anywhere with no server. |
| **JSON** | The full report plus the level, the questions and the answers. **Loads back into this app** to reopen, review and retake. |
| **CSV** | The score tables as one tidy sheet, with a `section` column marking composite, battery and subtest rows. |

Completed tests are also kept in the browser (the most recent 12) and reopen from the **Saved
results** list. That list is per-device; downloading is what makes a report permanent or portable.

The saved document has its own stylesheet (`DOC_CSS` in `src/export.js`) rather than the app's. That
is deliberate: paper wants a light-only, chrome-free, paginated design, and a page served from
`file://` cannot read its own stylesheet at runtime. The *markup builders* are shared with the
on-screen report, so content cannot drift — only presentation differs.

---

## Layout

```
index.html                     app shell
assets/styles.css              theme-aware styling (light and dark)
src/levels.js                  levels, grade→level mapping, form composition, test assembly
src/scoring.js                 IRT estimation, scale conversions, SEM-based ability profile
src/admin.js                   administration state machine and progress persistence
src/figures.js                 declarative SVG renderer for the nonverbal battery
src/pictograms.js              46 object drawings for the primary picture battery
src/speech.js                  derives the examiner script for any item
src/export.js                  saved-report stylesheet and HTML/JSON/CSV serialization
src/app.js                     screens, navigation, keyboard, read-aloud
src/bank/generators.js         quantitative item factories
src/bank/generators-figural.js nonverbal item factories, including fold geometry
src/bank/verbal.js             hand-authored verbal pools (upper levels)
src/bank/primary.js            hand-authored picture pools (primary levels)
src/bank/index.js              assembles the pools, describes the eleven subtests
test/                          83 tests across levels, scoring, bank, admin, speech, export, simulation
scripts/serve.js               static dev server
```

Every module is UMD-wrapped, so it loads in the browser as a global and in Node with `require` —
which is how the tests exercise the real item bank rather than fixtures.

### Where items come from

The **quantitative and nonverbal** pools are generated by parameterized factories. These items are
systematic by nature — a number series really is "a rule applied to a sequence" — so the rule that
generates the question also derives its walkthrough and its per-distractor rationale. Paper folding
is computed rather than hand-placed: folds are reflections about creases whose positions are derived
from the region being folded, and unfolding applies them in reverse with duplicates merged, so a
punch landing on a crease yields a single hole as a consequence of the geometry rather than a
special case.

The **verbal and picture** pools are hand-authored, because analogies and sentence completion turn
on meaning, which does not come from a formula.

### Adding questions

Add an object to the relevant file in `src/bank/`:

```js
{
  id: 'va-49', battery: 'verbal', subtest: 'verbal-analogies',
  b: 0.4,                                     // absolute difficulty in logits: −3.5 (easy) to +2.5
  stem: { kind: 'analogy', pairs: [['cub', 'bear'], ['puppy', '?']] },
  choices: ['kennel', 'dog', 'kitten', 'bark', 'tail'],
  answer: 1,
  hint: 'A nudge that does not give it away.',
  walkthrough: [{ title: 'Name the relationship', text: '…' }, …],
  why: { 0: 'Why this distractor is tempting but wrong.', … }
}
```

`npm test` enforces the invariants: unique ids, a valid answer index, at least four distinct
choices, a difficulty in range, a hint, a multi-step walkthrough, distractor notes that point at real
wrong choices, at least two practice items per subtest, and pools that span enough difficulty to
serve every level they appear on. Nonverbal items are additionally checked for renderable figure
specs and fold-consistent hole counts; picture items for real pictograms, an examiner script, and an
answer that does not merely repeat a picture from its own stem.

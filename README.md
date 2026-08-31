# CogAT Practice &amp; Score Evaluator

A self-contained practice test modelled on the **Cognitive Abilities Test (CogAT)**, with a
full score report and a worked walkthrough for every question.

No build step, no dependencies at runtime. Open `index.html` in a browser and it runs.

> **Not an official test.** CogAT&reg; is a registered trademark of its publisher. This project is
> independent and unaffiliated. The official norm tables are proprietary, so the scores here are
> produced by an open, documented model — good for finding what to practise, not for predicting a
> real score or making placement decisions.

---

## Running it

```bash
open index.html          # works straight from the filesystem
# or, to serve it over HTTP:
npm run serve            # http://localhost:8080
npm test                 # 30 unit tests, no dependencies
```

Only the test tooling needs Node (18+). The app itself is plain ES5-compatible browser
JavaScript loaded with `<script>` tags, so `file://` works with no CORS problems.

---

## What it covers

Nine subtests across the three classic batteries — 71 questions in total.

| Battery | Subtests |
| --- | --- |
| **Verbal** | Verbal Analogies · Sentence Completion · Verbal Classification |
| **Quantitative** | Number Analogies · Number Puzzles · Number Series |
| **Nonverbal** | Figure Matrices · Figure Classification · Paper Folding |

The nonverbal items are drawn as real SVG figures from a small declarative shape language, so
matrices, classifications and paper-folding diagrams are genuine visual problems rather than
descriptions of them.

## Modes

- **Full practice test** — all nine subtests, timed, scored end to end. Produces the complete
  report: battery scores, the VQN composite, and an ability profile.
- **Single battery** — the same, scoped to Verbal, Quantitative or Nonverbal.
- **Practice one subtest** — untimed. Strategy notes up front, a hint on request, then immediate
  feedback with the full step-by-step solution and an explanation of why your particular wrong
  answer was wrong.
- **Answer review** — after a test, every question again with the right answer marked, your answer
  marked, and the walkthrough.

Keyboard: `A`–`E` or `1`–`5` to answer, arrow keys to move between questions, `Enter` to
check and advance in practice mode.

---

## How the score evaluator works

The report mirrors the structure of a real CogAT report. Each step is implemented in
[`src/scoring.js`](src/scoring.js) and covered by tests.

**1. Ability estimate.** Rather than counting correct answers, the model asks which ability level
best explains this exact pattern of hits and misses. Every item carries a difficulty `b` on the
grade-normative scale, where ability is standard normal for the target grade. Responses are fitted
with a three-parameter logistic model,

```
P(correct | θ) = c + (1 − c) / (1 + e^(−a(θ − b)))
```

with a guessing floor of `c = 1 / (number of choices)`, and θ is estimated by EAP over a
quadrature grid. Omitted items score as incorrect, matching the real test's number-right scoring.

One consequence worth knowing: because the model allows for lucky guesses on the hardest
questions, two students with the same raw score can land in different places, and missing several
*easy* questions pulls the estimate down further than missing the hardest ones does.

**2. Age vs. grade norms.** A student who is old for their grade is compared against older peers,
so the same performance yields a slightly lower age-based score. The model applies roughly 0.12 SD
of ability per year of age difference from the grade median, which is what makes the age percentile
and the grade percentile diverge — exactly as they do on a real report.

**3. Scales.**

| Score | Meaning |
| --- | --- |
| **Raw** | Number correct. |
| **USS** | Universal Scale Score — an emulated cross-grade scale so scores from different grades sit on one continuum. |
| **SAS** | Standard Age Score, mean 100 / SD 16, reported with a ±1 SEM confidence band. |
| **APR / GPR** | Age and grade percentile ranks. |
| **Stanine** | 1–9, from the standard percentile cuts (4, 11, 23, 40, 60, 77, 89, 96). |

**4. VQN composite.** The three batteries are correlated (r ≈ 0.66 is typical), so averaging them
narrows the spread. The mean is re-standardized by `√((1 + (k−1)r) / k)` before conversion —
without that step every composite would drift toward 100.

**5. Ability profile.** A median stanine plus a pattern letter:

| Letter | Meaning |
| --- | --- |
| **A** | All three batteries at about the same level. |
| **B** | One battery stands apart — a relative strength (`V+`) or weakness (`Q−`). |
| **C** | A contrast: at least one strength *and* one weakness. |
| **E** | An extreme difference — 24 or more SAS points between highest and lowest. |

A battery counts as a relative strength or weakness when it sits at least 8 SAS points from the
student's own three-battery average. Both thresholds approximate the confidence-band rules behind
real profile narratives. So `5E (V+ N−)` means: median stanine 5, an extreme spread, verbal a
relative strength, nonverbal a relative weakness.

---

## Layout

```
index.html            app shell; loads everything with plain <script> tags
assets/styles.css     theme-aware styling (light and dark)
src/scoring.js        IRT ability estimation, scale conversions, ability profile
src/figures.js        declarative SVG renderer for the nonverbal battery
src/bank/*.js         item banks, one per battery
src/app.js            screens, navigation, keyboard handling
test/scoring.test.js  scoring pipeline
test/bank.test.js     item-bank integrity
scripts/serve.js      static dev server
```

`src/scoring.js` and `src/figures.js` are UMD-wrapped, so they load in the browser as globals and
in Node with `require` — which is how the tests exercise the real item bank rather than fixtures.

## Adding questions

Add an object to the relevant file in `src/bank/`:

```js
{
  id: 'va-09', battery: 'verbal', subtest: 'verbal-analogies',
  b: 0.4,                                     // difficulty, roughly −2 (easy) to +2 (hard)
  stem: { kind: 'analogy', pairs: [['cub', 'bear'], ['puppy', '?']] },
  choices: ['kennel', 'dog', 'kitten', 'bark', 'tail'],
  answer: 1,                                  // index into choices
  hint: 'A nudge that does not give it away.',
  walkthrough: [{ title: 'Name the relationship', text: '…' }, …],
  why: { 0: 'Why this distractor is tempting but wrong.', … }
}
```

`npm test` enforces the invariants: unique ids, a valid answer index, at least four choices, a
difficulty in range, a hint, a multi-step walkthrough, distractor notes that point at real wrong
choices, and enough difficulty spread within each subtest. Nonverbal items are additionally checked
for renderable figure specs and, for paper folding, a hole count consistent with the number of folds.

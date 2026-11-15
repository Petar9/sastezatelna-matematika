# Regional hint revision - 2026-11-15

Status: independent Astra review and owner approval complete; approved hints applied. Local acceptance complete; production publication pending.

## Approved scope

Expand exactly three progressive hints for all 23 natural answer units and 23 authored exercises in `content/olimpiada-oblasten/2023-2026.json`. Explain actual calculations and why transformations work, using grade 4 reasoning and short paragraphs. The requested example is seven groups of 987 minus six groups, leaving one group of 987. Hint 1 starts the model without supplying the current part’s requested answers; hint 2 explains the method; hint 3 finishes and checks.

Preserve original statements, fields/answers, figures, difficulty, stable identities, content version, saved drafts, completed history and rewards. Hints 1–2 retain current full gold; hint 3 retains the existing exclusion. This revision does not implement continuous practice or restart mechanics, or revise other competitions.

Sources: private 2023–2026 papers, official solutions and archived tutor captions in `materials/olimpiada-oblasten/`. Automatic captions inform reasoning but do not override paper or key; original collection’s outstanding exhaustive human source review remains separate.

## Compatibility

The existing current-solution lookup did not find connected IDs such as `oli-ob-g4-2023-p1:unit:question`; a synthetic saved-unit reproduction returned no current solution. Add a guarded lookup matching unit identity, source, count, skill, statement, fields and options, returning current hints without mutating saved state. Preserve the old solution on any mismatch. Split blank lines into existing paragraph arrays for both natural-part and whole-original explanations, with no new hint levels or controls.

## Copy review

Drafter and independent reviewer: separate actual `gpt-6-astra` agents. All 46 units/exercises and 138 hints reviewed against the official solutions; no arithmetic errors or first-hint disclosure of the current requested answer found. Full [proposed copy](../proposals/regional-hints-2026-11-15.md) and [independent review with R1–R7](regional-hints-astra-2026-11-15.md). Owner approved all R1–R7 in chat (“approve”), 2026-11-15; all eleven affected excerpts were replaced exactly as proposed. All 138 approved hints are applied to application content. Agent review does not replace exhaustive human source approval.

## Verification and publication

- 389/389 application tests passed using `NODE_ENV=test node --import tsx --test tests/*.test.ts tests/*.test.tsx`; the focused regional suite passed again (10/10) after the explicit Map-key type correction. Coverage includes all 23 saved natural units, mismatched contracts, defensive copies, levels 0–3, drafts, subsequent saved parts and unchanged reward eligibility.
- TypeScript, ESLint and optimized production build passed, including private-file tracing and standalone checks. All 46 answer sets were independently recalculated; JSON changes are limited to the 138 hint strings.
- Real Chrome against the built app at 1280px desktop and 320px emulated mobile: an old saved hint snapshot refreshed to current paragraph hints, six draft answers and hint level 2 survived, and the 25-gold preview remained. Opening hint 3 showed “Без злато след третата подсказка”; reload preserved level 3, all six drafts and no reward. No horizontal overflow at either width. Disposable local learner only; no real learner or Supabase writes.
- Release checkout is based on verified production revision `1b38ecc`, excluding the unrelated unfinished landing page. No database migration required. Exact-commit hosted verification remains pending; authenticated live family sessions and physical devices are separate checks.

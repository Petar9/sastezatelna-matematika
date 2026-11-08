# Adding a competition: content checklist

Use this checklist for each new grade 4 competition or source expansion. Read [key-decisions.md](../key-decisions.md) for learning, [gold and rewards](points.md#current-approved-policy) for reward policy and [plan.md](../plan.md) for current work/release status. Pending reward proposals do not change the active checklist. Keep a separate review record for each collection. An unchecked item is pending, not approval; record a reason and reviewer for anything marked not applicable.

Do not change app behavior, publish content or reset learner progress just to complete this checklist. The three existing pilot collections were explicitly approved for publication despite disclosed outstanding review; that dated exception is recorded in [current decisions](../key-decisions.md) and does not approve future unreviewed content.

## 1. Collect and verify sources

- [ ] Record the competition, grade, years, rounds and intended source scope; do not describe a partial archive as all past tournaments.
- [ ] Keep unchanged original PDFs, answer keys and solutions privately under `materials/`, outside Git and deployment bundles. Inventory the title, filename or URL, date received, year, round, problem number, page and matching answer key. Keep private learner information out of review documents.
- [ ] Save available tutor transcripts as Markdown alongside their sources, with video URLs, timestamps and uncertain or missing passages. Record unavailable transcripts; never invent them. Tutor explanations inform teaching methods, not the answer key.
- [ ] Preserve original wording, choices, problem numbering and figures. Check extraction against the PDF for OCR errors, broken words, mixed alphabets, units and decimal notation. Label any necessary clarification separately instead of silently rewriting the original.
- [ ] Check each answer against the official key and solution where available, and independently verify the mathematics. Record missing keys, conflicting answers and ambiguous conditions; exclude unresolved problems from automatic grading.
- [ ] Review Bulgarian explanations for clear grade 4 language and mathematical accuracy. Prefer concrete instructions to academic shorthand such as “максимизирай”; do not simplify away a mathematical condition.

**Gate:** Missing official solutions do not become official answers through transcription. The approved 2024 Olympiad exception permits draft solutions from the supplied tutor video plus independent checks, followed by human review. Any new exception needs an explicit decision before dependent work.

## 2. Organize the learning content

- [ ] Map **competition → island → skill → several real problems**, preferably from different years. Count full originals separately from their subconditions and authored exercises.
- [ ] Propose the island count and skill grouping, with coverage and gaps, for the owner's approval before implementation. Group by the main solving method; split an oversized mixed-method island when both resulting groups have useful coverage. Keep each whole original together. Do not force equal island counts or disguise thin coverage.
- [ ] Prioritize eligible unseen real competition problems in adventures, diagnostics, island practice and exact-skill practice. Use reviewed similar exercises for confirmation or documented source gaps; distinguish them from originals and never invent a competition year.
- [ ] Provide exactly three concrete worked-solution parts for each prepared problem, using its actual numbers, calculations and reasoning. “Подсказка” and “Следваща подсказка” reveal them progressively; check the final answer and every intermediate step.
- [ ] Give each whole original one canonical island. Show shared context and the current natural а/б/в part, with all its answer fields and relevant diagrams; keep the full statement and completed parts collapsed. Preserve source order. An unlettered multi-answer original is one unit; scaffolds are unpaid teaching support.
- [ ] Document a provisional introductory real problem for each covered method and explain its prerequisites. Do not infer difficulty from exam numbering, text length or answer format; do not claim measured difficulty without evidence.
- [ ] Record an explicit `standard` or `hard` editorial rating and a short reasoning-based rationale for every original in `content/problem-difficulty.json`. Hard means combined methods, dependent reasoning, case analysis or proof/optimization; exam numbering, the competition badge, text length and large numbers alone do not qualify. Original parts inherit the source rating. Review authored templates separately; a harder-selection pool is not a reward rating.
- [ ] Independently check every authored exercise, harder variant, answer, diagram and explanation. Record remaining skill/source gaps rather than claiming complete coverage.

**Gate:** Obtain approval for the proposed island structure and record unresolved coverage issues before building the collection.

## 3. Integrate without losing progress

- [ ] Add stable competition, island, skill, problem and original-source identities through the existing catalogue and server content registry. Record the content version and check saved-work compatibility before changing identifiers or versions. Give separate rounds distinct stable competition IDs; renaming an existing round must preserve its ID, content version and history.
- [ ] Keep unfinished collections unpublished. Local review requires an explicit local-only access guard; `published: false` does not automatically make a new competition locally accessible. Verify hosted access still rejects the draft.
- [ ] Preserve existing answers, hints, subcondition position, drafts, unfinished adventures, gold and earned awards. Keep learning and saved work separate by child and competition; retain the existing per-child wallet behavior.
- [ ] Preserve five-step adventures (natural subparts count as steps, with unfinished originals resumed in the next adventure), diagnostics of at most three problems, related follow-ups and exact-skill selection. For finite or exhausted content, show the actual finish or return/review action without an empty loop or silent switch to another skill.
- [ ] Apply the [active gold policy](points.md#current-approved-policy) for rates, payable natural parts, hints and exclusions; pending price/variant proposals are not instructions to implement. Reset local hints per part; preserve assisted classification when earlier help affects a dependent part. Sibling parts alone must not confirm a skill.
- [ ] Test legacy whole-source/alias and new part awards in both directions: repeats, reloads and mixed ledgers must not double-pay. Preserve historical amounts, milestones, confirmation and Doctor/Professor rules; follow [gold policy](points.md#current-approved-policy) and [learning decisions](../key-decisions.md) for details.
- [ ] Show earned island gold only, without a maximum, fraction, target bar or target chest. Preserve saved target fields internally for compatibility; adding sources must not reprice history, move saved targets or cap wallet/displayed gold.
- [ ] Beneath original tasks, show only “[competition] · [year]”; for authored practice show “По [competition] · [source year]”. Resolve the source year from catalogue provenance or an explicit original-source reference, never from invented exercise dates. Link the same label to the accessible original statement; do not link excluded sources. Retain complete provenance internally.
- [ ] Save unchanged PNG figure crops under `assets/images/`, keeping their logical `/kids/figures/...png` paths in content. Run `npm run assets:build`; commit the generated manifest and optimized public files. The generator verifies pixel equality, preserves white backgrounds and versions changed images for caching. Never put complete source packs in either image directory.
- [ ] Check the visible competition selector, correct competition name, selectable islands and skills, whole-map default, readable white-backed source figures, mobile layout, keyboard/touch access and visible check/continue action.

## 4. Review and release

- [ ] Complete the [Astra copy review and owner approval gate](../AGENTS.md#astra-copy-review-before-testing) for the collection's visible Bulgarian before the tests below; save the review context and decisions in its review record.
- [ ] Have a human reviewer check every original against its source, all answers and three-part explanations, authored exercises, figures and skill mappings. Resolve discrepancies and record the reviewer, date and outcome.
- [ ] Confirm permission to publish the intended statements, figures and other assets. Keep private source packs, full transcripts, answer packs, credentials and learner data out of public assets and deployment output.
- [ ] Test original-first selection, answers, assisted versus independent evidence, subcondition persistence, repeat prevention, rewards and exhausted-content behavior using disposable learners. Prove normal-command confirmation and delayed review reachability for every skill. Retention must remain available after Professor: first after two days, then 30 days after independent review; preserve saved due dates, recovery and earned awards.
- [ ] Test switching competitions and children, reload/resume, saved drafts and stale-save conflicts. Verify that a copy of existing history retains progress, targets and awards after the content update.
- [ ] Run applicable tests, type checking, lint and production build/private-file checks. Check desktop and mobile flows and record actual results and any remaining limitations.
- [ ] Obtain publication approval only after the review gate passes for the declared collection. Follow the existing deployment workflow, verify the deployed version separately and never describe local readiness as a live release.

## Per-collection review record

Copy this record into a collection-specific review document; keep the detailed source inventory private.

| Field | Record |
| --- | --- |
| Competition / grade / stable ID | |
| Declared years and rounds / content version | |
| Private source inventory location / missing sources | |
| Approved island count and grouping / approval date | |
| Full originals: total / gradable / excluded with reasons | |
| Subconditions / authored confirmation exercises / harder variants | |
| Coverage by island and skill / missing years and methods | |
| Answer verification / source exceptions / unresolved issues | |
| Difficulty review: ordinary / hard original counts, rationale registry / practice exceptions | |
| Astra copy review / context and proposals / owner decisions / date | |
| Human reviewer / review date / outcome | |
| Verification commands and results / history compatibility | |
| Publication permission and approval / release status | |
| Next action / blocker | |

Use the status that the evidence supports: **draft → ready for human review → content approved → release verified**. Keep content approval and actual publication separate; document blockers at any stage.

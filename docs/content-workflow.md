# Adding a competition: content checklist

Use this checklist for each new grade 4 competition or source expansion. Read [key-decisions.md](../key-decisions.md) and [plan.md](../plan.md) first; those files govern learning, rewards and release policy. Keep a separate review record for each collection. An unchecked item is pending, not approval; record a reason and reviewer for anything marked not applicable.

Prepare Олимпиада before НВО. Do not change app behavior, publish content or reset learner progress just to complete this checklist.

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
- [ ] Propose the island count and skill grouping, with coverage and gaps, for the owner's approval before implementation. Prefer enriching existing islands; do not force every competition to have the same count or add categories to disguise thin coverage.
- [ ] Prioritize eligible unseen real competition problems in adventures, diagnostics, island practice and exact-skill practice. Use reviewed similar exercises for confirmation or documented source gaps; distinguish them from originals and never invent a competition year.
- [ ] Provide exactly three concrete worked-solution parts for each prepared problem, using its actual numbers, calculations and reasoning. “Подсказка” and “Следваща подсказка” reveal them progressively; check the final answer and every intermediate step.
- [ ] Keep multi-answer originals in their intended order. Do not count subconditions or scaffolding as extra independent problems or separate gold entitlements.
- [ ] Document a provisional introductory real problem for each covered method and explain its prerequisites. Do not infer difficulty from exam numbering, text length or answer format; do not claim measured difficulty without evidence.
- [ ] Record an explicit `standard` or `hard` editorial rating and a short reasoning-based rationale for every original in `content/problem-difficulty.json`. Hard means combined methods, dependent reasoning, case analysis or proof/optimization; exam numbering, the competition badge, text length and large numbers alone do not qualify. Original parts inherit the source rating. Review authored templates separately; a harder-selection pool is not a reward rating.
- [ ] Independently check every authored exercise, harder variant, answer, diagram and explanation. Record remaining skill/source gaps rather than claiming complete coverage.

**Gate:** Obtain approval for the proposed island structure and record unresolved coverage issues before building the collection.

## 3. Integrate without losing progress

- [ ] Add stable competition, island, skill, problem and original-source identities through the existing catalogue and server content registry. Record the content version and check saved-work compatibility before changing identifiers or versions.
- [ ] Keep unfinished collections unpublished. Local review requires an explicit local-only access guard; `published: false` does not automatically make a new competition locally accessible. Verify hosted access still rejects the draft.
- [ ] Preserve existing answers, hints, subcondition position, drafts, unfinished adventures, gold and earned awards. Keep learning and saved work separate by child and competition; retain the existing per-child wallet behavior.
- [ ] Preserve five-task adventures, diagnostics of at most three problems, related follow-ups and exact-skill selection. For finite or exhausted content, show the actual finish or return/review action without an empty loop or silent switch to another skill.
- [ ] Award **10 gold for an ordinary new distinct correct problem, 15 (×1.5) for a reviewed hard problem**, including a correct answer with hints; reveal alone earns no problem bonus. Persist the actual amount. Old amount-less awards remain 5; never reprice history. Keep skill milestones at 5/10/20 and preserve selection balance: this multiplier does not bias adventures toward hard questions. Show a compact coin/amount preview (×1,5 for hard), hide it for an already paid source, and test reload, mixed legacy/new ledgers and weighted new targets. Apply recovery of unpaid entitlements through future success. Originals and their parts share one entitlement; repeated answers, hints alone and reloads must not duplicate rewards. Retain academic confirmation and Doctor/Professor rules.
- [ ] Preserve each child's saved island gold target when adding sources. New content can add wallet gold without moving an existing target or closing an earned chest; retain one horizontal gold bar with the coin count and chest.
- [ ] Beneath real tasks, show only the competition title and actual year, linked to the original statement. Retain complete provenance internally. Authored confirmation work has no fabricated year; keep its teaching origin identifiable without adding a redundant footer.
- [ ] Save unchanged PNG figure crops under `assets/images/`, keeping their logical `/kids/figures/...png` paths in content. Run `npm run assets:build`; commit the generated manifest and optimized public files. The generator verifies pixel equality, preserves white backgrounds and versions changed images for caching. Never put complete source packs in either image directory.
- [ ] Check the visible competition selector, correct competition name, selectable islands and skills, whole-map default, readable white-backed source figures, mobile layout, keyboard/touch access and visible check/continue action.

## 4. Review and release

- [ ] Have a human reviewer check every original against its source, all answers and three-part explanations, authored exercises, figures and skill mappings. Resolve discrepancies and record the reviewer, date and outcome.
- [ ] Confirm permission to publish the intended statements, figures and other assets. Keep private source packs, full transcripts, answer packs, credentials and learner data out of public assets and deployment output.
- [ ] Test original-first selection, answers, assisted versus independent evidence, subcondition persistence, repeat prevention, rewards and exhausted-content behavior using disposable learners.
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
| Human reviewer / review date / outcome | |
| Verification commands and results / history compatibility | |
| Publication permission and approval / release status | |
| Next action / blocker | |

Use the status that the evidence supports: **draft → ready for human review → content approved → release verified**. Keep content approval and actual publication separate; document blockers at any stage.

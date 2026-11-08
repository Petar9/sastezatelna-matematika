# Gold and rewards

Reviewed 2026-11-08. This is the authoritative guide for gold: active rules, evidence, proposed changes and rollout checks. [Learning decisions](../key-decisions.md) still govern selection, help and confirmation; the [design system](design-system.md) governs presentation.

**Status:** owner-approved implementation and production release; final local acceptance passed, deployment verification is pending. The owner approved the detailed plan, then deferred additional NVO exercises to the next iteration. Current implementation uses 80% original coverage, 10% independent confirmation and 10% later independent review; it does not award free completion for missing content. [Implementation/copy review](points-implementation-review.md) records outstanding decisions and limitations.

## Current approved policy

- Skill milestones pay 5 for the first completed attempt/revealed solution, 10 for first correctness (assisted included), and 20 for independent confirmation, once each. These earned entitlements are separate from progress markers.
- Future distinct correct problems pay the competition default plus a fixed 5 for existing reviewed exceptions: **easy 10/15, medium 15/20, hard 20/25** (default/exceptional), including correctness after hints one or two. Reveal alone pays no problem bonus. Each natural а/б/в subpart has one entitlement after all its fields are correct. Unlettered multi-answer originals form one unit; scaffolds do not create entitlements. Legacy whole-original and part aliases block duplicate payment in both directions; historical amounts and dates remain unchanged. Replays, reconfirmation and reloads cannot pay again.
- **Hint three excludes all new gold for that attempt**, including skill milestones; persist `goldEligible: false`. Show “Без злато след третата подсказка”. Learning and assisted classification continue unchanged; later eligible success can recover unpaid entitlements at the later date. Previously paid awards remain unchanged. Approved 2026-11-05.
- Persist the actual paid problem amount. Legacy awards without an amount remain exactly 5. GET/historical projection must not backfill problem bonuses, replay celebrations or reprice history; compatible historical skill milestones restore quietly and persist with the next accepted command.
- Each child has one wallet summed across separate competition ledgers. Validate and save awards server-side with revision-guarded learning updates; never maintain an independently mutable balance or combine children/families.
- Island views show earned gold only, without a maximum, fraction, target bar or target chest. Keep saved target fields solely for compatibility; do not move targets, cap displayed earnings or recalculate history. This supersedes older island-goal display rules (2026-11-04).
- Rate difficulty by actual reasoning, with rationale in `content/problem-difficulty.json`; combined methods, dependent steps, cases and proof/optimization can justify hard. Order, competition badge, text length, answer format, large numbers and the harder-selection pool alone cannot. Rate authored practice separately; parts inherit the original. Editorial ratings are provisional, not measured levels.
- The competition price changes rewards only, not hard-task frequency, adventure selection or confirmation/academic-award criteria. No shop or spending mechanic is approved.

Implementation boundaries: skill milestones are once per skill **within each competition**, not once per transferable concept across the wallet. “Started” means a completed attempt, not opening a question. An eligible incorrect/revealed completion can earn that milestone, but no successful-problem reward. Gold eligibility and fresh independent evidence are separate: a later retry may recover unpaid gold without qualifying as new independent knowledge. Doctor/Professor and adventure stamps add no separate gold bonus.

## Owner decisions - 2026-11-08

- Successful-problem prices: **easy 10/15, medium 15/20, hard 20/25** (default/exceptional). Easy rewards must not decrease. Preserve paid history; no retrospective top-ups.
- Reuse current reviewed exception membership for the +5. Keep skill milestones **5/10/20**. Retain natural-subpart payment units and current variant eligibility; no individual base-category overrides, downgrades or new content reclassification project.
- Hints one and two remain fully rewarded. Hint three excludes all new gold for that attempt; preserve the existing warning/recovery behavior. No new hint-penalty modal.
- Reopen the last competition worked on using a small browser cookie scoped by child. An explicit competition URL wins; no extra preference API. This is same-browser navigation memory, not cross-device synchronization.
- Preparation progress uses **80% original coverage and 20% finite independent consolidation**. Show a compact bar primarily on the competition overview and the same metric with detail in Напредък. The approved neutral name is **„Напредък в подготовката“**; it is not a prediction of exam performance.
- Design the bar around the existing otter and design system. The final approved refinement places the overview card below the map, with a 24px gap, and one count-only accordion panel in Напредък; copy decisions are resolved in the linked review record.

The owner approved the complete plan, final UI refinements and production deployment on 2026-11-08; see [release evidence](points-implementation-review.md).

## Pre-change audit - 2026-11-07

Inspected implementation: [gold calculation and ledger](../src/core/kids-gold.ts), [attempts and natural-part grading](../src/core/kids-course.ts), [catalogue identity/selection](../src/core/kids-selection.ts), [competition labels](../src/core/competitions.ts), [saved competition courses](../src/store/supabase-course.ts) and [rating registry](../content/problem-difficulty.json).

1. Before this implementation there was **no competition-specific rate**. All five competitions paid 10 or 15 according to editorial problem difficulty. Current badges: NVO easy; municipal Olympiad medium; Maths, Spring and regional Olympiad hard. Badges and reward difficulty are different concepts.
2. The 5/10/20 skill awards can outweigh the successful-problem award. A first correct standard task on an untouched skill can pay **25** (5 + 10 + 10); a hard one **30**. Opening many easy skills can therefore be attractive. This is an incentive effect, not evidence of duplicate payment.
3. Numerical variants can have separate rewarded identities. Static Maths enumeration contains **2,832 authored entries plus 102 original entries**; these are catalogue entries, not 2,934 different source problems or demonstrated reachable rewards. Generation is finite today; no infinite exploit was verified. Changing only numbers can still create many earning opportunities within a hard-labelled competition.
4. Static NVO enumeration has **100 originals, 108 natural units and 27 skills**. Current inherited ratings give 82 standard units and 26 hard units: nominal problem gold `82 × 10 + 26 × 15 = 1,210`; nominal skill awards at most `27 × 35 = 945`. These sums are catalogue calculations, not a reachable-wallet proof or a real child's balance. Hard NVO work occurs beyond just the final written questions; answer format alone is not a difficulty test.
5. Current natural parts inherit their original's difficulty. Rating each part separately would change editorial policy and data, even while preserving the approved payment unit.
6. Paid problem amounts are persisted, but skill awards currently store only milestone/date and use the current 5/10/20 constants when read. Changing those constants without preserving historical amounts would reprice existing balances. Keep them unchanged in the first trial.
7. The dated [difficulty review](problem-difficulty-review.md) contained superseded whole-original/hint rules. It is historical rating evidence; this guide owns current reward policy. Historical pilot badge counts are also not the current competition registry.

The report of easy-content preference is useful qualitative evidence. We did not inspect Ema's current records, measure solve times, infer her ability or establish how common the behavior is.

### Why doubling alone may not solve it

For diagnosis, compare expected eligible reward against effort and success, rather than just the displayed amount. Hypothetically, a hard task taking five times as long but paying twice as much yields 40% of the easy task's gold per minute at equal success probability. Lower success makes the difference larger. These are arithmetic examples, **not measured solve times** and not a proposal to pay by time.

Milestones narrow the proposed gap further: a first correct untouched skill would pay 25/30/35 at problem prices 10/15/20; a first easy success can exceed a 20-gold hard success on an already rewarded skill. Two initial fresh independent successes followed by normal confirmation would total 55/65/75. Those examples assume eligibility and no previous awards; helped/recovery paths differ.

The objective is useful preparation and growing independence. Harder work can be irrelevant or premature; easier prerequisite/recovery work can be useful. Exact gold-per-minute parity is not the objective; time and success probability vary across children and tasks.

## Research and its limits

Sources checked 2026-11-07. Product descriptions establish what a service does; experiments and syntheses inform risks. None establishes an optimal multiplier for Bulgarian fourth graders.

| Primary source | Relevant finding | Practical inference and limitation |
| --- | --- | --- |
| [Duolingo: Time Spent Learning Well](https://blog.duolingo.com/time-spent-learning-well/) (official product account; page date not exposed) | Duolingo describes short/easy sessions biasing its activity metric, bulk XP grinding, moving monthly challenges from XP to quests, and raising rewards along the learning path. | Align rewards and the next action with useful progress. Its reported gains concern an internal proxy; this is not independent evidence for maths learning or a reason to copy leagues, streak pressure or daily time targets. |
| [Khan Academy: energy points](https://support.khanacademy.org/hc/en-us/articles/202487710-What-are-energy-points-badges-and-avatars) (updated June 2025) and [mastery levels](https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work) (updated August 2023) | Points represent effort rather than ability; skill mastery uses separate performance evidence. | Keep earned gold separate from confirmed skills. These are documented design choices, not causal tests of effectiveness. |
| [Sailer & Homner, The Gamification of Learning](https://link.springer.com/article/10.1007/s10648-019-09498-w) (2019 online / 2020 issue, meta-analysis) | Pooled learning, motivation and behavior effects were positive but heterogeneous; motivational/behavioral findings were less robust in higher-rigor subsets. | Game elements can help, but intervention packages and settings vary. The study cannot isolate gold, justify exact rates or guarantee effects in grade 4. |
| [Deci, Koestner & Ryan](https://selfdeterminationtheory.org/wp-content/uploads/2014/04/1999_DeciKoestnerRyan_Meta.pdf) (1999, meta-analysis) | Expected tangible rewards sometimes reduced later free-choice engagement; child samples showed greater adverse effects than college samples. | Avoid making every learning action a transaction. Laboratory rewards and short tasks differ from this persistent app; the result does not show that all digital points are harmful. |
| [Cameron, Banko & Pierce](https://pmc.ncbi.nlm.nih.gov/articles/PMC2731358/) (2001, competing meta-analysis) | Reward effects depended on interest and reward contingency; the authors rejected a pervasive negative effect. | Read the disagreement, rather than treating removal of all rewards as established science. Neither synthesis prices a modern learning economy. |
| [Patall, Cooper & Robinson](https://selfdeterminationtheory.org/wp-content/uploads/2019/10/2008_PatallCooperRobinson_PsychBulletin.pdf) (2008, meta-analysis) | Choice generally benefited motivation, effort and performance across child/adult studies, with contextual differences. | Recommend preparation while retaining choice. This does not prove unrestricted easy-task selection is best for learning. |
| [Mueller & Dweck](https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf) (1998, six experiments with fifth graders) | Intelligence praise produced less favorable persistence and responses to failure than effort praise. | Give specific feedback about strategies and progress. The age group is close, but brief praise experiments do not validate gold rates or paying for elapsed time. |
| [Baker et al., Off-Task Behavior in the Cognitive Tutor Classroom](https://www.cs.cmu.edu/~rsbaker/p383-baker-rev.pdf) (CHI 2004, classroom study) | Gaming help/feedback was associated with lower learning, including after controlling prior knowledge. | Reward-driven activity is not learning evidence. This was observational and concerns different behavior/older students; legitimately choosing easy competitions is not cheating. |

Design inference: retain simple recognition, make relevant progress the obvious next step, preserve useful help and test changes against later independent work. Exact prices below remain product hypotheses.

## Revised recommendations

| Priority | Improvement | Decision / boundary |
| --- | --- | --- |
| 1 | Resume the last worked competition per child on this browser. | Owner-requested behavior. Use the approved small browser cookie: the server can choose the first course without a new preference API or first rendering Maths. Explicit competition URLs take precedence; validate available IDs and fall back safely. |
| 2 | Apply the owner's competition prices, retaining easy exceptions and earned history. | Prices selected below. Reuse the approved current reviewed exception flags for the +5. Do not promise that a 2× price removes the time/effort incentive. |
| 3 | Retire individual base-category overrides and downgrades. | Owner rejected the earlier recommendation. Do not make a new difficulty audit or easy-task reward reduction a prerequisite. |
| 4 | Keep current variant eligibility in a price-only release. | Restricting earning opportunities is a separate unapproved policy. Static audit evidence does not authorize a cap or removal of currently available rewards. |
| 5 | Keep skill milestones at 5/10/20 for this first release. | Approved: isolate the problem-price increase and preserve history. Do not silently multiply milestones or remove easy rewards. |
| 6 | Improve the existing progress overview before claiming readiness. | The approved 80/10/10 calculation is specified below. Count distinct coverage and independent consolidation; do not equate coin totals, repeated activity or lifetime confirmation with current ability. |
| 7 | Keep hints one/two fully rewarded and hint three at zero. | Explicitly retained by the owner. Preserve recovery, help classification, pause/resume and the existing third-hint warning; no new penalty modal. |
| 8 | Evaluate useful preparation in the existing Напредък view and a small observed pilot. | Look for broader relevant coverage and later independent performance, alongside frustration, abandonment and appropriate help seeking. Gold totals alone do not establish learning. |

No shop, paid boosts, public ranking, time-based pay, forced hard-only route, lost streaks or daily earning limits are needed for this revision. Useful easy practice remains available.

## Approved problem prices

| Competition difficulty | Default gold | Exceptional gold |
| --- | ---: | ---: |
| Easy | 10 | 15 |
| Medium | 15 | 20 |
| Hard | 20 | 25 |

Use one resolved amount per approved natural unit, with one +5 exception. Do not stack the old ×1.5, compound exceptions or multiply milestone awards. Keep replay and third-hint exclusions. Repricing never tops up already-paid awards or creates a second entitlement.

Approved exception mapping: reuse current reviewed exception membership. Easy 10/15 remains unchanged, medium 10/15 becomes 15/20, and hard 10/15 becomes 20/25 for future eligible awards. Existing easy exceptions are not limited to final written questions; question position and answer format must not silently remove them. The competition registry currently marks municipal Olympiad medium; an older historical document says hard. These prices do not authorize changing that published medium classification.

## Last-worked competition - approved direction

The current server chooses and loads the course before the client mounts. A localStorage-only restore would first load the default Maths course and then potentially request another course. Use a small validated browser cookie storing only the last competition ID per child. The existing page request can read it; no additional preference endpoint or database query is needed. Scope by child so siblings do not overwrite each other's navigation. Explicit URL choice wins, an unavailable/invalid preference falls back to the default, and failure to persist never blocks learning.

Record a successfully saved graded answer (including wrong or partial answers) or completed reveal, rather than merely visiting another map. Hints, drafts, selection and failed/stale saves do not update the cookie. This remembers navigation on the same browser after login; it does not promise cross-device synchronization or replace saved learning state. Server authorization still determines which child/course can load.

## Preparation progress - approved 80/10/10

The chosen weights are a product convention, not a validated prediction of competition performance. The owner approved the following evidence rules for local implementation.

### Original coverage: 80%

- Scope: available, gradable canonical source originals in the selected competition, across its included years. Exclude blocked originals. Never use raw catalogue rows, gold entries or numerical variants as the original denominator.
- Partial credit: every original has equal total weight. Its coverage is successful required natural units divided by all its required units. A correct а) in an а/б/в source earns one-third of that original's coverage; all three earn one original. An unlettered multi-field question stays one unit; scaffolds add no coverage.
- Correct answers, including assisted correctness after hints one, two or three, count as coverage. Merely opening/revealing a solution, a wrong answer or an unfinished answer does not. Gold eligibility is a separate rule. A later eligible success can complete a previously unsuccessful unit.
- Detail label: **„Задачи от състезания“**, counting distinct successful graded natural units (`X/Y`). Each separately graded а/б/в subpart is one task; an unlettered multi-field original is one task. Skills remain a separate denominator. The percentage still weights whole originals equally and includes fractional coverage; task counts do not change its 80/10/10 formula. Do not infer success from `sourceComplete`: it can be set on last-part submission even if earlier parts were wrong/revealed.
- Deduplicate stable source/unit identities and known legacy aliases; ambiguous historical evidence earns only what it proves. Keep an internal scope version. Future-addition policy: preserve an existing child's scope until an explicitly communicated scope update; new children start with the current scope. Do not silently reduce earned progress when content is added. Persist only source/unit and skill IDs plus the scope version in the existing course JSON on accepted commands. Legacy profiles without metadata use the fixed initial-release baseline; GET never writes. New courses use the current catalogue. Existing baseline entries are immutable; `scripts/generate-preparation-baseline.ts` adds only missing competitions.

### Independent consolidation: 20%

Finite target: **10% for independent confirmation and 10% for a subsequent independent review**, averaged over the competition's included skills. Reuse existing confirmation and delayed-review evidence, rather than introduce another mastery algorithm. Original questions may supply qualifying independent evidence, as well as authored practice; one success may support coverage and confirmation because these measure different things. Repeated immediate submission is not new evidence.

This replaces “solve all extra problems”: Maths has thousands of authored entries, while NVO has none. NVO must be able to consolidate using eligible originals and later review. Reaching 100% must be possible through the normal learning route for every included skill; prove this before committing the denominator. If existing selection cannot reach a target, bring back the specific content/route gap for a bounded decision rather than award free credit, silently shrink the target or invent exercises.

Calculation: `percentage = 80 × originalCoverage + 10 × confirmedSkillFraction + 10 × subsequentlyReviewedSkillFraction`, each fraction capped at one. A review counts only after that skill's qualifying confirmation and the existing review interval; missing dates do not establish delayed review. Show whole percentages rounded down, and show 100% only when all defined targets are met. Progress is accumulated preparation, so later mistakes or time passing do not remove it; current recall needs stay visible separately.

### Scope inventory and limitations

Astra's read-only catalogue enumeration on 2026-11-08 found 86 distinct Maths source originals / 78 skills, municipal 11 / 12, regional 12 / 7, Spring 19 / 12 and NVO 100 / 27. The generated initial-release baseline uses these source/skill counts. Maths' 102 original catalogue entries include connected entries for the same source. A normal-command simulation confirmed 134/136 skills can confirm and later review; the two exceptions below remain explicit content/route limitations.

Known gaps: NVO `nvo-area-units` has no fresh second core example; regional Olympiad `oli-ob-growth` has only harder-pool alternatives before confirmation. Do not fabricate consolidation credit or hide these skills. The owner deferred adding NVO exercises to the next iteration; regional routing remains a separate follow-up. Those competitions cannot yet reach 100% through the current normal route for every skill.

Compute one pure source-aware projection on the server from the authorized course and catalogue metadata. Existing calendar events lack the identities needed to calculate this reliably. Return only totals, fractions, status and scope metadata to both surfaces, not answers or raw courses. Reuse existing reads; no extra request on navigation, submission or login.

## Hints - owner retained full rewards

Hints one and two continue to earn the full applicable problem reward. Hint three excludes new gold under the current policy. Never deduct existing wallet gold. The owner explicitly chose this after discussing reductions from the first hint; do not reopen that choice without new evidence or a new request.

Follow-up research: [Roll et al. (2011), help-seeking tutoring](https://pact.cs.cmu.edu/pubs/Roll%2C%20Aleven%2C%20McLaren%20%26%20Koedinger%202011.pdf) distinguishes productive help seeking, help avoidance and misuse. It does not establish an optimal coin penalty for this app. Penalizing early help could make harder practice less attractive; this is a plausible product risk, not a measured result here. [NN/g confirmation-dialog guidance](https://www.nngroup.com/articles/confirmation-dialog/) advises against routine disruptive confirmations. Preserve clear advance consequences for the existing third-hint behavior; no new every-hint dialog is proposed.

## Generated practice - separate option

Separate unapproved research option: explicitly reviewed finite rewarded variants/templates with stable identities; additional generated number substitutions remain available without automatically creating more paid entitlements. Preserve natural original-part rewards and already-paid variant entries. Do not collapse all exercises for a skill into one payment: different reviewed reasoning and legitimate confirmation work can be distinct.

Before implementation, decide whether this applies only to future catalogue additions or also to currently unpaid variants. No daily cap, random diminishing returns or cross-competition deduplication is proposed. Explain any changed future availability honestly; do not describe new restrictions as an existing anti-duplicate rule.

## History and implementation acceptance

- Preserve every paid amount/date, legacy amount-less problem award at 5, milestone constants, stable child/owner IDs and competition-separated ledgers. No balance reset, retrospective top-up, new historical problem bonuses or GET write/backfill. Quiet legacy skill projection remains unchanged.
- Use one price resolver for preview and server-side award calculation. Pass authoritative competition difficulty and current reviewed exception membership; never trust a client-supplied price. Persist the resolved amount. Do not stack the old ×1.5 with the new table.
- Pending-work rule: apply the new, non-decreasing rate to the next unpaid eligible award, including a saved attempt started before release. Its resumed preview must show that rate. Already paid awards stay unchanged. This approved rule also governs resumed previews.
- Preserve natural-unit and whole/part legacy aliases, revision checks and authorization. A lost-response retry cannot mint another award. Reordering fields, adding scaffolds or renaming presentation cannot create entitlements.
- Keep earning eligibility separate from fresh independent evidence and the preparation projection. Do not change selection frequency, Doctor/Professor criteria or current variant eligibility as a hidden consequence of repricing.

| Area | Required acceptance cases |
| --- | --- |
| Prices/history | All six prices; original/authored/part units; preview equals persisted payout; no stacking, retrospective top-ups or revaluation of mixed historical amounts, legacy 5 or milestones. Validate registry metadata. |
| Hints/recovery | Hints 0/1/2 and 3, dependent help, wrong/reveal, later eligible recovery, pause/resume; third-hint exclusion persists and never deducts wallet gold. |
| Coverage | One-of-three versus all-three; wrong/revealed earlier part with a correct last part; multiple fields, scaffolds, aliases, assisted success and hint three; no credit from gold or ambiguous history. |
| Consolidation | Existing confirmation, qualifying later review, immediate repeats, missing dates, no-extra-content NVO and exhausted routes; finite targets actually reachable. |
| Scope | Blocked originals, added material, version persistence, empty/unavailable targets, integer solved count distinct from fractional bar; both surfaces agree. |
| Resume/reliability | Explicit URL overrides cookie; meaningful saved work updates it; browsing does not; invalid/disabled cookie, child switch, shared adult, reload, stale save and failed save recover safely. No extra preference request or wrong initial-course fetch. |
| UI | 0/partial/80/100%, endpoint clamps, long Bulgarian, 320/390px and desktop, keyboard, screen reader values, reduced motion, no task/action-bar overlap or duplicate adventure meaning. |
| Privacy | Authorized child scope, sibling/family isolation, no answers in preparation projection; disposable fixtures only. |

Astra reviews new visible Bulgarian and the owner approves its wording in conversation before acceptance testing, following [AGENTS.md](../AGENTS.md#astra-copy-review-before-testing).

## Full implementation plan

### 1. Resolve detailed rules and establish fixtures

Keep the approved direction above. Record the approved specific decisions below and the exact coverage/consolidation rules. Produce a target manifest and reachability check for all five competitions, including legacy aliases, blocked originals and NVO. Establish synthetic old/new ledger, multipart and review fixtures. Do not inspect or rewrite a real child's records to establish behavior.

Acceptance: each target has a stable identity and a reachable normal route; every historical inference is supported; unresolved gaps are explicit. No new content or selection redesign is assumed.

### 2. Implement prices and safe resume as separate slices

First add the shared reward resolver and six-price tests, preserving historical payouts and hints. Then add the per-child browser cookie to the existing course resolution/save path. Approved “worked” trigger: an accepted graded answer or completed reveal, including a wrong graded answer; map browsing, selecting a competition, opening a hint and failed/stale saves do not update it. Store only competition IDs keyed by authorized child identity; validate published IDs and bound cookie size. Explicit URL selection wins. Persistence failure never blocks practice, and existing unsaved-work protection remains.

Acceptance: no new preference endpoint, extra initial course fetch or database read; preview and actual reward agree; saved task, ledger and authorization regressions pass.

### 3. Implement the shared preparation projection

Add the pure source-aware calculation and bounded scope metadata using the approved detailed rules. Derive it from existing authorized course/catalogue reads. Wire one projected value to the competition view and Напредък; never calculate separate percentages in components or infer coverage from calendar aggregates. Keep calendar dates, events and gold unchanged.

Acceptance: the coverage/consolidation matrix passes across all competitions and relevant legacy formats; a completed finite scope reaches exactly 100%; adding content follows the approved scope policy. Report persistence/schema needs before making any external migration.

### 4. Build the otter preparation bar

Use one small domain component, `CompetitionPreparation`, plus a detailed variant on Напредък. Reuse `KidsOtter`, shared card/text/spacing/focus styles and the existing **blue `--progress` / pale `--progress-track`** tokens. Gold remains reserved for currency. Do not introduce a competing visual theme or assign Doctor/Professor rank from this percentage.

Approved compact layout: title left, percentage right; a calm water-like track beneath with a small otter at the filled endpoint and a quiet link to Напредък. Omit the repeated solved-original count. Keep the otter decorative and modest beside the existing welcome illustration. No chest, additional reward, repeated helper paragraph, new mascot asset or looping animation. Clamp the illustration at both ends so it cannot overlap text or leave the card.

On the main selected-competition overview, place the card after the map with a 24px gap. Exclude focused islands and exercise screens, which already have task/skill progress. On Напредък, place one all-competition accordion panel after calendar/day activity and before upcoming dates, independent of the calendar filter. Show only available rows above 0%, with separate task/confirmation/review counts and no weight labels. Parent and child see the same authorized evidence. Do not label the 80% position as “all originals”: consolidation can accrue before originals are complete.

States: new learner, partial source, all originals with consolidation outstanding, 100%, unavailable scope and failed refresh. Retain the last saved value during a save; never flash zero or advance optimistically before acceptance. Use one labelled progressbar with numeric value and meaningful accessible text; decoration is hidden from assistive technology. Respect reduced motion; otherwise only a short existing progress transition after a saved increase. Buttons/links retain 44px targets and visible focus.

Add examples to the development-only design catalogue at 0%, partial and 100%, mobile and long-label states. [WAI-ARIA](https://www.w3.org/TR/wai-aria/#progressbar) supplies progress semantics; the [meter guidance](https://www.w3.org/WAI/ARIA/apg/patterns/meter/) distinguishes measurement from task completion; [W3C motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) supports suppressing unnecessary interaction animation. These sources do not validate the educational weights.

### 5. Review wording and verify locally

Present a local version with synthetic profiles and real catalogue content. Independent **gpt-6-astra** reviews changed Bulgarian, the proposed progress descriptions and consistency with approved wording. Keep suggestions visible in chat/terminal context and this review record; apply only owner-approved changes before acceptance testing.

Run focused reward, connected-part, projection, selection and competition tests; then the full suite, typecheck, lint, production build and private-file checks. Check actual desktop/mobile pages, keyboard/reduced motion and all relevant transitions, including last-competition login, shared-adult access and both progress surfaces. Preserve production-only `/design-system` exclusion. Test a realistic long source without touching a learner's record.

Acceptance: passing evidence plus a local owner review of the bar, amounts, resume and truthful breakdown. Distinguish browser fixtures from actual authenticated/physical-device verification. This plan does not claim those tests have run.

### 6. Release only after local acceptance, then observe

After explicit production approval, deploy the tested revision using the existing release process and smoke-test prices, resume, scope projection and both surfaces on the actual build. Record revision, checks and limitations in plan.md. No hosting purchase/migration, telemetry project or unrelated cleanup is included. Rollback must preserve paid amounts and any scope metadata already saved; never undo a child's earned gold.

Observe ordinary sessions for relevant original coverage, later independent success, useful hint use, abandonment and frustration. Higher gold or harder clicks alone do not demonstrate learning. If the incentive still favors easy repetition, discuss a separate targeted change; do not introduce caps, new variant restrictions or continually inflate prices in this release.

## Approved implementation details

The owner approved the full plan before implementation: equal original weights, fractional natural-unit credit, assisted-success coverage, 80/10/10 calculation, versioned scope preservation, increased rates for unpaid saved work, meaningful-work browser memory and the compact otter layout. The earlier labels „Решени оригинални задачи: X от Y“ and „Самостоятелни упражнения и преговор“ were superseded by the approved count-only panel: „Задачи от състезания“, „Затвърдени умения“ and „Преговор“.

The subsequent Astra copy proposals and their approval status are recorded in [the local implementation review](points-implementation-review.md). Final acceptance tests wait for that copy decision. No new NVO exercises or production release are included in this iteration.

## Review and verification record

- 2026-11-07: three read-only workers covered implementation, primary-source research and independent decisions review. The decision reviewer ran **gpt-6-astra**, not merely an agent named Astra; audit/research workers ran gpt-6.1-terra (high) and gpt-6.1-sol (low). The coordinator retained integration and verification ownership.
- Initial Astra conclusions (2026-11-07, subsequently revised by owner decisions above): multipliers alone do not guarantee that relevant harder work becomes more attractive; preparation relevance is the strongest alignment change; distinguish competition default from actual reasoning, review natural units, bound future variant entitlements, keep milestone rates/history and the approved hint rule. At that review these suggestions were pending; the independent review is not human approval and does not override the subsequent owner decisions.
- Final independent Astra document review: clarified that base-category overrides use only the proposed price table, softened the multiplier conclusion to uncertainty rather than impossibility, and removed an unsupported claim about time calibration. These corrections described the original draft; the 2026-11-08 owner decisions supersede its proposed rates and category overrides.
- Targeted audit verification: `NODE_ENV=test node --import tsx --test tests/kids-gold.test.ts tests/competitions.test.ts tests/problem-difficulty.test.ts tests/kids-connected.test.ts` passed 29/29 with disposable fixtures. This checks existing behavior, not the proposed economy or a deployed release.
- Documentation verification and final coordinator check are recorded in [plan.md](../plan.md). No new user-visible Bulgarian copy is introduced here; any later UI copy follows the existing Astra/owner gate.

- 2026-11-08: independent follow-up **gpt-6-astra** review checked the revised prices, exception/history preservation, local resume, readiness denominator and hint/modal proposals. It recommended retaining full early-hint rewards, avoiding repeated modals and separating coverage from readiness; the owner then explicitly retained full rewards for hints one/two. It flagged milestone scope and the difference between lifetime confirmation and current readiness. No runtime/copy approval or learner-data access was implied.

- 2026-11-08: independent **gpt-6-astra** plan/code review identified raw-entry/source count differences, the unsafe `sourceComplete` shortcut, insufficient calendar identities and NVO's lack of authored extras. The plan now explicitly requires source-aware evidence and reachability verification. Astra retained „Напредък в подготовката“ and proposed the two detail labels above; these suggestions are preserved here and presented in conversation for owner review. The coordinator retains the design system's blue progress tokens. Review was read-only; no learner data, runtime acceptance test or deployment was involved.

### Displayed task inventory

| Competition | Included gradable originals | Graded tasks | Skills |
| --- | ---: | ---: | ---: |
| Математика за всеки | 86 | 102 | 78 |
| Олимпиада (общински кръг) | 11 | 21 | 12 |
| НВО | 100 | 108 | 27 |
| Пролетно математическо състезание | 19 | 38 | 12 |
| Олимпиада (областен кръг) | 12 | 23 | 7 |

Municipal editions cover 2022–2025. The incomplete 2023 problem 3 remains blocked, so 11 gradable originals is intentional. Do not manufacture an answer or completion to reach 12. Calendar cells combine independent and hinted successes as „1 задача“ / „N задачи“, including natural parts; wrong and revealed attempts remain separate in the day details.

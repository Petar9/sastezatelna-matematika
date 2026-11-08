# Current work - Състезателна математика

## Sharing action controls - released, 2026-11-08

- Owner approved quiet-outline option A after reviewing all three alternatives: red email-removal X, confirmation with primary “Да” and neutral close/Escape cancellation, and overlapping-rectangle copy icon with matching success tick. Independent configured `gpt-6-astra` copy review recommended no changes; approval context is saved in [shared access](docs/child-sharing.md#copy-review).
- Verification: 363/363 application tests, TypeScript, ESLint and optimized production build/private-file checks passed. Chrome actual-component/CSS fixtures at 320/390/1440px confirmed no overflow, 44px controls, native modal/focus behavior, cancellation, failed-removal retry, duplicate prevention and clipboard/manual fallback. No API, authentication, database or learner-history changes.
- Owner explicitly approved production publication in chat on 2026-11-08. Published application revision `9c352b4`; Vercel reports success for that exact commit, and live checks confirm the new confirmation and SVG in all eight successfully loaded login JS assets. Real Google owner/recipient sessions remain an owner smoke check.

## Unified email access - released, 2026-11-08

- Approved shared-email UI and access logic are published; independent actual Astra copy review recommended no changes. Local application tests, TypeScript, lint and production build passed; owner reported both production SQL queries succeeded on 2026-11-08; final local release checks passed.
- Owner explicitly waived the pre-migration backup on 2026-11-08. Supabase SQL Editor initially reported a query truncated inside the email regex. Replaced the POSIX whitespace notation with equivalent PostgreSQL shorthand and supplied separate protected-table and function transactions for manual execution.
- Disposable-database verification includes both separately committed queries, identity/family isolation, legacy access, revocation, RLS/RPC permissions, progress preservation and malformed/whitespace email rejection. Owner success is reported evidence, not an independent inspection of production database records.

- Final verification: 361/361 application tests, disposable database migration/security/progress regression, TypeScript, ESLint, optimized production build/private-file exclusions and whitespace checks passed. Chrome sharing/fallback layouts at 320/390/1440px have no horizontal overflow and 44px icon targets; daily accordions were checked with keyboard/reduced motion. Real Google sessions and physical-device continuity remain owner smoke checks.

## Daily progress details - released, 2026-11-08

- [x] Reused the preparation accordion pattern for daily competition groups: collapsed initially, independently expandable, day totals always visible, and expansion reset when selecting another day. Existing skill copy, counts and history projection are unchanged.
- [x] Verification: 361/361 tests, TypeScript, ESLint, optimized build/private-file checks and whitespace checks passed. Chrome confirmed Enter/Space activation, visible focus, day reset, reduced motion and no horizontal overflow at 320/390px and desktop; no browser errors observed.
- Local review: http://127.0.0.1:3020/progress (select 2 November for activity across all five competitions in the isolated historical/synthetic preview). No learner/database writes during local testing; published with application revision `5053eef`.

Updated 2026-11-08. Read [AGENTS.md](AGENTS.md) for the working agreement and task-specific guides. This file tracks current work and evidence, not permanent product policy. Historical rollout requirements and completed slices are preserved in the [implementation history](docs/archive/implementation-history.md); approved behavior lives in [key-decisions.md](key-decisions.md).

## Reward and preparation implementation - released, 2026-11-08

- [x] Applied easy 10/15, medium 15/20 and hard 20/25 rewards through one preview/payout resolver; preserve historical payouts, milestones and full early-hint rewards. Added child-scoped same-browser last-worked competition resume after accepted graded work.
- [x] Added immutable baseline/current-scope preparation projection (80/10/10), all-competition count-only accordion panel and bottom-of-overview otter card with 24px separation. Task totals count distinct graded natural parts: 102/21/108/38/23 across Maths/municipal/NVO/Spring/regional; percentages retain equal original weighting.
- [x] Calendar cells use „1 задача“ / „N задачи“, including mixed independent/hinted successes. Doctor uses a diploma/seal and Professor a graduation cap; earning and motion rules are unchanged. Independent actual Astra review recommended no further wording changes; owner decisions and deferred proposals are recorded in [acceptance evidence](docs/points-implementation-review.md).
- [x] Final local acceptance: 360/360 tests, TypeScript, ESLint, production build/private-file and whitespace checks passed. Real Chrome desktop and 320/390px checks covered independent keyboard accordions, task totals, calendar labels, reduced motion, badge artwork and spacing. Private historical/synthetic preview fingerprints unchanged.
- [x] Published tested application revision `87edf03` and verified Vercel success, live public routes/assets and private access protections; see current release below. Production publication explicitly approved by the owner on 2026-11-08.
- Local preview: http://127.0.0.1:3018/progress. Maths uses an isolated older import snapshot, the other four competitions synthetic histories; no Supabase or real learner writes.
- Known content gaps: 134/136 skills confirm/review through normal commands. NVO `nvo-area-units` needs another core example (deferred by owner); regional `oli-ob-growth` routing remains a follow-up. Preserve honest incomplete progress.

## Gold economy research - 2026-11-07

- [x] Audited current rewards, natural-unit identities, authored variants and persistence; researched Duolingo/Khan Academy and primary educational/game-design studies with three workers, including independent gpt-6-astra decision review.
- [x] Added [Gold and rewards](docs/points.md) as the authoritative policy/research guide; moved the existing approved gold rules intact and linked agent routing, learning decisions, content checklist, design system and historical difficulty review. Saved ranked recommendations, evidence limits, draft rates, approval decisions and staged acceptance checks.
- [x] Recorded 2026-11-08 owner decisions: competition prices 10/15, 15/20 and 20/25; preserve easy/earned rewards, retire individual base-category downgrades, retain full rewards after hints one/two and the third-hint zero rule. Independent follow-up gpt-6-astra critique informed the revised recommendations.
- [x] Recorded the owner-approved 80/20 preparation bar, primary competition-overview placement plus Напредък detail, existing exception reuse, milestone 5/10/20, unchanged variant eligibility and per-child browser-cookie resume.
- [x] Wrote the [full implementation plan](docs/points.md#full-implementation-plan), including the otter UI proposal, finite coverage/consolidation, history protection, test matrix and local-before-production stages; linked the planned pattern from the design system. Independent gpt-6-astra inspected the denominator, legacy evidence, review routes and Bulgarian labels.
- [x] Owner approved the detailed plan and final production release; see current implementation status and the explicit remaining content limitations above.
- Planning verification (2026-11-08): 33 relative file links resolve, the active runtime-policy section is byte-for-byte unchanged, stale 60/40 proposals were removed, and `git diff --check` passes. Application tests were not rerun for documentation-only work.
- Verification: on 2026-11-07 the coordinator repeated the targeted existing-behavior suite (29/29 passed), checked that the approved gold policy moved intact and that relative documentation references resolve, and inspected the Markdown diff/whitespace and scope. Independent Astra reviewed the final research draft; three precision corrections were applied. The 2026-11-08 revision checked documentation links, unchanged runtime-policy text and whitespace; no runtime tests were repeated for this documentation-only follow-up. These checks do not verify the proposed economy or a deployed release.

## Current release

- Production: https://sastezatelna-matematika.vercel.app/ . Application revision `9c352b4`, 2026-11-08. Vercel [deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/5qZBtmhk3dkRrKZuNT1sAjoCPEgT) reports success for that exact commit; owner explicitly requested deployment in chat.
- Published quiet-outline red removal X with confirmation, primary “Да”, neutral close/Escape cancellation, and overlapping-rectangle copy icon with matching success tick. Preserve owner-only management, direct Google email access, legacy access and daily progress accordions. This iteration changes no API, authentication, schema or learner records.
- Local verification: 363/363 application tests, TypeScript, ESLint, optimized production build/private-file checks, whitespace and changed documentation links passed. Chrome actual-component/CSS fixtures at 320/390/1440px cover wrapping, 44px controls, native modal/focus, cancellation, failure/retry, duplicate prevention and copy/manual fallback. Independent configured Astra review recommended no copy changes; owner approved option A.
- Live HTTPS: home/login/materials/robots/sitemap return 200; profiles/progress retain login redirects with no-store; sharing and course APIs return 401/no-store; development catalogue returns 404. All eight login-referenced JS assets return 200 and contain the new confirmation and copy SVG. No authenticated mutation was used for release verification.
- Real Google owner/recipient sessions and physical-device behavior remain owner smoke checks. The earlier Supabase migration is owner-reported, not independently inspected; no additional migration is needed for these controls.

## Previous rewards release

- Production: https://sastezatelna-matematika.vercel.app/ . Application release: `87edf03d3bbb9ec21a420edab6e61f291178d54d`, 2026-11-08. Vercel: [verified release](https://vercel.com/petar-s-projects33/sastezatelna-matematika/BR9ZXeA7ZFvX86eqwb1HRG1uqr8r); GitHub Vercel commit status reports success.
- Published: competition gold rates and per-child same-browser last-worked competition resume, all-five-competition preparation panel, natural-part task counts, bottom-of-overview otter card with 24px separation, diploma/cap academic badges and calendar „задача/задачи“. Historical rewards, percentage weighting and earning criteria are preserved. See [acceptance evidence](docs/points-implementation-review.md).
- Final local checks: 360/360 tests, TypeScript, ESLint, optimized production build/private-file checks and desktop/mobile Chrome passed. Isolated historical/synthetic preview hashes are unchanged.
- Live HTTPS checks: home, materials hub, six articles, sitemap and robots return 200; public materials retain canonical/indexing metadata, shared caching and no Set-Cookie. Anonymous progress uses a streamed login redirect with no-store/noindex; course API returns 401/no-store and development catalogue returns 404. All twelve live-referenced JS assets return 200, including the new preparation labels. Local chunk names differ from the production build and were not used as deployment evidence.
- Live Chrome mobile check at 390px: materials page has no horizontal overflow, broken images or runtime console errors. Authenticated preparation UI was tested on the local production build, not through a real live Google account.
- No database schema, real learner history or Supabase records changed. Real parent/child Google sessions and physical-device checks remain owner checks. The two documented content-route gaps remain honest incomplete preparation; commercial landing expansion and billing remain plan-only.
- Competition snapshots retain the earlier 30-second mounted-learner reuse policy with stale/focus/write checks. Local checks and deployment success do not establish authenticated end-to-end latency for a real child.

## Approved release readiness - 2026-11-06

- [x] Applied the approved Bulgarian revisions to Spring and Regional Olympiad hints, explanations, labels and descriptions; retained source answers, stable IDs, content versions and exclusions. Independent Astra review found no remaining material content blocker; this does not replace the pending human review.
- [x] Prepared both new competitions for publication, bringing the catalogue to five. Preserved connected natural subparts, legacy history/rewards, sixteen Maths islands, four municipal, six NVO, four Spring and four Regional islands. Reproduced and fixed the Regional map missing all four positions, with a regression test that failed before the fix.
- [x] Final regression: 317/317 tests, TypeScript, ESLint, whitespace check and production build/private-file trace checks passed. Chrome on the final production build confirmed all five maps, the five-choice picker and navigation, grouped answers, draft restoration after reload, third-hint zero gold and continuation to the next part with its original diagram.
- [x] Final visual checks: regional gameplay at 390px; materials hub and both articles at 390px/1440px, with screenshots inspected, no horizontal overflow, no visible broken images and no gameplay runtime console errors. Disposable local learner/storage only; no real learner, Supabase record or schema changed.
- [x] Published and verified the approved application/content/SEO/documentation changes on Vercel; see current release evidence above. Commercial landing expansion, billing and migrations remain outside this release. Real parent/child Google sessions and physical-device checks remain owner checks.

## Mandatory copy review gate - 2026-11-06

- [x] Saved the [Astra copy review gate](AGENTS.md#astra-copy-review-before-testing) and linked it from competition, UI and article workflows: draft → independent critical review → owner approves proposals → apply approved copy → acceptance tests → release checks.
- [x] Require saved review context, recommendations and owner decisions; preserve original statements, mathematical meaning and approved wording. This instruction does not claim a new review of existing content.
- Verification: documentation diff, local links/anchors and gate ordering checked; no application code, learner data or deployment changed. Application tests are not required for this documentation-only change.

## Outstanding checks and decisions

- [ ] Owner smoke test: real parent and linked-child Google sessions, family isolation, cross-device resume, refresh and optional-email “Не сега” latency. Measure authenticated competition switching before attributing remaining delay to hosting plans.
- [ ] Physical-device check: keyboard/fixed action bar, touch map and native competition picker. Desktop/mobile viewport checks do not establish physical-device behavior.
- [ ] Complete final human content review and record outcomes in collection review records. Preserve the disclosed pilot publication exception and missing 2024 Olympiad official solution key; publication does not imply completed review.
- [ ] Resolve excluded 2023 Математика за всеки M1-06/M1-17 clarifications; see [source review](docs/maths-2023-review.md). Keep underdetermined Olympiad 2023 problem 3 excluded.

## Future work - not implementation authorization

- [ ] Plan reminders after two consecutive calendar days without learning activity, separately for parent/child channels, consent, sending time and repetition limits. Home-page visits do not count as learning. Design durable activity/sent-message tracking with that feature; no calendar schema migration is currently required.
- Hosting upgrades or migration remain a separate decision after authenticated measurements. No subscription purchase, infrastructure move or automatic notification delivery is authorized by this document.

## Documentation foundation - approved 2026-11-06

- [x] Put the clarity/simplicity principle and task routing in AGENTS.md; preserve child-friendly identity, necessary teaching guidance and the generated Next.js block.
- [x] Consolidate current product rules and separate superseded decisions/release chronology into linked archives without losing recorded evidence.
- [x] Align design-system guidance, content checklist, setup and deployment references with current approved behavior.
- Verification: checked all 35 relative Markdown links in the nine changed documents, exact archive fidelity after link relocation, preservation of the generated Next.js block, and whitespace/diff scope. Application tests were not rerun for this documentation-only change; the 261-test result above is historical release evidence. No application code, APIs, schema or learner data changed; no deployment is required.

## SEO/GEO foundation - approved 2026-11-06

- [x] Strategy in [seo-geo.md](seo-geo.md), „Ценни материали“, separate sourced СМГ/НПМГ admissions guides, canonical/OG metadata, public sitemap/robots and private/preview indexing guards.
- [x] Public article reads bypass Supabase; shared caching is limited to explicit non-personal public routes. Home and learner routes retain their existing authentication/no-store behavior.
- [x] Critical research review: corrected the SMG grade-average definition and conditional zero scores; clearly separated its historical 2026/2027 formula from NPMG’s upcoming 2027/2028 eligibility announcement. Removed an unconfirmed price and invented publication date; preview pages remain crawlable so bots can read noindex. Independent content review found no remaining material issue.
- [x] Materials UI follows the landing page: shared header with prominent „Вход“, reused illustration, responsive article cards, readable article layout and related links. Added the reusable patterns to the design-system guide and development catalogue. SMG retains the formula and plain explanation of the sixfold weight without a worked example; NPMG clearly marks its methodology as pending. The retired combined URL permanently redirects to `/materiali` and is excluded from the sitemap.
- [x] Local verification: 270/270 tests, ESLint, TypeScript and production build/private-file checks passed. Real HTTP checks confirmed six explicit public read routes return 200 with shared cache headers and no Set-Cookie, both anonymously and with a fixture auth cookie; five canonical sitemap URLs; the legacy 308 redirect; and no-store/noindex on login/progress/welcome. No real learner data was used.
- [x] Chrome checks at 320/390/1440px: the hub and both articles have one H1, valid section targets and no horizontal overflow; inspected screenshots, visible keyboard focus, card activation and formula anchor navigation. Latest console contained no errors. These checks used a local production build, not physical devices or a live deployment.
- [x] Optional production Search Console verification metadata and owner setup instructions are ready; the owner token and ownership verification remain pending.
- [x] Production publication and live verification completed in `e001ef0`; see current release evidence above. Search Console ownership and indexing by search engines are not implied.
- Landing expansion for paid acquisition remains plan-only. Domain availability/purchase, Search Console/Bing setup and commercial launch remain owner/configuration steps; no payments, schema or learner-history changes.

## Paid-launch blueprint - agreed 2026-11-06

- [x] Created [guideliness.md](guideliness.md): applied essentials from the three $100M books, agreed US$100/month offer, refined existing brand, anonymous sample, 14-day first-payment cancellation/refund window, ten-new-family intake, Stripe/Mollie comparison, acquisition scripts, economics, cohort definitions and staged implementation criteria.
- [x] Linked the commercial source of truth from seo-geo.md and reconciled its earlier price/manual-activation proposals. Existing pilot, production and SEO release status are unchanged.
- Verification: checked local Markdown links, fee/revenue examples, agreed-decision coverage and whitespace/diff scope. Book frameworks use official public companion sources rather than a full-text book review; the competitor price needs live reconfirmation. Application tests were not rerun for this documentation-only change.
- [x] Updated the launch test to US$100/month, charged upfront, with a 14-day first-payment cancellation/full-refund window; aligned Bulgarian copy and SEO references, recalculated ten-family gross charges to US$1,000 and removed obsolete euro fee estimates pending USD configuration. Verified price/window consistency, arithmetic, relative links and whitespace; no application tests were needed for this documentation-only update.
- [ ] Implement the paid-release slices in guideliness.md. No commercial UI, billing integration, account activation, outreach, purchase or deployment was performed in this documentation slice.

## Landing-page specification - agreed 2026-11-06

- [x] Saved [landing-page-plan.md](landing-page-plan.md) and linked it from the commercial blueprint: researched practices, value-proposition critique, selected Bulgarian copy, one embedded sample with Лесно / Средно / Трудно, US$100/month and 14-day first-payment refund terms, and performance/accessibility acceptance criteria.
- Verification: checked relative links, agreed copy and demo decisions, pricing/refund consistency, whitespace and scope. Application tests were not rerun for this documentation-only change.
- [ ] Implement and verify the page, sample and required purchase flow separately. This slice creates the plan only; no application, learner-data or deployment changes.

## Spring competition - local implementation 2026-11-06

- [x] Added the approved hard grade-4 competition for 2023–2026: six islands, twelve skills, twenty archived originals, forty eligible source learning units and sixty finite authored exercises; nineteen originals are eligible for automatic grading.
- [x] Preserved source statements, subconditions, seven diagram crops and source metadata; integrated original-first selection, multipart answers, existing reward rules and history preservation. The 2026 solutions use the tutor video plus independent mathematical checks, without claiming an official key.
- [x] Kept the competition as a local-only draft, excluded from hosted access and publication. Review record: [content/proletno/review.md](content/proletno/review.md).
- [x] Verification: 280/280 tests, TypeScript, ESLint and production build/private-file checks passed; the map component test selects all six islands. Local production HTTP returned 200 with all six island titles.
- Local review: http://127.0.0.1:3010/?competition=proletno, using isolated disposable local storage; no real learner or Supabase data changed.
- [ ] Human content and visual desktop/mobile review. Browser automation entry points failed before page access, so no visual pass is claimed.
- [ ] Resolve 2024 problem 6: its nonzero-number wording does not justify the positive-integer assumption in the supplied proof. The full problem remains archived and excluded from grading pending the owner's decision; no clarification was silently approved.
- No commit, push or deployment. The previous SEO and other unrelated working-tree changes are preserved.

## Connected originals - local implementation 2026-11-06

- [x] Applied connected original problems across Математика за всеки, Олимпиада, НВО and Пролетни: 216 eligible originals and 269 natural answer units. Each original has one island; natural а/б/в boundaries group all answer fields belonging to that part. Unlettered multi-answer questions remain one unit.
- [x] Retained 15 Maths islands rather than the proposed aggressive consolidation from 17 to 5; Olympiad has 4, NVO 6 and Spring 4. Historical topic IDs, saved work and rewards remain readable without rewriting learner history.
- [x] Show shared context and the current part, with collapsed full statement/diagrams and completed parts. Preserve drafts and exact continuation across navigation, reload and five-step adventures, including adventures ending mid-original.
- [x] Award gold per natural part after all its fields are correct; the third hint excludes new gold. Reset local hints per part, retain dependent-help attribution and prevent sibling parts alone confirming a skill. Legacy whole/alias awards and new part awards cannot double-pay.
- [x] Fixed canonical natural-part source links: full-source pages return the complete statement and all original diagrams without teaching answers.
- [x] Verification: 306/306 tests, TypeScript, ESLint and production build/private-file checks passed. Real Chrome checks at 1200px and 390px covered grouped fields, continuation after reload, third-hint zero gold, source-page HTTP 200 with both diagrams, all four island maps and no horizontal overflow or console errors.
- Local review: http://127.0.0.1:3011, using an isolated disposable learner and local data. No real learner/Supabase data, commit, push or deployment changes.
- [ ] Human content review and physical-device checks remain pending. Spring stays a local-only draft; the existing source exclusions and missing official-key limitations remain in force.

## GTM roadmap - agreed 2026-11-06

- [x] Saved [gtm-plan.md](gtm-plan.md): High / Medium / Low priorities, owners, dependencies and completion criteria; product readiness before outreach; both direct and tutor channels; feedback-led article selection; ambassador programs and commissions out of scope.
- [x] Linked the roadmap from the commercial guidelines and reconciled their stale combined-guide reference and fixed article order with the existing separate school guides and agreed feedback-led selection.
- Verification: checked Markdown links, task structure, agreed decisions, whitespace and edit scope. Application tests were not rerun for this documentation-only change.
- [ ] Execute the roadmap in separately verified slices. No application code, billing, outreach, learner-data or deployment changes were performed here.

## Maths geometry follow-up - 2026-11-06

- [x] Split the 20-original geometry island into „Обиколки на фигури“ (9) and „Лица и мрежи“ (11); Maths now has 16 islands. Keep every whole original together and preserve saved drafts, learner history and rewards.
- [x] Updated the short content checklist for method-based grouping, natural subparts and reward compatibility; added saved-task continuation coverage.
- Verification: 308/308 tests, TypeScript, ESLint and production build/private-file checks passed. Chrome at 390px and 1200px confirmed both island labels and the area panel, with no horizontal overflow.
- Local only; no real learner-data, commit, push or deployment changes.

## Regional Olympiad - local implementation 2026-11-06

- [x] Added „Олимпиада (областен кръг)“, „Трудно“, 2023–2026: 12 whole originals, 23 natural answer units, 21 finite exercises, seven skills in four approved islands; source statements, five figure crops, official keys and all four full video caption archives checked and saved privately.
- [x] Renamed the existing display to „Олимпиада (общински кръг)“, „Средно“, preserving its stable ID, content version and history; integrated the new collection through the existing connected-original engine and reward rules.
- [x] Verification: 316/316 tests, TypeScript, ESLint and production build/private-file checks passed. Real Chrome at 1200px/390px checked grouped answers, reload/resume, next part, third-hint zero new gold and both original diagrams; no horizontal overflow or runtime console errors.
- Review record: [content/olimpiada-oblasten/review.md](content/olimpiada-oblasten/review.md). Local review: http://127.0.0.1:3012/?competition=olimpiada-oblasten, isolated disposable local learner.
- [ ] Human content review, publication permission and physical-device checks. Unpublished local-only draft; no real learner/Supabase data, commit, push or deployment changes.

## Recording future work

Keep active tasks, material open decisions and a short latest-verification summary here. For each completed slice record the outcome, checks/results, unresolved limitations and release status. Move lengthy completed evidence to the history archive; do not turn it back into mandatory reading. Update the authoritative domain guide when behavior changes, and preserve dated approval context for exceptions.


## Competition reference and parent materials - approved release 2026-11-06

- [x] Consolidated supplied background, verified facts and corrections in [docs/competition-reference.md](docs/competition-reference.md); retained unverified history as editorial context.
- [x] Drafted four format/preparation articles, linked About cards, shared 2027 calendar for both school guides, and extended static metadata/public route/sitemap registration. SMG's historical formula remains separate from NPMG's upcoming intake.
- [x] Added the owner-approved upcoming competition list and marked dates to the shared child/parent progress calendar, using one schedule for public articles and the app; activity and gold projections remain separate.
- [x] Independent [copy review and owner decisions](docs/reviews/competition-articles-2026-11-06.md): all three proposals approved and applied; production publication approved on 2026-11-06.
- [x] 320/320 tests, TypeScript, ESLint and production build/private-file checks passed. Isolated Chrome at 320, 390 and 1440px checked nine routes, date selection, article links and overflow; no page errors.
- [x] Published `06c9166` to `main`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/vF3N9JuYbYNP528rAcL2esk5P3mF) reported success for that exact SHA. Live checks passed for all nine public pages: 200, canonical, indexable metadata, Article schema, public cache (home remains no-store), no Set-Cookie, nine-page sitemap and robots. Chrome at 390px confirmed dates, approved wording, keyboard access and no overflow/page errors; unauthenticated progress reaches login with no-store and `/design-system` returns 404.
- No learner-data, API, CMS or schema changes. Real Google account/physical-device smoke checks were not repeated. Landing expansion remains plan-only.

- [x] Corrected the copy-review requirement to Astra (`gpt-6-astra`) across the agent, competition, design and SEO guides; preserved the actual model in historical review evidence.

## Calendar links and complete schedule - approved 2026-11-06

- [x] Drafted the approved five-entry schedule, deadline distinction, shared preparation links, calendar/list order, article rows and quiet materials navigation.
- [x] Actual `gpt-6-astra` completed the independent Bulgarian copy review; [all three proposals approved in chat and applied](docs/reviews/calendar-navigation-2026-11-06.md).
- [x] Applied the three owner decisions, added materials navigation to the parent last-task view, refreshed design guidance and internal date provenance, and documented chat approval handling in AGENTS.md.
- [x] Regression tests, TypeScript, ESLint, production build and private-file checks passed. Isolated Chrome checked all six articles and progress at 320, 390 and 1440px: five dates, municipal deadline, competition filter, direct preparation navigation, materials links, no overflow or page errors; production design catalogue returns 404. No learner-data changes.
- [x] Published `9c10f7e`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/vJhaJLHRBFWhky4sL6iXHt3rZT3K) succeeded for that exact SHA. Live Chrome verified all six articles at 320/390/1440px, the complete schedule and preparation links, canonical/indexability, no overflow or page errors, progress-to-login/no-store, API 401/no-store and design catalogue 404. All 325 regression tests passed; authenticated calendar/navigation was verified locally with disposable data, not real Google accounts.


## Connected-statement UX - approved release 2026-11-06

- [x] Always show the complete original statement once, highlight the active natural subpart, and remove the full-statement disclosure and repeated current question across all competitions. Preserve supplemental answer-entry instructions, show each diagram once, and keep previous submitted answers/solutions collapsed. Updated the design-system pattern.
- [x] Verification: 324/324 tests, TypeScript, ESLint and production build/private-file checks passed. Isolated Chrome at 1200, 390 and 320px checked the municipal multipart statement, draft retention after reload, correct submission, next-part highlighting and collapsed prior answers; a long Spring original showed its diagram once, loaded correctly. No horizontal overflow or page errors.
- [x] Production publication explicitly approved. The release contains this UX change only; pending calendar/article changes remain separate.
- [x] Published `2a6cdca` to `main`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/GTrGfdZnQRD4oBBJHm8YUah8ArkP) succeeded for that exact SHA. Live public routes returned 200, `/design-system` returned 404, unauthenticated course access returned 401/no-store, and production JS/CSS contained the new highlight with no obsolete full-statement disclosure.
- No learner-data, API, reward-rule or schema changes. Real-account and physical-device smoke checks were not repeated.


## Shared child access - release 2026-11-07

- [x] Implemented the approved owner-entered Google email and manually shared, seven-day link; recipients reuse the existing child and history, with owner-only access management and optional child login.
- [x] Actual Astra Bulgarian review: no changes recommended. Full regression 342/342, TypeScript, ESLint, production build/private-file checks and disposable PostgreSQL migration/security tests passed. Synthetic browser fixtures fit 320/390/1440px. See [implementation and verification](docs/child-sharing.md).
- [x] Owner explicitly approved publication and deployment; owner reports the production migration completed with “Success. No rows returned.” on 2026-11-07. Release checks repeated: 342/342 tests, TypeScript, ESLint and production build/private-file trace checks passed.
- [x] Published `9f37c4e` to `main`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/GrmFKTsAwL6mEtycc9WeqwjJzzYf) succeeded for that exact SHA. Live home/materials/invite returned 200; invite is no-store with noindex/nofollow and no-referrer metadata; anonymous sharing returns 401, acceptance GET 405, invalid acceptance 400, and foreign-origin acceptance 403. Development catalogue remains 404.
- [ ] Real-account cross-device sharing smoke test remains pending; the three adults still need owner-created links and acceptance with their matching Google accounts.


## Combined preparation panel - local acceptance 2026-11-08

- [x] Consolidated started competitions into one panel below calendar/day activity, independent of the calendar filter; full-row independent accordions reveal only three X/Y counts. Untouched, rounded-zero and unavailable rows are omitted.
- [x] Moved the otter preparation card to the bottom of competition overviews; applied the approved heading and removed the solved-original helper. Updated the design catalogue and guidance; actual Astra copy review recommended no changes.
- [x] Verification: 359/359 regression tests, TypeScript, ESLint, optimized build/private-file checks and whitespace checks passed. Chrome at 1440/390/320px checked keyboard access, independent expansion/filtering, reduced motion, bottom placement and overflow; read-only history fingerprints unchanged.
- Local only: http://127.0.0.1:3018/progress. Historical Maths copy plus synthetic histories for the other four competitions; no Supabase or production changes. [Acceptance evidence and limitations](docs/points-implementation-review.md).

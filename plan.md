# Current work - Състезателна математика

Updated 2026-11-06. Read [AGENTS.md](AGENTS.md) for the working agreement and task-specific guides. This file tracks current work and evidence, not permanent product policy. Historical rollout requirements and completed slices are preserved in the [implementation history](docs/archive/implementation-history.md); approved behavior lives in [key-decisions.md](key-decisions.md).

## Current release

- Production: https://sastezatelna-matematika.vercel.app/ . Application release: `e001ef0`, 2026-11-06. Vercel: [verified release](https://vercel.com/petar-s-projects33/sastezatelna-matematika/7P3zqhZK367tew5birjiRYHLa82S).
- Published: five competitions, including Пролетни and Олимпиада (областен кръг), approved Bulgarian revisions, connected natural subparts and the 16/4/6/4/4 island maps; public „Ценни материали“ and separate СМГ/НПМГ guides with SEO metadata. Earlier dated entries describing drafts/local-only work record their state at that time.
- Final local checks: 317/317 tests, TypeScript, ESLint, production build/private-file checks and desktop/mobile Chrome passed. Verified draft restoration, grouped answers, next-part continuation and zero new gold after the third hint with disposable local data.
- Live checks: Vercel deployment succeeded; anonymous public pages, canonical/indexing metadata, five-URL sitemap, robots and legacy 308 redirect passed. Public article routes have shared cache headers and no Set-Cookie, including with a disposable invalid auth-cookie fixture; private routes remain no-store/noindex and protected read APIs return 401. New competition assets return 200 with immutable caching. Chrome loaded the live materials hub and СМГ guide without layout overflow.
- No database schema, real learner history or Supabase records changed. Real parent/child Google sessions, physical devices and final human content review remain owner checks. Commercial landing expansion and billing remain plan-only.
- Competition snapshots retain the earlier 30-second mounted-learner reuse policy with stale/focus/write checks. Local checks and deployment success do not establish authenticated end-to-end latency for a real child.

## Approved release readiness - 2026-11-06

- [x] Applied the approved Bulgarian revisions to Spring and Regional Olympiad hints, explanations, labels and descriptions; retained source answers, stable IDs, content versions and exclusions. Independent Astra review found no remaining material content blocker; this does not replace the pending human review.
- [x] Prepared both new competitions for publication, bringing the catalogue to five. Preserved connected natural subparts, legacy history/rewards, sixteen Maths islands, four municipal, six NVO, four Spring and four Regional islands. Reproduced and fixed the Regional map missing all four positions, with a regression test that failed before the fix.
- [x] Final regression: 317/317 tests, TypeScript, ESLint, whitespace check and production build/private-file trace checks passed. Chrome on the final production build confirmed all five maps, the five-choice picker and navigation, grouped answers, draft restoration after reload, third-hint zero gold and continuation to the next part with its original diagram.
- [x] Final visual checks: regional gameplay at 390px; materials hub and both articles at 390px/1440px, with screenshots inspected, no horizontal overflow, no visible broken images and no gameplay runtime console errors. Disposable local learner/storage only; no real learner, Supabase record or schema changed.
- [x] Published and verified the approved application/content/SEO/documentation changes on Vercel; see current release evidence above. Commercial landing expansion, billing and migrations remain outside this release. Real parent/child Google sessions and physical-device checks remain owner checks.

## Mandatory copy review gate - 2026-11-06

- [x] Saved the [Alpha copy review gate](AGENTS.md#alpha-copy-review-before-testing) and linked it from competition, UI and article workflows: draft → independent critical review → owner approves proposals → apply approved copy → acceptance tests → release checks.
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
- [x] Independent [Alpha copy review and owner decisions](docs/reviews/competition-articles-2026-11-06.md): all three proposals approved and applied; production publication approved on 2026-11-06.
- [x] 320/320 tests, TypeScript, ESLint and production build/private-file checks passed. Isolated Chrome at 320, 390 and 1440px checked nine routes, date selection, article links and overflow; no page errors.
- [x] Published `06c9166` to `main`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/vF3N9JuYbYNP528rAcL2esk5P3mF) reported success for that exact SHA. Live checks passed for all nine public pages: 200, canonical, indexable metadata, Article schema, public cache (home remains no-store), no Set-Cookie, nine-page sitemap and robots. Chrome at 390px confirmed dates, approved wording, keyboard access and no overflow/page errors; unauthenticated progress reaches login with no-store and `/design-system` returns 404.
- No learner-data, API, CMS or schema changes. Real Google account/physical-device smoke checks were not repeated. Landing expansion remains plan-only.

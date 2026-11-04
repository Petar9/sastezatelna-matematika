# Математически открития - agent execution plan

Approved: 2026-11-03. Owner: visible gpt-6.1-sol coordinator, high reasoning.

## Read first

- This is the standalone app in /Users/mac/ideas/maths. Do not modify the original AI study tool.
- Preserve data/, backups/, existing answers, solution steps, discoveries and awards. Never include these private folders, materials/ or credentials in Git or public deployment bundles.
- Reuse the existing deterministic educational engine and the decisions in key-decisions.md. No live AI grading, leaderboards, payments or self-service content upload in this rollout. Child Google login is optional and parent-managed (approved 2026-11-04).
- Parent Google login, private child nicknames, invitation-only access, five active children total.
- Each competition has separate practice, sessions, maps, evidence and awards. All content is mathematics for grade 4. Add Олимпиада before НВО.
- User supplies PDFs, solutions and YouTube links. Archive transcripts as Markdown; prepare, review and publish via development workflow. Never invent missing source material or publish unreviewed questions.

## Agent execution protocol

1. Inspect instructions, code, repository state and connected services before changing anything.
2. The approved decisions above are authorization; do not interview the user again about them.
3. For material unresolved behavior, data, privacy, deployment or product decisions, ask one focused multiple-choice question at a time and wait before dependent changes. Reach enough clarity to specify behavior and acceptance criteria; do not claim a numerical confidence measurement. Continue independent work while waiting.
4. Use at most two workers when independent workstreams justify them. Assign bounded file ownership, inputs, outputs and acceptance checks. Workers return changes, commands/results and risks. The coordinator integrates and verifies the whole result.
5. Mark each stage pending, in progress, blocked or verified, with evidence and blockers. Local implementation is not a verified live release.
6. Never print secrets or store them in this plan. Do not accept charges, terms or send invitations on the user's behalf without the required authorization.
7. Inspect the integrated diff and run proportionate checks. Preserve unrelated changes. Keep user updates short and report blockers honestly.

## Status

| Stage | Status | Next gate |
| --- | --- | --- |
| 1. Host current app | HTTPS, owner login and history import verified | Verify cross-device resume |
| 2. Competition paths | All three collections published on 2026-11-04; Vercel release verified | Signed-in visual selector check is blocked by Chrome automation; final human content review remains unconfirmed, including the missing 2024 Olympiad official solutions |
| 3. Five-child pilot | Owner login and first child profile saved online | Verify history, cross-device resume and live family isolation |
| 4. Landing/invitations | Landing redesign verified locally | Deploy and smoke-test hosted invitation flow |

## Stage 1 - host the current app

- Create a separate local Git repository. Keep secrets, history, backups and source materials excluded; review files before publishing a remote repository.
- Use Vercel Hobby and Supabase Free with a free Vercel URL. Configure hosted-only data access, Google OAuth, exact callback URLs and approved parent emails.
- Inspect connected access first; account readiness is unknown. Ask for missing access/setup choices only after investigation.
- Initially approve only the owner's family. Create the child profile, export a backup and import existing history with the existing guarded import tool. Never overwrite progress.
- Keep credentials server-only; preserve revision guards, cross-family isolation and the current answer when saving fails.
- Document deployment, rollback, manual progress export/restoration and free-tier constraints.
- Vercel Hobby is for personal/non-commercial use. Supabase Free can pause after low activity; do not promise an always-on SLA or generate artificial activity.
- Acceptance: HTTPS deployment works independently of the laptop, cross-device resume works, history survives deployment, unauthorized access fails, private files and server secrets stay out of public assets.

## Stage 2 - separate competition paths

- Add stable competition IDs and a catalogue with names, grade, content version and publication state.
- Scope progress and active work by child plus competition. Preserve the existing course in matematika-za-vseki without resetting evidence or awards.
- Competition selection preserves unfinished work; adventures draw only from the selected competition. Keep incomplete collections hidden.
- Add Олимпиада first, then НВО. Archive supplied sources and explicitly flag missing keys. The approved 2024 Olympiad exception permits draft preparation from the tutor video and independent calculations, followed by human review.
- Content pipeline: archive sources/transcripts privately; extract original text/figures; verify answers; map skills; prepare exact three-part worked solutions, fresh practice and harder variants; record provenance; review before publication.
- Acceptance: full learning flow works within each published path; switching never mixes or discards work; every published answer and explanation has been checked.

## Stage 3 - five-child pilot

- Extend the existing parent/profile flow to approved families, with a global maximum of five active child profiles.
- Keep each child's attempts, discoveries, confirmations and awards independent per competition.
- Provide a concise parent summary and a way to report unclear problems.
- Verify shared-device profile switching, multiple families and concurrent sessions. Collect feedback on clarity, navigation and willingness to return.
- Acceptance: five children can learn independently without exposing or overwriting another child's history; concurrent creation cannot exceed the cap.

## Stage 4 - landing page and invitation requests

- Create a Bulgarian parent-facing page matching the app with accurate supported-content descriptions. Keep the large screenshot and personal-data section removed. Use a lightweight decorative island journey with the existing otter, cream surfaces, marine-blue landing actions and gold accents.
- Include one Заяви покана form and a discreet Вход link. Collect only parent email; show “Ще използваме имейла само за поканата.” without a separate consent checkbox or hidden substitute. Preserve email validation, duplicate handling and the existing rate limit.
- Requests are private and manually reviewed. Submission grants no access. Keep additional families waiting until the owner separately approves expansion beyond five children.
- Defer the public contact/personal-data section at the owner’s request. Invitation submissions remain private; this owner-approved email-only flow supersedes the earlier checkbox requirement.
- Acceptance: parents understand the app, can request an invitation and receive confirmation; applicants remain private and cannot self-enrol.

## Verification and release gates

- Run applicable tests, type checking, lint and production build; verify mobile and desktop flows.
- Test authentication, owner scoping, failed saves, concurrent updates and profile selection.
- Test competition migration on a copy of existing history before any live import. Verify unchanged original history and archive integrity.
- Production child data must not be used in preview deployments. Use a separate test project or disable authenticated preview use until configured.
- Record commands/results below. Missing service access and missing reviewed content are explicit blockers, never completed checkboxes.

## Evidence and blockers

Verified locally on 2026-11-03:

- Separate local Git repository on `main`; no remote, commit or public source upload created while the owner's repository choice is pending. GitHub CLI authenticates as `Petar9`.
- Added competition registry, stable IDs, grade, content version and draft state. Only the reviewed existing collection is selectable; Олимпиада and НВО stay hidden. Database, local stores, API calls, lost-response recovery and import/export use child + competition scope. Legacy local path stays unchanged.
- Migration `202611030002_competitions.sql` preserves the original JSON and revision under `matematika-za-vseki`; no live import or database migration has been run.
- Added private invitation requests, manual access approval, parent summary and unclear-problem reports; global cap is five active profiles. No request grants access.
- Added Bulgarian landing at `/welcome` and unauthenticated hosted `/`, with a real app screenshot captured using temporary blank progress. No child's history or identity appears in it.
- `npm test`: 89 passed. `npm run typecheck`, `npm run lint`, `npm run build`: passed. Build checks reject private history, source materials and environment files in traces/standalone output. Client chunks contain no service-role key name or prepared answer-content module references.
- `bash scripts/test-database.sh`: passed on disposable PostgreSQL 14 with mocked Supabase auth. Covers all three migrations, JSON/revision preservation, owner isolation and revocation, private-table/RPC privileges, duplicate requests, rate limits/expiry, twelve concurrent profile inserts across two families, archive/replacement and reactivation at capacity. This is not live Supabase or OAuth evidence.
- Real production HTTP checks passed: read-only course GET, no-store, invalid host/origin rejection, hidden draft rejection, public landing/image, Vercel Preview data denial, and private file paths inaccessible.
- Browser check passed: start an adventure, request its first exact worked step, reload and resume the same question/help, submit an assisted correct answer, and see the primary action within a 390 x 844 viewport without horizontal overflow. Landing fits the same width and its image loads.
- SHA-256 checks confirm all six original history/archive files in the private baseline manifest are unchanged. The original AI study tool was not edited.
- Coordinator: gpt-6.1-sol, high reasoning; two bounded workers supported deployment review and pilot/database work. Final integration and checks were performed by the coordinator.

Unresolved gates - ask the owner, do not infer answers:

1. Source repository selected by owner: public `Petar9/sastezatelna-matematika` (https://github.com/Petar9/sastezatelna-matematika). Admin access and an empty remote were verified on 2026-11-03. Reviewed source was published to `main` in initial commit `efb0576`; private history, materials and credentials were excluded.
2. Signed-in Vercel and Supabase accounts were verified in the owner's existing Chrome session on 2026-11-03. Vercel project `sastezatelna-matematika` was created in `Petar's projects` on Hobby. The owner created the separate Supabase Free project; all three migrations and nine live schema/access checks passed. Google OAuth configuration remains pending; no deployment or live history import has run.
3. Public contact email for the landing page is pending. `MATHS_CONTACT_EMAIL` is documented in `.env.example`; do not invent an address or open public invitations without a real contact.
4. Superseded by the 2026-11-03 Olympiad intake below: sources for 2022–2025 are archived; the 2024 official solutions remain missing. НВО source intake is still pending.
5. After access is ready: create/configure only free projects, set exact callback URLs and production-only secrets, apply migrations in order, approve only the owner family, create the child profile, preserve a backup, run the guarded history import, and verify HTTPS/OAuth/cross-device resume/family isolation. Then verify a private invitation request before approving more families.

Operational details: [deployment and recovery](docs/deployment.md); [content intake and review](docs/content-workflow.md). These are local implementation results, not a claim that the app is deployed or that new collections are available.

Deployment preparation update, 2026-11-03:

- Owner selected the public GitHub repository above; the local `origin` targets only that repository. Initial source commit `efb0576` was pushed successfully to `main` on 2026-11-03.
- Re-ran `npm test` (89 passed), `npm run typecheck`, `npm run lint` and `npm run build`: all passed. Build trace and standalone private-file checks passed.
- Reviewed 132 source candidates before this status update, including the landing screenshot. Credential-pattern checks found no private keys, service secrets, GitHub tokens or JWTs; detected email addresses are test/documentation examples. Confirmed `data/`, `backups/`, `materials/`, `.env.local`, `node_modules/` and `.next/` are ignored.
- `positioning.md` records the approved short positioning plan. The app name and candidate domain are unchanged; no domain purchase is authorized.
- GitHub authentication for deployment providers does not configure the application's parent Google login; that OAuth setup is still required.

Cloud setup update, 2026-11-03:

- Verified the existing Chrome sessions: Vercel Hobby and Supabase Free. Supabase contains three unrelated paused projects; none was changed.
- Created the separate Vercel project connected to the approved GitHub repository; assigned production domain is `sastezatelna-matematika.vercel.app`. Dashboard confirms no production deployment.
- Saved `MATHS_MODE=hosted` and the assigned HTTPS `MATHS_APP_URL` in Production only; Preview has no production credentials.
- Prepared a separate Supabase project named `sastezatelna-matematika`, Free/Europe, Data API enabled and automatic table exposure disabled; migrations explicitly grant the required access. The owner created the project and privately saved the database password. The project is healthy in West Europe (London), `eu-west-2`, on Nano/Free.
- Remaining gates: production-only Supabase credentials, Google OAuth client configuration and owner allowlist identity, approved public contact, guarded history import and live verification. No paid plan or terms acceptance was performed.
- This documentation update is local until cloud configuration is ready; pushing now would trigger an incompletely configured deployment.

Database setup update, 2026-11-03:

- Applied all three reviewed migrations in order to the separate project `ptjeffzooxdkjdotxzxs`; Supabase SQL Editor reported success.
- Nine read-only checks passed: seven expected tables, RLS enabled, anonymous progress reads blocked, direct authenticated progress reads blocked, service access present, invitation RPC private, child/competition primary key, child-limit trigger present, and no history imported. This verifies schema configuration, not a completed live authentication or cross-device test.
- Saved Site URL `https://sastezatelna-matematika.vercel.app` and the sole exact allowed redirect `https://sastezatelna-matematika.vercel.app/auth/callback`.
- Verified Google is disabled and its client ID/secret fields are empty. Supabase's Google callback is `https://ptjeffzooxdkjdotxzxs.supabase.co/auth/v1/callback`; Google Cloud client setup remains pending.
- Asked which Google email should be the first approved parent. Public contact identity remains a separate owner decision. No parent, child profile, history or invitation has been created/imported.
- Credentials have not been copied into Vercel; the server connection requires action-time confirmation before granting Vercel access. The app is not deployed.

Parent setup update, 2026-11-03:

- Added the owner's explicitly supplied Google email to the private parent allowlist, without publishing that identity in source. The live database confirmed exactly one approved parent. This is allowlist configuration; Google login remains disabled pending OAuth setup.
- Saved `SUPABASE_URL` for Vercel Production only. API keys have not been transferred and no deployment has started.
- Automatic approval review blocked opening Google Cloud Console before its account/project was identified. The owner clarified that Google Cloud is in a different Chrome profile and reported creating a separate `sastezatelna-matematika` project there. This is owner-reported, not browser-verified. Continue with manual Google OAuth setup in that profile; the approved parent login identity is unchanged.
- Public contact email, OAuth client credentials, server connection approval, child-profile creation, guarded history transfer and live release checks remain pending.


Approved onboarding update, 2026-11-03:

- Implemented the owner-approved compact owl/island welcome: one parent Google action, then one nickname field with „Как да те наричаме?“ and „Към приключението“. Returning children retain direct resume; adding another child is secondary. The home greets the selected nickname without recording learning progress.
- Kept parent approval, the global five-child limit, existing child ownership checks and learning history. Login cancellation, authorization denial, unavailable login and profile failures now have distinct Bulgarian recovery messages. Raw provider/database errors are not rendered.
- Matched the public landing hero to the owl/island welcome. Invitation access rules are unchanged.
- Research informed a short parent-to-child handoff, one action per screen and contextual help: [Khan Kids parent setup](https://khankids.zendesk.com/hc/en-us/articles/360006537272-How-do-I-set-up-an-account), [Khan Kids Learning Path](https://khankids.zendesk.com/hc/en-us/articles/360048828572-Learn-more-about-the-Learning-Path), [Duolingo characters](https://blog.duolingo.com/building-character/), [NN/g onboarding tutorials](https://www.nngroup.com/articles/onboarding-tutorials/). These are design inputs, not evidence of outcomes for this app.
- Verification: `npm test` 97 passed; `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed. The build private-file checks passed. New tests cover first/returning setup, nickname creation, owned-profile selection, secure selection cookie, cancellation/denial/retry, local-mode auth rejection and nickname greeting without fabricated progress.
- Chrome checked the built login and landing at mobile/desktop sizes; no horizontal overflow at 390 px, with the login action above the fold. Login also fits 320 x 640. Actual onboarding components rendered as test-only HTML verified nickname/profile layout at 390 x 844 and 320 x 640, optional profile disclosure and keyboard focus from nickname to primary action. No authentication bypass was added to the app.
- Live Google OAuth and hosted cross-device persistence remain unverified until the deferred cloud credentials/setup are complete. No production child/history data was changed, no source was pushed and no deployment was started for this UI update.


Approved whole-app UI update, 2026-11-03:

- Replace the owl with an original otter explorer throughout onboarding, landing, home, islands, practice and earned awards. Use warm cream surfaces, pale blue sea, teal primary actions, blue progress and gold discovery feedback. Keep original white-background figures on white panels without altering source assets.
- Shorten the home introduction, prioritise the five-task adventure and bring the map higher. Keep topics secondary, collapse evidence details and remove unearned Doctor/Professor placeholders while preserving earned awards and the optional requirements explanation.
- Use one horizontal adventure bar and one compact active-skill discovery indicator. Show real progress immediately after attempts and correctness, including labelled helped discoveries. Preserve the exact problem selection, worked solutions, confirmation rules, history and child/competition scope.
- Research inputs: [Duolingo’s focused home path](https://blog.duolingo.com/new-duolingo-home-screen-design/), [Khan Academy course mastery](https://support.khanacademy.org/hc/en-us/articles/360032987591), [NN/g microinteractions](https://www.nngroup.com/articles/microinteractions/). These inform visual hierarchy and feedback, not claims of learning outcomes for this app.
- Verification: `npm test` 97 passed; `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed. Build traces and standalone private-file exclusion checks passed. All 36 baseline private-history, archive and source-figure hashes are unchanged.
- Chrome checked the real production build at 1060 × 900 and 390 × 844: home, island selection, exact worked part, helped correct answer, adventure start/answer and original diagram. No horizontal overflow; fixed check/next actions remain visible. A helped correct answer immediately shows 2/3 discoveries and its remaining independent-answer goal. The original figure loads on white without alteration. Test-only rendered onboarding views also checked at 320 × 640, including keyboard focus and optional profile creation. The public landing screenshot now shows the blank-history otter home.
- Original AI app, adaptive selection, award requirements and learning data were not edited for this redesign. Hosted Google OAuth and cross-device persistence remain deferred. No push, deployment or cloud changes were made.
- Additional owner suggestion: a short otter celebration at major milestones. The supplied Google Images/Pinterest GIF has no verified reuse permission. Asked the owner to choose our original mascot animation with „Видрата празнува с теб!“ or a separately licensed real-otter GIF. This additional animation is pending that choice; the approved static mascot reactions are implemented.


Approved Bulgarian explanation edit, 2026-11-03:

- Replaced academic or unclear authored wording with concrete instructions for grade 4 in lessons, worked solutions and checks. Examples: “максимизирай” becomes “намери колко най-много”, and “низходящо” becomes “от най-голямата към най-малката”. Corrected the mistaken subtraction term “умалително” by describing the number being subtracted. Original competition statements, choices, numeric keys and provenance are unchanged.
- Saved questions display revised worked solutions only when the current catalog matches the exact question ID, statement, fields/answer keys and options. Otherwise they retain their saved solution. This projection does not rewrite history, submitted answers, assistance, awards or revisions.
- Verification: `npm test` 98 passed, `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed. The regression covers refreshed partial and answered solutions, fallback for changed statements/keys, and read-only history. Build private-file exclusion checks passed.
- Restarted the local production build at `http://127.0.0.1:3002/`. A read-only API comparison verified revised wording for the currently saved 2026-M1-16 task, with every field outside the displayed explanation unchanged. All 27 protected history/archive/original-source/figure hashes match the pre-edit snapshot. The Chrome CLI bridge did not start; no new visual-layout verification is claimed for this text-only edit. No push, deployment or cloud changes were made.


Approved gold and adventure update, 2026-11-03:

- [x] Add one-time server-validated gold per skill within each competition: 5 for first completed effort/revealed solution, 10 for first correct answer including help, 20 for independent confirmation (maximum 35). Combine simultaneous gains; help alone, repetitions, reconfirmation and completion add no bonus. No shop, deductions or lost gold.
- [x] Keep one child wallet across competition ledgers, with learning and academic awards separate by competition and child. Preserve revision guards and profile isolation; simultaneous same-course commands cannot double-award, and different competitions do not overwrite a shared balance.
- [x] Credit existing history quietly from saved attempts/confirmations, retaining an append-only earned ledger on the next accepted learning command. GET and reload do not replay old gains or mutate history. Existing private JSON storage needs no SQL schema migration.
- [x] Prioritise one home start/resume action, otter, horizontal five-stop blue route and moving boat, next-treasure preview and latest souvenir. Keep topics and manual-topic resume secondary. Helped/revealed completed work advances the boat independently of skill confirmation.
- [x] Replace tree leaves/plants with one skill marker: blue flag for first effort, teal sparkle for first correctness, gold checked medallion for confirmation. Рачешки задачи has five markers. Preserve earned states after later difficulty, current learning goals and Doctor/Professor rules.
- [x] Start the secondary map near the latest/selected island while retaining all 17 destinations, full-map reset and topic grid. Exclude island buttons from pan-gesture handling so pointer activation remains native.
- [x] Show a brief combined gold gain with optional breakdown and coin flight to the wallet; respect reduced motion. Preview/reveal four original repeating sea souvenirs using existing saved adventure stamps, retaining their actual achievement text.
- [x] Keep fixed Check/Next controls and readable cream/sea/teal styling; blue denotes progress, gold denotes rewards. No automatic advance.
- [x] Update key-decisions.md and verify the implementation locally. No push, deployment or cloud configuration changes in this slice.

Verification and limits:

- `npm test`: 107 passed, 0 failed. Coverage includes quiet historical credit, reveal/help/correctness/confirmation milestones, repeated and stale commands, lost-response recovery, cross-competition aggregation, parent/child isolation, simultaneous same- and different-competition writes, one marker per skill, map activation and the five-task UI flow.
- `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check`: passed. Build trace and standalone private-file exclusions passed.
- Chrome checked the built app on desktop and at 390 x 844 and 320 x 640 with temporary progress. No horizontal overflow; the home primary action is above the fold and fixed Check/Next is visible. Completed a five-task adventure containing independent, helped and revealed work; verified +15 combined first correctness, +5 new effort, no gold for help alone or repeated correctness, saved wallet after reload, moving route and matching souvenir preview/reveal. The chest adds no extra gold. Verified five selectable skills in Рачешки задачи and pointer opening from the full map. Temporary viewport override was reset.
- A read-only GET from the updated real local app confirms a numeric historical wallet and no replayed gold gain. All 36 baseline history/archive/source-figure hashes remain unchanged. The original AI study app was not edited.
- Restarted the verified local production build at `http://127.0.0.1:3002/`. Browser test data is isolated under `/tmp/maths-gold-browser-verification`, not real learning history.
- Hosted store behavior is covered with the test database adapter; live Google OAuth and cross-device Supabase persistence still require the deferred cloud setup and are not claimed as verified here. Browser extensions emitted unrelated wallet-provider warnings during Chrome testing.
- Coordinator remained gpt-6.1-sol with high reasoning effort; this coupled implementation and final verification used one agent.


Map reward visibility fix, 2026-11-03:

- [x] Reproduced the island-name plaques covering the lower part of the skill reward markers in Chrome; moved plaques below the reward row. No reward rules, saved progress or theme-card counts changed.
- Verification: existing UI suite 29/29 passed; production build and private-file exclusions passed; `git diff --check` passed. Chrome DOM geometry checked all 17 islands at desktop and 390 x 844: no marker/name overlap or bottom label clipping in full-map view. Selected Рачешки задачи retains five unobscured markers at both sizes; navigation opens/closes the island. Restored the viewport override.
- All 36 protected history/archive/source-figure hashes remain unchanged. The updated local production app runs at `http://127.0.0.1:3002/`. No push, deployment or cloud changes.


Theme-card gold display correction, 2026-11-03:

- Approved scope: replace the old island discovery counts with a coin, “Събрано злато”, earned/available gold and a gold bar in the topic grid and selected-island summary. Keep individual skill learning goals unchanged.
- Project each topic's collected gold from the authoritative retained award ledger, including historical credit; maximum 35 per skill (175 for the five-skill Рачешки задачи island). Reading the display must not mutate history or replay rewards.
- Verification: `npm test` 108 passed; `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed. Build private-file exclusion checks passed. Regression coverage includes historical credit, retained ledger gold after learning evidence changes, topic isolation, five skills / 175 available gold, and unchanged individual learning goals.
- Restarted the production build at `http://127.0.0.1:3002/`. Chrome verified coins and gold-colored fills on all 17 theme cards, existing Рачешки задачи gold of 70/175, and the matching selected-island summary. Desktop and 390 × 844 mobile checks show no horizontal overflow; all five skills remain accessible. No answers were submitted. All 36 protected history/archive/source-figure hashes are unchanged. No push, deployment or cloud changes.


Compact theme gold display, 2026-11-03:

- Remove the repeated visible “Събрано злато” label; place the coin beside earned/available gold on the right above the bar. Keep accessible gold descriptions and saved rewards unchanged.
- Verification: UI regressions 29/29 passed; production build, private-file exclusions and `git diff --check` passed. Chrome checked all 17 cards: no repeated label, coin and number right-aligned, existing totals retained. Desktop and 390 × 844 mobile layouts have no horizontal overflow. Local app restarted on port 3002; no learner answers submitted. All 36 protected history/archive/source-figure hashes unchanged.


Website and competition identity, 2026-11-03:

- Approved: website name “Състезателна математика”, active competition and grade underneath the learning header, concise “За сайта” link; retain the current teal buttons. Competition labels follow the selected catalogue entry rather than a hard-coded course name.
- Verification: all 108 tests, type checking, lint, production build and private-file exclusions passed. Chrome checked the header, About link, teal primary action and desktop/mobile layouts; isolated rendering checked selected-competition labels and login identity. Regenerated the public preview with an empty history profile. All 36 protected history/archive/source-figure hashes remained unchanged; no learning or reward behavior changes, answers submitted, push or deployment.


## 2026-11-03 - Olympiad content preparation

- [x] Organize seven unchanged PDFs privately by competition/grade/round/year and record hashes, provenance and the missing 2024 solution PDF.
- [x] Archive the four full Bulgarian automatic transcripts as Markdown. Preserve the 2023 creator correction separately; it is not a full transcript. Save tutor teaching methods with source links.
- [x] Prepare 12 originals / 29 learning units, 60 fresh exercises (three core and two harder per skill) and exactly three concrete solution parts. Independently check the maths; exclude the underdetermined 2023 problem 3 from grading.
- [x] Integrate the approved four islands: Числови загадки, Геометрични открития, Истории с числа, Логически загадки. Retain the five-task adaptive adventure, progressive help and existing gold rules.
- [x] Keep `olimpiada` unpublished and reject public access before any storage write. Preserve the existing competition's history and backups.
- [ ] Human review of wording, figures, solutions and new variants; resolve/accept source caveats in `docs/olimpiada-content-review.md` before publication.
- No deployment, Git push, new cloud setup or НВО content in this slice.

Verification for Olympiad preparation:

- `npm test`: 115 passed; type checking, lint, production build and `git diff --check` passed. Build trace and standalone private-file exclusions passed.
- Independent Python checks verified original answers and all 60 new exercises. Regression tests cover four islands, three-part help, five-task adventures, gold, mastery, isolated persistence and unpublished access rejection.
- All 36 protected history/archive/source files match the baseline; the seven relocated PDFs are byte-identical. Four full-video transcript archives match their inventory hashes. Runtime content has no private local paths, and the source answer pack is absent from client static assets.
- New map rendering and actions were checked in DOM tests; no new live-browser visual verification or publication is claimed. The existing study history was not changed.


Olympiad Bulgarian language review, 2026-11-03:

- Reviewed all 60 new problem statements and the authored teaching steps for the 12 originals. Replaced awkward literal phrasing with clear fourth-grade Bulgarian, including rectangle sides, fees, Roman numerals and overlapping groups. Corrected misleading instructions to add where the displayed calculation subtracts.
- Original competition statements, answer keys, IDs, options, curriculum, diagrams and provenance remain unchanged. Private review sources and runtime teaching text match. Original PDFs and raw automatic transcripts are preserved.
- Checked 356 authored text fields for broken words, mixed-script words and encoding/invisible-character problems; no candidates remain. Human reading informed the language changes; the character scan is not a substitute for proofreading.
- Verification: 115 tests passed, both independent maths checks passed, production build including TypeScript and private-file exclusion checks passed, and `git diff --check` passed. All 36 protected baseline hashes and recorded PDF/transcript hashes match. No live-browser visual check, publication, history changes or cloud changes in this text-only slice.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this closely related copy revision.


Local Olympiad review enabled, 2026-11-03:

- Owner approved showing Olympiad locally. The home now offers Математика за всеки and Олимпиада; page, API and local storage share the same availability guard. Olympiad remains unpublished in hosted mode; НВО stays hidden.
- Verification: all 116 tests, lint, production build (including TypeScript and private-file exclusion checks), and `git diff --check` passed. Local home and Olympiad return HTTP 200; НВО returns 404. Chrome verified both competition links and switching to the four Olympiad islands. Separate-store persistence and hosted rejection pass regression tests.
- All seven pre-change learner-history/backup hashes match. No answers submitted by verification; no reset, push, deployment or cloud changes. Local production server restarted at http://127.0.0.1:3002/.
- Coordinator: gpt-6.1-sol, high reasoning; one agent.

Approved hint copy update, 2026-11-03:

- Remove the optional Как мислиш? explanation box from both child players. Rename existing solution help to Подсказка / Следваща подсказка, including accessible headings. Retain step-by-step calculations, help classification and historical reasoning. Lesson navigation remains Следваща стъпка.
- Verification: all 116 tests pass, including both players’ hint progression and absent explanation inputs. Lint, production build (including TypeScript and private-file exclusions), and `git diff --check` pass. Restarted port 3002; read-only HTTP checks confirm the served app includes both new hint labels and excludes the removed wording. All seven protected learner-history/backup hashes are unchanged. No live-browser hint interaction or learner answers submitted for this copy edit; no deployment or cloud changes.


Approved map defaults and competition dropdown, 2026-11-03:

- Both maps open fully zoomed out to show all islands, regardless of the last practised topic. Choosing an island still zooms into it; Цялата карта returns to the overview. No changes to teaching order, content, scoring or rewards.
- Replaced the home competition links with a compact dropdown in the existing cream/teal design. Both Математика за всеки and Олимпиада show Трудно; the current choice has a check mark. Keyboard activation, Escape, focus leaving the selector and outside-click dismissal are supported.
- Verification: all 118 tests, lint, production build (including TypeScript and private-file exclusions), and git diff --check pass. Chrome verified both maps after hydration, switching in both directions, badges/current selection, Escape dismissal, and a 390px mobile viewport without horizontal overflow. Restored the normal viewport and restarted the local production server at http://127.0.0.1:3002/.
- Verification submitted no learner answers or learning commands. Six protected backup hashes match the previous baseline. The live course file has newer user progress than that older baseline (revision 85, last saved at 21:55:47 local, before this UI work); retained it without restoration or rewriting. No push, deployment or cloud changes.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this tightly related UI slice.


Approved compact islands and direct subtopic practice, 2026-11-03:

- [x] Each island skill row starts that skill’s exercises directly, with a right arrow and a decorative discovery marker. The top “Да упражним” action keeps whole-island adaptive practice. All five Рачешки задачи skills and all Olympiad skills remain individually selectable.
- [x] Save scoped questions, help, lesson steps and feedback separately from other skills, whole-island practice and adventure work. Resume after reload; reject invalid or cross-island skill IDs. When the selected skill runs out of prepared exercises, keep its scope and offer a return to the island.
- [x] Remove expanded skill evidence panels, “Моите малки открития”, repeated award requirements, the map milestone explainer and the duplicated home competition subtitle. Retain concise skill statuses, island gold, useful exercise progress, maths, help and earned recognition. Tighten island rows without reducing touch targets below 44px.
- [x] Preserve all Doctor/Professor rules, earned awards, celebrations, confirmation requirements and gold accounting. This is a routing and display change, not a new rewards policy.
- Verification: all 123 tests passed, including every skill in both competitions, isolated scoped persistence/exhaustion, stale revisions and unchanged rank/gold rules. Type checking, lint, production build including private-file exclusions, and git diff --check passed.
- Chrome verified non-first subtopic selection in both competitions, scoped continuation, hint restoration after home/reload, compact island rows and 390 × 844 mobile layout without horizontal overflow. Learning commands ran only against a disposable local store on port 3003. Browser warnings/errors observed were from installed wallet extensions, not the application. Restored the normal viewport.
- Restarted the real app at http://127.0.0.1:3002/ and checked it read-only: 210 wallet gold, 70/175 Рачешки задачи gold and the 3/5 unfinished adventure remain visible. All eight protected learner-history/backup hashes match the pre-change baseline. No reset, Git push, deployment or cloud changes.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this closely related UI and practice-routing change.


Approved real-competition-first teaching policy, 2026-11-03:

- [x] Apply one history-based selector to both competitions, adventures, diagnostics, whole islands and exact subtopics. Prefer unused real competition questions; retain the selected skill for confirmation. Use another real question when available, otherwise a reviewed, explicitly labelled teaching exercise. Keep diagnostics at three problems maximum.
- [x] Preserve original statements/figures and display actual competition, year, round and problem number. Offer a read-only original-statement page without answer keys or private source files. Distinguish original subconditions and authored scaffolding.
- [x] Present newly assigned multi-answer originals one subcondition at a time; persist the current part, mistakes and help. Record one final outcome and reward only after the whole problem. Preserve legacy pending questions and their existing input format.
- [x] Give concrete partial solutions in three hints. Prevent repeats, overlapping original/subcondition work, revealed solutions and helped work from becoming fresh independent evidence. Preserve existing gold, Doctor/Professor rules and previously earned recognition.
- [x] Schedule retention review for each confirmed skill after two days, without blocking further learning or rewards. Review repetitions do not mint fresh evidence or gold.
- [x] Document the educational decision in key-decisions.md and correct About copy to describe real tasks followed by confirmation exercises.
- Verification: all 130 tests pass; type checking, lint, production build, private-file exclusion checks and git diff --check pass. New regressions cover both catalogues and all entry points, old high cursors, original/subcondition overlap, sequential answers, help/error classification, two-day per-skill review and original-source whitelisting.
- Chrome verification used only a disposable store on port 3003: completed the three-part 2024 grid original, resumed its second part after reload, checked one final outcome and delayed gold, then saw a clearly labelled confirmation exercise. Verified an exact non-first Olympiad skill starts a real 2024 subcondition and restores its concrete first hint after reload. The original-statement page exposes the statement and figure without answers. Screenshot: /tmp/maths-real-first-preview.png.
- Restarted the real local production app at http://127.0.0.1:3002/; both competition APIs and the original-statement page return HTTP 200. Read-only verification confirms 210 wallet gold, 70/175 Рачешки задачи gold and the unfinished 3/5 adventure. All eight learner-history/backup files match their pre-change SHA-256 hashes. No learner actions were submitted against the real store; no reset, push, deployment or cloud changes.
- Content limit retained: the underdetermined Olympiad 2023 problem 3 remains excluded from grading; the missing 2024 official solution PDF remains recorded for human content review. Local Olympiad review stays available; hosted publication remains a separate step.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for the coupled selection, evidence and persistence changes.


Approved compact source labels and saved-task refresh, 2026-11-03:

- [x] Show only competition and real year beneath real tasks in both competitions; make that label the original-statement link. Remove saved legacy wording from the display. Authored confirmation work shows the competition name without a fabricated year.
- [x] Following the owner's “да замени”, replace only untouched saved authored exercises with eligible unused real tasks in the same skill/mode. Keep attempted/hinted work, history, skill progress, gold, academic awards and adventure position. Migration is projected on reads and persisted with the next accepted revision-guarded learning action.
- Verification: all 133 tests, type checking, lint, production build including private-file exclusions, and git diff --check passed. Regressions cover both competitions, island/skill/adventure slots, migration idempotence, preserved started work and compact UI labels.
- Read-only checks against the actual saved courses identify five eligible Olympiad replacements; other pending work either has help/history or no eligible unused real source. Existing 210 wallet gold and all historical attempts/skill state remain unchanged. All eight protected learner-history/backup SHA-256 hashes match the pre-change baseline.
- Chrome used a disposable copy on port 3003: verified an old Olympiad number exercise is replaced by the real 2023 original, survives topic reopening after reload, and shows only “Олимпиада · 2023”; verified “Математика за всеки · 2024” on a real task in the other competition. Screenshot: /tmp/maths-compact-source-preview.png. No answers or hints submitted against real learner data.
- Rebuilt and restarted http://127.0.0.1:3002/; both competition APIs return HTTP 200. No progress reset, push, deployment or cloud changes.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this coupled label and saved-task fix.


Owner-approved Olympiad test refresh and content coverage audit, 2026-11-04:

- [x] Follow the owner's explicit exception for seen/hinted local Olympiad test exercises. The five untouched replacements had already persisted through normal owner navigation; replace the remaining hinted Roman-numeral exercise with the full 2025 problem 1. All seven currently saved Olympiad work slots now contain real competition tasks. Preserve the existing adventure, active subtopic, skills, historical attempts and rewards.
- [x] Save the original Olympiad record and repair evidence under private backups/olimpiada-test-refresh/2026-11-04T06-29-44-138Z/. Revision advances from 18 to 20; existing real tasks are byte-equivalent as objects, and all seven other protected history/archive file hashes match the immediate pre-repair baseline. No permanent relaxation of started-work migration rules.
- [x] Audit all supplied Olympiad sources and the actual runtime catalogue. All 11 gradable originals from 2022–2025 are included: numbers 4, geometry 4, stories 2, logic 1. The remaining original is the known underdetermined 2023 problem 3. See docs/olimpiada-content-review.md for exact original/subcondition counts and skill gaps.
- Proposed next content slice, pending source scope: enrich the existing four islands with additional years of real competition problems, prioritising logic and stories. Confirm a new island with the owner only if genuinely new subject matter needs one. No additional source material or new islands have been added in this slice.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for the local test-data repair and closely related coverage audit.
- Verification: the running localhost:3002 Olympiad API returns HTTP 200 with the repaired revision and 210 wallet gold. Resuming the adventure through the actual startQuest command on an in-memory copy selects the real 2025 original with no inherited hints; the file is unchanged by this check. Migration is idempotent. Backup integrity, all seven other protected file hashes and git diff --check pass. Subsequent owner navigation is allowed to advance the revision normally. No application code, build or deployment changed in this data-only repair.


## Approved method-based practice and fresh-problem gold - 2026-11-04

- Preserve both catalogues, islands, skill IDs, history, unfinished work, 5/10/20 milestones and earned academic awards.
- Use existing methods internally; select provisional real introductory questions with a short rationale rather than infer difficulty from exam numbering, length or answer format.
- Return with an unseen application of a previously successful method; give one fresh related follow-up after success or supported/error/revealed work, then interleave. Repeated difficulty changes method. Keep real sources ahead of checked authored confirmation.
- Keep five resumable tasks, diagnostics at most three and original subconditions in order; do not force a hard fifth task.
- Add +5 once for a fresh correctly completed problem, helped included. Full originals and their parts share one entitlement; reveal alone, repetitions and historical work get no new bonus. No historical backfill or reward replay.
- Island gold maximum includes distinct problem entitlements alongside skill milestones; retain a single compact gain notice.
- Verify routing, persistence, overlap, rewards and UI using disposable learners; run tests, typecheck, lint and production build. Protect real history with hashes and restart localhost:3002 only after verification. No publication or cloud changes.
- [x] Implemented method pairing, documented provisional introductions, cross-year real-source preference and prospective +5 problem gold; preserved exact-subtopic scope and existing skill/rank rules.
- Verification: all 139 tests pass, including real introductions, same-method pairing across skills/years, return visits, repeated difficulty, hint persistence, source/part overlap and prospective reward accounting. Type checking, lint, production build/private-file checks and git diff --check pass. Catalogue audit found no duplicate identities with different bonus entitlements or entitlements shared across islands.
- HTTP acceptance used only a disposable store on port 3003: a fresh Математика за всеки original paid one combined +20 (existing 5/10 milestones plus +5), then selected reviewed confirmation because that method has no second real source. An Olympiad original completed with a saved hint paid the same one-time problem bonus and selected a different-year real follow-up. GET/reload did not replay rewards.
- Browser acceptance remains unverified in this slice: the preferred Chrome CLI failed on an incompatible pageId snapshot call, and the alternate Chrome connection failed while opening/claiming a tab. Existing rendered-component tests passed; do not count these as live visual verification. A manual visual check remains useful before the pilot.
- Rebuilt and restarted http://127.0.0.1:3002/; both competition APIs and home pages return HTTP 200. Read-only checks confirm the saved 210 wallet gold, unfinished 3/5 adventure, no gain notice on GET and all eight protected learner-history/backup hashes unchanged. Test actions never used the real learner store. No reset, push, deployment or cloud changes.
- Status: implementation and automated/HTTP acceptance complete; live browser visual acceptance outstanding because of the browser connection failure. Introductory choices remain provisional for the five-child pilot; existing source/publication caveats are unchanged.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for the coupled selection and reward changes.


## Approved reachable-treasure and continuation polish - 2026-11-04

This slice supersedes the earlier no-recovery policy for previously attempted problems and the moving catalogue target. No deployment or content expansion is included.

- [x] Retain island gold-target bars, coin counts and small open/closed chests. Freeze per-child island targets on the next accepted persisted command for legacy courses and at creation for new courses; future content pays wallet gold without moving targets.
- [x] Recover unpaid +5 problem entitlements on a future successful attempt exactly once, including originals/parts overlap. Preserve 5/10/20 skill milestones, existing gold, history and academic awards; never backfill problem bonuses on GET.
- [x] Keep eligible hard problems available after Professor in adventures and topic practice with prerequisites and source/exposure protections. Complete finite adventures at the actual task count, grant one souvenir without extra gold, and show an honest zero-work/review state.
- [x] Persist scoped numeric/choice answer drafts through the profile course store, restore across navigation and reload, and reject stale-device conflicts without overwriting answers. Saving a draft does not submit or grade it.
- [x] Resolve revisit-status contradictions, use neutral continuation copy, fix “засега”, update About for both competitions, and group repeated souvenirs with counts.
- Verification: all 151 tests pass, including gold recovery, fixed targets after content growth, hard work after Professor, finite/empty adventures, draft navigation, choice zero, stale-device conflicts and hosted-store profile/competition isolation.
- Live Chrome verification used disposable data on port 3003: checked gold bars/chests, restored a two-digit answer through Home, Pause and reload without gold or grading, and checked both competitions at 390px without horizontal overflow. The mobile check button remains visible at the bottom of the viewport; no application runtime exceptions were observed.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this coupled learning, rewards and persistence slice.
- Final acceptance: lint, production build (including TypeScript and private-file trace exclusions), and git diff --check pass. Exhausted exact-subtopic practice returns to its own island. Both competition pages and APIs return HTTP 200 on the refreshed http://127.0.0.1:3002/.
- Preservation: read-only checks confirm the existing 210 wallet gold, unfinished 3/5 adventure, and no gain replay. All 54 non-metadata learner, backup and source files match their pre-change SHA-256 hashes; macOS changed one .DS_Store metadata file. Learning commands ran only against disposable data. No reset, push, deployment or cloud changes; live Supabase device testing remains part of hosted acceptance.


## Approved competition-intake checklist - 2026-11-04

- [x] Replace docs/content-workflow.md with the approved reusable checklist: source verification, island/skill mapping, integration without progress loss, and human review/release gates.
- [x] Include 27 checklist items and a per-collection record for source scope, coverage, excluded problems, island approval, reviewer, verification and blockers. Retain the approved missing-key exception, real-problem-first policy, compact source labels, fixed island targets and existing rewards.
- Verification: reviewed against key-decisions.md and the competition catalogue/local-review guard; all two relative Markdown links resolve; four checklist stages and the review-record template are present; git diff --check passes for the changed documentation.
- Status: documentation verified. No content, application code, learner history, source materials, cloud settings or publication state changed. Runtime tests were not rerun for this documentation-only update; existing content/publication blockers remain unchanged.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this documentation-only slice.


## Approved NVO intake - 2026-11-04

- [x] Add all supplied 2022–2025 grade-4 NVO originals: 100 full problems, 108 answer conditions, 40 original figure crops and three concrete solution parts per original. No videos or bulk authored confirmation exercises.
- [x] Map to the 10 owner-approved islands and 27 skills; keep question 25 as one original with three sequential answers and one reward entitlement.
- [x] Add NVO to the local-review dropdown with “Лесно”; retain explicit unpublished/hosted gates and independent competition storage. Fit the whole ten-island map by default.
- [x] Record source caveats, coverage and finite-source gaps in docs/nvo-content-review.md and key-decisions.md. Human content review remains pending; no claim of publication approval.
- Verification: all 158 tests pass; typecheck, lint, production build/private-file exclusions and git diff --check pass. The independent key fixture covers all 108 answers.
- Live isolated Chrome acceptance on disposable data at port 3003: all three competition choices and difficulty badges, fitted ten-island map, exact-subtopic launch, all three concrete hint parts, correct supported answer, +20 combined gold and reload without reward replay. At 390px there is no horizontal overflow and the check button stays in the viewport; no application runtime exceptions were observed.
- Rebuilt and restarted http://127.0.0.1:3002/; all three home pages and APIs return HTTP 200. Read-only checks retain 210 wallet gold and existing unfinished adventures. All 62 protected learner-history, backup and source files match pre-change SHA-256 hashes; test learning commands used only disposable data.
- Status: implementation and local automated/browser acceptance complete. Human mathematical/language review of the new collection remains pending; NVO remains unpublished. The single-source area-units skill is documented honestly rather than given duplicate evidence.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this coupled content and integration slice. No deployment, push or cloud changes.


## Approved weighted problem gold - 2026-11-04

- [x] Review all three original catalogues and authored templates; store explicit reasoning-based standard/hard metadata and rationales. Originals/parts share the source level. Selection pool names and competition badges are not reward levels.
- [x] Implement prospective 10/15 problem gold, compact available-reward preview and actual-amount breakdown. Keep hinted correctness eligible, one award per source, 5/10/20 skill milestones and unchanged adaptive selection/academic criteria.
- [x] Preserve amount-less historical awards at 5 and frozen per-child targets; use weighted unique entitlements only for new targets. No data migration, content identifiers or private source changes.
- [x] Update docs/content-workflow.md, key-decisions.md and docs/problem-difficulty-review.md with the intake and compatibility rules.
- [x] Complete automated checks, production build and private-file preservation verification; refresh localhost 3002.
- Verification: 163/163 tests, typecheck, lint, production build/private-file trace exclusions and git diff --check pass. All three competition home pages and APIs return HTTP 200 at http://127.0.0.1:3002/. Read-only views retain 210 wallet gold and the existing unfinished 3/5 adventure; all 63 protected learner-history, backup and source files match their pre-change SHA-256 hashes.
- Isolated production API acceptance on disposable port-3003 data: hard preview is 15/×1.5, hints retain that rate, supported success pays 15 problem gold plus unchanged 5/10 milestones, and reload retains 30 without replay or an unpaid preview. Real learner history received no learning commands.
- [ ] Complete live desktop/mobile visual acceptance. Retried Chrome automation after the owner requested it; the preferred CLI cannot resolve page IDs, the alternate browser bridge fails before navigation, and native computer-use permission is unavailable. Component-rendering tests pass, but no live visual/responsive verification is claimed for this slice.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this coupled reward/content slice. Local only, no push, deployment or cloud changes. Human content/publication review remains pending.


## Approved daily progress calendar - after pilot - 2026-11-04

Статус: одобрен бъдещ обхват след пилотния старт. В тази стъпка се обновява само планът.

### Календар на напредъка

- [ ] Добави месечен календар за всяко дете, достъпен от детския профил и родителския екран чрез съществуващите права за достъп, без отделни детски имейл акаунти.
- [ ] Показвай за всеки ден спечеленото злато, самостоятелните верни решения и верните решения с подсказка.
- [ ] Брой всяко успешно решаване, включително повторенията. Повторението не носи допълнително злато извън съществуващите правила.
- [ ] Не брой подусловията като отделни завършени задачи или разглеждането на решение като успешен отговор.
- [ ] Покажи общ изглед за всички състезания с филтър по състезание; натискане на ден отваря подробностите.
- [ ] Групирай дните по Europe/Sofia; седмицата започва в понеделник.

### Обхват на промените

- Обобщаване на дневните решения и награди от съществуващата история.
- Защитено четене на данните за избраното дете.
- Общ календарен компонент за детския и родителския екран.
- Навигация, филтри и мобилен изглед.
- Автоматични проверки за изчисленията и достъпа.

За пилота не е необходима нова таблица или предварителна миграция за календара: съществуващите записи на опити и награди съдържат необходимите дати. При реализацията провери старите записи; липсващи или възстановени дати не представяй като точна историческа активност.

### Проверки при реализацията

- [ ] Решения с помощ и без помощ, повторения и задачи с подусловия се броят според правилата по-горе.
- [ ] Дневното злато съвпада със записаните награди, без повторно начисляване или преизчисляване на историческите суми по нови ставки.
- [ ] Групирането е правилно около полунощ и при смяна на часовото време.
- [ ] Детският и родителският изглед показват еднакви резултати; няма достъп до чуждо дете.
- [ ] Мобилният календар, празните дни, филтърът и преминаването между месеци работят.

### Бъдещ обхват: напомняния

- [ ] Планирай напомняне след два последователни календарни дни без учебна активност.
- [ ] Преди реализацията уточни с потребителя каналите за родител и дете, съгласието, часа и ограничаването на повторни известия.
- [ ] Добави надежден запис на последната учебна активност и изпратените напомняния; отварянето на началната страница не се приема за учене.
- [ ] Реализирай изпращането на имейли и известия като отделна последваща задача.

- Проверка на тази стъпка: добавен е само одобреният бъдещ обхват; предходното съдържание на плана е запазено. Приложението, базата и историята не са променяни. Не са изпълнявани runtime тестове за тази документална промяна.
- Coordinator: gpt-6.1-sol, high reasoning; one agent for this documentation-only slice.


## Approved storage optimization - completed locally, 2026-11-04

- Replaced public PNG delivery with reproducible lossless image generation. All 64 unchanged PNG sources remain in `assets/images/`; `npm run assets:build`, development startup and production builds generate smaller content-hashed public images and the path manifest. Content identifiers and saved figure paths stay unchanged; legacy PNG URLs temporarily redirect to their optimized versions.
- Verified every decoded pixel and image dimension. Image payload fell from **2,319,694 to 1,129,660 bytes (51.3% smaller)**; all public files together fell from **2,326,979 to 1,136,945 bytes**. No resizing, lossy compression or changes to white figure backgrounds.
- Hashed public images use `public, max-age=31536000, immutable`; stable lesson SVGs use `public, max-age=0, must-revalidate`. Excluded only the new public image directory from the auth proxy so it cannot override asset caching or refresh auth cookies there. Personalized pages, profiles, auth and API responses retain `no-store`.
- Original PNG sources are excluded from deployment tracing alongside private source packs, backups, learner data and credentials. The verified local standalone bundle is **43,640,617 bytes**, including server dependencies; this macOS build is not a measured Vercel upload size. Existing dependencies and database persistence were retained; no new storage service or schema migration was introduced.
- Verification: **166/166 tests passed**, TypeScript, ESLint and production build passed, deployment trace/private-file checks passed. Production HTTP checks verified all **64 optimized images**, all **64 legacy redirects**, preview image markup, SVG cache headers and uncached private endpoints. Source PNG hashes and **69 files** under `data/`, `backups/` and `materials/` are byte-identical; no protected files were added or removed. The duplicate source PDF remains intact.
- Updated the figure-import checklist and deployment notes so future competitions use the same optimization workflow. Updated the stage table to include both implemented draft competitions; publication remains a separate review gate.
- Local app restarted at `http://127.0.0.1:3002/`. Browser automation could not provide a snapshot because its page-ID bridge failed; rendering checks used production HTML/asset responses and exact pixel comparisons. No deployment, Git push, live database changes or learner reset performed.

### Remaining before the pilot release

- Complete production Supabase/Google OAuth credentials and Vercel configuration, then verify HTTPS login and cross-device resume with preserved history.
- Finish human content/publication review for the locally available Олимпиада and НВО drafts, including the documented missing Olympiad answer key exception and permission to publish source statements/figures.
- Confirm public contact identity, then verify the hosted invitation flow, family isolation and five-child cap. Calendar/history-by-day and inactivity reminders remain the future scope already recorded above.


## Island topic cards - verified locally, 2026-11-04

- Removed repeated open/close text from Themes cards in all three competitions. The entire card activates its existing native button; accessible gold bars, selected state and keyboard focus remain intact. Reduced unused card height.
- Verified all 17 / 4 / 10 cards in Chrome at desktop (1280 × 900) and mobile (390 × 844) sizes: gold-area clicks, Space/Enter, return focus and no horizontal overflow. No learning POSTs occurred and learner data file hashes were unchanged.
- Verification: 40/40 UI tests, TypeScript, ESLint and production build passed. Updated local production app running at `http://127.0.0.1:3002/`; no deployment or database changes.


## GitHub source update - 2026-11-04

- Owner authorized committing and pushing the current standalone app to `Petar9/sastezatelna-matematika` on `main`.
- Verified 166/166 tests, TypeScript, ESLint, production build and deployment trace/private-file checks. Reviewed source candidates for credentials and private files.
- Learner history, backups, source PDF/transcript archives and environment credentials remain excluded; macOS `.DS_Store` is not included.
- This publishes source only. Production deployment, hosted OAuth/cross-device verification, content publication approval and public contact remain the release gates above.
- Coordinator: gpt-6.1-sol, high reasoning; one agent.


## Vercel build repair - 2026-11-04

- First production deployment of `395f7cc` compiled successfully, then failed in `scripts/deployment-check.mjs`: its blanket symlink rejection refused Vercel's generated `_global-error.segments/__PAGE__.segment.rsc.func` link.
- Removed that blanket rejection for links contained within `.next`; inspect their resolved targets once and stop cycles. Links outside the build remain rejected, and standalone bundle/private-file checks remain enforced.
- Added a regression covering Vercel function aliases, link cycles, private traced files, links outside the build and standalone symlinks. Verified 167/167 tests, TypeScript, ESLint, production build and `git diff --check`; all 69 private baseline files are unchanged.
- Fix pushed as `3a6c052`; Vercel production deployment `4wLWRKJtjBxK4RpJ5WVEZH6ar9BZ` reached Ready (47 seconds). Public HTTPS GET returned HTTP 500; Vercel runtime logs identify `Missing SUPABASE_PUBLISHABLE_KEY`. Code also requires `SUPABASE_SERVICE_ROLE_KEY` for database access. Add the production keys through Vercel, redeploy, then verify login and saved progress. No credentials, cloud access settings, database content or learning behavior changed.
- Coordinator: gpt-6.1-sol, high reasoning; one agent.


Homepage and first profile update, 2026-11-04:

- Owner completed the hosted smoke test. Supabase Table Editor confirms the first active child profile under the approved parent; online course_progress was empty before import. Google login and child creation now work; the previous missing-key runtime blocker is resolved. Cross-device and live second-family checks remain pending.
- Removed the large homepage screenshot and “Лични данни” section, including unused image styles. Kept the original small mascot and invitation consent.
- Validated the local matematika-za-vseki course (revision 89, 16 attempts) through the current course projection without modifying the source. Created a byte-identical private backup and a one-row CSV for the verified parent/child IDs. The owner imported the CSV successfully. A fresh Supabase export confirms one record for the verified child and parent, competition matematika-za-vseki, revision 89; its complete course JSON matches the local source exactly. The validated history contains 16 attempts, 210 gold and 5 confirmed skills. No existing database progress was overwritten. The readback export is stored in the private import backup folder. Draft competitions have no attempts and were not imported. Cross-device display remains unverified.
- Verification: TypeScript, ESLint, production build and private-file bundle checks passed. Coordinator: gpt-6.1-sol, high reasoning; one agent.


## Compact homepage - 2026-11-04

- Implemented the approved shorter headline, supporting copy, three benefits, invitation section and consent. Layout styles are limited to the landing page; learning, authentication, invitation processing and learner history are unchanged.
- Applied the owner's exact collection wording: “Наличният комплект е по математика за 4. клас и включва задачи от „Математика за всеки“, Олимпиада, НВО (матура) за 2023-2026 г.” This copy edit does not publish draft competitions. Source years differ by collection as documented on the About page; the aggregate wording is owner supplied.
- Verification before the final copy edit: 167/167 tests, TypeScript, ESLint, production build and private-file bundle checks passed. After the final copy edit, production build, TypeScript, ESLint, private-file bundle checks and git diff --check passed; local /welcome returned HTTP 200 with the exact requested text.
- Browser automation was unavailable; desktop/mobile visual acceptance is not claimed. Local preview uses port 3003; these changes have not been deployed.
- Coordinator: gpt-6.1-sol, high reasoning; one agent.


## Landing redesign - 2026-11-04

- Approved: one hero with text and a single invitation form on the left, a decorative three-island journey and existing otter on the right; mobile order is text, form, illustration, collection information. Remove repeated benefits, headings, CTA and oversized framed sections.
- Keep “Подготовка за състезания, стъпка по стъпка.”, use “Истински задачи, ясни подсказки и приключения с награди.”, retain the exact owner-supplied collection sentence below the hero, and display “Тестваме с група до 5 деца.” above the form.
- Remove the checkbox and server-side consent=yes requirement together; no hidden consent value. Keep native email validation, private invitation RPC, duplicate success and 30/hour protection unchanged. Confirmation: “Благодарим! Получихме заявката за покана.” No database, history, collection-publication or learning-flow changes.
- Acceptance: inspect 390/768/1440 px, 200% zoom, keyboard focus, validation and success/error states; run focused route tests, TypeScript, lint, full tests and production build. Record final evidence below. Changes remain local until deployed separately.
- Coordinator: gpt-6.1-sol, high reasoning. Implementation: gpt-6.1-sol, high reasoning. Independent critical review: gpt-6-astra, high reasoning.

- Implemented the approved layout, landing-only marine-blue CTA and lightweight SVG illustration with the existing otter. The form requests only the parent email; checkbox validation was removed from the route without changing the private RPC. Network/RPC failures retain a recoverable error state. No dependencies, database schema, learner history, shared learning styles or collection publication changed.
- Verification: **173/173 tests passed**, TypeScript, ESLint, production build and deployment trace/private-file checks passed. Route tests cover validation, email normalization without a consent field, RPC results, network failure and local-mode behavior. Repeated-request tests mock the existing RPC; live database duplicate/rate-limit behavior was not exercised.
- Real Chrome inspection passed at **390 × 844, 768 × 1000 and 1440 × 1000**: no horizontal overflow, mobile CTA before the illustration, one form, visible keyboard focus in login/email/CTA order, native email validation, button hover and accessible success/invalid/unavailable states. Decorative artwork is hidden from assistive technology; no browser warnings/errors were reported. Also checked 720 CSS-pixel reflow and 200% CSS magnification; the native browser zoom shortcut was unavailable, so native 200% zoom is not claimed.
- Independent gpt-6-astra source and screenshot review found no blockers or meaningful usability defects; coordinator completed the browser interaction checks. No live invitation submissions or learner writes were made.
- Updated production-mode local preview: **http://127.0.0.1:3003/welcome**. No commit, push or deployment in this step; hosted invitation submission and database verification remain post-deployment checks.


## Learning app UI polish - 2026-11-04

- Approved scope: compact practice header and one boat/count route; persistently reachable Hint beside Check; focused island screen replacing the dashboard/map while exploring; readable whole-map phone overview with page scrolling at fit; concise outcome, combined gold and one learning goal; correct map return and retained island/list context.
- Preserve the cream/teal/gold palette, otter, original diagrams, three worked hint steps, learning selection, gold rules, Doctor/Professor logic, draft saves and all existing child history. No database, content-publication or deployment changes.
- Implemented locally. Compact practice header and boat route bring the question higher; Hint and Check remain in the action bar. Exploring an island shows only that island and its selectable skills. Feedback combines gold into one amount and shows one learning goal. Returning to the map preserves the island/list context; Home/resume retains typed answers and revealed hints. Navigation waits for draft saving and remains on the question if saving fails.
- Coordinator: gpt-6.1-sol, high reasoning. Implementation worker: gpt-6.1-sol, high reasoning. Independent critic: gpt-6-astra, high reasoning.

- Verification: **176/176 tests passed**, TypeScript, ESLint, production build and deployment trace/private-file checks passed. Added navigation/save-failure and focused island regressions. Chrome checks covered 320 × 740, 390 × 844 and desktop layouts, direct skill selection, assisted answer/continue, typed answer + hint restoration after Home/resume, list return, all three competition maps and five-task treasure completion. No horizontal page overflow in the checked layouts. Tests used disposable learner data; all **13 private history/backup hashes** remain unchanged.
- Independent gpt-6-astra review found no remaining functional blockers after correcting draft-loss handling and 320 px header overlap. Limitation: the 17-island fit overview at 320 px clips some long labels; zoom and Themes expose full names. Physical-device keyboard and touch gestures remain unverified. No push, deployment, database or learning-rule changes.


## Optional child Google login, 2026-11-04 - implemented, rollout pending

- Parents create nickname profiles, then may add a child Google email in an optional “Самостоятелен вход” step with “Не сега”. Existing profiles can add/change/remove this login later.
- Child Google identities remain separate from parent identities. Link verified Google login to the existing child ID; child access is limited to that child, while the approved parent keeps family management.
- A private service-only email/auth-user mapping is checked on protected requests. Enforce one login per child and one child per login, reject parent emails, and revoke access when unlinked, inactive or parent approval is removed.
- Preserve all course JSON, revisions, awards, gold and the five-active-child cap. Link Ema’s supplied email to her existing hosted profile after backup; no duplicate profile or email invitation.
- Coordinator owns auth/database/integration; a bounded worker owns onboarding/profile UI, followed by an independent security review. Verify UI, authorization, migration preservation, concurrent saves and build before live rollout.

- Implemented the optional post-creation email step, skip, and parent-only add/change/remove controls. Confirmed Google identities resolve to the existing child profile, with no invitation email or duplicate profile.
- Verification: **189/189 tests passed**, TypeScript, ESLint, production build, private-file deployment checks and git diff --check passed. Disposable PostgreSQL checks cover private table/function privileges, email uniqueness, identity binding, revocation, inactive/unapproved families, and unchanged seeded course JSON/revision. Existing concurrent-save and family-isolation checks pass. Independent security review found no material authorization defect.
- Live preflight: the existing hosted course remains revision 89 with the same saved history; the child-login table is not yet present. Apply `supabase/migrations/202611040001_child_logins.sql` before deploying this code, then recheck the course fingerprint. Do not deploy ahead of this additive migration.
- Pending: live migration, production deployment, linking the owner-supplied child email to the existing profile, and a real sign-in by the child. Chrome tab automation is currently failing; the active native Chrome window is the owner's meeting, so rollout is waiting for access to the Supabase SQL Editor. No hosted progress or login mapping has changed in this step.
- Coordinator: **gpt-6.1-sol, high reasoning**; bounded UI implementation: gpt-6.1-terra, high reasoning; independent security review and authorization regression tests: gpt-6.1-sol, high reasoning.


## Island gold target audit, 2026-11-04 - decision pending

- Earned gold is unchanged: the imported course still projects 210 gold. Skill milestones pay 5 + 10 + 20; each newly solved distinct problem pays 10, or 15 when editorially marked hard. Repeated problems and overlapping source parts share one problem entitlement. Historical awards retain their recorded amount.
- The imported revision-89 course has no saved island targets. Its fallback now adds every prepared practice entitlement to the skill milestones, producing the reported large denominators (1125 / 2795 / 845 / 3370 for the first four islands). This is target recalculation, not duplicated earned gold.
- Asked the owner whether to restore legacy skill-based goals for imported courses while preserving earned gold, existing saved goals and current rewards. No reward or learner-history change made while that decision is pending.
- Deployment remains blocked on the additive child-login migration. Chrome tab controls failed; the owner has been given the exact migration file to run in the Supabase SQL Editor. Do not push the dependent code before migration success is confirmed and verified.


## Demo production release, 2026-11-04

- Owner reports the additive child-login migration completed with “Success. No rows returned” and explicitly requests immediate production publication for the demo. This supersedes the migration rollout hold above.
- Publish the verified landing, learning UI and optional child-login changes. Previous acceptance evidence: 189 tests, TypeScript, ESLint, production build and private-bundle checks passed.
- Live Supabase access checks, linking the child email and real child sign-in remain follow-up verification; user explicitly requests not delaying the demo on these checks. No learner data is changed by this release.
- Gold-target compatibility decision remains pending; this release preserves the audited reward calculations and earned history.
- Coordinator: gpt-6.1-sol, high reasoning; release executed by one agent.

- Production published: commit `d548e08`; Vercel deployment `ASWJY8z3H6o7G2xHK2Ko7PWWQs78` reported success. HTTPS `/welcome` and `/login` returned 200; the live welcome page contains the new landing copy and invitation field without a consent checkbox. Authenticated child sign-in and live database privilege checks remain unverified.


## Earned island gold - approved 2026-11-04

- Replace island gold-target fractions and bars with a coin and earned amount on both topic cards and focused islands. Keep the short adventure route/count and existing skill progress, earned awards and celebrations.
- Supersedes the pending target-display decision in the audit above. Preserve all reward calculations, stored targets, learner history and database records; this slice changes presentation only.
- Implemented: a shared earned-only component receives no maximum and does not cap the amount. Removed obsolete island bar/chest styles and the unused progress-display option.
- Verification: all 189 tests passed, including 43 UI tests covering all 17 original islands and four Olympiad islands, direct skill practice, retained awards, unchanged saved learning and earned totals above a former target. Typecheck, ESLint, production build, private-bundle audit and diff checks passed. Visual browser verification was attempted but blocked by the Chrome automation connection; production publication is pending.
- Coordinator: gpt-6.1-sol, high reasoning; one agent. User approved testing and deployment after checks pass.


## Publish all competition paths - approved 2026-11-04

- Owner explicitly requests “publish everything” after being told why production hides Олимпиада and НВО and that final human review and the 2024 Olympiad official solutions remain outstanding. This supersedes their local-only publication holds for the invitation-only pilot; it does not claim a human content review occurred.
- Publish the prepared Математика за всеки, Олимпиада and НВО paths through the existing competition dropdown, with their current difficulty badges and separate learner history. Preserve IDs, content versions, exclusions, source safeguards, rewards, saved work and authentication; no database migration or learner writes.
- Acceptance: all three paths available in hosted mode; dropdown visible on each dashboard with three working destinations; existing history isolation and unknown-ID rejection pass; tests, typecheck, lint and production/private-bundle checks pass before release.
- Verification: all 190 tests passed, including the three-way dropdown on each competition dashboard, hosted availability, separate history and invalid-ID rejection. Typecheck, ESLint, production build, pixel-preserving image generation, private-bundle audit and diff checks passed. The dropdown was exercised for all three dashboards in UI tests. Chrome automation is unavailable, so a signed-in live visual check could not be completed.
- Release: `d9e8730` pushed to `main`; Vercel deployment `7GcKNWSMVPqQxZLATDo41CkhnT88` reported success. Production URLs for all three competition IDs, `/welcome` and `/login` returned HTTP 200 without an application-error screen. These unauthenticated checks validate availability, not signed-in dashboard rendering. No learner data was changed.
- Coordinator: gpt-6.1-sol, high reasoning; one agent.

# Математически открития - agent execution plan

Approved: 2026-11-03. Owner: visible gpt-6.1-sol coordinator, high reasoning.

## Read first

- This is the standalone app in /Users/mac/ideas/maths. Do not modify the original AI study tool.
- Preserve data/, backups/, existing answers, solution steps, discoveries and awards. Never include these private folders, materials/ or credentials in Git or public deployment bundles.
- Reuse the existing deterministic educational engine and the decisions in key-decisions.md. No live AI grading, leaderboards, payments, child email accounts or self-service content upload in this rollout.
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
| 1. Host current app | locally verified; live release blocked | Browser sign-in to Vercel/Supabase, Google OAuth configuration |
| 2. Competition paths | infrastructure verified; content blocked | Obtain Олимпиада PDFs, keys, solutions and tutor links, then НВО |
| 3. Five-child pilot | locally verified; hosted verification blocked | Run live OAuth, cross-device and family checks after stage 1 setup |
| 4. Landing/invitations | locally verified; publication blocked | Owner-approved public contact, live hosted invitation check |

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
- Add Олимпиада first, then НВО. Obtain missing PDFs, answer keys and tutor video links before preparing those collections.
- Content pipeline: archive sources/transcripts privately; extract original text/figures; verify answers; map skills; prepare exact three-part worked solutions, fresh practice and harder variants; record provenance; review before publication.
- Acceptance: full learning flow works within each published path; switching never mixes or discards work; every published answer and explanation has been checked.

## Stage 3 - five-child pilot

- Extend the existing parent/profile flow to approved families, with a global maximum of five active child profiles.
- Keep each child's attempts, discoveries, confirmations and awards independent per competition.
- Provide a concise parent summary and a way to report unclear problems.
- Verify shared-device profile switching, multiple families and concurrent sessions. Collect feedback on clarity, navigation and willingness to return.
- Acceptance: five children can learn independently without exposing or overwriting another child's history; concurrent creation cannot exceed the cap.

## Stage 4 - landing page and invitation requests

- Create a Bulgarian parent-facing page matching the app, with real screenshots and accurate supported-content descriptions.
- Include Заяви покана and Вход. Collect only parent email plus submission consent; handle duplicates and basic abuse.
- Requests are private and manually reviewed. Submission grants no access. Keep additional families waiting until the owner separately approves expansion beyond five children.
- Include accurate contact details and concise privacy information; ask the owner for public contact identity before publication.
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
2. Owner reports Vercel and Supabase accounts are available through GitHub. The accessible Chrome sessions still show sign-in; Vercel GitHub login reaches the GitHub credential screen. Browser login and Google OAuth configuration remain pending. Sign-in tabs have been left for the owner. No external projects, costs, terms acceptance or deployments were created.
3. Public contact email for the landing page is pending. `MATHS_CONTACT_EMAIL` is documented in `.env.example`; do not invent an address or open public invitations without a real contact.
4. Only „Математика за всеки“ 2024-2026 sources are present. Request the owner's folder path or supplied PDFs/keys/solutions/video links for Олимпиада, then НВО, before preparing new content.
5. After access is ready: create/configure only free projects, set exact callback URLs and production-only secrets, apply migrations in order, approve only the owner family, create the child profile, preserve a backup, run the guarded history import, and verify HTTPS/OAuth/cross-device resume/family isolation. Then verify a private invitation request before approving more families.

Operational details: [deployment and recovery](docs/deployment.md); [content intake and review](docs/content-workflow.md). These are local implementation results, not a claim that the app is deployed or that new collections are available.

Deployment preparation update, 2026-11-03:

- Owner selected the public GitHub repository above; the local `origin` targets only that repository. Initial source commit `efb0576` was pushed successfully to `main` on 2026-11-03.
- Re-ran `npm test` (89 passed), `npm run typecheck`, `npm run lint` and `npm run build`: all passed. Build trace and standalone private-file checks passed.
- Reviewed 132 source candidates before this status update, including the landing screenshot. Credential-pattern checks found no private keys, service secrets, GitHub tokens or JWTs; detected email addresses are test/documentation examples. Confirmed `data/`, `backups/`, `materials/`, `.env.local`, `node_modules/` and `.next/` are ignored.
- `positioning.md` records the approved short positioning plan. The app name and candidate domain are unchanged; no domain purchase is authorized.
- GitHub authentication for deployment providers does not configure the application's parent Google login; that OAuth setup is still required.

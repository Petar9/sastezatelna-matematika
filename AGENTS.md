# Agent instructions - Състезателна математика

## Quality standard for every task

Make the app's purpose clear, its steps simple, and learning enjoyable. Use Linear / Apple Notes as a standard for clarity and polish while preserving the child-friendly cream, otter and island identity.

- Keep purpose, architecture, design and implementation simple. Remove repeated copy, unnecessary controls and unused code within the approved change; fix confusing layouts before adding explanations.
- Keep teaching hints, visible accessible labels and useful error/recovery messages. Minimalism must preserve understanding, mathematical meaning and accessibility.
- Write short, concrete Bulgarian that makes the next action clear. Treat “simple steps make learning fun” as a direction, not a tagline to repeat.
- Consider the child using it, the developer maintaining it and the next agent changing it. Prefer existing patterns, clear boundaries and one authoritative home for each rule; do not introduce abstractions for hypothetical needs.

## Working agreement

- Inspect relevant instructions, code, tests and current state before editing. Work in this standalone app; preserve the original AI study tool and unrelated user changes.
- Follow approved decisions. Ask one focused multiple-choice question for a material unresolved design, behavior, data or release decision before dependent work; continue independent work. Do not reopen settled decisions.
- Preserve learner history, saved work, rewards and family isolation. Keep credentials, `data/`, `backups/` and `materials/` private; use disposable learners for checks. Never fabricate source verification or completed human review.
- Use bounded parallel workers only when authorized and independently useful; one owner integrates and verifies the result. Runtime instructions govern model choice and team limits.
- Never push or open a PR before the owner approves in the conversation. Run each check once per candidate version, choose extra verification by what changed, and give the owner a persistent localhost build for application changes; see the [release workflow](docs/deployment.md#release-workflow).
- Verify proportionately to the change. Report evidence and limitations; a local build is not a verified deployment. Record completed work briefly in `plan.md` (a local, untracked file; update it without a commit or push), update the affected authoritative guide, and archive lengthy evidence instead of growing mandatory reading.

## Verify the review baseline

Before reviewing current behavior, record the checkout path, commit and verification date, and establish its relationship to production using the [release verification procedure](docs/deployment.md#verify-a-release-and-reconcile-local-work). A local documentation commit is not a deployed application revision. Missing features in an unverified checkout are unconfirmed findings, not proof of a production defect.

Separate confirmed defects, already-shipped behavior, approved product policies and proposals needing approval. Check the authoritative guide before recommending a policy change; do not reopen an approved decision as a bug. Identify source findings, observed behavior and inferences separately. Preserve dirty checkouts and compare them only to identify work worth retaining. See the [stale-checkout correction](docs/reviews/production-audit-2026-11-27.md#critical-review-correction---2026-11-27).

## Independent copy review before testing

For every new or expanded competition, new page or article, and substantial copy revision, complete this gate after drafting and before acceptance/regression testing:

1. Use an independent reviewer running a current frontier model, separate from the agent that drafted the copy. Give it the changed files, intended audience, sources, approved wording and previous owner decisions. Critically review all visible Bulgarian: descriptions, headings, controls, hints, solutions and messages, as applicable.
   If no independent frontier-model reviewer is available, report the review as pending; never present a self-review as independent. Earlier records name `gpt-6-astra` (Astra); they remain valid history.
2. Keep every suggestion in the current conversation/terminal task context as well as the linked review record, so a later chat reply can resolve it without reopening the files or repeating the question. Accept the owner’s answer here in the conversation as approval or rejection of the clearly identified pending suggestions; update their status and proceed without asking again. Present the owner with each hesitation: location, current wording, concern and recommended replacement. Wait for approval before applying copy proposals; explicitly report when no changes are recommended. Preserve original competition statements and mathematical meaning; propose clarifications separately.
3. Save the review context, reviewer/date, proposals and owner approvals/rejections in the collection review record or a linked task review note. Retain approved exceptions so future agents do not reopen settled wording. An agent review does not replace required human source/content verification.
4. Apply approved changes, then run the required acceptance tests and release checks. Material copy changes after approval repeat this gate for the affected text. If the independent review or owner decision is pending, report it as pending; do not skip the gate or claim readiness.

## Read only the guidance relevant to the task

| Task | Guidance |
| --- | --- |
| Current work, outstanding checks or release status | [plan.md](plan.md) (local only, not in Git) |
| Education, content selection, progress or account behavior | [key-decisions.md](key-decisions.md) |
| Gold, points, reward rates, eligibility or reward history | [Gold and rewards](docs/points.md); distinguish active policy from pending proposals |
| UI, components, interaction or copy | [Design system](docs/design-system.md); inspect `components/ui` and the development-only `/design-system` catalogue |
| Adding or expanding competition content | [Competition checklist](docs/content-workflow.md) and the collection's review record |
| SEO, GEO, public articles or acquisition strategy | [SEO/GEO strategy](seo-geo.md) |
| Deployment, migrations, backups or recovery | [Deployment guide](docs/deployment.md) |
| Local setup and repository structure | [README](README.md) |

Historical archives linked from the current documents are evidence, not instructions to replay. Do not read the full archive by default. Keep each rule in its authoritative guide and link to it; do not create overlapping instruction files.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

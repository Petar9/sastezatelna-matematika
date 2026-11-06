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
- Verify proportionately to the change. Report evidence and limitations; a local build is not a verified deployment. Record completed work briefly in `plan.md`, update the affected authoritative guide, and archive lengthy evidence instead of growing mandatory reading.

## Read only the guidance relevant to the task

| Task | Guidance |
| --- | --- |
| Current work, outstanding checks or release status | [plan.md](plan.md) |
| Education, content selection, progress, rewards or account behavior | [key-decisions.md](key-decisions.md) |
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

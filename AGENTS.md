# Agent instructions — Математически открития

Read plan.md before work; it is the canonical approved staged rollout. Read key-decisions.md before changing education or progress behavior.

- Work only in this standalone application. Preserve the original AI study tool and all existing learner history.
- Follow the agent execution protocol in plan.md. Ask focused multiple-choice questions for material unresolved decisions before dependent work; continue independent work.
- Update stage status, checks, evidence and blockers in plan.md after each completed slice. Never call a local implementation a verified deployment.
- Keep credentials, data/, backups/ and materials/ private. Never fabricate reviewed competition content or reset progress.
- Use bounded parallel workers only where useful; the visible coordinator owns integration and final verification.
- Before changing Next.js code, read the relevant installed guides in node_modules/next/dist/docs/; installed Next.js APIs may differ from memory.

## UI development

- Before every UI change, read [docs/design-system.md](docs/design-system.md) and inspect `components/ui` and the development-only `/design-system` catalogue.
- Reuse first; extend an existing component when the semantic need fits. If a real reusable gap remains, create the smallest complete shared component, document its contract/states/accessibility and add a gallery example in the same change. Keep one-off layouts local and specialist educational/map patterns in their domain components.
- Use shared semantic tokens; preserve cream/otter/islands, dark-teal actions, blue learning progress and gold rewards. Ask the owner before material new design or interaction decisions.
- Verify keyboard/focus, error/loading/disabled states, long Bulgarian text, mobile/desktop, reduced motion and fixed learning actions where affected. Preserve all educational rules/history; use isolated fixtures for visual checks. Record evidence in plan.md.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

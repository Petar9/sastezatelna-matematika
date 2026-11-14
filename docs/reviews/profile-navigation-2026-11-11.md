# Profile and app navigation review - 2026-11-11

## Approved scope

The owner approved the rendered cream/teal profile and navigation POC, then requested implementation using the existing design system. Latest clarification: show the menu icon without visible „Меню“ copy; preserve its accessible name. No production publication was requested for this iteration.

Use a prominent child-profile entry, quiet rename/share tools with exclusive draft-preserving panes, lazy sharing reads and one shared top-right navigation disclosure. Preserve owner-only sharing, API authorization, the exact sharing message, profile privacy guidance, feedback wording, rewards and learning flows. Course navigation/logout must save pending answers before leaving and retain the task on failure.

## Independent Bulgarian copy gate

- Reviewer: worker `astra_product_copy_gate`, explicitly configured model **gpt-6-astra**, high reasoning, 2026-11-11.
- Context: actual app AGENTS.md, design-system and child-sharing guides; approved POC/navigation choices; changed profile, navigation, feedback, progress and parent-task files; exact API sharing-message template.
- Audience: Bulgarian children and their parents/family. Review copy and consistency without changing original mathematical content or reopening approved choices.
- Result: **no Bulgarian copy changes recommended; no pending wording proposals**. Keep „Име на детето:“ / „Запази“, approved navigation labels and existing privacy/feedback/share text. Result was retained in the conversation before acceptance testing.
- The independent reviewer inspected source/copy, not rendered layouts. A separately named older navigation worker was not used as evidence of a verified Astra model.

## Implementation and verification

Reuse Button, Input, Message, Dialog, shared tokens and rounded ActionIcon strokes. Add AppHeader/AppMenu and ProfileCard product patterns; no new component framework. Navigation uses ordinary links, not ARIA menu roles, following the [WAI disclosure-navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/).

- Application tests: 375/375 passed, including menu dismissal/current-page semantics, lazy sharing reads, preserved rename/email drafts, shared-user control boundaries and pending-answer navigation/logout success/failure.
- Real Chrome local checks: desktop and 390/320px profiles/menu; long names/emails wrap without horizontal overflow; 48px menu and 44px profile tools. Normal Tab order and Escape-to-trigger restoration checked; feedback opens with textarea focus and closes/restores the menu trigger. Email-removal cancellation checked without a mutation.
- Final TypeScript and ESLint checks and optimized production build passed, including private-file trace checks; `git diff --check` passed.
- Disposable-data production server returned 200 for `/`, `/progress` and `/profiles`, and 404 for the development-only `/design-system`. Actual task navigation at 320px fits without horizontal overflow; its menu remains inside the viewport. The temporary production server was stopped after verification.

Local checks use the synthetic catalogue and isolated local preview, not real Google sessions. Real owner/shared Google accounts and physical-device behavior remain owner smoke checks. No Supabase migration or real learner write; no deployment.

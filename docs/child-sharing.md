# Shared child access

The owning parent adds a Google email to the existing child through one “Сподели достъп” section. There is no adult/child choice and no new invitation acceptance: the recipient signs in normally with that Google account. No automatic email, duplicate learner or global allowlist entry.

- Everyone with access can learn, resume, view progress and rename the child. Only the original owner manages access. Other children remain private.
- New grants can precede the recipient’s first login. Bind them once to a confirmed Google identity whose verified email matches. A different account later reusing the email cannot inherit an already-bound grant.
- Recheck access on every protected request. Keep actor identity separate from the child’s original owner; preserve IDs, course rows, revisions, drafts, rewards and history. Reject stale concurrent saves.
- Preserve existing child logins and accepted adult memberships. Existing pending seven-day invitation links keep their expiry and acceptance rules; migration alone never accepts them. An explicit new grant replaces a matching pending link. Removing an email removes its connections across all three stores and cancels matching old links, so replay cannot restore access.
- New tables and RPCs are service-role only, with RLS and no browser-role privileges. Add/remove verify the approved active owner; resolution verifies Google identity and the active approved family. Sharing endpoints require same-origin authenticated requests.

## UI and approved message

One “Google имейл” field and “Добави достъп” action. Compact email rows use the approved quiet-outline action: a red rounded-stroke X, 44px target and email-specific accessible name. Clicking it opens “Сигурен ли си, че искаш да спреш достъпа на {email}?”; only the primary “Да” submits removal. The neutral top-right X or Escape cancels and restores trigger focus; the backdrop does nothing. While saving, prevent duplicate requests and dismissal. A failed removal keeps the row and dialog for retry; success closes the dialog and focuses the access heading, including after removing the last email. A failed refresh after accepted removal must not invite another removal.

After a successful add, the owner receives this exact approved message, using the child’s current name and the canonical production `/login` URL:

> Здравей направих ти профил в Състезателна математика за {name}. Можеш да влезеш с гугъл профила ти оттук {link}.

The outline icon with two overlapping rectangles copies the message; its accessible name is “Копирай съобщението”. A temporary matching rounded-stroke tick and a live announcement confirm success. Clipboard failure focuses/selects a read-only textarea for manual copying. No invitation token or private identifier enters the link.

## Copy review

2026-11-08: independent `gpt-6-astra` reviewed the Bulgarian changes in `components/child-sharing.tsx`, `components/onboarding.tsx` and `app/api/sharing/route.ts` against the approved behavior and design system before regression testing. No changes or optional wording suggestions were recommended. The exact share message is owner-approved. No pending copy decision. Legacy invitation copy was unchanged and retains its 2026-11-07 Astra review.

The same day, an independent reviewer configured as `gpt-6-astra` reviewed the three action-control prototypes and exact confirmation wording before acceptance tests. No Bulgarian changes were recommended. The owner accepted all three options in chat and the visual review, delegated selection, and approved the quiet-outline option A. No pending wording proposal. The share message remains unchanged.

## Local verification - 2026-11-08

- Latest action-control acceptance: `npm test` 363/363, TypeScript, ESLint and optimized production build/private-file checks pass. Chrome actual-component/CSS fixtures at 320/390/1440px confirm wrapping, no overflow, 44px controls, native modal opening, initial/cancel/success focus, keyboard cancellation, error/retry and copy/manual fallback. No API, auth or database changes in this UI iteration.
- Previous unified-access regression: `npm test`: 361/361 passed, including API/context/UI behavior, owner-only management, shared rename/report access, duplicate prevention, copy/fallback, failure recovery and daily competition accordions.
- `bash scripts/test-database.sh`: all migrations and SQL assertions pass against disposable PostgreSQL 14/Supabase auth stubs. Fixtures roll back. Covered unregistered emails, verified Google binding, spoofed/unconfirmed/non-Google identities, cross-family/sibling isolation, changed/recycled emails, legacy connections, pending links, revocation/replay, inactive/unapproved families, service-only privileges and byte-for-byte unchanged course records.
- TypeScript, ESLint, whitespace checks and the optimized production build/private-file checks passed. Chrome checks on the actual component/CSS fixtures at 320/390/1440px confirmed no horizontal overflow, wrapping long emails, 44px icon targets and the manual-copy fallback; no console errors were present. Daily accordions were checked at these widths and with keyboard/reduced motion.
- Owner reported both manual production migration queries succeeded on 2026-11-08 after explicitly waiving the backup; this is owner-reported evidence, not an independent production database inspection. The exact split transactions and the atomic source migration passed disposable PostgreSQL checks, including malformed/whitespace email rejection.
- Local/component/database tests do not establish real Google OAuth or physical-device continuity. Live release evidence belongs in [plan.md](../plan.md#current-release).

## Before release

1. Preserve a private backup. Apply `202611070001_child_sharing.sql`, then `202611080001_email_access.sql`, before dependent application code. Verify original owner/child/progress records are unchanged and browser roles have no new table/RPC access. Existing published code remains compatible with the additive schema.
2. Complete TypeScript, lint, production build/private-file checks and mobile/desktop UI checks. Publish only after the database migration is confirmed; verify the exact deployed commit and live endpoint protections.
3. Use two real Google accounts for the final owner smoke test: add the intended email, sign in normally as that recipient, resume the same child and inspect history/hints/gold/calendar/draft on both devices. Confirm owner-only management, sibling isolation, rename, revoke on next request and unchanged existing logins. A stale concurrent save must not overwrite newer work.

## Historical release

2026-11-07: owner approved and reported applying `202611070001_child_sharing.sql`. Application `9f37c4e` deployed successfully after 342 tests, TypeScript, lint and build checks. This was the earlier seven-day invitation flow; its release did not create new memberships. Current release evidence belongs in [plan.md](../plan.md#current-release).

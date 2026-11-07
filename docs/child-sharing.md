# Shared child access

The owning parent enters an adult’s Google email and manually shares an email-bound, single-use link, valid for seven days. The recipient signs in with that Google account and opens the existing child profile directly. No automatic email, duplicate learner or global allowlist entry.

- Shared adults can learn, resume, see progress and rename the child. Only the owner manages invitations, connected adults and optional child Google login. Other children remain private.
- Invitations store only token hashes. Acceptance is an authenticated same-origin POST; visiting or previewing a link does not grant access. Wrong-account and transient failures preserve the invitation.
- Keep actor identity separate from each child’s owner. Recheck membership on every protected request. Preserve course rows, revisions, drafts, rewards and history; concurrent stale saves must fail rather than overwrite.
- Review Bulgarian independently with actual Astra, present any proposed changes in chat for approval, then run focused security/continuity tests, regression checks and local UI review.
- Local review first. Production migration, publication and deployment require separate release approval.

## Local verification - 2026-11-07

- Full regression: `npm test` passed 342/342 tests. `npm run typecheck`, `npm run lint` and `npm run build` passed, including the private-file tracing check.
- Applied all migrations to a disposable PostgreSQL 14 database with minimal Supabase auth stubs; `psql -v ON_ERROR_STOP=1 -f tests/sql/child-sharing.sql` passed. Its fixtures roll back. Covered identity/email checks, ownership and sibling isolation, multiple owners, expiry/cancellation/reissue, accepted-request retries, revocation/replay, role collisions, inactive/unapproved families, service-only privileges and unchanged saved progress.
- Component/API tests cover lazy loading, duplicate submissions, copying/cancelling/revoking, error recovery, fragment removal, Google account switching, hashed tokens, same-origin checks and existing child selection. Browser layout checks used synthetic component fixtures with the app CSS/font at 320, 390 and 1440px; no horizontal overflow, including long emails and links. These are not a real Google authentication test.
- Built local HTTP checks: `/invite` returns 200 with no-store, noindex/nofollow and no-referrer; GET acceptance returns 405. Hosted sharing APIs remain disabled in local mode.

## Before release

1. Obtain release approval; preserve a private backup and apply `202611070001_child_sharing.sql` before deploying its dependent application code. Existing child, owner and progress IDs stay unchanged. Do not grant table/RPC access to browser roles.
2. In a controlled hosted environment, use two real Google accounts: owner creates and manually shares a link; wrong account can switch; intended adult accepts and resumes the existing child. Confirm same history, hints, gold, calendar and draft on both devices; a stale concurrent save must not overwrite newer work.
3. Confirm shared adults can rename but cannot invite, revoke or change child login; siblings stay private. Revoke from the owner, then check the other adult's next read/write is denied and the old link cannot restore access. Also smoke-test normal parent and optional child login.

2026-11-07: owner explicitly approved publication/deployment and reported that the production migration completed with “Success. No rows returned.” Release regression repeated: 342/342 tests, TypeScript, ESLint and production build/private-file checks passed. Production deployment verification and real-account cross-device smoke tests remain pending.

## Copy review

2026-11-07: `gpt-6-astra` reviewed the invitation, access-management, error and onboarding copy against the implementation and design system. No changes recommended; no pending copy decisions. Source review only; browser and authentication verification are separate.

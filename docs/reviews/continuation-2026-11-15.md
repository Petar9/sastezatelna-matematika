# Continuous competition practice - 2026-11-15

## Approved scope and cause

The owner approved immediate recovery when fresh content runs out, followed by an unlimited “Започни отново” option. Preserve progress, history, saved work, rewards, exact-skill scope and delayed-review evidence. The regional-hints production release `b8257a8` explicitly excluded this change; the old selector blocked recent repeats for two days. Preparation percentage is unchanged and does not gate practice.

## Independent Astra review

Actual `gpt-6-astra`, high reasoning, read-only independent review (`astra_continuation_review`) completed before final acceptance. It recommended no Bulgarian copy changes to “Да си припомним” or “Започни отново”; no copy proposals remain pending.

The reviewer found two integration issues: manual fallback feedback could be removed because practice mode differed from its storage slot; a connected repeat crossing the fifth step lost its practice-session marker. Both are fixed and covered by dedicated tests. Current work is found by attempt identity, and restored practice continuations retain the session marker and recovery/repeat availability.

The owner subsequently supplied the exhausted-state replacement in chat: “Всички задачи от това състезание са решени.” (corrected the obvious typing error “репени”). Applied directly as owner wording, without introducing a new copy proposal.

## Acceptance

- Fresh tasks and due reviews retain priority; immediate fallback does not change scheduled review dates.
- Recovery selects unresolved outcomes first, then least recently attempted work; reservations and source identities remain protected.
- Exact-skill, island, challenge, review and Professor practice retain feedback and can continue; connected parts survive session boundaries.
- Restart retains history, awards and wallet; repeats do not create fresh mastery evidence or duplicate gold. Previously unpaid entitlements may be earned once under existing policy.
- All five published catalogues are tested with synthetic exhausted histories; no real child records are changed.

## Verification

- Full regression: `NODE_ENV=test node --import tsx --test tests/*.test.ts tests/*.test.tsx` passed 397/397; TypeScript, ESLint and `git diff --check` passed.
- Fresh optimized production build passed, including deployment-trace/private-file audit. No database migration.
- Production-build Chrome smoke at 320px: exhausted regional catalogue shows enabled “Да си припомним”; correct answer retains feedback and “Следваща задача” immediately opens another task. Exhausted independently solved NVO catalogue shows “Започни отново” and starts unanswered practice. Desktop 1280px and mobile have no horizontal overflow; browser error console is empty.
- All five catalogues use synthetic same-day history in tests; dedicated tests cover wrong/helped recovery, preserved history and rewards, saved reservations, exact-skill/manual modes, connected parts across five-step sessions and repeated restart. Browser fixtures are disposable local records, not the real child's 57% profile.
- Production publication and exact-commit checks are pending. Real authenticated child-session verification remains an owner smoke check; no learner records are changed by this release.

# Accomplishments - 2026-11-14

## Owner-approved plan

The owner selected all four additions, calendar counting, aggregation across competitions per child, once per record type per day from the second active day, one combined native dialog, first independent multipart completion per original, every qualifying scheduled review, appreciation without extra gold, and existing dated history as the baseline. The owner then approved the reviewed copy and requested implementation. No deployment is authorized.

An active day contains a completed attempt, including unsuccessful attempts, in Europe/Sofia. Correct independent and assisted calendar task/subpart units count; incorrect and revealed solutions do not. Daily totals must strictly exceed the best earlier day. Invalid/missing dates do not establish a day or record. Future eligible answers can recognize a record; GET, refresh and resume do not backfill celebrations. A daily claim is consumed when issued in a successful answer response, not on dismissal; a lost response does not replay it.

Whole-original recognition requires every connected part to be independently correct in the completing run and no earlier verified independent completion of that original. Reaching its last part alone is insufficient. A scheduled review qualifies only when that skill was due before the independent review answer. Existing hint-to-fresh-independent recognition remains unchanged.

## Independent copy review and owner decision

Actual model: `gpt-6-astra`, high reasoning, independent read-only worker `/root/accomplishments_copy_review`, 2026-11-14. It inspected the existing dialog, calendar counting, connected handling and relevant learning/reward/design guidance; no private learner data, edits or tests were involved.

Only proposal, presented in the conversation:

- Location: scheduled-review appreciation in `components/personal-progress-dialog.tsx`.
- Draft: „Спомни си как се решава и се справи самостоятелно. Браво!“
- Concern: infers an unobserved mental process and omits the review context.
- Replacement: „При преговора реши задачата самостоятелно. Браво!“
- **Owner approved the replacement and all other messages in the conversation before implementation/testing. No pending proposals.**

Astra recommended no changes to these approved messages:

- Title: „Личен напредък!“; button: „Продължи“.
- Existing: „Миналият път реши този тип задача с подсказка, а сега самостоятелно. Браво!“
- Daily tasks: „Нов личен рекорд! Днес реши {N} задачи - най-много досега за един ден.“ Singular: „1 задача“.
- Daily gold: „Нов личен рекорд! Днес събра {N} злато - най-много досега за един ден.“
- Whole original: „Реши всички части на тази задача самостоятелно. Браво!“

## Implementation and verification

Implemented locally. Local claims use exclusive file creation in the local learner wallet; hosted claims use a service-only table with a child/day/type primary key. The hosted migration is supplied for a future release, not applied to production. Recognition failure cannot reject an already-saved answer. Learning history and gold amounts remain authoritative and unchanged.

Acceptance completed with disposable learners only:

- 164/164 relevant tests passed across accomplishments, learning retention, connected problems, HTTP, hosted storage, course UI, gold, core course, progress and progress UI. Coverage includes strict records from the second active Sofia day, ties, calendar subparts, dated gold, shared competition totals, wrong/revealed outcomes, multipart history and saved navigation slots, due/early/assisted reviews, learner isolation, claim persistence/concurrency, failed saves and lost-response reconciliation without replay.
- TypeScript, ESLint and whitespace checks passed. The optimized production build passed, including standalone/private-file trace checks; the final navigation-slot correction was included in the last build and 164-test run.
- Applied the supplied migration in a disposable PostgreSQL 14 cluster. Two simultaneous inserts produced one claim; authenticated reads were denied, the owner-child foreign key rejected a mismatched parent, and RLS was enabled. The cluster was stopped and removed. No hosted/production migration was applied.
- Chrome verification used the production build at http://127.0.0.1:3041/?competition=olimpiada with data under `/private/tmp/maths-accomplishments-preview/data`. Completing the final part of a real three-part Olympiad problem produced one dialog: whole-original learning appreciation first, then task and gold records. Gold stayed at the existing awarded total of 90.
- Desktop 1440×1000 and true mobile 320×640 rendering were inspected. The mobile dialog fit within the viewport, had no horizontal overflow, exposed the complete accessible description, and focused Continue. Dismissal retained correct-answer feedback; reload/GET returned no appreciation and opened no dialog. Screenshots: `/private/tmp/maths-accomplishments-preview/desktop.png` and `/private/tmp/maths-accomplishments-preview/mobile.png`.

Local acceptance is complete. No production deployment or real learner data changes. Hosted daily records require the supplied migration as part of a separately authorized release.

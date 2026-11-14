# Calendar and approved application release - 2026-11-14

Owner approved implementation and production publication of calendar day dialogs and the previously approved profile/navigation, incorrect-answer copy and personal accomplishments. The unfinished long landing page remains excluded.

## Implementation

- Shared responsive native dialog: full-width bottom sheet below 600px, centered desktop dialog, fixed date/close header, independent scrolling, safe-area padding and reduced motion.
- Calendar days open only on activation. Focus starts on the date, Escape/Close restores the date trigger, background scrolling is locked while open, and the selected highlight remains. Backdrop clicks do not close it. Reopening remounts the dialog and resets both scroll position and disclosures.
- Existing daily metrics, competition/skill breakdown, filters and wording are reused; opening a day does not write learning history.

## Validation

- Full application suite: 387/387 passed. Calendar suite: 15/15 passed again after the reopen fix. TypeScript, ESLint and whitespace checks passed.
- Fresh optimized production build passed, including deployment trace/standalone private-file checks.
- Disposable PostgreSQL harness passed migration preservation, role restrictions, family ownership constraints, positive amounts, allowed kinds and concurrent daily-claim deduplication.
- Browser checks on a disposable local learner: 320px and 390px mobile, 1280px desktop and 640×450 narrow desktop; no horizontal overflow, correct initial date focus, trigger focus restoration, fixed header while details scroll, empty day and independent disclosure behavior. Physical devices were not tested.
- Owner applied the additive daily_accomplishments SQL migration and reported success. Read-only hosted metadata confirmed RLS enabled; six columns, one primary key, one family foreign key and two check constraints; no anonymous read or authenticated browser write; service-role write allowed. No real learner answers were submitted during verification.

## Release isolation and rollback

Release checkout: /private/tmp/maths-release-20261114, based on 6eb3f3cde074832878dff6c7212dce5bbe7bd536. Landing component/styles, invitation tests, landing plan and SEO guide match that baseline byte for byte; the draft invitation form and landing assets are absent. Local draft files in the original working copy are preserved.

If application rollback is needed, redeploy the baseline revision and retain the additive daily_accomplishments table. Production deployment identity and live verification are recorded after publication.

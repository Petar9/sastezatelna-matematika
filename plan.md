# Current work - Състезателна математика

Reconciled 2026-11-27 against remote `main`, exact-commit Vercel status and read-only live checks. [Audit, local comparison and verification limits](docs/reviews/production-audit-2026-11-27.md). Earlier delivery entries are preserved in the [dated status archive](docs/archive/status-2026-11-27.md); they are historical evidence, not pending instructions.

The later critical review used the stale original checkout; its conflicting findings are corrected in the [dated review correction](docs/reviews/production-audit-2026-11-27.md#critical-review-correction---2026-11-27). The review-baseline rule is now in `AGENTS.md`. This documentation update implements no proposed reward, UI or measurement changes.

## Current release

- Production: https://sastezatelna-matematika.vercel.app/ . Latest verified source commit: `c79e24944e7555a66d9d4044151311b84b46cc8b` (2026-11-27, PR #1). Vercel status `success` for that commit; live `/`, `/about`, `/progress`, `/materiali` returned 200 and the new adventure subtitle is in the production bundle. Previous release: `4bf453b` (2026-11-22).
- Published product: five competitions; connected natural subparts; current gold and preparation rules; shared Google email access; shared app menu; responsive calendar/day accordions; personal accomplishments; expanded regional hints; immediate recovery/repeat sessions; contextual guide and replay; weekly adventure goal/summary and consistent distinct-error counts. Authoritative behavior is in [current decisions](key-decisions.md), [rewards](docs/points.md) and the [design system](docs/design-system.md).
- The November 27 release lets a skill needing revisit recover through unseen harder authored tasks once its core pool is exhausted (gold rules unchanged; Professor tradeoff accepted in [key decisions](key-decisions.md)), names repeat practice on the adventure home („Да затвърдим знанията си.“ / „Нека да преговорим някои задачи.“) and makes the copy review gate model-agnostic. [Review record](docs/reviews/exhausted-recovery-2026-11-27.md). The November 22 release includes gold-only precedence when daily task/gold records coincide, replay from every shared-menu page, and Next.js/ESLint plugin 16.4.6. It excludes unfinished landing/SEO drafts and changes no learner history or database schema. [Release acceptance](docs/reviews/weekly-progress-2026-11-20.md#production-release-authorization---2026-11-22).
- Existing public SEO is published: `/about`, `/materiali`, six school/competition articles, canonical metadata, robots and a nine-URL sitemap. Do not confuse this with the unpublished landing or yearly archive work. [Acquisition strategy](seo-geo.md).

## Local only and not yet verified

- New landing/product-trial UI, screenshots, US-market research and landing-copy proposal are preserved on the local branch `archive/local-wip-20261127` in `/Users/mac/ideas/maths` (the single working copy, now synced to `main`); they are not in the verified production tree. The commercial offer and billing remain unimplemented. [Landing specification](landing-page-plan.md).
- Year-by-year HTML competition archives, the 2021/2022 Maths enrichment integration and its reminder exercises, and the competition-import skill were discussed in chat, but implementation artifacts were not located in the audited source/docs. Treat these as **unverified**, not ready to publish; locate their worktree/branch and review before resuming.
- A separate arithmetic weekly/daily average is **not implemented**; the published feature is a weekly summary. The metric and denominator need a decision before coding.
- Three optional progress-copy alternatives remain deferred and excluded, as recorded in the [weekly review](docs/reviews/weekly-progress-2026-11-20.md#independent-astra-review-and-copy-context). Existing approved wording remains active.

## Outstanding checks and decisions

- Real Google owner/shared-family sign-in, cross-device continuity, physical-device keyboard/map/selector checks and the reported “Не сега” delay have not been independently reverified in this audit. Use disposable accounts before touching learner data.
- Final human source/content review and the missing 2024 municipal official solutions remain disclosed limitations; prior pilot publication approval does not establish completed review. Municipal 2023 problem 3 remains excluded; Maths 2023 M1-06/M1-17 clarification decisions remain pending. [Content checklist](docs/content-workflow.md).
- Domain ownership, Search Console/Bing verification, indexing/search demand and paid acquisition are not established by live routes. Follow [SEO/GEO](seo-geo.md) separately. Current calendar configuration is recorded in the audit; its dates were not freshly revalidated with organizers.
- Future notification/email reminders, payments and hosting changes need their own approved scope. Do not infer approval from the published learning-retention schedule or commercial draft.

## Next-work boundary

The original checkout has an old HEAD, a stale cached remote and mixed published/local changes. Do not reset it or publish its whole working tree. Start from fresh remote `main`, preserve local drafts and port only reviewed differences using the [release verification procedure](docs/deployment.md#verify-a-release-and-reconcile-local-work). Run the [independent copy gate](AGENTS.md#independent-copy-review-before-testing) for applicable new visible copy, then proportionate tests and local acceptance before any newly authorized release.

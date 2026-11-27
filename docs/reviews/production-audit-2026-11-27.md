# Production and local-work reconciliation - 2026-11-27

Scope: read-only release/source audit and documentation reconciliation. The owner approved the plan in chat. No application code, deployment, migration, provider configuration or learner data is changed. This technical record introduces no user-visible Bulgarian copy; it does not replace the Astra gate for future content/UI work.

## Verified release identity

| Evidence | Observed value |
| --- | --- |
| Stable origin | https://sastezatelna-matematika.vercel.app/ |
| Remote `main` | `4bf453b6f178244451587c19285e8cdb44a56c0a` |
| Commit date / subject | 2026-11-22 16:25:12 UTC / Record weekly product release verification |
| Application revision | `4bd115b7469a5873790a387972df38222aa0adb3` |
| Latest exact-commit Vercel status | `success` / Deployment has completed |
| Latest deployment | [Vercel](https://vercel.com/petar-s-projects33/sastezatelna-matematika/6yzhoRcZT8Ky6Um9MHPpr7qLkWYP) |
| Application deployment | [Vercel](https://vercel.com/petar-s-projects33/sastezatelna-matematika/8iRKqLbss9TBfr1meXLSoX5vThEW) |

Remote identity was read directly through GitHub, rather than inferred from a cached tracking branch. GitHub/Vercel commit status, release history and stable-origin responses together support the release identification; the anonymous site exposes no new authenticated diagnostic endpoint for this audit.

## Live checks repeated on November 27

| Read-only check | Result |
| --- | --- |
| `/` | 200; heading “Подготовка за състезания, стъпка по стъпка.” |
| `/materiali` | 200 |
| `/materiali/priem-sled-4-klas-smg` | 200 |
| `/materiali/matematika-za-vseki-4-klas` | 200 |
| `/robots.txt` | 200; API/auth disallowed; stable-origin sitemap advertised |
| `/sitemap.xml` | 200; nine canonical URLs: home, about, materials and six articles |
| `/api/kids/course` without a session | 401 and `Cache-Control: no-store` |
| `/design-system` and `/docs/points.md` | 404 |
| Homepage JavaScript assets | All ten live-referenced scripts returned 200 |
| Shipped bundle markers | `data-weekly-goal`, `maths:guide:v1:` and “Започни отново” present |

Commands: `gh api repos/Petar9/sastezatelna-matematika/commits/main`, exact-SHA `/status`, and read-only Python `urllib` requests to the listed routes and script URLs. Bundle markers confirm shipped code, not an exercised authenticated interaction. No real Google login or learner session was used.

## Published product context

- Five competitions are `published: true`: Maths 2023–2026, municipal Olympiad 2022–2025, NVO 2022–2025, Spring 2023–2026 and regional Olympiad 2023–2026. Municipal difficulty is medium, NVO easy, the others hard. Existing `draft` words in content-version identifiers are legacy names, not publication flags. Do not rename stable identifiers to tidy them.
- Connected originals show the complete statement and all natural subparts once, always visible, with the current subpart highlighted. Completed answers/solutions may collapse. Full statements do not use a disclosure. Existing answer/history contracts remain intact.
- [Gold and preparation](../points.md#current-approved-policy): future eligible default/exception rewards are easy 10/15, medium 15/20, hard 20/25; hints one/two remain fully rewarded, hint three excludes new gold. The preparation percentage is 80/10/10. Natural graded tasks and whole originals have different denominators; the [task inventory](../points.md#displayed-task-inventory) records both. No retrospective repricing.
- Direct shared Google email access, owner-only grant management, red removal confirmation and the copy icon are published. No adult/child role choice is required for a new email grant. See [access rules](../child-sharing.md).
- The shared app menu, calendar day modal, per-competition daily accordions, accomplishments and retained-learning practice are published. Calendar cells use “задачи”; distinct incorrect tasks remain separate from raw wrong attempts.
- Regional hints have three expanded steps for each of 23 natural units and 23 authored exercises. [Hint release](regional-hints-2026-11-15.md). Two authored core exercises each for NVO area units and regional growth are also published; the November 8 normal-command simulation verified confirmation/review reachability for 136/136 skills. [Retention acceptance](../learning-retention-review.md).
- Exhausted competitions offer immediate recovery, then voluntary repeat/restart sessions without waiting two days or resetting history/rewards. [Continuation release](continuation-2026-11-15.md).
- The contextual guide and replay from every shared-menu page are published. Weekly adventure goals, the weekly summary, consistent distinct-error counts, responsive progress layouts and gold-only record precedence shipped in the November 22 release. [Final release acceptance](weekly-progress-2026-11-20.md#production-release-authorization---2026-11-22).
- Existing public articles and technical SEO are already live. The six articles cover SMG, NPMG, Maths, Olympiad, Spring and NVO. This does not publish the new landing, yearly problem archive or US-market copy.

The configured schedule in `src/competition-dates.ts` contains municipal round **by 12 December 2026** (a deadline), regional **7 February 2027**, Spring **27 March 2027**, Maths **15 May 2027**, and NVO Maths **4 June 2027**. Calendar/upcoming/article links open the selected competition through `/?competition=…`. These are audited deployed values, not freshly revalidated organizer dates. Provenance remains in the [competition reference](../competition-reference.md), without restoring the owner-removed public caveat.

## Local-only work and missing artifacts

Original checkout: `/Users/mac/ideas/maths`; its HEAD is `6eb3f3cde074832878dff6c7212dce5bbe7bd536` from November 8. Its cached `origin/main` is `5f23dc0` from November 15 and is stale relative to live remote `main`. The checkout is dirty and was left untouched.

Content comparison used Git-listed tracked/untracked, non-ignored regular files against the fresh remote tree, excluding `.DS_Store`: **415 identical, 37 different and 14 local-only**. Ignored private data, source packs, credentials and build artifacts are outside this inventory. A dirty/untracked file is not evidence of an unpublished feature: much of the local implementation already matches production, while several different files are older than production.

The 14 local-only files are:

| Group | Files in the original checkout |
| --- | --- |
| Landing UI | `components/landing-trial.tsx`, `components/landing-trial.module.css`, `src/landing-trial.ts` |
| Local helper and tests | `components/invitation-form.tsx`, `tests/invitation-form-ui.test.tsx`, `tests/landing-trial-ui.test.tsx` |
| Research/proposal | `docs/research/us-market.md`, `docs/proposals/landing-page.md` |
| Local review records | `docs/reviews/landing-2026-11-13.md`, `docs/reviews/landing-product-trial-2026-11-14.md` |
| Landing screenshots | `public/landing/hint.webp`, `public/landing/progress-day.webp`, `public/landing/progress.webp`, `public/landing/task.webp` |

`components/landing.tsx` and its stylesheet also differ from production. These landing changes remain local under the owner's exclusion. The helper filenames do not mean shared account access is absent from production; that feature has its own published implementation.

Important older local differences must not overwrite production: `kids-course.tsx` lacks the later mounted-guide replay handling; selection/quest/map files lack the complete immediate-practice/restart release; local Next metadata is 16.4.3 versus deployed 16.4.6. Production also contains weekly-goal/summary modules, tests and release records absent from this older local tree. File counts are a dated comparison, not a deployment manifest.

The conversation describes yearly HTML competition archives, 2021/2022 Maths enrichment integrated into islands with reminders, and an explicit competition-import skill. No matching implementation/review artifacts were located in the audited main and original local app/content/docs inventories. Their status is **unverified / artifact not located**, not “implemented and awaiting deploy” and not proof that they were never built elsewhere. Locate the original worktree/branch/source record before planning further changes. Full private transcripts and source PDFs were intentionally not inspected in this audit.

## Pending and unverified work

- A separate arithmetic average has no implemented calculation or agreed denominator. The published weekly panel is a summary. Do not advertise it as an average.
- Three optional weekly-review copy alternatives remain deferred: calendar “С помощ”, explicit “Решени: X”/“Сгрешени: X”, and “Грешни опити без уточнена задача”. Their [exact current/proposed copy](weekly-progress-2026-11-20.md#independent-astra-review-and-copy-context) remains available for a later owner decision. Do not reopen already approved unrelated wording.
- Human source review, the absent 2024 municipal official solution key, municipal 2023 problem 3 exclusion, and Maths 2023 M1-06/M1-17 decisions remain limitations. Historical pilot approval is not evidence of completed review.
- Search Console/Bing ownership, index coverage, keyword volume and provider billing/plan configuration were not verified. The commercial price is a proposal, not evidence of validated demand or implemented payments.
- Real Google owner/shared-family flows, physical-device behavior, cross-device continuity and the reported “Не сега” latency were not re-tested. Authenticated product acceptance in prior records used disposable local fixtures; public HTTP checks do not settle these questions.

## Critical review correction - 2026-11-27

The subsequent Claude review inspected the dirty `/Users/mac/ideas/maths` checkout, then treated missing or older local implementation as current-product evidence. This conflated an old checkout with production and approved design choices with defects. The corrected review used `/private/tmp/maths-docs-reconcile-20261127`, whose local HEAD was `566d7220e6e507bfb1e8e07e98d5bbf189327d66`: a documentation-only reconciliation based on verified production source `4bf453b6f178244451587c19285e8cdb44a56c0a`, not a deployed revision. These identities are dated evidence; verify again before future implementation or release claims.

The following original findings are withdrawn or narrowed against that production source:

| Original finding | Correction and source |
| --- | --- |
| No mistakes on calendar tiles | `components/progress-calendar.tsx` renders the distinct incorrect-task count. |
| No attempt logging or learning evidence | `CourseAttempt` in `src/core/kids-course.ts` already retains the problem, answers, outcome, hint level, completion date and mode. Activity records do not by themselves establish learning effectiveness. |
| No weekly summaries or goals | `components/weekly-progress.tsx` and the weekly goal in `components/kids-adventure.tsx` are already shipped. |
| Three-part hints only for regional Olympiad | Three progressive worked parts are an established [content requirement](../content-workflow.md) with catalogue tests in `tests/kids-quest.test.ts`; the regional set received expanded explanations. |
| No report-a-problem control | `components/app-menu.tsx` already opens feedback. A more direct task-specific entry point is a proposal, not a missing-feedback defect. |
| First correct task always pays 25/30 gold | `src/core/kids-gold.ts` can award 35/40 for a new hard-competition problem including first skill milestones. The actual payout depends on eligibility and prior awards. |
| Selection policy is untestable | Selection/review tests exist; adequacy of coverage remains a review question. |

Confirmed concerns remain: skill awards have no stored paid amount and balances read current milestone constants; wrong answers still share the feedback surface and immediately show the explanation. Approved reward, help and review policies remain in [points](../points.md) and [current decisions](../../key-decisions.md), and copy review remains governed by [AGENTS.md](../../AGENTS.md#independent-copy-review-before-testing). No redesign was approved by accepting this correction.

The explanation for the three screenshot days remains an inference: no child's saved records were read. A future investigation should first prepare an owner-facing reward breakdown from an explicitly agreed data source. A child-facing breakdown is a separate UI proposal. Use existing attempt history before adding measurement; time-on-task is optional and needs a defined question because idle tabs and interruptions distort it. Separate immediate recovery practice from actually delayed reviews when assessing retention. Phone/readability and assistive-technology findings require observed checks rather than assumptions from source alone.

The owner approved this documentation correction in chat. The reusable [review-baseline rule](../../AGENTS.md#verify-the-review-baseline) requires future reviews to separate confirmed defects, already-shipped behavior, approved policies and proposals. This correction adds no application change, private-data access, live recheck or deployment; the evidence and limits above still apply.

Correction verification: 40 relative file/anchor links across the three changed Markdown files passed, as did `git diff --check`; the changed-file scope contains only `AGENTS.md`, `plan.md` and this record. Application tests were not rerun for this documentation-only change.

## Documentation reconciliation and verification

Current status is now concise in [plan.md](../../plan.md); its previous mixed local/released log is retained in the [status archive](../archive/status-2026-11-27.md). Current decisions/checklist now agree with the always-visible connected-original UI and five published competitions. Rewards record the already released NVO/regional exercises; design rules record gold-only precedence. SEO/landing docs distinguish published resources from the unpublished commercial draft. README/access wording and the deployment verification procedure match current behavior.

Documentation verification passed on November 27: **11 Markdown files, 154 relative file/anchor links, zero broken links**, exact preservation of the former `plan.md` in the archive apart from relocated relative links, Markdown-only scope and `git diff --check`. Full application tests/build were not rerun: no executable source changed. The prior release's **428/428 tests, typecheck, lint, build/private-file audit** and zero-production-vulnerability audit are **November 22 evidence**, not fresh November 27 results; three moderate development-only ESLint-chain advisories were recorded then, and no current dependency audit is claimed here.

Documentation work lives in isolated checkout `/private/tmp/maths-docs-reconcile-20261127`, based on the verified remote SHA. No push or production release is part of this reconciliation. Keep the original local landing and all learner records intact when integrating these documentation changes later.

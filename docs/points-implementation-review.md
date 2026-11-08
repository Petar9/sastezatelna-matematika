# Points implementation review - 2026-11-08

Scope: local reward prices, child-scoped browser resume and the shared preparation bar. Approved plan: [points.md](points.md). Production release approved; deployment evidence is recorded below. Owner-authorized local inspection uses an isolated historical copy; no live learner record is accessed or changed.

## Approved implementation

- Owner approved the full execution plan: six prices, existing exceptions, history protection, unchanged hints/milestones, browser resume, 80/10/10 evidence and otter UI on the competition overview and Напредък.
- Owner's latest steering: retain the percentage logic; add extra NVO problems next iteration.
- Independent core review: **gpt-6-astra (high)** identified a legacy read-only scope issue. Fixed with an immutable initial-release baseline, persisted only with an accepted command. New courses receive the current scope. No GET write or schema migration.
- Normal-command simulation: 134/136 skills confirm and later review. NVO `nvo-area-units` needs another fresh core example; regional `oli-ob-growth` needs a separate content/route decision. No free credit or denominator removal.

## Initial Astra Bulgarian review - superseded by approved refinement

Reviewer: independent **gpt-6-astra**, 2026-11-08. Audience: Bulgarian fourth graders and parents. Approved wording retained: „Напредък в подготовката“, „Решени оригинални задачи: X от Y“, „Самостоятелни упражнения и преговор“, „Затвърдени умения“ and „Напредък →“.

| Location/current wording | Concern | Recommended replacement | Status |
| --- | --- | --- | --- |
| Detailed weights: `80%` / `10%` | Fixed weights can look like progress already earned. | „до 80% от напредъка“ / „до 10% от напредъка“ | Superseded by removal of weight labels |
| Detailed original count without explanation | The bar gives partial credit, while the integer counts only whole originals. | Add only in the detailed view: „Решените подусловия се отчитат в процента. Броят показва само изцяло решените задачи.“ | Superseded: owner removed explanatory copy |
| Detailed review row: „Преговор“ | Other rows count skills; this row should name the same unit. | „Преговорени умения“ | Not adopted: owner retained „Преговор“ |
| Unavailable state: „Няма достатъчно данни.“ | Does not identify what is unavailable. | „Не можем да покажем напредъка в подготовката.“ | Deferred: unchanged state outside this revision |

Owner subsequently approved the compact, count-only panel and the exact overview heading in chat; this supersedes the first three proposals. The unchanged unavailable-state proposal remains deferred, not silently approved.

## Verification

Implementation author checks before final copy review: reward/core/selection 53/53; saved historical unpaid-work scenarios 7/7; preparation author tests 8/8. These are focused author results, not final integrated acceptance.

Coordinator regression tests have been authored for resume cookies, stale/failed saves, scope stability and both UI surfaces. Static checks passed: `npx tsc --noEmit --incremental false`, `npm run lint` and `git diff --check`. TypeScript found a missing required `partIndex` in the new draft fixture; corrected before the passing check. Local optimized build and private-file trace checks passed on 2026-11-08. Final integrated acceptance is recorded below. Production remains unchanged.

## Historical local preview - 2026-11-08

Owner requested a local build with saved child history. Copied the Ema import snapshot updated 2026-11-04T06:28:12.083Z (revision 89, 16 attempts) into a private disposable folder, separate from the repository history and Supabase. Local-only server: http://127.0.0.1:3018/; detailed view: http://127.0.0.1:3018/progress?competition=matematika-za-vseki. It shows 210 gold and 5% preparation: 5/86 originals, 5/78 confirmed skills, 0/78 reviewed skills. This older copy is not the current hosted profile.

Home, progress and the course API returned HTTP 200. Chrome rendered the overview and detailed preparation card; 1440px desktop and 390px mobile had no horizontal overflow, no broken images and no console errors; Chrome reported two font-preload warnings after mobile emulation. Source and copied-course SHA-256 hashes remained unchanged after these read-only checks. Screenshots are private beside the disposable preview. The Chrome CLI required explicit page IDs through its bridge due to a CLI/upstream compatibility error. Final integrated acceptance is recorded below; this preview is not a production release.


## Combined preparation panel - 2026-11-08

Owner approved one independent panel after calendar/day activity and before upcoming dates, only displayed percentages above zero, full-row independent accordions, three X/Y count rows without weights or helper text, and the otter card at the bottom of the overview with the exact heading „Напредък в подготовката за това състезание.“. No preparation formula or hosted-data changes.

Independent copy reviewer: **gpt-6-astra (high)**, 2026-11-08. Checked `competition-preparation.tsx` and changed usages in `progress-calendar.tsx` and `kids-course.tsx` against the fourth-grader/parent audience and the approved wording. **No changes recommended; no new pending copy proposals.** Result reported in the conversation before acceptance testing. Previous proposals are resolved or explicitly deferred above.

Local demonstration: copied historical Maths snapshot plus synthetic histories across the other four competitions generated through normal course commands. Displayed values: Maths 5%, municipal Olympiad 24%, NVO 5%, Spring 51%, regional Olympiad 42%. Private disposable directory: `/private/tmp/maths-ema-preview-20261108`; manifest records the evidence. Supabase was not queried or changed. No production deployment.


## Final integrated acceptance - 2026-11-08

- Full regression: **359/359 passed**; TypeScript, ESLint, `git diff --check`, optimized production build and private-file trace checks passed. Updated stale reward and cookie fixtures to the approved prices and browser-resume behavior; focused checks passed before the full run.
- Real Chrome at 1440, 390 and 320px: five competition rows, collapsed initial state, independent Enter/Space activation, multiple open rows, visible keyboard focus, three count-only detail rows and no horizontal overflow. Selecting NVO changes the calendar/upcoming list while all five preparation rows remain visible.
- Overview card appears immediately before the footer, after the map, with the approved heading and without solved-original helper text. Reduced-motion emulation disables the otter, track and chevron transitions. No runtime console errors; two existing font-preload warnings appeared during overview/mobile navigation.
- SHA-256 fingerprints of disposable history files were unchanged across read-only browser checks; the archived Maths source hash also matched. The Maths snapshot is historical; the other four histories are synthetic, not real child results.
- Local preview: http://127.0.0.1:3018/progress and http://127.0.0.1:3018/?competition=matematika-za-vseki. No Supabase access, migration, commit, push or production deployment. Physical-device checks were not performed. The two previously documented content coverage gaps remain outside this UI revision.

## Final counter, spacing and badge revision - 2026-11-08

Owner approved task counts per separately graded natural subpart, the label „Задачи от състезания“, 24px map/card separation, diploma/seal Doctor and graduation-cap Professor artwork, and calendar cells „1 задача“ / „N задачи“. Whole-original percentage weighting and all earning rules stay unchanged. Municipal 2023 problem 3 remains excluded because its condition is incomplete; no invented twelfth source.

Independent reviewer **gpt-6-astra (high)** reviewed the approved calendar and preparation labels before acceptance testing on 2026-11-08. **No additional copy changes recommended.** Singular is used only for exactly 1; all other counts use „задачи“. Existing detail labels remain unchanged. Result reported in the conversation; no pending copy proposals. Final verification and release evidence follow below.


### Final revision acceptance

- 360/360 regression tests passed, including exactly 76 independent plus 4 hinted successes displayed as „80 задачи“, singular/plural, distinct natural-task counting, repeated/assisted evidence and unchanged original-weighted percentages. TypeScript, ESLint, optimized production build/private-file trace checks and whitespace checks passed.
- Real Chrome: desktop keyboard Enter/Space opens rows independently with visible focus; all five expanded rows fit at 320px. Displayed task counts: Maths 5/102, municipal 5/21, NVO 6/108, Spring 20/38, regional 9/23. Percentages remain 5/24/5/51/42. Overview at 390px has exactly 24px map/card separation and no horizontal overflow.
- Visually inspected earned/unearned Doctor diploma/seal and Professor cap in the development catalogue at their real 32px size. Reduced motion produces no badge animation; no runtime console errors in this check. Catalogue remains excluded from production.
- Read-only preview SHA-256 fingerprints are unchanged; the archived historical Maths source still matches its recorded hash. No Supabase queries, migration or real learner writes. Earlier physical-device, real-account and two content-route limitations remain applicable.
- Owner authorized production deployment after these refinements; live verification follows.


### Production release verification

- Owner-approved application revision `87edf03d3bbb9ec21a420edab6e61f291178d54d` pushed to main on 2026-11-08; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/BR9ZXeA7ZFvX86eqwb1HRG1uqr8r) reports success for that exact commit.
- Live origin: https://sastezatelna-matematika.vercel.app/ . Home/materials/six articles/sitemap/robots return 200. Materials are publicly cached without Set-Cookie and retain production canonicals; anonymous progress streams a login redirect with no-store/noindex, course API returns 401/no-store, and development catalogue returns 404.
- All twelve live-referenced JS assets return 200. The served preparation bundle includes „Задачи от състезания“ and „Напредък в подготовката за това състезание.“; production content hashes differ from local-build asset names, so only actual live references were accepted as evidence.
- Chrome mobile materials smoke at 390px: no horizontal overflow, broken images or runtime console errors. Authenticated progress/calendar/reward behavior is covered by the final local production-build checks and tests above; no real live Google session or physical-device verification is claimed. No Supabase access, migration or real learner writes.

# Weekly goal and consistent progress - review and release

Date: 2026-11-20. Scope: product-only local implementation; no production publication, account/database migration, reward policy, landing or SEO changes.

## Approved behavior

- Complete one existing adventure per competition in a Monday-Sunday Europe/Sofia week. Use saved completion stamps, including a shorter valid adventure and an adventure started before the week. The completion week receives credit; no additional gold or quotas.
- Show the current-week summary below the competition filter and above the calendar. Filtering applies to both; browsing a historical calendar month does not move the weekly summary.
- Count distinct identifiable tasks or natural subparts as “Сгрешени задачи” within each period. Repeated wrong attempts on the same task count once; a later correct answer does not erase the error. Keep raw wrong attempts in skill details and unidentified historical errors separately.
- Preserve per-competition day accordions, existing learner history, family authorization and the server-side answer boundary. Show at most one achievement supported by saved evidence.

## Independent Astra review and copy context

Actual `gpt-6-astra`, high reasoning, was used for the weekly-goal implementation, progress consistency implementation, and a separate independent copy/implementation audit. The coordinator integrated and verified the result.

The independent audit approved these new phrases unchanged: “Тази седмица”, “Задачи и подусловия”, “Самостоятелно: X · С помощ: Y”, “Дни с упражнения: X.”, “Още няма записани опити тази седмица.”, and the two quiet weekly-adventure goal states. Existing personal-achievement messages are reused unchanged. The owner's explicit “Сгрешени задачи” decision is retained.

Three optional copy proposals were presented together in the conversation. They are **deferred and excluded from the approved release**; current wording is retained:

| Location | Current wording | Concern and proposed replacement |
| --- | --- | --- |
| Existing calendar help metrics | “С подсказка” | Align with the new weekly summary using “С помощ” throughout Напредък. |
| Compact calendar cells | “X задачи” / “X сгрешени” | Make the meaning explicit with “Решени: X” / “Сгрешени: X”. |
| Unidentified historical errors | “По-стари грешни опити” | Explain missing identity rather than age: “Грешни опити без уточнена задача”. |

These optional proposals have not been applied. The owner subsequently approved the UI proposals and explicitly requested publication of all completed goodies on 2026-11-22. Release the inspected current implementation without introducing these unapproved wording alternatives; retain them here for a later copy decision.

The implementation audit identified historical identity cases that were fixed before final acceptance checks: single-unit NVO original/current aliases, Olympiad original/final-part/current aliases, separate historical teaching scaffolds, and ambiguous multi-part historical entries. Canonical identities include competition and source/unit identifiers without answers. A final read-only Astra audit reported no remaining material counting, date or privacy issues.

## Verification

- Full suite: `NODE_ENV=test node --import tsx --test tests/*.test.ts tests/*.test.tsx` - **425/425 passed**. The equivalent Node import was used because the `tsx` CLI IPC socket is denied by the sandbox.
- `npm run typecheck`, `npm run lint`, `git diff --check` - passed.
- `npm run build` - passed on retry, including the standalone private-file audit. The first build compiled successfully but Next's security check stopped it and reported an advisory affecting the existing Next 16.4.4 dependency; the retry completed with a warning. No dependency upgrade was included. This existing advisory must be addressed before a production release decision.
- Tests cover Sofia week/year/DST boundaries, invalid/future stamps, competition scoping, repeat mistakes followed by success, ambiguous historical identities, saved-only achievements, parsed timestamp ordering, projection privacy and input immutability. Existing family/reward/history regression tests also passed.
- Real Chrome production-bundle checks at 1440px desktop and emulated 320px/390px mobile: weekly placement and wrapping, no page horizontal overflow, correct totals, competition filtering, month navigation independence, day accordions and distinct-versus-raw errors. The synthetic repeated-error case displays “Сгрешени задачи: 1 · Грешни опити: 2”. Escape closes the day dialog and returns focus to its calendar button. No browser warning/error messages were reported on the inspected competition page.
- Completed weekly goal shown for Математика за всеки; pending goal shown for the municipal Olympiad. Both remain competition-specific without additional controls.

## Local preview and limits

- [Напредък](http://127.0.0.1:3048/progress)
- [Completed weekly goal](http://127.0.0.1:3048/?competition=matematika-za-vseki)
- [Pending weekly goal](http://127.0.0.1:3048/?competition=olimpiada)

Production bundle served on loopback in local mode from the isolated release checkout. Disposable synthetic records cover all five competitions; no real learner data was copied or changed. Fixture generator: `/private/tmp/maths-weekly-fixture.mts`; data: `/private/tmp/maths-weekly-preview-data`; browser evidence: `/private/tmp/maths-weekly-review/`; test log: `/private/tmp/maths-weekly-tests.log`. These temporary paths are local evidence, not deployed assets.

The weekly goal refreshes through existing course action/focus refresh behavior; no background midnight timer was introduced. A continuously focused idle page can show its previous week until that refresh. Browser CLI compatibility required supplying an explicit page ID through its documented bridge client. No browser-tool or dependency files were modified.

## Weekly card visual preview - 2026-11-21

Owner requested a clearer UI and then asked to see the proposed layout locally. Applied three aligned metric groups, independent/help breakdown below the main total, and a quieter footer using the existing decorative check icon. Mobile below 600px places the total above two secondary metrics. Existing wording, counts, filtering and achievements are retained; label punctuation was removed where values now appear on separate lines. No new primitive or token was necessary. Optional copy proposals above remain pending.

20/20 focused progress UI/weekly tests, TypeScript, targeted ESLint, optimized build/private-file audit and whitespace checks passed. Build succeeded on retry with the previously recorded Next security advisory. Real Chrome at 1440px, 320px and 390px confirmed the intended metric arrangement and no horizontal overflow. Screenshots: `/private/tmp/maths-weekly-review/refined-desktop.png` and `refined-mobile320.png`. Console reported two existing font-preload warnings and no errors. Preview remains local on port 3048 with disposable synthetic data; production is unchanged.

### Owner label correction - 2026-11-21

- Owner explicitly requested „Задачи“ instead of „Задачи и подусловия“ in the weekly summary; applied to the label and UI assertions. Counting rules are unchanged.
- Broader UI audit found an unbalanced monthly metric grid, dense all-time summaries and duplicate disclosure icons. A concrete visual-only plan was presented in chat for approval before implementation, following AGENTS.md.
- Label verification: 20/20 focused tests, TypeScript and whitespace checks passed; optimized build/private-file audit passed after the existing Next advisory retry. Rebuilt local preview restarted on port 3048.

### Approved consistency pass - 2026-11-21

- Owner approved in chat: monthly metrics in four desktop/two mobile columns; aligned label/value rows for all-time summaries; existing shared navigation/disclosure icons with unchanged 44–48px targets. Visual-only scope; no counting, rewards, history, links or account changes.
- Applied to progress calendar and preparation components. Profile controls already use `ActionIcon` and need no replacement. Reused existing tokens and components; documented the patterns in the design system. No substantial new copy, so this pass does not reopen the independent copy gate.
- Verification: 31/31 focused progress, weekly, profile, navigation and sharing tests passed; TypeScript, targeted ESLint and whitespace checks passed. Optimized build/private-file audit passed after the existing Next security-advisory retry; dependency upgrade remains outside this visual-only scope.
- Real Chrome checks at 1440px, 390px and 320px: monthly grid measured four/two/two columns, no page overflow or clipped metric/summary headings, all fifteen all-time count rows retained and right-aligned. Navigation targets measure 52×44px; daily disclosure targets are at least 56px high; shared decorative icons and independent expansion verified. Keyboard Enter toggles preparation details; Escape closes the daily modal and restores its date button. Screenshots: `/private/tmp/maths-weekly-review/consistency-desktop.png`, `consistency-mobile390.png`, `consistency-mobile320.png`. Console: two existing font-preload warnings, no errors. Local production-build preview remains at http://127.0.0.1:3048/progress with disposable data; no production changes.

## Production release authorization - 2026-11-22

- Owner explicitly requested all completed goodies in production, including the weekly panel. Scope: weekly adventure goal, weekly summary, consistent distinct-error counts, responsive progress refinements, gold-record precedence and guide replay from every shared app-menu route. Landing/SEO drafts remain excluded. No database migration, reward-policy change or learner-history rewrite.
- The implemented panel is a weekly summary, not an arithmetic average. A clarification about a separate daily average was sent in chat; no new average calculation, denominator or UI is introduced by this release.
- Resolved the previously reported production Next.js advisory with the same-minor patch from 16.4.4 to 16.4.6 and matching ESLint plugin. The [upstream security advisory](https://github.com/advisories/GHSA-f3mh-rxg3-f5g2) identifies 16.4.5 as patched; [16.4.6](https://github.com/vercel/next.js/releases/tag/v16.4.6) adds backported bug fixes. Production-only npm audit now reports zero vulnerabilities; three moderate development-only ESLint-chain advisories remain outside this release.
- Final acceptance on patched Next: 428/428 tests, TypeScript, full ESLint, optimized production build/private-file audit and whitespace checks passed. Real Chrome confirmed the weekly panel (15 tasks, 4 active days, 5 distinct errors) and guide replay from Progress with disposable records; no horizontal overflow. Earlier desktop/320px/390px acceptance remains applicable because the patch changed no UI source. Application commit and live smoke-check evidence are recorded below.

### Live deployment verification

- Application commit `4bd115b7469a5873790a387972df38222aa0adb3` was pushed to `main`; [Vercel exact-commit status](https://vercel.com/petar-s-projects33/sastezatelna-matematika/8iRKqLbss9TBfr1meXLSoX5vThEW) reports successful completion. Production: https://sastezatelna-matematika.vercel.app/ .
- Live read-only smoke checks: `/`, `/login` and `/materiali` return 200; anonymous course API returns 401 with `no-store`; the POST-only profiles endpoint rejects GET with 405; `/progress` streams its expected login redirect; design-system and private documentation paths return 404. Initial verifier assumptions about GET profiles and streamed redirects were corrected against the route definitions; these were verification-script errors, not application failures.
- All ten home JavaScript bundles and all nine bundles referenced by the protected Progress response return 200. Deployed home code contains the weekly goal and guide/restart markers; the deployed Progress bundle contains the weekly summary and its empty state. Real Chrome confirms the existing public landing loads at 1440px with no horizontal overflow. No landing/SEO source changes were included.
- Limitation: no authenticated production learner session was used and no production learner data was modified; personal counts, goals, filters and guide interactions were accepted in the local production bundle using disposable synthetic records.

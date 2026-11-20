# Contextual child guide - local review, 20 November 2026

## Approved scope

Three optional overview tips for competition selection, the adventure action and islands, followed by one contextual tip on the first unanswered problem. Existing learners use “Покажи ми как” in the shared menu. No forced interaction, backdrop, hint use, learner mutation or deployment. Existing draft-save guards apply to navigation. Browser-only versioned progress is scoped to the child, with a separate anonymous key and session-memory fallback. Closing suppresses automatic guidance; manual replay remains available.

## Independent Astra copy review

Actual reviewer model: `gpt-6-astra`, high reasoning; agent `/root/onboarding_copy_review`, 20 November 2026. The reviewer inspected the changed components and copy, AGENTS.md, the design guide and the active hint/reward policy in docs/points.md. It recommended **no wording changes**. No owner decisions are pending. The approved wording was retained before acceptance/regression testing.

1. **Избери състезание.** Оттук можеш да сменяш състезанието, за което се подготвяш.
2. **Започни оттук.** Ще получиш задачи за следващото си занимание.
3. **Избери остров.** Ако искаш да упражняваш определена тема, отвори нейния остров.
4. **Нужна ти е помощ?** Подсказките показват решението на части. Първите две запазват златото за задачата, а след третата няма ново злато за този опит.

Controls: “Назад”, “Напред”, “Готово”; close name: “Затвори напътствията”. The review confirmed child-appropriate Bulgarian and that the third-hint wording does not imply subtracting previously earned gold.

## Design rationale and sources

Use contextual assistance near the real control, with a clear skip/replay path and no required introductory tour. Desktop uses a compact anchored card; small screens use a compact viewport card with target visibility and keyboard handling. Reuse cream/teal tokens, buttons, close/info icons and a small otter on the first tip only.

- [Nielsen Norman Group: onboarding tutorials](https://www.nngroup.com/articles/onboarding-tutorials/) - keep instruction brief and relevant to the current task.
- [Material: onboarding](https://m1.material.io/growth-communications/onboarding.html) - progressive, contextual assistance and optional discovery.
- [Duolingo: implicit learning](https://blog.duolingo.com/what-is-implicit-learning/) - support learning by doing; this is a product analogy, not evidence of this app’s effectiveness.

## Verification

- Full application suite: 406/406 tests passed; after the final keyboard-focus correction, all 83 affected guide/navigation/course UI tests passed again.
- TypeScript (`tsc --noEmit --incremental false`), ESLint and `git diff --check` passed.
- Chrome checks covered desktop 1280px, actual mobile 390px and 320px, reduced motion, card placement above the fixed hint control, real-control interaction, Escape, Tab, dismissal, menu replay and query-link replay. No horizontal overflow; closing returns focus to a visible control or the focusable map. Fixed two focus edge cases found during browser verification.
- Development catalogue example uses the same component. Guide persistence/child isolation, existing-learner opt-in, untouched drafts/hint level/gold and navigation-save guards are covered by automated tests.
- Existing Next.js 16.4.4 raises a security advisory during builds; the dependency was not changed within this onboarding task. The final optimized build and private-file audit passed on retry after its advisory reminder; no dependency upgrade was performed.
- Local disposable data only; no hosted database, production release or real learner data changes. Native mobile software-keyboard behavior was not tested on a physical device.

Final built-app smoke check: http://127.0.0.1:3051/?guide=1 returns the guide with keyboard focus and no horizontal overflow; `/` is 200 and the development-only `/design-system` is 404. Chrome network inspection showed all application chunks/fonts loading successfully; the existing missing `favicon.ico` produces 404 messages, and font-preload warnings remain. Local preview is loopback-only with disposable learner data. Development catalogue remains at http://127.0.0.1:3050/design-system.

## Approved visual refinement - 20 November 2026

Replaced the heavy double blue framing with a light cream card, one border, soft shadow and a subtle teal target highlight. Blue rings remain for keyboard controls. The guide focuses its heading for reading; Escape restores control focus. Reduced the otter and spacing, retained readable type and 44px actions, and added a small pointer only when it sits directly beside its target. Desktop placement maintains a 16px gap with edge fallbacks. Mobile uses a compact bottom card or moves above a fixed target; sizing follows visual-viewport offsets, keyboard height and safe-area bounds. No approved Bulgarian wording, reward rules or learning persistence changed. The development catalogue uses this same component.

The refinement follows [NN/g contextual onboarding guidance](https://www.nngroup.com/articles/onboarding-tutorials/) and [SEB contextual-help patterns](https://designlibrary.sebgroup.com/patterns/pattern-contextualhelp), adapted to the existing design tokens rather than introducing another visual system.

Verification: full suite 411/411, including five geometry tests; the final pointer correction passed all five again. TypeScript, focused ESLint and diff whitespace checks passed. Chrome inspection covered all overview steps at desktop 1280px and mobile 390px, plus the contextual hint at 390px and 320px. The narrow hint card clears the fixed control by 16px; no horizontal overflow. Tab shows the existing 3px blue ring, and Escape closes the guide and returns focus to Подсказка. Visual-viewport offsets, reduced keyboard height and safe-area placement have automated geometry coverage; a physical software keyboard remains untested. The optimized build and private-file audit passed after retrying the existing Next.js security-advisory interruption.

Screenshots: `/private/tmp/maths-guide-refinement/`. Local only; no production deployment.


## Isolated production release verification - 20 November 2026

Owner approved production publication of the guide and refined UI while keeping the new landing and SEO/archive work local. The release starts from verified production `5f23dc00b48ec69974e4d134d7c8318a6ad0fe18`. Existing live continuous practice and regional hints are retained; their core sources, landing components and public materials routes are unchanged. No database migration or real learner writes.

- Combined release: 409/409 tests passed using `NODE_ENV=test node --import tsx --test tests/*.test.ts tests/*.test.tsx`; TypeScript, ESLint, whitespace checks and optimized production build/private-file audit passed. The direct Node runner avoids the sandbox's `tsx` wrapper IPC restriction.
- Built app at loopback port 3052: desktop 1280px and mobile 390px/320px checked overview tips, next/close, menu replay, Escape focus restoration, real hint interaction and overflow. The contextual hint card clears the fixed hint button by 16px at 320px. No browser console errors in the final flows. Physical mobile keyboard remains untested.
- Disposable local exhausted histories: regional Olympiad with unresolved mistakes and future reviews immediately opens recovery, accepts a correct answer and advances to another task; NVO with all original tasks solved immediately opens a fresh task through “Започни отново”. No production learner account used.
- Existing Next.js advisory noted above remains outside this guide release; no dependency changes.

Application commit `7187ae55befe949acbd37d0c2d10ad60533ca1dc` published to `main`; [Vercel deployment](https://vercel.com/petar-s-projects33/sastezatelna-matematika/69buk9Zpq9wMq4M3KWXjqonQFPwZ) succeeded for that exact SHA. Live read-only checks: home/login/materials return 200; anonymous course API returns 401/no-store; development catalogue and private documentation return 404. All ten page JavaScript bundles load successfully and include the new guide/storage key, menu replay and retained recovery/restart actions. Chrome at 390px confirms the unchanged public landing page, no horizontal overflow and no console errors. Authenticated guide/recovery flows were verified on the identical isolated release locally with synthetic data; no real-account production writes or physical-device test.

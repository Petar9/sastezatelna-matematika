# Alpha review: competition reference and articles

Date: 2026-11-06. Audience: Bulgarian parents of fourth-graders. Scope: four distinct format/preparation articles, one competition reference, short About cards, school-guide calendar. Production publication approved by the owner on 2026-11-06.

## Owner decisions carried forward

- One Olympiad article with municipal and regional sections.
- Keep historical changes brief; no long history or numerical admissions example.
- Separate last intake (SMG 2026/2027) from the upcoming intake (NPMG 2027/2028); weights for the latter are not established by its announcement.
- Preserve the owner's earlier statement that experienced mathematics teachers personally check the application; do not invent additional qualifications or sign-off.
- Earlier About copy calling MvV the most important competition for both schools was owner-approved. If it needs narrowing, propose that explicitly rather than silently undoing it.
- Primary research corrections: Spring IV maximum 50, not 26; Olympiad IV 4 hours, not 4.5, in the checked 2025/2026 regulations. Current 2027 dates alone do not verify new-year formats.

## Review gate

Independent reviewer: Alpha (`gpt-6.1-sol`, low), 2026-11-06. Article and calendar extension reviews completed. Read the actual changed Bulgarian text, titles, summaries, About and school-guide additions with `docs/competition-reference.md` and `AGENTS.md`.

For each hesitation record file/location, exact current text, concern and recommended replacement; separate required factual corrections from optional copy improvements. No copy changes are approved merely because the implementation plan was approved. Owner approved all three proposals and production publication on 2026-11-06 ("ok i accept move it to production"). All three replacements applied verbatim before testing. Acceptance: 320/320 tests, TypeScript, ESLint, production build and private-file exclusions passed. Isolated Chrome checked nine routes at 320, 390 and 1440px, calendar date selection and article links, with no horizontal overflow or page errors. Physical-device and real Google account smoke checks were not repeated. Production deployment verification is pending.

## Alpha proposals - all approved and applied

1. `app/materiali/olimpiada-matematika-4-klas/page.tsx:13`: “За областния кръг през тази учебна година се допускат учениците с поне 16 точки.” → “По регламента за 2025/2026 г. до областния кръг се допускат учениците с поне 16 точки.” Avoid implying that last year's verified threshold is current.
2. `app/materiali/matematika-za-vseki-4-klas/page.tsx:8`: “„Математика за всеки“ съчетава тест и две задачи с подробно решение.” → “По регламента за 2025/2026 г. „Математика за всеки“ съчетава тест и две задачи с подробно решение.” Current regulation remains unread.
3. `app/about/page.tsx:21`, final sentence: “За последните години това е най-важното състезание при балообразуването за прием в СМГ и НПМГ след четвърти клас.” → “При приема в СМГ за 2026/2027 г. трансформираният резултат от него има най-голяма тежест сред състезанията. Тежестите за приема в НПМГ за 2027/2028 г. предстои да бъдат публикувани.” Evidence narrows the previously owner-approved broader claim; explicit approval required.

No other substantial article copy changes recommended; settled teacher-review wording retained. Reviewer checked supplied local source evidence, not independent external source verification.

## Approved progress calendar extension

Owner approved 2026-11-06: short “Предстоящи състезания” list above the shared child/parent calendar, selection opens and marks the day, with an article link; announced dates do not count as learning activity or gold. Shared schedule follows competition filtering; source caveat retained. No learner-data changes.

Calendar review result: Alpha (`gpt-6.1-sol`, low), 2026-11-06, recommends no substantive copy changes to the upcoming list, dates, competition names, source/change/registration caveat, accessible day labels or article links. The reviewer inspected the actual calendar and shared date source; no tests, visual acceptance or independent external verification were performed. Article proposals above were subsequently approved and applied.

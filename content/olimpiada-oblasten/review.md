# Regional Olympiad grade 4 - collection review

Status: **approved for release by the owner**, 2026-11-06. Approved Bulgarian revisions applied; final regression and live evidence recorded in [plan.md](../../plan.md).

- Stable ID `olimpiada-oblasten`; „Олимпиада (областен кръг)“, badge „Трудно“; version `bg4-olimpiada-oblasten-2023-2026-draft-v1`.
- 2023–2026: **12 whole originals, 23 natural answer units, 21 finite authored exercises**, seven skills in four approved islands. No source exclusions or missing official solutions.
- Sources: unchanged supplied papers and official solutions, private inventory and all four full Bulgarian caption archives in `materials/olimpiada-oblasten/`; transcripts inform the teaching approach, while PDFs and independent calculations establish the answers.
- Existing `olimpiada` keeps its ID, version and history; its display name becomes „Олимпиада (общински кръг)“, badge „Средно“.
- Owner approved the proposed Bulgarian revisions and release. Astra reviewed all teaching copy without a material blocker; exhaustive independent human mathematical review remains unrecorded.

## Approved coverage

| Skill | Whole originals | Natural units | Authored exercises |
| --- | --- | --- | --- |
| Изрази и неизвестни числа | 2023 №1, 2024 №1, 2025 №1, 2026 №1 | 4 | 3 |
| Групи и количества | 2023 №2, 2024 №3 | 5 | 3 |
| Размяна и връщане назад | 2025 №2 | 2 | 3 |
| Кутии и възможности | 2026 №3 | 3 | 3 |
| Квадрати в правоъгълници | 2023 №3, 2024 №2 | 4 | 3 |
| Растеж и обиколки | 2025 №3 | 3 | 3 |
| Срещи по затворен път | 2026 №2 | 2 | 3 |

Islands: „Числови загадки“ (4 originals), „Истории с числа“ (4), „Геометрични открития“ (3), „Срещи и обиколки“ (1). The last island has only one source year; practice supplies confirmation without implying more archived coverage. Each skill starts with a real original; all whole originals stay in one canonical island.

## Input adaptations and safeguards

- Unlettered multi-answer originals remain one answer unit. Lettered а/б/в parts retain source order, shared context, all relevant fields and dependencies; full statements and completed parts stay collapsed during practice.
- 2023 problem 2 в): separately labelled numeric proof aid, `1 = да`, `0 = не`, plus 19 hens and 18 available places. This is one natural part, not automatic grading of a written proof.
- 2025 problem 3 б): date fields are day and month (8, 3). 2026 problem 3 в): both possible counts are entered smaller first (2, 7).
- Five original PNG crops retain their figures; the source page for 2023 problem 3 includes both diagrams. Generated WebP assets preserve decoded pixels; full PDFs, solutions and caption archives remain private.
- Original difficulty review: 2 standard, 10 hard; practice: 16 standard, 5 hard. Badge and selection pool do not determine reward difficulty. Existing rules remain 10/15 gold per natural part, at most two local hints; the third excludes new gold. No historical repricing or history migration.
- All originals, natural units and exercises have three concrete worked solution stages. Finite pools return exhaustion instead of recycling new achievements.

## Verification

- 316/316 tests passed, including eight new regional cases: independent checks of all 12 original answer sets and 21 exercises, source/figure inventory, original-first selection, five-step adventures, drafts/reload, dependent help, third-hint exclusion, alias repeat prevention and isolated saved history.
- TypeScript, ESLint and production build passed, including standalone/private-file checks. Image generation verified pixel equality.
- Real Chrome checks at 1200px and 390px: round names and badges, four-island map, grouped fields, draft reload/resume, next natural part and its diagram, third-hint zero new gold, source page with both decoded figures, no horizontal overflow and no runtime console errors.
- Local review: http://127.0.0.1:3012/?competition=olimpiada-oblasten; isolated disposable local learner, no Supabase or real learner data.

Release permission is recorded in the conversation; hosted catalogue enabled. Physical-device and real-family Google-session checks remain separate from the disposable local learner checks. No database migration or learner-history rewrite.

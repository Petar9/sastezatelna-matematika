# Calendar navigation copy review

Date: 2026-11-06. Independent reviewer: `gpt-6-astra`, high reasoning. Audience: fourth-graders and their parents. Status: all three proposals approved by the owner in the conversation on 2026-11-06 and applied; local acceptance and production checks passed.

## Context

Approved scope: remove repeated date-source caveats from public copy, retain internal provenance, add the municipal deadline and NVO date, place the upcoming list below the calendar and day details, link schedule entries directly to preparation, reuse the rows in articles, and add quiet materials navigation beside feedback. Preserve learner data, activity and gold calculations, source wording, and the distinction between historical school admissions rules and forthcoming rules. Guest/sales navigation remains future work.

The reviewer inspected the shared schedule, both calendar components, six changed articles, onboarding, profiles, progress, and course navigation against the project instructions and design guide. Source accuracy relied on the verified research supplied to the reviewer; no rendered verification or tests were performed.

## Approved proposals

| Location | Current wording | Concern | Recommendation |
| --- | --- | --- | --- |
| `components/progress-calendar.tsx`, upcoming heading | Предстоящи състезания | The list also includes NVO and a deadline. | Предстоящи дати |
| `components/progress-calendar.tsx`, day accessible label | състезание: … | Calls NVO a competition. | дата: …; preserve краен срок за провеждане: … for the deadline. |
| `app/materiali/priem-sled-4-klas-npmg/page.tsx`, calendar heading | Календар за 2026/2027 г. | Five general dates under an admissions-specific section could be confused with the three admissions competitions. | Общ календар за 4. клас през 2026/2027 г. |

No other wording changes recommended. Municipal deadline wording, date formats, the three-item NPMG list, and Ценни материали were accepted by the reviewer. All three proposals were presented in the task context and approved by the owner’s chat reply (“i said they are approved”). All three replacements are applied. The existing approved materials-link wording also covers the parent’s last-task page.

## Acceptance evidence

TypeScript, ESLint, the production build/private-file checks and regression tests passed. Isolated Chrome checked the six articles and progress at 320, 390 and 1440px, municipal deadline selection, competition filtering, direct preparation navigation and materials links; no horizontal overflow or page errors. The production design catalogue returns 404. Tests use isolated disposable learner data; real Google accounts were not retested.

Production: release `9c10f7e` was published successfully by [Vercel](https://vercel.com/petar-s-projects33/sastezatelna-matematika/vJhaJLHRBFWhky4sL6iXHt3rZT3K). Live Chrome checked all six articles at 320/390/1440px, the complete schedule, preparation links, canonical/indexability, no overflow/page errors and unauthenticated privacy boundaries (progress login/no-store, API 401/no-store, design catalogue 404). All 325 regression tests passed. Authenticated navigation was tested locally with disposable data; real Google accounts were not repeated.

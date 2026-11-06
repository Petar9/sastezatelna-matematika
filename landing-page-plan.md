# Landing-page plan

Agreed specification, 6 November 2026. Status: planning complete; page, demo and billing implementation remain future work.

## 1. Purpose and positioning

Create a Bulgarian landing page for parents of fourth-graders preparing for maths competitions.

The page must explain the value, demonstrate the experience and support an informed purchase at **US$100/month per child**, with a **14-day first-payment cancellation and full-refund window**.

**Core value proposition:** practice that connects worked explanations with fresh related problems, while showing parents which tasks their child solves independently or with help.

The page cannot establish that the product improves competition results simply by describing this mechanism. Demonstrate current capabilities and treat willingness to pay as unvalidated until purchases and renewals occur.

The [commercial blueprint](guideliness.md) governs the offer and cohort definitions. The [design system](docs/design-system.md) governs presentation; [key decisions](key-decisions.md) govern learning behavior. This document specifies the landing page and its embedded sample. Search and resource publishing remain in the [SEO/GEO guide](seo-geo.md).

### Research informing the plan

- Communicate the audience, offering and reason to choose it immediately; use informative visuals. [NN/G homepage principles](https://www.nngroup.com/articles/homepage-design-principles/).
- Establish a clear next action and demonstrate the offering. Treat landing-page practices as hypotheses to test. [Unbounce guidance](https://unbounce.com/landing-page-articles/landing-page-best-practices/).
- Prefer concise, scannable and objective language over promotional claims. [NN/G writing research](https://www.nngroup.com/articles/applying-writing-guidelines-web-pages/).

Research was reviewed on 6 November 2026. These sources inform design choices; they do not establish this product's conversion rate or validate its price.

## 2. Page structure and selected copy

### Header and hero

Retain the existing cream, teal, otter and island identity. Use the working name **Математически открития** and keep a visible, visually secondary **„Вход“** link.

**Audience label**

> Състезателна математика за 4. клас

**Headline**

> Подготовка за самостоятелно решаване на състезателни задачи.

**Supporting text**

> При затруднение детето получава обяснение стъпка по стъпка, а след това упражнява метода върху друга задача. Вие виждате кои задачи решава самостоятелно и кои с помощ.

**Primary button**

> Опитайте примерна задача

The button scrolls to the embedded demo at `#primer`.

**Adjacent disclosure**

> Без регистрация и карта. Абонаментът е 100 щ.д./месец за едно дете.

On desktop, place copy beside a truthful product preview. On mobile, show copy and the primary action before the preview.

### Interactive demonstration

**Heading**

> Опитайте задача от платформата

**Supporting text**

> Решете задачата, разгледайте помощта и приложете метода върху следващата.

Show three difficulty buttons:

> Лесно · Средно · Трудно

Select **Средно** initially. The buttons explain the choice without an additional instruction.

Each difficulty contains one reviewed sequence:

1. A representative competition problem with an answer field.
2. Optional progressive help using that problem's actual numbers and reasoning.
3. A fresh related problem where the visitor can apply the method.

Use six problems altogether. Preserve the app's relevant answering and help behavior, with clear correct/incorrect feedback. Visitors may reveal the explanation without first submitting an answer.

Difficulty describes the examples; it does not assess the child. Finishing the sequence must not produce a mastery or readiness claim.

Use this as the single free sample, rather than developing a second separate demonstration.

Display:

> Примерът не запазва напредъка.

Keep attempts separately for each difficulty while the visitor remains on the page. Switching difficulty must not discard another example's in-memory attempt. Do not create profiles, save learning history or award rewards.

### Parent visibility

**Heading**

> Виждате кога решава самостоятелно.

Show the actual progress interface with synthetic data labelled **„Примерни данни“**.

Explain independent and assisted attempts without presenting repeated successes, activity or rewards as proof of new learning.

Do not add invented testimonials, improvement percentages or pilot results.

### Suitability and included access

State clearly:

- Intended for fourth-graders practising competition mathematics.
- Worked explanations, related practice and saved progress.
- Available Математика за всеки and Олимпиада collections.
- НВО as supplementary school-exam practice.
- Self-paced platform access for one child.
- No personal lessons, individual proof marking or guaranteed admission.

Verify collection names, coverage and publication suitability before release. Do not advertise local-only draft collections as included paid content.

### Pricing

Show one plan:

> **100 щ.д. на месец за едно дете**
>
> Първото плащане е при записване. Абонаментът се подновява всеки месец.
>
> До 14 дни от първото плащане можете да прекратите абонамента и да поискате пълно възстановяване на сумата.
>
> След този срок можете да спрете следващото подновяване. Достъпът остава до края на платения период.

**Purchase button**

> Започнете за 100 щ.д./месец

Display the working refund-request channel nearby. Keep USD explicit throughout the page and checkout. Confirm the final consumer-price treatment before publication. The voluntary refund promise does not replace applicable statutory rights.

Do not describe this as a free trial. Do not add introductory discounts, crossed-out prices or subscriber-count price increases.

### FAQ and footer

Answer suitability, help, parent involvement, compatibility with lessons, included content, Google login, support, cancellation and refunds.

Include business identity, contact, terms, privacy, about and existing useful resources.

Avoid a separate long promotional conclusion. A parent ready to purchase can use the pricing action without completing the sample.

## 3. Critical copy and evidence rules

| Avoid | Reason | Use instead |
| --- | --- | --- |
| Rewards as the main promise | Engagement is not the parent's desired outcome | Demonstrate useful practice |
| „Истински задачи“ as the differentiator | Other resources provide them | Show explanation followed by fresh application |
| „Гарантиран прием“ or medals | Unsupported outcome guarantee | Accurate preparation scope |
| „AI учител“ or personal tutoring | Misrepresents the product | Explain its actual help mechanism |
| „Доказан напредък“ from activity counts | Usage does not establish learning | Describe recorded attempts precisely |
| „Спестява часове на родителя“ | Unmeasured time-saving claim | Show what the parent can see and use |

The sample must carry the argument for value. If the demonstration does not convince suitable parents, investigate product value and fit rather than making stronger claims.

Use short Bulgarian sentences, descriptive headings and real product visuals. Keep decoration subordinate to the task experience.

## 4. Performance and implementation boundaries

Keep the landing page server-rendered, with the initial medium problem readable in HTML.

Implement the demo as a small isolated interactive component:

- Do not import the full competition player, maps, account management, reward system or complete catalogue.
- Include only the six selected problems and their compact help/answer data.
- Load diagrams only for the selected difficulty.
- Defer additional interactive code until the demo approaches the viewport.
- Use explicit image dimensions and stable loading space.
- Avoid video, animation libraries and new third-party scripts.
- Make no demo database, authentication or AI requests.
- Keep the landing-page copy readable if demo JavaScript fails.

Use **20 KB compressed additional demo JavaScript** as the initial engineering budget, excluding framework code already loaded. Measure the actual build before accepting it.

Next.js supports deferred client-component loading to reduce initial JavaScript. [Official lazy-loading guidance](https://nextjs.org/docs/app/guides/lazy-loading).

Preserve authenticated learner routing, existing pilot access and private-data boundaries. Do not introduce shared caching of authenticated homepage responses.

The purchase button depends on verified parent authentication, checkout and paid access. Do not publish a purchase action that merely collects an invitation request.

No new public application API or billing schema is introduced by this documentation deliverable. The planned visible interface is the anonymous homepage with an embedded `#primer` sample and the separate authenticated purchase flow; no duplicate sample route is required.

## 5. Verification and delivery

### Content and comprehension

Review the page with five prospective parents outside the existing pilot. Ask them to identify:

- Who the product is for.
- What happens when the child gets stuck.
- What distinguishes the practice experience.
- The recurring price and first-payment refund terms.
- The next available action.

Use four of five understanding these essentials as a provisional revision gate, not a scientific benchmark.

Ask what makes the offer worth US$100/month and what remains unconvincing. Stated willingness does not replace actual payment evidence.

### Functional checks

Verify all difficulty sequences, answer feedback, progressive help, switching between attempts and recovery from loading errors.

Confirm that the sample writes no learner records or rewards. Check existing login and the eventual purchase journey separately.

### Performance and accessibility

Compare production builds with and without the demo using repeatable cold-load mobile tests.

Check:

- LCP ≤2.5 seconds.
- CLS ≤0.1.
- Prompt feedback for answering and difficulty changes.
- Real-user INP ≤200 ms when sufficient field data exists.
- No unnecessary requests for unselected diagrams or app features.
- Keyboard operation, visible focus, accessible selection states and 320/390px layouts.

These are targets, not results already achieved. [Core Web Vitals guidance](https://web.dev/articles/vitals).

### Measurement and documentation

Measure adult sample-entry and purchase actions without exporting children's answers or learning history to marketing tools. Report counts and denominators.

Judge commercial usefulness through purchases, refunds, activation and full-price renewals using the [commercial blueprint](guideliness.md).

Record implementation, verification and publication status in [plan.md](plan.md). This specification does not record an implemented or deployed page, demo or payment integration.

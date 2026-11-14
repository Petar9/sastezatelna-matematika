# Design system

Status: compact shared foundation, approved 2026-11-05. Preserve the cream, otter and island identity. Evolve it through real product needs and testing. No external component framework or Storybook dependency is required.

## Clarity before decoration

Apply the quality standard in [AGENTS.md](../AGENTS.md): clear purpose, simple steps and enjoyable learning, with the existing child-friendly identity. Linear / Apple Notes set the standard for polish, not a replacement visual theme.

Make the purpose and next action apparent through hierarchy and layout. Remove repeated headings, taglines, helper text and secondary labels when they add no useful information; repair a confusing layout before explaining it. Keep essential teaching hints, visible field labels, accessibility text and actionable error/recovery messages. Use short, concrete Bulgarian; do not add a generic learning tagline to every screen. This is guidance for approved future changes, not permission for a broad redesign.

## Sources of truth

- `app/globals.css`: semantic color, spacing, type, radius, focus, sizing and motion tokens.
- `components/ui/`: shared primitives and their states in `ui.module.css`.
- `/design-system`: interactive catalogue and actual landing/onboarding/profile previews. Development only; production returns 404. Uses synthetic data and prevents form submission; never an authentication bypass.
- This document: usage, exceptions and acceptance checklist. [plan.md](../plan.md) records current work and brief verification; its linked archive retains detailed delivery evidence.

## Visual rules

| Meaning | Token / rule |
| --- | --- |
| Page / surface / text | `--background` cream, `--card` warm white, `--foreground`, `--muted` |
| Primary action | `--primary` dark teal, `--primary-hover`, `--on-primary`; same on landing and app |
| Learning progress | `--progress` blue on `--progress-track`; always expose the metric in accessible text |
| Rewards | `--gold`; existing illustrated coins; never reuse blue progress to represent gold |
| Input / control outline | `--border-control`; `--border` is for decorative surfaces, not the sole boundary of fields |
| Feedback | `--success`, `--warning`, `--error` and their surface/border tokens; use words as well as color |
| Keyboard focus | `--focus`, 3px outline with 4px offset; never remove it |

Spacing: 4, 8, 12, 16, 20, 24, 32 and 48px (`--space-*`). Body 18px, supporting text 16px, question 20px, heading 24px, title 32px. Existing compact domain labels may remain smaller. Controls have 48px minimum height; quiet actions have at least 44px targets. Radii: controls 12px, cards 16px, dialogs 24px, islands 32px. Decorative SVGs retain their own illustration palette; original problem figures remain unaltered on white panels.

## Components and contracts

| Component | Use / states |
| --- | --- |
| `Button` | Action, native button props/ref. `variant="primary"` (default), `secondary`, `quiet`. Default `type="button"`; set `type="submit"` explicitly in forms. `loading` disables and sets `aria-busy` while preserving the label. Caller prevents duplicate side effects. |
| `ButtonLink` | Navigation, actual Next link with `href` and same variants; defaults to secondary. No fake disabled link. |
| `Input`, `Textarea` | Native props/ref including `required`, `inputMode`, `autoComplete`, `aria-invalid` and `aria-describedby`. Caller owns value and validation; component does not invent labels or errors. |
| `Select` | Native single-choice select props/ref, including controlled/default value, disabled, required and aria-invalid/describedby. Caller supplies visible label, options and validation. Reserved chevron space; native keyboard and mobile picker. Forced colors restores the browser arrow. |
| `Message` | `info`, `success`, `warning`, `error`; `inline` for field errors. Error defaults to alert, success to status; caller can override role. No automatic animation or dismissal. |
| `Badge` | Compact noninteractive label: neutral, success, warning. Difficulty remains a label, not a button. |
| `Dialog` | Native modal shell with required title/titleId and close action. Caller owns ref, `showModal()`, initial focus, close callback and focus restoration. Browser owns modal focus containment and Escape. The `responsive` variant adds a scrollable body and fixed heading, a centered 680px dialog on desktop and a full-width bottom sheet below 600px, with safe-area padding and reduced-motion support. Its title accepts `titleRef` for initial reading focus. Optional `closeDisabled` disables the close action during a pending mutation; the caller also prevents the cancel event while pending. |
| `ActionIcon` | Decorative 24px rounded-stroke SVGs for copy/check/close, navigation and profile tools. Matching strokes inherit the action color. Pair icon-only controls with an accessible name and at least 44px hit target; do not add visible text where the approved pattern uses an icon. Examples appear in the action gallery. |

```tsx
<label htmlFor="email">Имейл на родител</label>
<Input id="email" type="email" required aria-invalid={invalid || undefined}
  aria-describedby={invalid ? "email-error" : undefined} />
{invalid && <Message id="email-error" tone="error" inline>Въведи валиден имейл.</Message>}
<Button type="submit" loading={saving}>Запази</Button>
```

Keep labels visible. Preserve native form validation and server error recovery. Associate inline errors with their fields; retain user input after a failed request. Use links for navigation and buttons for actions. Use one clear primary action per task; secondary and quiet actions do not compete with it.

## Product patterns and deliberate exceptions


- Incorrect-answer feedback uses the owner-approved heading „Отговорът не е верен.“ and supporting sentence „Нека разгледаме решението стъпка по стъпка.“ before the worked solution (approved 2026-11-09). History and calendar outcome labels remain unchanged.

- Public resources reuse the landing shell/content width (1120px), header typography, primary `ButtonLink` for Вход and existing `LandingIllustration` at compact scale. `MaterialsHeader` links the brand home. No new asset, form or client state is needed.
- `MaterialCard({guide})` is the domain pattern for hub and related-reading cards: school/year, H2, short summary and a single full-card link. Hover uses the existing accent; keyboard focus outlines the whole card. The two-column hub becomes one column below 700px. Examples live in the development catalogue.
- `MaterialsArticle({guide,related,intro,contents,children})` owns breadcrumbs, one H1, review date, in-page navigation, related card and matching Article/Breadcrumb data. Body sections use H2/H3; anchor targets have scroll margin. The reading column is at most 800px with 18px text and 1.65 line height. Mobile uses the same landing gutters, wrapping formula and compact definition rows. Sources and dated limitations remain visible in HTML.
- `materials.module.css` styles these public layouts with shared tokens: cream background/card, teal links, sea formula panel, accent notice and 44px navigation targets. No unrelated primitive variants. Pages remain server-rendered, free of learner data and Supabase calls. A historical formula must carry its admission year; pending methodology must not look like a confirmed formula.
- `KidsLearningProgress`: three skill milestones, blue bar, accessible numeric value. `AdventureRoute`: completed natural steps in the current adventure. These are different metrics and remain separate components.
- `GoldWallet` and `IslandGoldTotal`: earned gold only, no cumulative maximum or target bar. Do not derive learning confirmation from gold. Rates, eligibility and history follow the [active gold policy](points.md#current-approved-policy); competition badge styling does not set the reward rate.
- Competition selector, map zoom/pan, island markers, skill selectors, answer options and numeric keypad are domain controls. Retain their selection/keyboard semantics and custom layouts; do not force them into generic buttons. They reuse shared tokens or the compatibility classes in `kids.module.css`.
- `KidsActionBar`: fixed next/check action, safe-area padding, measured content clearance and visual-viewport keyboard adjustment. Preserve its behavior, including multipart and secondary actions. Do not replace it with a normal-flow footer.
- `ProgressCalendar`: shared read-only child/parent calendar. Receives projected competition summaries and dated events, never raw courses or answers. Monday-first months and Europe/Sofia dates; competition filter, labelled day buttons, current-day/selected-day states, a responsive day-details modal, empty days and separately labelled uncertain historical amounts. Three labelled monthly metrics separate gold, independent successes and hinted successes. When new natural-part events exist, show separate subpart and whole-original totals without reclassifying historical records. Empty days show only the date; active cells show gold and combined independent plus hinted successes, labelled „1 задача“ / „N задачи“ (including natural parts). Tapping a date opens its details; never open automatically. Close/Escape dismiss and restore the date trigger without scrolling the calendar. Focus the date heading, lock background scrolling while open, and keep long details inside the scrollable body; backdrop taps do nothing. Selected-day headline metrics distinguish independent, hinted, incorrect and revealed attempts. Daily competition rows start collapsed and reuse the preparation panel’s full-width heading button and chevron, with keyboard activation, visible focus and `aria-expanded`/`aria-controls`. Each row expands independently; opening or changing the selected day resets its rows. Keep day totals visible and skill details inside the expandable body. The list groups attempts by competition and catalogue skill, showing successful whole-task counts or “Упражнявано”; raw sources and reward-ledger entries stay out of this list; buttons retain focus and 44px targets at 320px. Loading and retry states belong to `/progress`; parent-only last-task links are supplied by the server. A shared dated schedule (`src/competition-dates.ts`) supplies marked days and an upcoming list below the calendar. Both the list and selected-day links open the relevant preparation competition directly; public articles reuse `CompetitionCalendar` rows and the same links. Distinguish municipal deadlines from fixed dates. Diamond-marked dates follow the competition filter and never enter activity or gold totals. Future navigation extends through the last announced month; past dates leave the upcoming list but remain marked. Keep date provenance in the internal competition reference, without repeated public caveats. The calendar is a domain component, not a general date picker.
- `AppHeader` / `AppMenu`: one icon-only, 48px top-right trigger with accessible name „Меню“, expanded state and ordinary disclosure navigation. Order: Напредък, Профили, Ценни материали, За сайта, Обратна връзка, then separated Изход. Keep normal links and Tab order; do not use ARIA menu roles. Close on outside interaction, focus leaving or Escape; Escape restores the trigger. The panel stays within narrow viewports. Course links and logout await the existing draft-save guard; failed saves retain the mounted task and recovery message. Replace app footer navigation with this shared pattern; public marketing navigation stays separate.
- `FeedbackDialog`: opened from the shared menu, with child/competition and visible-task context captured on opening. Preserve the mounted exercise and failed message; follow the Dialog focus contract and restore the menu trigger on close. `FeedbackButton` remains a compatibility wrapper for existing callers.
- `ProfileNameForm`: parent/child nickname editing with shared Input, Button and Message, visible „Име на детето:“ label and „Запази“ action. Use an inline field/action row on wide screens and stack below 540px. Trims and validates 1–40 characters on the server; retains input on failure, prevents duplicate submissions, announces errors/success and refreshes the saved label. Authorization remains family-scoped; changing a nickname never changes login links or learner IDs.
- `ProfileCard`: centered profile column (760px maximum) within the shared app shell, otter welcome and prominent full-width name/arrow selection. Quiet icon/label tools open one settings pane per child at a time; keep hidden panes mounted to preserve drafts. Owner-only „Сподели достъп“ fetches unified email access only on first opening and caches it while mounted; shared users retain selection/name editing without owner controls. Reuse wrapping email rows, existing removal/copy controls and shared fields/messages. Preserve native selection/create forms and the optional additional-profile disclosure. Landing invitation keeps its single email field and concise recovery state. See the [approved profile/navigation review](reviews/profile-navigation-2026-11-11.md).
- `kids.module.css` exports compatibility classes composed from shared button/surface styles so existing page links and domain layouts stay consistent. New generic controls import primitives directly. Page-specific CSS owns layout, not a competing primitive theme.

## Competition preparation pattern - local implementation

The owner-approved preparation metric uses the existing 80/10/10 calculation; its authoritative evidence rules remain in [Gold and rewards](points.md#full-implementation-plan).

`PreparationPanel` is one shared cream surface below the calendar, before upcoming dates. It includes all available competitions with a displayed percentage above zero, independently of the calendar filter. Each separated row has a full-width heading button, name, percent, slim blue bar and chevron; rows start collapsed and expand independently. Details show only three count pairs: „Задачи от състезания“, „Затвърдени умения“, „Преговор“ (`X/Y`). Use heading/button semantics, `aria-expanded`/`aria-controls`, hidden collapsed content, 48px targets, visible focus and reduced motion. Omit the panel when there are no qualifying competitions; do not repeat otters, weight labels or explanatory copy.

`CompetitionPreparation` sits at the bottom of the competition overview, after learning content; it remains absent on islands and tasks. Separate it from the map with `--space-6` (24px). Keep the owner heading „Напредък в подготовката за това състезание.“, overall percentage, decorative endpoint otter and quiet „Напредък →“ link. Use the shared card and blue progress tokens, clamp the otter at both endpoints, label the progressbar and respect reduced motion. No solved-original sentence. The development catalogue covers zero, partial, complete, unavailable and long Bulgarian states; [copy review and verification](points-implementation-review.md) records approval context.

## Copy and motion

Short, concrete Bulgarian. Preserve approved “Откриваме заедно”, “Неприпокриващи се случаи”, “Гаранция чрез най-лош случай”. Use “Подсказка” / “Следваща подсказка”, “Верен отговор” / “Грешен отговор”, and one “← Начало” navigation action. Avoid repeated progress headings, explanatory perk blocks and technical recovery wording. Doctor uses a rolled diploma with a seal; Professor uses a graduation cap. Reuse the shared `Award` SVG, muted unearned and coloured earned states, existing growth animation and reduced-motion handling. Doctor/Professor eligibility remains educational logic; show earned achievements without restoring unearned badge clutter.

Use short transitions (`--motion-fast`) for controls. Progress uses its existing short transition. Respect `prefers-reduced-motion` in controls, progress and celebrations; no essential information may depend on movement.

## Every UI change

1. Read this guide, inspect the catalogue and the existing implementation before designing.
2. Reuse an existing primitive or product pattern. Extend it with a documented state/variant when the same semantic need fits.
3. If a real reusable gap remains, create the smallest complete component in `components/ui` (domain patterns stay with domain components). Document props, states, accessibility and examples here; add it to the gallery in the same change. Keep one-off layouts local.
4. Ask the owner before material new visual/interaction decisions. Do not create hypothetical variants or silently redesign approved behavior.
5. For new pages or substantial copy revisions, complete the [Astra copy review and owner approval gate](../AGENTS.md#astra-copy-review-before-testing); save the review context and approved wording before acceptance testing.
6. Check keyboard focus and semantics, error/loading/disabled states, long Bulgarian labels, 320/390px mobile and desktop, reduced motion, and the fixed action bar where affected. Do not write learner data for a visual check.
7. Run proportionate interaction tests, `npm run typecheck`, `npm run lint`, and production build. Confirm `/design-system` returns 404 in production. Record results and any limitation in `plan.md`.

## Migration boundary

Shared buttons, fields, messages, badges and dialog now serve landing, onboarding/profiles, feedback and generic learning actions. Remaining specialist map/answer/illustration styles are intentional, not duplicate generic APIs. Migrate remaining legacy generic controls when their screens are changed; do not rebuild unrelated screens or educational state just to expand this library. Follow test feedback before adding more abstraction.

Onboarding creates/selects the child without a separate child-email step. The catalogue includes first-profile and profile previews with submissions prevented. Landing uses primary “Вход” and secondary “Заяви покана”.

### Connected original pattern

`CourseQuestion` shows the original statement and all natural subparts once, always visible. Highlight the current subpart in the statement with the sea background and primary left border; do not repeat its question beside the answer fields. Show each original figure once. Keep any supplemental answer-entry instructions by the fields. Show “Подусловие i от n” only for multipart sources; previous completed subparts stay collapsed with submitted answers and their own solution disclosure. The next action is “Следващо подусловие” or “Следваща задача”; the adventure trail counts steps. Reuse existing question, figure, action bar and token styles. Future answers never enter the browser view.

- `CompetitionCalendar`: shared server-compatible schedule rows with semantic lists, dates, deadline captions and preparation links; use the shared card, spacing and focus tokens. Wrap the date onto its own row on narrow screens. „Ценни материали“ and feedback are available through the shared app menu across course, profiles, progress and the parent’s last-task view; leaving a course follows its existing draft-save path.

### Shared Google email access

Use one owner-only “Сподели достъп” disclosure with a “Google имейл” field and “Добави достъп” action. Existing emails are compact wrapping rows with a quiet right-aligned red outline X, matching the rounded-stroke success tick; reuse button/focus tokens and a minimum 44px target, with an email-specific accessible removal name. Open a native Dialog before changing access: “Сигурен ли си, че искаш да спреш достъпа на {email}?” with primary “Да” and a neutral top-right close action. Initial focus goes to close; close/Escape cancel and restore the trigger, while backdrop clicks do nothing. Prevent dismissal and duplicate submits while pending. Keep failed removals in the dialog for retry; after success focus the access heading. Do not introduce adult/child choices or a separate child-email section. Keep pending old links cancellable until they expire.

After adding access, show the approved ready-to-send message and one outline control with two overlapping rectangles, named “Копирай съобщението” for assistive technology. Show a temporary matching outline tick and a live-region success announcement after copying; if clipboard access fails, focus/select a read-only textarea for manual copying. Disable duplicate submissions while pending, preserve the email draft or existing row on failure, and announce errors. See [shared access](child-sharing.md) for the exact message, authorization and review record.

### Personal progress recognition

Use the shared native `Dialog`, celebratory otter, primary „Продължи“ and existing close X. Recognize a fresh independent solution after the latest same-skill assisted success; show once on the accepted answer, never on resume/reload. No extra gold. Focus enters the dialog and returns to the task heading on close; Escape cancels the overlay. [Learning rules](../key-decisions.md), [approved copy and checks](learning-retention-review.md).


### Combined accomplishment dialog

Owner-approved 2026-11-14: reuse the native personal-progress dialog, celebrating otter, „Личен напредък!“ and „Продължи“. Put learning appreciations first, followed by task and gold daily records, as separate short paragraphs in one dialog. Open only from a new accepted-answer response, never from restored history; restore focus to the exercise heading on dismissal. Preserve native keyboard/Escape behavior and mobile scrolling. Exact approved copy and Astra review: [accomplishments](reviews/accomplishments-2026-11-14.md).

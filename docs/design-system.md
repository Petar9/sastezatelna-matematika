# Design system

Status: compact shared foundation, approved 2026-11-05. Preserve the cream, otter and island identity. Evolve it through real product needs and testing. No external component framework or Storybook dependency is required.

## Sources of truth

- `app/globals.css`: semantic color, spacing, type, radius, focus, sizing and motion tokens.
- `components/ui/`: shared primitives and their states in `ui.module.css`.
- `/design-system`: interactive catalogue and actual landing/onboarding/profile previews. Development only; production returns 404. Uses synthetic data and prevents form submission; never an authentication bypass.
- This document: usage, exceptions and acceptance checklist. `plan.md` records delivered slices and verification.

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
| `Dialog` | Native modal shell with required title/titleId and close action. Caller owns ref, `showModal()`, initial focus, close callback and focus restoration. Browser owns modal focus containment and Escape. |

```tsx
<label htmlFor="email">Имейл на родител</label>
<Input id="email" type="email" required aria-invalid={invalid || undefined}
  aria-describedby={invalid ? "email-error" : undefined} />
{invalid && <Message id="email-error" tone="error" inline>Въведи валиден имейл.</Message>}
<Button type="submit" loading={saving}>Запази</Button>
```

Keep labels visible. Preserve native form validation and server error recovery. Associate inline errors with their fields; retain user input after a failed request. Use links for navigation and buttons for actions. Use one clear primary action per task; secondary and quiet actions do not compete with it.

## Product patterns and deliberate exceptions

- `KidsLearningProgress`: three skill milestones, blue bar, accessible numeric value. `AdventureRoute`: completed tasks in the current adventure. These are different metrics and remain separate components.
- `GoldWallet` and `IslandGoldTotal`: earned gold only, no cumulative maximum or target bar. Do not derive learning confirmation from gold.
- Competition selector, map zoom/pan, island markers, skill selectors, answer options and numeric keypad are domain controls. Retain their selection/keyboard semantics and custom layouts; do not force them into generic buttons. They reuse shared tokens or the compatibility classes in `kids.module.css`.
- `KidsActionBar`: fixed next/check action, safe-area padding, measured content clearance and visual-viewport keyboard adjustment. Preserve its behavior, including multipart and secondary actions. Do not replace it with a normal-flow footer.
- `ProgressCalendar`: shared read-only child/parent calendar. Receives projected competition summaries and dated events, never raw courses or answers. Monday-first months and Europe/Sofia dates; competition filter, labelled day buttons, current-day/selected-day states, inline details, empty days and separately labelled uncertain historical amounts. Three labelled monthly metrics separate gold, independent successes and hinted successes. Empty days show only the date; active cells show gold and the total successfully solved whole tasks. Selected-day headline metrics distinguish independent, hinted, incorrect and revealed attempts. The list groups attempts by competition and catalogue skill, showing successful whole-task counts or “Упражнявано”; raw sources and reward-ledger entries stay out of this list; buttons retain focus and 44px targets at 320px. Loading and retry states belong to `/progress`; parent-only last-task links are supplied by the server. The calendar is a domain component, not a general date picker.
- `FeedbackButton`: permanent quiet action below the content on dashboard, islands, tasks and progress; full navigation footer appears only on the main dashboard. Task context is attached only while a task is visible. The modal preserves the mounted exercise and failed message. Modal focus follows the Dialog contract.
- `ProfileNameForm`: parent/child nickname editing with shared Input, Button and Message. Trims and validates 1–40 characters on the server; retains input on failure, prevents duplicate submissions, announces errors/success and refreshes the saved label. Authorization remains family-scoped; changing a nickname never changes login links or learner IDs.
- Onboarding/profile disclosures retain their native forms and optional child-email step. Landing invitation keeps its single email field and concise recovery state.
- `kids.module.css` exports compatibility classes composed from shared button/surface styles so existing page links and domain layouts stay consistent. New generic controls import primitives directly. Page-specific CSS owns layout, not a competing primitive theme.

## Copy and motion

Short, concrete Bulgarian. Preserve approved “Откриваме заедно”, “Неприпокриващи се случаи”, “Гаранция чрез най-лош случай”. Use “Подсказка” / “Следваща подсказка”, “Верен отговор” / “Грешен отговор”, and one “← Начало” navigation action. Avoid repeated progress headings, explanatory perk blocks and technical recovery wording. Doctor/Professor eligibility remains educational logic; show earned achievements without restoring unearned badge clutter.

Use short transitions (`--motion-fast`) for controls. Progress uses its existing short transition. Respect `prefers-reduced-motion` in controls, progress and celebrations; no essential information may depend on movement.

## Every UI change

1. Read this guide, inspect the catalogue and the existing implementation before designing.
2. Reuse an existing primitive or product pattern. Extend it with a documented state/variant when the same semantic need fits.
3. If a real reusable gap remains, create the smallest complete component in `components/ui` (domain patterns stay with domain components). Document props, states, accessibility and examples here; add it to the gallery in the same change. Keep one-off layouts local.
4. Ask the owner before material new visual/interaction decisions. Do not create hypothetical variants or silently redesign approved behavior.
5. Check keyboard focus and semantics, error/loading/disabled states, long Bulgarian labels, 320/390px mobile and desktop, reduced motion, and the fixed action bar where affected. Do not write learner data for a visual check.
6. Run proportionate interaction tests, `npm run typecheck`, `npm run lint`, and production build. Confirm `/design-system` returns 404 in production. Record results and any limitation in `plan.md`.

## Migration boundary

Shared buttons, fields, messages, badges and dialog now serve landing, onboarding/profiles, feedback and generic learning actions. Remaining specialist map/answer/illustration styles are intentional, not duplicate generic APIs. Migrate remaining legacy generic controls when their screens are changed; do not rebuild unrelated screens or educational state just to expand this library. Follow test feedback before adding more abstraction.

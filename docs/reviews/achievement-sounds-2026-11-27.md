# Achievement sounds - 2026-11-27

## Context
Owner request: sounds that make achievements feel rewarding without overdoing it, tied to the achievement outcome rather than a screen. Default on with a mute toggle (owner decision). Research basis: Duolingo and Khan Academy offer sound effects with a mute setting; Material Design reserves celebratory sounds for rare milestones; per-answer sounds risk distraction and overjustification; sound must not be the only signal; iOS Web Audio obeys the silent switch.

Implementation: two synthesised chords (no audio files) from the accepted answer's outcome in any practice mode. Rules live in [design system](../design-system.md#copy-and-motion) and [key decisions](../../key-decisions.md).

## Independent copy review
Reviewer: independent frontier model, separate from the drafting agent. Input: menu context, both labels, audience (grade 4 and parents), accessibility constraints.

| Location | Wording | Concern | Recommendation | Owner decision |
|---|---|---|---|---|
| App menu sound item, on | „Звук: включен“ | none; a state, not a command; fits the menu's noun items | keep | approved 2026-11-27 |
| App menu sound item, off | „Звук: изключен“ | none | keep | approved 2026-11-27 |

Accessibility note from the review, applied: the state text is a polite live region so screen readers announce the change after a click.

import type { ProgressEvent } from "./progress.ts";

const sofia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" });
export function sofiaDay(value: string | undefined): string | undefined {
 if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return;
 const instant = new Date(value);
 if (!Number.isFinite(instant.getTime())) return;
 const dateOnly = new Date(`${value.slice(0,10)}T00:00:00Z`);
 if (!Number.isFinite(dateOnly.getTime()) || dateOnly.toISOString().slice(0,10) !== value.slice(0,10)) return;
 const parts = Object.fromEntries(sofia.formatToParts(instant).map(part => [part.type, part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}

export function dayProgress(events: ProgressEvent[]) {
 const attempts = events.filter(event => event.kind === "attempt");
 const successfulUnits = attempts.filter(event => event.wholeProblem || event.naturalPart);
 const incorrect = attempts.filter(event => event.outcome === "incorrect");
 return { gold: events.reduce((sum, event) => sum + (event.amount ?? 0), 0),
  independent: successfulUnits.filter(event => event.outcome === "independent").length,
  hinted: successfulUnits.filter(event => event.outcome === "hinted").length,
  incorrect: new Set(incorrect.flatMap(event => event.taskId ? [event.taskId] : [])).size,
  incorrectAttempts: incorrect.length,
  legacyIncorrect: incorrect.filter(event => !event.taskId).length,
  revealed: attempts.filter(event => event.outcome === "revealed").length };
}

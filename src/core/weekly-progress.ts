import type { ProgressCourse, ProgressEvent } from "./progress.ts";
import { dayProgress } from "./progress-calendar.ts";
import { sofiaWeek } from "./progress-week.ts";

export function weeklyProgress(collections: Pick<ProgressCourse, "events">[], day: string) {
 const week = sofiaWeek(day);
 const events = collections.flatMap(course => course.events).filter(event => event.day >= week.start && event.day <= day && event.day <= week.end);
 const attempts = events.filter(event => event.kind === "attempt");
 const achievement = attempts.filter(event => event.outcome === "independent" && event.appreciation)
  .sort((a, b) => Date.parse(b.completedAt ?? `${b.day}T00:00:00Z`) - Date.parse(a.completedAt ?? `${a.day}T00:00:00Z`) || b.key.localeCompare(a.key))[0];
 return { ...week, ...dayProgress(events), activeDays: new Set(attempts.map(event => event.day)).size,
  attempts: attempts.length, achievement: achievement?.appreciation as ProgressEvent["appreciation"] };
}

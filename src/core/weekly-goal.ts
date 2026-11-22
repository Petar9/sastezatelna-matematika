import type { KidsCourse } from "./kids-course.ts";
import { sofiaDay } from "./progress-calendar.ts";
import { sofiaWeek } from "./progress-week.ts";

export interface WeeklyAdventureGoal {
 weekStart: string;
 achieved: boolean;
}

export function weeklyAdventureGoal(course: Pick<KidsCourse, "stamps">, now: string): WeeklyAdventureGoal | undefined {
 const day = sofiaDay(now);
 if (!day) return;
 const week = sofiaWeek(day);
 const instant = Date.parse(now);
 return { weekStart: week.start, achieved: (course.stamps ?? []).some(stamp => {
  const completedDay = sofiaDay(stamp.earnedAt);
  return !!completedDay && completedDay >= week.start && completedDay <= week.end && Date.parse(stamp.earnedAt) <= instant;
 }) };
}

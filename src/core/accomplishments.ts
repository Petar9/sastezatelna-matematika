import type {ConnectedCourseProblem, CourseAttempt, KidsCourse} from "./kids-course.ts";
import {dayProgress, projectProgressCourse, sofiaDay} from "./progress.ts";

export type LearningAppreciation = {kind: "hint-independent" | "whole-problem" | "scheduled-review"};
export type DailyAppreciation = {kind: "daily-tasks" | "daily-gold"; day: string; amount: number};
export type Appreciation = LearningAppreciation | DailyAppreciation;

export function firstIndependentWholeProblem(history: CourseAttempt[], source: ConnectedCourseProblem, completed: CourseAttempt[]) {
 const ids = source.units.map(unit => unit.id);
 const complete = (attempts: CourseAttempt[]) => attempts.length === ids.length && ids.every(id =>
  attempts.some(a => a.problem.naturalUnit?.sourceId === source.sourceId && a.problem.naturalUnit.unitId === id && a.outcome === "independent"));
 if (ids.length < 2 || !complete(completed)) return false;
 if (history.some(a => a.outcome === "independent" && a.problem.archive?.sourceId === source.sourceId && a.problem.archive.kind === "original" && ids.every(id => a.problem.archive!.covers.includes(id)))) return false;
 let previous: CourseAttempt[] = [];
 for (const attempt of history) {
  if (attempt.problem.naturalUnit?.sourceId !== source.sourceId) continue;
  const id = attempt.problem.naturalUnit.unitId;
  if (previous.some(a => a.problem.naturalUnit?.unitId === id)) previous = [];
  previous.push(attempt);
  if (attempt.sourceComplete) {
   if (complete(previous)) return false;
   previous = [];
  }
 }
 return true;
}

export function dailyRecordCandidates(courses: KidsCourse[], now: string): DailyAppreciation[] {
 const today = sofiaDay(now);
 if (!today) return [];
 const events = courses.flatMap((course, index) => projectProgressCourse(course, String(index)).events);
 const earlier = events.filter(event => event.day < today);
 if (!earlier.some(event => event.kind === "attempt")) return [];
 const totals = dayProgress(events.filter(event => event.day === today));
 const previousDays = [...new Set(earlier.map(event => event.day))].map(day => dayProgress(earlier.filter(event => event.day === day)));
 const tasks = totals.independent + totals.hinted;
 const result: DailyAppreciation[] = [];
 if (tasks > Math.max(0, ...previousDays.map(day => day.independent + day.hinted))) result.push({kind: "daily-tasks", day: today, amount: tasks});
 if (totals.gold > Math.max(0, ...previousDays.map(day => day.gold))) result.push({kind: "daily-gold", day: today, amount: totals.gold});
 return result;
}

export function increasedDailyRecords(courses: KidsCourse[], before: KidsCourse, next: KidsCourse, now: string) {
 const day = sofiaDay(now);
 const totals = (course: KidsCourse) => dayProgress(projectProgressCourse(course, "current").events.filter(event => event.day === day));
 const old = totals(before), current = totals(next);
 return dailyRecordCandidates(courses, now).filter(record => record.kind === "daily-tasks"
  ? current.independent + current.hinted > old.independent + old.hinted : current.gold > old.gold);
}

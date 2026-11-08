import type { KidsCourse, CourseAttempt, KidsCourseContent } from "./kids-course.ts";
import { currentPreparationScope, preparationProgress, type PreparationProgress } from "./preparation.ts";
import { courseGoldAwards, goldAmounts, goldKey, problemAwardAmount } from "./kids-gold.ts";

export type ProgressEvent = {
 key: string; day: string; kind: "attempt" | "gold"; label: string;
 outcome?: "independent" | "hinted" | "incorrect" | "revealed";
 wholeProblem?: boolean; naturalPart?: boolean; wholeOriginal?: boolean; amount?: number; skillId?: string; skillTitle?: string;
};
export type ProgressCourse = {
 competitionId: string; summary: { attempts: number; confirmed: number; revisit: number; hasTask: boolean };
 events: ProgressEvent[]; undatedGold: number; undatedAttempts: number;
};
import { sofiaDay } from "./progress-calendar.ts";
export { sofiaDay, dayProgress } from "./progress-calendar.ts";

const successful = (attempt: CourseAttempt) => attempt.outcome === "independent" || attempt.outcome === "hinted";
const milestoneLabels = { started: "Първа стъпка", correct: "Първо откритие", confirmed: "Затвърдено умение" };

// Explicit projection: saved answers, grading fields, login metadata and raw course records stay on the server.
export function projectPreparation(value: unknown, content: KidsCourseContent): PreparationProgress {
 const course = value && typeof value === "object" ? value as KidsCourse : undefined;
 return preparationProgress(course && Array.isArray(course.attempts) && course.topics ? course : { attempts: [], topics: {}, preparationScope: currentPreparationScope(content) } as unknown as KidsCourse, content);
}
export function projectProgressCourse(value: unknown, competitionId: string, content?: Pick<KidsCourseContent, "topics">): ProgressCourse {
 const result: ProgressCourse = { competitionId, summary: { attempts: 0, confirmed: 0, revisit: 0, hasTask: false }, events: [], undatedGold: 0, undatedAttempts: 0 };
 if (!value || typeof value !== "object") return result;
 const course = value as KidsCourse;
 if (!Array.isArray(course.attempts) || !course.topics) return result;
 const skillTitles = new Map(content?.topics.flatMap(topic => topic.skills.map(skill => [skill.id, skill.title] as const)) ?? []);
 const attempts = [...new Map(course.attempts.map(attempt => [attempt.key, attempt])).values()];
 const skills = Object.values(course.topics).flatMap(topic => Object.entries(topic.skills ?? {}));
 result.summary = { attempts: attempts.length, confirmed: skills.filter(([,skill]) => !!skill.confirmedAt).length,
  revisit: skills.filter(([,skill]) => skill.revisit).length,
  hasTask: attempts.length > 0 || Object.values(course.topics).some(topic => Object.values(topic.work ?? {}).some(Boolean) || Object.values(topic.skillWork ?? {}).some(Boolean)) || !!course.quest?.work };
 for (const attempt of attempts) {
  if (!attempt.outcome) continue;
  const day = sofiaDay(attempt.completedAt);
  if (!day) { result.undatedAttempts++; continue; }
  result.events.push({ key: `attempt:${attempt.key}`, kind: "attempt", day,
   label: attempt.problem.source || "Задача", outcome: attempt.outcome,
   skillId: attempt.problem.skillId, skillTitle: skillTitles.get(attempt.problem.skillId) ?? "Други упражнения",
   ...(attempt.problem.naturalUnit ? { naturalPart: attempt.problem.naturalUnit.total > 1, wholeOriginal: attempt.sourceComplete === true } : {}),
   wholeProblem: attempt.problem.naturalUnit ? attempt.problem.naturalUnit.total === 1 : attempt.problem.archive?.kind !== "part" });
 }
 for (const award of courseGoldAwards(course)) {
  const candidates = attempts.filter(attempt => attempt.problem.skillId === award.skillId && !!attempt.outcome && attempt.goldEligible !== false);
  const evidence = award.milestone === "started" ? candidates[0]
   : award.milestone === "correct" ? candidates.find(successful)
   : candidates.find(attempt => attempt.outcome === "independent" && attempt.completedAt === award.earnedAt);
  const day = sofiaDay(award.earnedAt);
  // Older projections can substitute updatedAt or confirmation dates for missing events.
  // A persisted timestamp alone cannot distinguish that reconstruction from actual activity.
  const confirmedDate = skills.find(([id]) => id === award.skillId)?.[1].confirmedAt;
  const supported = evidence?.completedAt === award.earnedAt && (award.milestone !== "confirmed" || confirmedDate === award.earnedAt);
  const amount = goldAmounts[award.milestone];
  if (!day || !supported) result.undatedGold += amount;
  else result.events.push({ key: `gold:${goldKey(award)}`, kind: "gold", day, label: milestoneLabels[award.milestone], amount });
 }
 for (const award of new Map((course.problemGoldAwards ?? []).map(award => [award.key, award])).values()) {
  const day = sofiaDay(award.earnedAt), amount = problemAwardAmount(award);
  if (!day) result.undatedGold += amount;
  else result.events.push({ key: `problem-gold:${award.key}`, kind: "gold", day, label: "Злато за задача", amount });
 }
 return result;
}

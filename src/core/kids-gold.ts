import type { CourseAttempt, CourseProblem, KidsCourse, KidsCourseContent } from "./kids-course.ts";

import { archiveFor, catalogueProblems, difficultyFor, problemIdentity } from "./kids-selection.ts";

const problemGoldPrices = { easy: 10, medium: 15, hard: 20 } as const;
const legacyProblemGoldAmount = 5;
export interface ProblemGoldAward { key: string; skillId: string; earnedAt: string; amount?: number; groupId?: string }
// Missing amounts belong to the pre-multiplier ledger and must never be repriced.
export const problemAwardAmount = (award: ProblemGoldAward) => award.amount ?? legacyProblemGoldAmount;
export function problemGoldRate(problem: CourseProblem, content?: KidsCourseContent) {
 return problemGoldPrices[content?.rewardDifficulty ?? "easy"] + (difficultyFor(problem, content)?.level === "hard" ? 5 : 0);
}
export const goldAmounts = { started: 5, correct: 10, confirmed: 20 } as const;
export type GoldMilestone = keyof typeof goldAmounts;
export interface GoldAward { skillId: string; milestone: GoldMilestone; earnedAt: string }
export interface GoldGain { amount: number; awards: GoldAward[]; problems?: ProblemGoldAward[] }
export const goldKey = (award: Pick<GoldAward, "skillId" | "milestone">) => `${award.skillId}:${award.milestone}`;

// The course is the competition boundary. Historical evidence is projected quietly,
// then persisted with the next revision-guarded command, alongside the learning data.
export function courseGoldAwards(course: KidsCourse): GoldAward[] {
 const awards = new Map((course.goldAwards ?? []).map(award => [goldKey(award), award]));
 const add = (award: GoldAward) => { if (!awards.has(goldKey(award))) awards.set(goldKey(award), award); };
 for (const attempt of course.attempts) {
  if (!attempt.outcome || attempt.goldEligible === false) continue;
  const skillId = attempt.problem.skillId, earnedAt = attempt.completedAt ?? course.updatedAt;
  add({ skillId, milestone: "started", earnedAt });
  if (attempt.outcome === "independent" || attempt.outcome === "hinted") add({ skillId, milestone: "correct", earnedAt });
 }
 for (const topic of Object.values(course.topics)) for (const [skillId, state] of Object.entries(topic.skills)) {
  if (state.confirmedAt) {
   // Older imports can retain confirmation without their individual attempts.
   for (const milestone of ["started", "correct", "confirmed"] as const) add({ skillId, milestone, earnedAt: state.confirmedAt });
  }
 }
 return [...awards.values()];
}
export function courseGoldBalance(course: KidsCourse) {
 return courseGoldAwards(course).reduce((sum, award) => sum + goldAmounts[award.milestone], 0) + distinctProblemAwards(course).reduce((sum, award) => sum + problemAwardAmount(award), 0);
}
function distinctProblemAwards(course: KidsCourse) {
 return [...new Map((course.problemGoldAwards ?? []).map(a => [a.key, a])).values()];
}
const entitlementCatalogues = new WeakMap<KidsCourseContent, Map<string, { key: string; topicId: string; amount: number }>>();
function entitlements(content: KidsCourseContent) {
 let entries = entitlementCatalogues.get(content);
 if (entries) return entries;
 entries = new Map();
 const identities = new Map<string, string>();
 for (const p of catalogueProblems(content)) {
  const archive = archiveFor(p, content), identity = problemIdentity(p);
  const key = archive ? `source:${archive.sourceId}` : identities.get(identity) ?? `problem:${p.id}`;
  identities.set(identity, key);
  entries.set(p.id, { key, amount: problemGoldRate(p, content), topicId: content.topics.find(t => t.skills.some(s => s.id === p.skillId))!.id });
 }
 entitlementCatalogues.set(content, entries);
 return entries;
}
export function problemGoldKey(problem: CourseProblem, content: KidsCourseContent) {
 if (problem.naturalUnit) return `source:${problem.naturalUnit.sourceId}:unit:${problem.naturalUnit.unitId}`;
 return entitlements(content).get(problem.id)?.key ?? (archiveFor(problem, content) ? `source:${archiveFor(problem, content)!.sourceId}` : `problem:${problem.id}`);
}
function alreadyPaid(course: KidsCourse, content: KidsCourseContent, problem: CourseProblem) {
 const key = problemGoldKey(problem, content), unit = problem.naturalUnit;
 const source = archiveFor(problem, content)?.sourceId ?? content.connectedProblem?.(problem)?.sourceId;
 return course.problemGoldAwards?.some(a => a.key === key || (unit && (a.key === `source:${unit.sourceId}` || unit.legacyGoldKeys?.includes(a.key))) || (!unit && source && a.key.startsWith(`source:${source}:unit:`)));
}
export function problemGoldPreview(course: KidsCourse, content: KidsCourseContent, problem: CourseProblem): { amount: number } | undefined {
 if (alreadyPaid(course, content, problem)) return undefined;
 return { amount: problemGoldRate(problem, content) };
}
export function awardProblemGold(course: KidsCourse, content: KidsCourseContent, attempt: CourseAttempt, now: string) {
 if (attempt.problemGoldEligible === false || attempt.goldEligible === false || (attempt.outcome !== "independent" && attempt.outcome !== "hinted")) return;
 const key = problemGoldKey(attempt.problem, content);
 // A future successful attempt can recover missed gold; originals and parts share it.
 if (alreadyPaid(course, content, attempt.problem)) return;
 const amount = problemGoldRate(attempt.problem, content);
 (course.problemGoldAwards ??= []).push({ key, skillId: attempt.problem.skillId, earnedAt: now, amount, ...(attempt.problem.naturalUnit?.groupId ? { groupId: attempt.problem.naturalUnit.groupId } : {}) });
}
export function topicProblemGold(course: KidsCourse, content: KidsCourseContent, topicId: string) {
 const amounts = new Map([...entitlements(content).values()].filter(e => e.topicId === topicId).map(e => [e.key, e.amount]));
 const skills = new Set(content.topics.find(t => t.id === topicId)!.skills.map(s => s.id));
 const awards = distinctProblemAwards(course).filter(a => skills.has(a.skillId));
 // Historical entitlements retain their actual paid amount, even after editorial review.
 for (const award of awards) amounts.set(award.key, problemAwardAmount(award));
 return { earned: awards.reduce((sum, award) => sum + problemAwardAmount(award), 0), total: [...amounts.values()].reduce((sum, amount) => sum + amount, 0) };
}
export function islandGoldTargets(course: KidsCourse, content: KidsCourseContent): Record<string, number> {
 const perSkill = Object.values(goldAmounts).reduce((sum, amount) => sum + amount, 0);
 return Object.fromEntries(content.topics.map(topic => [topic.id,
  course.islandGoldTargets?.[topic.id] ?? topic.skills.length * perSkill + topicProblemGold(course, content, topic.id).total]));
}
export function newGoldGain(before: KidsCourse, after: KidsCourse): GoldGain | undefined {
 const previous = new Set(courseGoldAwards(before).map(goldKey));
 const awards = courseGoldAwards(after).filter(award => !previous.has(goldKey(award)));
 const oldProblems = new Set(distinctProblemAwards(before).map(a => a.key));
 const problems = distinctProblemAwards(after).filter(a => !oldProblems.has(a.key));
 const amount = awards.reduce((sum, award) => sum + goldAmounts[award.milestone], 0) + problems.reduce((sum, award) => sum + problemAwardAmount(award), 0);
 return amount ? { amount, awards, ...(problems.length ? { problems } : {}) } : undefined;
}

import type { CourseProblem, KidsCourse, KidsCourseContent } from "./kids-course.ts";

export const problemIdentity = (p: CourseProblem) => JSON.stringify([p.text, p.options, p.fields.map(f => f.answer)]);
export const isCompetitionProblem = (p: CourseProblem) => p.archive ? p.archive.kind !== "scaffold" : !!p.provenance || p.id.endsWith(":original");
const catalogues = new WeakMap<KidsCourseContent, Map<string, CourseProblem>>();
function catalogueFor(content: KidsCourseContent) {
 let catalogue = catalogues.get(content);
 if (!catalogue) {
  catalogue = new Map();
  for (const topic of content.topics) for (const skill of topic.skills) for (const hard of [false, true]) for (let i = 0; i < 1000; i++) {
   const item = content.problem(skill.id, i, hard); if (!item) break; catalogue.set(item.id, item);
  }
  catalogues.set(content, catalogue);
 }
 return catalogue;
}
export function catalogueProblems(content: KidsCourseContent): CourseProblem[] {
 return [...catalogueFor(content).values()];
}
export function difficultyFor(p: CourseProblem, content?: KidsCourseContent) {
 if (p.difficulty || !content) return p.difficulty;
 const canonical = catalogueFor(content).get(p.id);
 return canonical && problemIdentity(canonical) === problemIdentity(p) ? canonical.difficulty : undefined;
}
export function archiveFor(p: CourseProblem, content?: KidsCourseContent) {
 if (p.archive || !content) return p.archive;
 const canonical = catalogueFor(content).get(p.id);
 return canonical && problemIdentity(canonical) === problemIdentity(p) ? canonical.archive : undefined;
}
export const teachingMethod = (content: KidsCourseContent, skillId: string) => content.objectiveMap?.[skillId]?.primary ?? skillId;
export function skillPrerequisitesReady(course: KidsCourse, content: KidsCourseContent, skillId: string) {
 const method = teachingMethod(content, skillId);
 const prerequisites = content.concepts?.find(c => c.id === method)?.prerequisites ?? [];
 return prerequisites.every(concept => content.topics.some(topic => topic.skills.some(skill => {
  const state = course.topics[topic.id]!.skills[skill.id]!;
  return teachingMethod(content, skill.id) === concept && !state.revisit && (!!state.confirmedAt || state.streak > 0);
 })));
}
export function isIntroduction(course: KidsCourse, content: KidsCourseContent, problem: CourseProblem) {
 const method = teachingMethod(content, problem.skillId);
 return content.introductions?.[method]?.problemId === problem.id && isCompetitionProblem(problem)
  && !course.attempts.some(a => teachingMethod(content, a.problem.skillId) === method && a.outcome === "independent");
}
export function overlaps(a: CourseProblem, b: CourseProblem, content?: KidsCourseContent): boolean {
 if (a.id === b.id || problemIdentity(a) === problemIdentity(b)) return true;
 const left = archiveFor(a, content), right = archiveFor(b, content);
 return !!left && !!right && left.sourceId === right.sourceId && left.covers.some(id => right.covers.includes(id));
}
export function pendingProblems(course: KidsCourse, replacingKey?: string) {
 return [...Object.values(course.topics).flatMap(topic => [...Object.values(topic.work), ...Object.values(topic.skillWork ?? {})]), course.quest?.work]
  .filter(work => work && !work.attempt.outcome && work.attempt.key !== replacingKey).map(work => work!.attempt.problem);
}
export function skillReviewDue(course: KidsCourse, topicId: string, skillId: string): string | undefined {
 const state = course.topics[topicId]!.skills[skillId]!;
 return state.reviewDueAt ?? (state.confirmedAt ? new Date(Date.parse(state.lastReviewAt ?? state.confirmedAt) + 2 * 86400000).toISOString() : undefined);
}

// Enumerate finite catalogues from the beginning. Saved cursors remain compatible,
// but cannot hide newly prioritised originals after a content-order change.
export function chooseSkillProblem(course: KidsCourse, content: KidsCourseContent, skillId: string, harder: boolean, now: string, review = false, replacingKey?: string) {
 const reserved = pendingProblems(course, replacingKey);
 const history = course.attempts;
 const candidates: { problem: CourseProblem; cursor: number; rank: number }[] = [];
 const ids = new Set<string>();
 for (const pool of harder ? [true] : [false, true]) for (let cursor = 0; cursor < 1000; cursor++) {
  const problem = content.problem(skillId, cursor, pool);
  if (!problem) break;
  if (ids.has(problem.id)) continue;
  ids.add(problem.id);
  // Harder authored tasks remain challenges, rather than filling exhausted core pools.
  if (!harder && pool && !isCompetitionProblem(problem)) continue;
  if (reserved.some(p => overlaps(p, problem, content))) continue;
  const seen = history.filter(a => overlaps(a.problem, problem, content));
  if (seen.length && (!review || seen.some(a => !a.completedAt || Date.parse(now) - Date.parse(a.completedAt) < 2 * 86400000))) continue;
  const rank = isCompetitionProblem(problem) ? problem.archive?.kind === "part" ? 3 : 4 : problem.archive?.kind === "scaffold" ? 1 : 0;
  candidates.push({ problem, cursor, rank: rank + (seen.length ? -10 : 0) + (!harder && isIntroduction(course, content, problem) ? 2 : 0) });
 }
 candidates.sort((a, b) => b.rank - a.rank);
 return candidates[0];
}

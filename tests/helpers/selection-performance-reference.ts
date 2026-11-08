// Unindexed selector used for synthetic parity checks and benchmarks; routing policies match production.
import type { CourseMode, CourseProblem, KidsCourse, KidsCourseContent, QuestKind } from "../../src/core/kids-course.ts";
import { pendingProblems, overlaps, isCompetitionProblem, isIntroduction, teachingMethod, skillReviewDue, skillPrerequisitesReady } from "../../src/core/kids-selection.ts";
export function referenceSkillProblem(course: KidsCourse, content: KidsCourseContent, skillId: string, harder: boolean, now: string, review = false, replacingKey?: string) {
 const reserved = pendingProblems(course, replacingKey);
 const history = course.attempts;
 const lastReview = review ? history.findLast(a => a.problem.skillId === skillId && a.mode === "review" && a.outcome === "independent") : undefined;
 const preferPractice = lastReview && isCompetitionProblem(lastReview.problem);
 const candidates: { problem: CourseProblem; cursor: number; rank: number }[] = [];
 const ids = new Set<string>();
 for (const pool of harder ? [true] : [false, true]) for (let cursor = 0; cursor < 1000; cursor++) {
  const problem = content.problem(skillId, cursor, pool);
  if (!problem) break;
  if (ids.has(problem.id)) continue;
  ids.add(problem.id);
  // Harder authored tasks can support review, but never fill exhausted core pools.
  if (!harder && !review && pool && !isCompetitionProblem(problem)) continue;
  if (reserved.some(p => overlaps(p, problem, content))) continue;
  const seen = history.filter(a => overlaps(a.problem, problem, content));
  if (seen.length && (!review || seen.some(a => !a.completedAt || Date.parse(now) - Date.parse(a.completedAt) < 2 * 86400000))) continue;
  const rank = isCompetitionProblem(problem) ? problem.archive?.kind === "part" ? 3 : 4 : problem.archive?.kind === "scaffold" ? 1 : 0;
  candidates.push({ problem, cursor, rank: rank + (preferPractice && !isCompetitionProblem(problem) ? 5 : 0) + (seen.length ? -10 : 0) + (!harder && isIntroduction(course, content, problem) ? 2 : 0) });
 }
 candidates.sort((a, b) => b.rank - a.rank);
 return candidates[0];
}

export function referenceQuestProblem(course: KidsCourse, content: KidsCourseContent, now: string, preferredSkill?: string, availabilityOnly = false) {
 const quest = course.quest!;
 const previous = quest.steps.at(-1);
 const primary = (id: string) => teachingMethod(content, id);
 const attempts = course.attempts.filter(a => a.questId === quest.id);
 const last = attempts.at(-1), penultimate = attempts.at(-2);
 const lastMethod = last && primary(last.problem.skillId);
 const paired = !!last && !!penultimate && primary(penultimate.problem.skillId) === lastMethod;
 const followup = last && !paired;
 const opening = quest.completed === 0;
 const known = new Set(course.attempts.filter(a => a.outcome === "independent").map(a => primary(a.problem.skillId)));
 const prerequisites = (id: string) => content.concepts?.find(c => c.id === primary(id))?.prerequisites ?? [];
 const failures = course.attempts.filter(a => a.questId === quest.id && a.outcome !== "independent");
 const diagnosticCount = quest.steps.filter(s => s.kind === "diagnostic").length;
 // An observed difficulty is already a useful routing result. Avoid extending the test to fill a quota.
 const enoughEvidence = quest.diagnosticFor ? diagnosticCount >= 1 && !failures.length || diagnosticCount >= 2 : diagnosticCount >= 2 && failures.length > 0;
 if (diagnosticCount >= 3 || enoughEvidence) quest.diagnostic = false;
 if (followup) quest.diagnostic = false;
 const desired: QuestKind = quest.diagnostic ? "diagnostic" : (["familiar", "gap", "familiar", "gap", "familiar"] as const)[quest.completed]!;
 const focus = followup ? last.problem.skillId : quest.diagnosticFor;
 const focusPrerequisites = focus ? prerequisites(focus) : [];
 const focusConcepts = new Set(focus ? [primary(focus), ...focusPrerequisites, ...(content.objectiveMap?.[focus]?.related ?? [])] : []);
 const ready = (id: string) => skillPrerequisitesReady(course, content, id);
 const candidates: { topicId: string; skillId: string; mode: CourseMode; problem: CourseProblem; kind: QuestKind; cursor: number; score: number }[] = [];
 for (const topic of content.topics) for (const skill of topic.skills) {
  const progress = course.topics[topic.id]!, state = progress.skills[skill.id]!;
  const independent = course.attempts.some(a => a.problem.skillId === skill.id && a.outcome === "independent");
  const familiar = !state.revisit && (!!state.confirmedAt || independent);
  const gap = state.revisit || !state.confirmedAt && state.streak > 0;
  const topicConfirmed = topic.skills.every(s => progress.skills[s.id]!.confirmedAt && !progress.skills[s.id]!.revisit);
  const challenge = !!followup && last.outcome === "independent" && last.problem.skillId === skill.id && topicConfirmed && ready(skill.id);
  const due = skillReviewDue(course, topic.id, skill.id);
  let mode: CourseMode = familiar && !!due && due <= now ? "review" : challenge ? "challenge" : "core";
  let chosen = referenceSkillProblem(course, content, skill.id, mode === "challenge", now, mode === "review");
  if (!chosen && topicConfirmed && ready(skill.id)) {
   mode = "challenge";
   chosen = referenceSkillProblem(course, content, skill.id, true, now);
  }
  if (!chosen) continue;
  const { problem, cursor } = chosen;
  const original = isCompetitionProblem(problem);
  if (desired === "diagnostic" && quest.diagnosticFor && !focusConcepts.has(primary(skill.id))) continue;
  const matches = desired === "diagnostic" ? original && !familiar : desired === "familiar" ? familiar : gap;
  const lastIndex = course.attempts.findLastIndex(a => primary(a.problem.skillId) === primary(skill.id));
  const sameConcept = previous && primary(previous.skillId) === primary(skill.id);
  const related = focus && focusConcepts.has(primary(skill.id));
  // Pair one fresh application with the previous method, then interleave.
  // Introductory choices are editorial, never inferred from length or exam numbering.
  let score = matches ? 10000 : 0;
  if (opening && known.has(primary(skill.id))) score += 60000;
  if (followup && primary(skill.id) === lastMethod) score += 100000 + (original ? 20000 : 0) + (skill.id === last.problem.skillId ? 2000 : 0);
  if (paired && primary(skill.id) === lastMethod) score -= 100000;
  if (isIntroduction(course, content, problem)) score += 4000;
  if (desired === "diagnostic" && !original) score -= 20000;
  if ((desired === "diagnostic" || desired === "gap") && related) score += 1500;
  if (!ready(skill.id) && !gap) score -= 20000;
  if (sameConcept) score -= 600;
  if (previous?.topicId === topic.id) score -= 150;
  if (mode === "review") score += state.lastReviewAt ? 20000 : 500;
  if (original) score += 3000;
  score -= (lastIndex + 1) * 2;

  candidates.push({ topicId: topic.id, skillId: skill.id, mode, problem, cursor, kind: matches || desired === "diagnostic" ? desired : familiar ? "familiar" : gap ? "gap" : "stretch", score });
  if (availabilityOnly) return candidates[0];
 }
 candidates.sort((a, b) => b.score - a.score);
 const chosen = candidates[0];
 if (desired === "diagnostic" && (!chosen || !isCompetitionProblem(chosen.problem))) {
  quest.diagnostic = false;
  return referenceQuestProblem(course, content, now, preferredSkill, availabilityOnly);
 }
 return chosen;
}


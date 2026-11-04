import type { CourseMode, CourseProblem, KidsCourse, KidsCourseContent, LearningConceptView, LearningSkillView, QuestKind } from "./kids-course.ts";

import { chooseSkillProblem, isCompetitionProblem, isIntroduction, teachingMethod, skillReviewDue, skillPrerequisitesReady } from "./kids-selection.ts";

export function learningSkillView(course: KidsCourse, content: KidsCourseContent, topicId: string, now: string): LearningSkillView[] {
 const topic = content.topics.find(t => t.id === topicId)!;
 const progress = course.topics[topicId]!;
 return topic.skills.map(skill => {
  const state = progress.skills[skill.id]!;
  const concept = content.concepts?.find(c => c.id === content.objectiveMap?.[skill.id]?.primary);
  const evidence = { independent: 0, hinted: 0, incorrect: 0, revealed: 0 };
  let firstCorrect: "independent" | "hinted" | undefined;
  for (const attempt of course.attempts) if (attempt.problem.skillId === skill.id && attempt.outcome) {
   evidence[attempt.outcome]++;
   if (attempt.outcome === "independent" || attempt.outcome === "hinted") firstCorrect ??= attempt.outcome;
  }
  const earned = !!state.confirmedAt;
  const started = Object.values(evidence).some(Boolean);
  return { id: skill.id, title: skill.title,
   prerequisites: (concept?.prerequisites ?? []).map(id => ({ id, title: content.concepts!.find(c => c.id === id)!.title,
    topicIds: content.topics.filter(t => t.skills.some(s => content.objectiveMap?.[s.id]?.primary === id)).map(t => t.id) })),
   status: earned && !state.revisit ? skillReviewDue(course, topicId, skill.id) && skillReviewDue(course, topicId, skill.id)! <= now ? "review" : "confirmed" : started || state.streak > 0 || state.revisit ? "practising" : "untried",
   milestones: { started, ...(firstCorrect ? { firstCorrect } : {}) }, evidence,
   confirmation: { earned, streak: state.streak, target: state.target, revisit: state.revisit } };
 });
}

export function learningMapView(course: KidsCourse, content: KidsCourseContent, topicId: string, now: string): LearningConceptView[] {
 const topic = content.topics.find(t => t.id === topicId)!;
 const ids = new Set(topic.skills.map(s => content.objectiveMap?.[s.id]?.primary).filter(Boolean));
 return (content.concepts ?? []).filter(c => ids.has(c.id)).map(concept => {
  const skills = topic.skills.filter(s => content.objectiveMap?.[s.id]?.primary === concept.id);
  const evidence = { independent: 0, hinted: 0, incorrect: 0, revealed: 0 };
  let firstCorrect: "independent" | "hinted" | undefined;
  for (const a of course.attempts) if (skills.some(s => s.id === a.problem.skillId) && a.outcome) {
   evidence[a.outcome]++;
   if (a.outcome === "independent" || a.outcome === "hinted") firstCorrect ??= a.outcome;
  }
  const progress = course.topics[topicId]!;
  const confirmed = skills.every(s => progress.skills[s.id]!.confirmedAt && !progress.skills[s.id]!.revisit);
  const tried = skills.some(s => progress.skills[s.id]!.streak || progress.skills[s.id]!.revisit) || Object.values(evidence).some(Boolean);
  return { id: concept.id, title: concept.title,
   prerequisites: concept.prerequisites.map(id => ({ id, title: content.concepts!.find(c => c.id === id)!.title,
    topicIds: content.topics.filter(t => t.skills.some(s => content.objectiveMap?.[s.id]?.primary === id)).map(t => t.id) })),
   status: confirmed ? skills.some(s => { const due = skillReviewDue(course, topicId, s.id); return !!due && due <= now; }) ? "review" : "confirmed" : tried ? "practising" : "untried",
   milestones: { started: Object.values(evidence).some(Boolean), ...(firstCorrect ? { firstCorrect } : {}) },
   evidence, objectives: skills.map(s => ({ id: s.id, title: s.title, confirmed: !!progress.skills[s.id]!.confirmedAt, revisit: progress.skills[s.id]!.revisit })) };
 });
}

export function chooseQuestProblem(course: KidsCourse, content: KidsCourseContent, now: string, preferredSkill?: string, availabilityOnly = false) {
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
  let mode: CourseMode = challenge ? "challenge" : familiar && !!due && due <= now ? "review" : "core";
  let chosen = chooseSkillProblem(course, content, skill.id, mode === "challenge", now, mode === "review");
  if (!chosen && topicConfirmed && ready(skill.id)) {
   mode = "challenge";
   chosen = chooseSkillProblem(course, content, skill.id, true, now);
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
  if (mode === "review") score += 500;
  if (original) score += 3000;
  score -= (lastIndex + 1) * 2;

  candidates.push({ topicId: topic.id, skillId: skill.id, mode, problem, cursor, kind: matches || desired === "diagnostic" ? desired : familiar ? "familiar" : gap ? "gap" : "stretch", score });
  if (availabilityOnly) return candidates[0];
 }
 candidates.sort((a, b) => b.score - a.score);
 const chosen = candidates[0];
 if (desired === "diagnostic" && (!chosen || !isCompetitionProblem(chosen.problem))) {
  quest.diagnostic = false;
  return chooseQuestProblem(course, content, now, preferredSkill, availabilityOnly);
 }
 return chosen;
}

export function questAchievement(course: KidsCourse): string {
 const attempts = course.attempts.filter(a => a.questId === course.quest!.id);
 const independent = attempts.filter(a => a.outcome === "independent").length;
 if (independent) return `Реши ${independent} ${independent === 1 ? "задача" : "задачи"} самостоятелно в това приключение.`;
 if (attempts.some(a => a.outcome === "hinted")) return "Намери верен отговор с помощ и упражни нова идея.";
 return `Разгледа ${attempts.length} ${attempts.length === 1 ? "задача и нейното решение" : "задачи и техните решения"}. Запазихме идеите за още упражнение.`;
}

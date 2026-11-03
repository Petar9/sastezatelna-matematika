import type { CourseMode, CourseProblem, KidsCourse, KidsCourseContent, LearningConceptView, LearningSkillView, QuestKind } from "./kids-course.ts";

const identity = (p: CourseProblem) => JSON.stringify([p.text, p.options, p.fields.map(f => f.answer)]);

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
   status: earned && !state.revisit ? progress.reviewDueAt && progress.reviewDueAt <= now ? "review" : "confirmed" : started || state.streak > 0 || state.revisit ? "practising" : "untried",
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
   status: confirmed ? progress.reviewDueAt && progress.reviewDueAt <= now ? "review" : "confirmed" : tried ? "practising" : "untried",
   milestones: { started: Object.values(evidence).some(Boolean), ...(firstCorrect ? { firstCorrect } : {}) },
   evidence, objectives: skills.map(s => ({ id: s.id, title: s.title, confirmed: !!progress.skills[s.id]!.confirmedAt, revisit: progress.skills[s.id]!.revisit })) };
 });
}

export function chooseQuestProblem(course: KidsCourse, content: KidsCourseContent, now: string, preferredSkill?: string) {
 const quest = course.quest!;
 const used = new Set(course.attempts.map(a => identity(a.problem)));
 for (const topic of Object.values(course.topics)) for (const work of Object.values(topic.work)) if (work) used.add(identity(work.attempt.problem));
 const previous = quest.steps.at(-1);
 const primary = (id: string) => content.objectiveMap?.[id]?.primary ?? id;
 const prerequisites = (id: string) => content.concepts?.find(c => c.id === primary(id))?.prerequisites ?? [];
 const failures = course.attempts.filter(a => a.questId === quest.id && a.outcome !== "independent");
 const diagnosticCount = quest.steps.filter(s => s.kind === "diagnostic").length;
 // An observed difficulty is already a useful routing result. Avoid extending the test to fill a quota.
 const enoughEvidence = quest.diagnosticFor ? diagnosticCount >= 1 && !failures.length || diagnosticCount >= 2 : diagnosticCount >= 2 && failures.length > 0;
 if (diagnosticCount >= 3 || enoughEvidence) quest.diagnostic = false;
 const desired: QuestKind = quest.diagnostic ? "diagnostic" : (["familiar", "gap", "familiar", "gap", "stretch"] as const)[quest.completed]!;
 const focus = quest.diagnosticFor ?? failures.at(-1)?.problem.skillId;
 const focusPrerequisites = focus ? prerequisites(focus) : [];
 const focusConcepts = new Set(focus ? [primary(focus), ...focusPrerequisites, ...(content.objectiveMap?.[focus]?.related ?? [])] : []);
 const ready = (id: string) => prerequisites(id).every(concept => content.topics.some(t => t.skills.some(s => {
  const p = course.topics[t.id]!.skills[s.id]!;
  return primary(s.id) === concept && !p.revisit && (!!p.confirmedAt || p.streak > 0);
 })));
 const candidates: { topicId: string; skillId: string; mode: CourseMode; problem: CourseProblem; kind: QuestKind; cursor: number; score: number }[] = [];
 for (const topic of content.topics) for (const skill of topic.skills) {
  const progress = course.topics[topic.id]!, state = progress.skills[skill.id]!;
  const independent = course.attempts.some(a => a.problem.skillId === skill.id && a.outcome === "independent");
  const familiar = !state.revisit && (!!state.confirmedAt || independent);
  const gap = state.revisit || !state.confirmedAt && state.streak > 0;
  const topicConfirmed = topic.skills.every(s => progress.skills[s.id]!.confirmedAt && !progress.skills[s.id]!.revisit);
  const challenge = desired === "stretch" && topicConfirmed && !progress.professorAt && ready(skill.id);
  const mode: CourseMode = challenge ? "challenge" : familiar && progress.doctorAt && !!progress.reviewDueAt && progress.reviewDueAt <= now ? "review" : "core";
  let cursor = mode === "challenge" ? state.nextHard : state.nextCore;
  let problem = content.problem(skill.id, cursor, mode === "challenge");
  while (problem && cursor < 1000 && used.has(identity(problem))) problem = content.problem(skill.id, ++cursor, mode === "challenge");
  if (!problem || cursor >= 1000) continue;
  const original = !!problem.provenance || problem.id.endsWith(":original");
  if (desired === "diagnostic" && focus && !focusConcepts.has(primary(skill.id))) continue;
  const matches = desired === "diagnostic" ? original && !familiar : desired === "familiar" ? familiar : desired === "gap" ? gap : (!familiar && !gap || challenge) && ready(skill.id);
  const lastIndex = course.attempts.findLastIndex(a => primary(a.problem.skillId) === primary(skill.id));
  const sameConcept = previous && primary(previous.skillId) === primary(skill.id);
  const related = focus && focusConcepts.has(primary(skill.id));
  // Match the teaching category before interleaving; use recency and accessibility to break ties.
  let score = (matches ? 10000 : 0) + (skill.id === preferredSkill ? 50000 : 0);
  if (desired === "diagnostic" && !original) score -= 20000;
  if ((desired === "diagnostic" || desired === "gap") && related) score += 1500;
  if (!ready(skill.id) && !gap) score -= desired === "stretch" ? 20000 : 2000;
  if (sameConcept) score -= 600;
  if (previous?.topicId === topic.id) score -= 150;
  if (mode === "review") score += 100;
  score -= (lastIndex + 1) * 2;
  score += problem.options ? 30 : 0;
  score -= problem.fields.length * 10 + Math.min(problem.text.length, 1000) / 100;
  candidates.push({ topicId: topic.id, skillId: skill.id, mode, problem, cursor, kind: matches || desired === "diagnostic" ? desired : familiar ? "familiar" : gap ? "gap" : "stretch", score });
 }
 candidates.sort((a, b) => b.score - a.score);
 const chosen = candidates[0];
 if (desired === "diagnostic" && (!chosen || !(chosen.problem.provenance || chosen.problem.id.endsWith(":original")))) {
  quest.diagnostic = false;
  return chooseQuestProblem(course, content, now, preferredSkill);
 }
 return chosen;
}

export function questAchievement(course: KidsCourse): string {
 const attempts = course.attempts.filter(a => a.questId === course.quest!.id);
 const independent = attempts.filter(a => a.outcome === "independent").length;
 if (independent) return `Реши ${independent} ${independent === 1 ? "задача" : "задачи"} самостоятелно в това приключение.`;
 if (attempts.some(a => a.outcome === "hinted")) return "Намери верен отговор с помощ и упражни нова идея.";
 return "Разгледа пет задачи и техните решения. Запазихме идеите за още упражнение.";
}

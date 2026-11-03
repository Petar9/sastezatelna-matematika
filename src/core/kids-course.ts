import { KidsError, type KidsOutcome } from "./kids.ts";
import { chooseQuestProblem, learningMapView, learningSkillView, questAchievement } from "./kids-quest.ts";

export type CourseMode = "core" | "challenge" | "review" | "practice";
export interface CourseField { label: string; answer: string }
export interface CourseSolutionPart { title: string; paragraphs: string[] }
export type CourseSolution = [CourseSolutionPart, CourseSolutionPart, CourseSolutionPart];
export interface CourseProblem {
	id: string; skillId: string; text: string; source: string; options?: string[];
	fields: CourseField[]; hint: string; hints?: [string, string, string]; explanation: string[]; solution?: CourseSolution;
	figure?: { src: string; alt: string };
	provenance?: { year: number; objective: string; page: number; video: string };
	teachingFigure?: { src: string; alt: string };
}
export interface CourseSkill { id: string; title: string; lesson: string[]; illustration?: CourseProblem["figure"] }
export interface CourseTopic { id: string; title: string; rewardName: string; skills: CourseSkill[] }
export interface CourseConcept {
 id: string; title: string; prerequisites: string[];
 attention: string; idea: string; workedStep: string;
}
export interface CourseObjectiveMap { primary: string; related: string[] }
export type QuestKind = "familiar" | "gap" | "stretch" | "diagnostic";
export interface CourseQuest {
 id: string; startedAt: string; steps: { key: string; topicId: string; skillId: string; kind: QuestKind }[];
 completed: number; diagnostic: boolean; diagnosticFor?: string; work?: CourseWork;
 completedAt?: string; exhausted?: boolean;
}
export interface QuestStamp { questId: string; earnedAt: string; achievement: string }
export interface LearningConceptView {
 id: string; title: string; prerequisites: { id: string; title: string; topicIds: string[] }[];
 status: "untried" | "practising" | "confirmed" | "review";
 milestones: { started: boolean; firstCorrect?: "independent" | "hinted" };
 evidence: { independent: number; hinted: number; incorrect: number; revealed: number };
 objectives: { id: string; title: string; confirmed: boolean; revisit: boolean }[];
}
export interface LearningSkillView extends Omit<LearningConceptView, "objectives"> {
 confirmation: { earned: boolean; streak: number; target: number; revisit: boolean };
}
export interface KidsCourseContent {
	version: string; topics: CourseTopic[]; concepts?: CourseConcept[]; objectiveMap?: Record<string, CourseObjectiveMap>;
	problem(skillId: string, index: number, harder: boolean): CourseProblem | null;
 solutionFor?(problem: CourseProblem): CourseSolution | undefined;
}
export interface CourseAttempt {
	key: string; problem: CourseProblem; mode: CourseMode; hintUsed: boolean; hintLevel?: number; questId?: string;
	answers?: string[]; reasoning?: string; outcome?: KidsOutcome; completedAt?: string;
}
export interface CourseSkillProgress {
	streak: number; target: number; confirmedAt?: string; gap: boolean; revisit: boolean;
	nextCore: number; nextHard: number;
}
export interface CourseWork { attempt: CourseAttempt; lessonStep?: number }
export interface CourseTopicProgress {
	skills: Record<string, CourseSkillProgress>; work: Partial<Record<CourseMode, CourseWork>>;
	learningMode?: Exclude<CourseMode, "review">;
	challengeStreak: number; reviewStreak: number; doctorAt?: string; professorAt?: string;
	reviewDueAt?: string; lastReviewAt?: string; challengeNext: number; reviewNext: number;
}
export interface KidsCourse {
	version: 2; questVersion?: 1; journey?: "quest" | "topic"; quest?: CourseQuest; stamps?: QuestStamp[]; diagnostics?: { initialDone: boolean; checked: Record<string, number> }; contentVersion: string; revision: number; createdAt: string; updatedAt: string;
	paused: boolean; active?: { topicId: string; mode: CourseMode }; topics: Record<string, CourseTopicProgress>;
	attempts: CourseAttempt[]; awards: { topicId: string; rank: "doctor" | "professor"; earnedAt: string; taskKey: string }[];
	completedAt?: string;
	previousCompletions?: { contentVersion: string; completedAt: string }[];
}
export type CourseAction =
	| { type: "selectTopic"; topicId: string; review?: boolean }
	| { type: "answer"; taskKey: string; answers: string[]; reasoning?: string }
	| { type: "dontKnow"; taskKey: string; reasoning?: string }
	| { type: "hint"; taskKey: string; reasoning?: string }
	| { type: "reveal"; taskKey: string; reasoning?: string }
	| { type: "startQuest" }
	| { type: "nextQuestion" | "lessonNext" | "pause" | "resume" | "dashboard" };
export interface CourseTopicView {
	id: string; title: string; rewardName: string; doctor: boolean; professor: boolean;
	confirmed: number; total: number; reviewDue: boolean; reviewDueAt?: string; needsPractice: boolean;
	concepts?: LearningConceptView[];
	leaves?: LearningSkillView[];
	skills: { id: string; title: string; confirmed: boolean; streak: number; target: number; revisit: boolean }[];
}
export interface KidsCourseView {
	revision: number; paused: boolean; active?: { topicId: string; mode: CourseMode };
	topics: CourseTopicView[]; doctors: number; professors: number; professorGoal: number; complete: boolean; previouslyCompleted?: boolean;
	quest?: { id: string; completed: number; total: 5; step: number; finished: boolean; exhausted: boolean; achievement?: string };
 stamps?: QuestStamp[]; inQuest?: boolean;
 stage: "dashboard" | "question" | "lesson" | "questComplete"; streak?: number; target?: number; exhausted?: boolean;
	task?: { key: string; skillId: string; text: string; source: string; options?: string[];
		fields: { label: string }[]; figure?: CourseProblem["figure"]; hint?: string; hints?: string[]; hintLevel?: number; solutionParts?: CourseSolutionPart[];
		outcome?: KidsOutcome; answers?: string[]; explanation?: string[]; reasoning?: string; teachingFigure?: CourseProblem["figure"] };
	lesson?: { title: string; steps: string[]; total: number; illustration?: CourseProblem["figure"] };
	reward?: { rank: "doctor" | "professor"; topic: string };
}
export interface KidsCourseStore {
	read(content?: KidsCourseContent): KidsCourse | null;
	update(revision: number, action: CourseAction, content: KidsCourseContent): KidsCourse;
}

export function newKidsCourse(content: KidsCourseContent, now: string): KidsCourse {
	return { version: 2, questVersion: 1, journey: "topic", stamps: [], diagnostics: { initialDone: false, checked: {} }, contentVersion: content.version, revision: 0, createdAt: now, updatedAt: now,
		paused: false, attempts: [], awards: [], topics: Object.fromEntries(content.topics.map(topic => [topic.id, {
			skills: Object.fromEntries(topic.skills.map(skill => [skill.id, { streak: 0, target: 2, gap: false, revisit: false, nextCore: 0, nextHard: 0 }])),
			work: {}, challengeStreak: 0, reviewStreak: 0, challengeNext: 0, reviewNext: 0,
		}])) };
}

export function migrateKidsCourse(record: KidsCourse, content: KidsCourseContent, now: string): KidsCourse {
	if (record.contentVersion === content.version) {
  if (record.questVersion === 1) return record;
  const upgraded = structuredClone(record);
  upgraded.questVersion = 1; upgraded.journey = "topic"; upgraded.stamps = [];
  upgraded.diagnostics = { initialDone: record.attempts.length > 0, checked: {} };
  for (const topic of Object.values(upgraded.topics)) for (const work of Object.values(topic.work)) {
   if (work) work.attempt.hintLevel = work.attempt.hintUsed ? 1 : 0;
  }
  upgraded.revision++; upgraded.updatedAt = now;
  return upgraded;
 }
	if (record.contentVersion !== "bg4-2024-v1" || content.version !== "bg4-2024-2026-v2") throw new KidsError("Учебният комплект е от несъвместима версия.", 409);
	const course = structuredClone(record), fresh = newKidsCourse(content, now);
	for (const topic of content.topics) {
		const progress = course.topics[topic.id] ??= fresh.topics[topic.id]!;
		let added = false;
		for (const skill of topic.skills) if (!progress.skills[skill.id]) { progress.skills[skill.id] = fresh.topics[topic.id]!.skills[skill.id]!; added = true; }
		// Assigned tasks and lesson steps survive; their next transition returns to new skills.
		if (added && !Object.values(progress.work).some(w => w && (!w.attempt.outcome || w.lessonStep !== undefined))) {
			progress.learningMode = "core";
			if (course.active?.topicId === topic.id && !progress.work[course.active.mode]) { course.active.mode = "core"; progress.work.core ??= nextWork(course, content); }
		}
	}
	if (course.completedAt) {
		(course.previousCompletions ??= []).push({ contentVersion: course.contentVersion, completedAt: course.completedAt });
		delete course.completedAt;
	}
	course.contentVersion = content.version;
 course.questVersion = 1; course.journey ??= "topic"; course.stamps ??= [];
 course.diagnostics ??= { initialDone: course.attempts.length > 0, checked: {} };
 course.revision++; course.updatedAt = now;
	return course;
}

function allSkillsConfirmed(course: KidsCourse, content: KidsCourseContent) {
	return content.topics.every(topic => topic.skills.every(skill => course.topics[topic.id]!.skills[skill.id]!.confirmedAt));
}

export function normalizeCourseNumber(value: string): string | null {
	const clean = value.trim().replace(",", ".");
	if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(clean)) return null;
	return String(Number(clean));
}

function selection(course: KidsCourse, content: KidsCourseContent) {
	const topic = content.topics.find(t => t.id === course.active?.topicId);
	if (!topic || !course.active) throw new KidsError("Избери тема.", 409);
	return { topic, progress: course.topics[topic.id]!, mode: course.active.mode };
}

function nextWork(course: KidsCourse, content: KidsCourseContent, preferredSkill?: string): CourseWork | undefined {
	const { topic, progress, mode } = selection(course, content);
	let skill: CourseSkill;
	if (mode === "core") skill = topic.skills.find(s => s.id === preferredSkill && content.problem(s.id, progress.skills[s.id]!.nextCore, false)) ?? topic.skills.find(s => !progress.skills[s.id]!.confirmedAt || progress.skills[s.id]!.revisit)!;
	else {
		const cursor = mode === "challenge" ? progress.challengeNext : progress.reviewNext;
		skill = topic.skills[cursor % topic.skills.length]!;
	}
	if (!skill) return;
	const state = progress.skills[skill.id]!;
	const harder = mode === "challenge";
	const cursor = harder ? state.nextHard : state.nextCore;
	const problem = content.problem(skill.id, cursor, harder);
	if (!problem) return;
	if (harder) { state.nextHard++; progress.challengeNext++; }
	else { state.nextCore++; if (mode !== "core") progress.reviewNext++; }
	return { attempt: { key: `${course.revision + 1}:${topic.id}:${mode}:${problem.id}`, problem: structuredClone(problem), mode, hintUsed: false } };
}

function activeWork(course: KidsCourse, progress: CourseTopicProgress, mode: CourseMode) {
 return course.journey === "quest" ? course.quest?.work : progress.work[mode];
}

function assignQuestWork(course: KidsCourse, content: KidsCourseContent, now: string, preferredSkill?: string) {
 const quest = course.quest!;
 if (quest.completed >= 5) {
  quest.completedAt = now;
  if (!(course.stamps ??= []).some(s => s.questId === quest.id)) course.stamps.push({ questId: quest.id, earnedAt: now, achievement: questAchievement(course) });
  delete quest.work;
  return;
 }
 const chosen = chooseQuestProblem(course, content, now, preferredSkill);
 if (!chosen) { quest.exhausted = true; delete quest.work; return; }
 const { topicId, skillId, mode, problem, kind, cursor } = chosen;
 const progress = course.topics[topicId]!, state = progress.skills[skillId]!;
 if (mode === "challenge") { state.nextHard = cursor + 1; progress.challengeNext++; }
 else state.nextCore = cursor + 1;
 course.active = { topicId, mode };
 quest.work = { attempt: { key: `${course.revision + 1}:quest:${problem.id}`, problem: structuredClone(problem), mode, hintUsed: false, hintLevel: 0, questId: quest.id } };
 quest.steps.push({ key: quest.work.attempt.key, topicId, skillId, kind });
}

function finishQuestStep(course: KidsCourse, content: KidsCourseContent, now: string) {
 const attempt = course.quest!.work?.attempt;
 const preferredSkill = attempt?.outcome && attempt.outcome !== "independent" ? attempt.problem.skillId : undefined;
 if (preferredSkill) course.quest!.diagnostic = false;
 delete course.quest!.work;
 assignQuestWork(course, content, now, preferredSkill);
}

function dueDate(now: string) { return new Date(Date.parse(now) + 2 * 24 * 60 * 60 * 1000).toISOString(); }

function recordOutcome(course: KidsCourse, content: KidsCourseContent, attempt: CourseAttempt, now: string) {
	const { topic, progress, mode } = selection(course, content);
	const skill = progress.skills[attempt.problem.skillId]!;
	const independent = attempt.outcome === "independent";
	if (!independent) progress.challengeStreak = 0;
	// An outcome in another mode supersedes old feedback, never an unanswered task.
	for (const other of ["core", "challenge", "review", "practice"] as const) {
		if (course.journey !== "quest" && other !== mode && progress.work[other]?.attempt.outcome && progress.work[other]?.lessonStep === undefined) delete progress.work[other];
	}
	if (mode === "core" || mode === "practice") {
		if (independent) {
			skill.streak++;
			if (skill.streak >= skill.target) { skill.confirmedAt ??= now; skill.revisit = false; }
		} else {
			skill.streak = 0;
			if (attempt.outcome !== "hinted") skill.gap = true;
			skill.target = skill.gap ? 2 : 1;
			skill.revisit = true;
		}
	} else if (mode === "challenge") {
		progress.challengeStreak = independent ? progress.challengeStreak + 1 : 0;
		if (!independent) {
			skill.revisit = true; skill.streak = 0;
			skill.gap ||= attempt.outcome !== "hinted"; skill.target = skill.gap ? 2 : 1;
		}
	} else {
		progress.reviewStreak = independent ? progress.reviewStreak + 1 : 0;
		if (independent) {
			progress.lastReviewAt = now; progress.reviewDueAt = dueDate(now);
		} else {
			skill.streak = 0; skill.target = attempt.outcome === "hinted" && !skill.gap ? 1 : 2;
			skill.gap ||= attempt.outcome !== "hinted"; skill.revisit = true;
			progress.learningMode = "core";
			if (course.journey !== "quest" && progress.work.core?.attempt.outcome && progress.work.core.lessonStep === undefined) delete progress.work.core;
		}
	}
	attempt.completedAt = now;
	course.attempts.push(structuredClone(attempt));
 if (course.journey === "quest" && course.quest?.work?.attempt.key === attempt.key) course.quest.completed++;
	if (!progress.doctorAt && topic.skills.every(s => progress.skills[s.id]!.confirmedAt)) {
		progress.doctorAt = now; progress.reviewDueAt = dueDate(now);
		course.awards.push({ topicId: topic.id, rank: "doctor", earnedAt: now, taskKey: attempt.key });
	}
	const recentChallenges = course.attempts.filter(a => a.mode === "challenge" && topic.skills.some(s => s.id === a.problem.skillId)).slice(-2);
 if (mode === "challenge" && progress.doctorAt && !progress.professorAt && progress.challengeStreak >= 2 && topic.skills.every(s => progress.skills[s.id]!.confirmedAt && !progress.skills[s.id]!.revisit)
  && (topic.skills.length === 1 || new Set(recentChallenges.map(a => a.problem.skillId)).size === 2)) {
		progress.professorAt = now;
		course.awards.push({ topicId: topic.id, rank: "professor", earnedAt: now, taskKey: attempt.key });
	}
	const topics = Object.values(course.topics);
	if (allSkillsConfirmed(course, content) && topics.every(t => t.doctorAt) && topics.filter(t => t.professorAt).length >= Math.ceil(content.topics.length / 2)) course.completedAt ??= now;
}

export function applyCourseAction(record: KidsCourse, content: KidsCourseContent, action: CourseAction, now: string): KidsCourse {
	if (record.contentVersion !== content.version) throw new KidsError("Учебният комплект е променен. Нужна е съвместима версия.", 409);
	const course = structuredClone(record);
	if (action.type === "startQuest") {
  course.journey = "quest"; course.paused = false;
  if (!course.quest || course.quest.completedAt || course.quest.exhausted) {
   const diagnostics = course.diagnostics ??= { initialDone: course.attempts.length > 0, checked: {} };
   const unclear = content.topics.flatMap(t => t.skills).find(s => {
    const recent = course.attempts.filter(a => a.problem.skillId === s.id && (a.outcome === "incorrect" || a.outcome === "revealed"));
    const topic = content.topics.find(t => t.skills.some(x => x.id === s.id))!;
    return course.topics[topic.id]!.skills[s.id]!.revisit && recent.length - (diagnostics.checked[s.id] ?? 0) >= 2;
   });
   course.quest = { id: `quest-${course.revision + 1}`, startedAt: now, steps: [], completed: 0,
    diagnostic: !diagnostics.initialDone || !!unclear, diagnosticFor: unclear?.id };
   if (unclear) diagnostics.checked[unclear.id] = course.attempts.filter(a => a.problem.skillId === unclear.id && (a.outcome === "incorrect" || a.outcome === "revealed")).length;
   diagnostics.initialDone = true;
   assignQuestWork(course, content, now);
  } else if (course.quest.work) {
   const a = course.quest.work.attempt;
   course.active = { topicId: content.topics.find(t => t.skills.some(s => s.id === a.problem.skillId))!.id, mode: a.mode };
  }
 } else if (action.type === "pause") course.paused = true;
	else if (action.type === "resume") course.paused = false;
	else if (action.type === "dashboard") { /* Keep the resumable topic and its pause state. */ }
	else if (action.type === "selectTopic") {
		const topic = content.topics.find(t => t.id === action.topicId);
		if (!topic) throw new KidsError("Тази тема не е достъпна.");
		const progress = course.topics[topic.id]!;
		if (action.review && !progress.doctorAt) throw new KidsError("Първо завърши основните умения.");
		const recovery = topic.skills.some(s => !progress.skills[s.id]!.confirmedAt || progress.skills[s.id]!.revisit);
		const mode: CourseMode = action.review ? "review" : progress.learningMode ?? (recovery ? "core" : !progress.professorAt ? "challenge" : "practice");
		course.active = { topicId: topic.id, mode }; course.journey = "topic"; course.paused = false;
		if (mode !== "review") progress.learningMode = mode;
		progress.work[mode] ??= nextWork(course, content);
	} else {
		if (course.paused) throw new KidsError("Първо продължи заниманието.", 409);
		const { topic, progress, mode } = selection(course, content);
		const work = activeWork(course, progress, mode);
		if (!work) throw new KidsError("Подготвените задачи за тази стъпка свършиха. Избери друга тема.", 409);
		const attempt = work.attempt;
		if (action.type === "answer" || action.type === "dontKnow" || action.type === "hint" || action.type === "reveal") {
			if (attempt.outcome || work.lessonStep !== undefined || action.taskKey !== attempt.key) throw new KidsError("Тази задача вече не очаква отговор.", 409);
			if (action.reasoning !== undefined) attempt.reasoning = action.reasoning.trim() || undefined;
			if (action.type === "reveal") { attempt.outcome = "revealed"; }
   else if (action.type === "dontKnow" || action.type === "hint") {
    if (action.type === "dontKnow" && attempt.hintUsed) attempt.outcome = "revealed";
    else {
     const level = attempt.hintLevel ?? (attempt.hintUsed ? 1 : 0);
     if (level >= 3) throw new KidsError("Всички стъпки от решението вече са показани.", 409);
     attempt.hintUsed = true; attempt.hintLevel = level + 1;
    }
   } else {
				const answers = action.answers;
				if (attempt.problem.options) {
					if (answers.length !== 1 || !/^\d+$/.test(answers[0]!) || !attempt.problem.options[Number(answers[0])]) throw new KidsError("Избери един от показаните отговори.");
				} else if (answers.length !== attempt.problem.fields.length || answers.some(a => normalizeCourseNumber(a) === null)) {
					throw new KidsError("Попълни всеки числов отговор. Използвай цифри и запетая при нужда.");
				}
				attempt.answers = answers;
				const correct = answers.every((answer, i) => attempt.problem.options ? answer === attempt.problem.fields[i]!.answer
					: normalizeCourseNumber(answer) === normalizeCourseNumber(attempt.problem.fields[i]!.answer));
				attempt.outcome = correct ? attempt.hintUsed ? "hinted" : "independent" : "incorrect";
			}
			if (attempt.outcome) recordOutcome(course, content, attempt, now);
		} else if (action.type === "lessonNext") {
			if (work.lessonStep === undefined) throw new KidsError("Сега не сме в обяснението.", 409);
			const skill = topic.skills.find(s => s.id === attempt.problem.skillId)!;
			if (work.lessonStep + 1 < skill.lesson.length) work.lessonStep++;
			else if (course.journey === "quest") finishQuestStep(course, content, now);
   else {
				delete progress.work[mode];
				const recovery = topic.skills.some(s => !progress.skills[s.id]!.confirmedAt || progress.skills[s.id]!.revisit);
				course.active!.mode = recovery ? "core" : progress.professorAt ? "practice" : "challenge";
				progress.learningMode = course.active!.mode;
				progress.work[course.active!.mode] ??= nextWork(course, content);
			}
		} else if (action.type === "nextQuestion") {
			if (!attempt.outcome || work.lessonStep !== undefined) throw new KidsError("Първо опитай задачата.", 409);
			if (course.journey === "quest") finishQuestStep(course, content, now);
   else {
				delete progress.work[mode];
				const recovery = topic.skills.some(s => !progress.skills[s.id]!.confirmedAt || progress.skills[s.id]!.revisit);
				course.active!.mode = recovery ? "core" : !progress.professorAt ? "challenge" : "practice";
				progress.learningMode = course.active!.mode;
				progress.work[course.active!.mode] ??= nextWork(course, content, attempt.outcome !== "independent" ? attempt.problem.skillId : undefined);
			}
		}
	}
	course.updatedAt = now; course.revision++;
	return course;
}

function solutionFor(problem: CourseProblem, content: KidsCourseContent): CourseSolution {
 return problem.solution ?? content.solutionFor?.(problem) ?? [
  { title: "Първата стъпка", paragraphs: [problem.explanation[0] ?? problem.hint] },
  { title: "Продължаваме заедно", paragraphs: problem.explanation.slice(1) },
  { title: "Отговор и проверка", paragraphs: problem.fields.map(f => `${f.label}: ${problem.options ? problem.options[Number(f.answer)] : f.answer}.`) },
 ];
}

export function courseView(course: KidsCourse, content: KidsCourseContent, now: string): KidsCourseView {
	const topics: CourseTopicView[] = content.topics.map(t => {
		const p = course.topics[t.id]!;
		return { id: t.id, title: t.title, rewardName: t.rewardName, doctor: !!p.doctorAt, professor: !!p.professorAt,
			confirmed: t.skills.filter(s => p.skills[s.id]!.confirmedAt).length, total: t.skills.length,
			reviewDue: !!p.reviewDueAt && p.reviewDueAt <= now, reviewDueAt: p.reviewDueAt,
			needsPractice: t.skills.some(s => p.skills[s.id]!.revisit || (!!p.doctorAt && !p.skills[s.id]!.confirmedAt)),
			concepts: learningMapView(course, content, t.id, now),
			leaves: learningSkillView(course, content, t.id, now),
   skills: t.skills.map(s => ({ id: s.id, title: s.title, confirmed: !!p.skills[s.id]!.confirmedAt,
				streak: p.skills[s.id]!.streak, target: p.skills[s.id]!.target, revisit: p.skills[s.id]!.revisit })) };
	});
	const view: KidsCourseView = { revision: course.revision, paused: course.paused, active: course.active,
		topics, doctors: topics.filter(t => t.doctor).length, professors: topics.filter(t => t.professor).length,
		professorGoal: Math.ceil(topics.length / 2), complete: !!course.completedAt, previouslyCompleted: !!course.previousCompletions?.length, stage: "dashboard" };
	view.inQuest = course.journey === "quest";
 view.stamps = course.stamps ?? [];
 if (course.quest) view.quest = { id: course.quest.id, completed: course.quest.completed, total: 5,
  step: Math.min(course.quest.steps.length, 5), finished: !!course.quest.completedAt, exhausted: !!course.quest.exhausted,
  achievement: course.stamps?.find(s => s.questId === course.quest!.id)?.achievement };
 if (!course.active || course.paused) return view;
 if (view.inQuest && course.quest?.completedAt) { view.stage = "questComplete"; return view; }
	const { topic, progress, mode } = selection(course, content);
	const work = activeWork(course, progress, mode);
	if (!work) { view.exhausted = true; return view; }
	const a = work.attempt, p = a.problem, state = progress.skills[p.skillId]!;
	view.streak = mode === "challenge" ? progress.challengeStreak : mode === "review" ? progress.reviewStreak : state.streak;
	view.target = mode === "challenge" ? 2 : mode === "review" ? 1 : state.target;
	if (work.lessonStep !== undefined) {
		const skill = topic.skills.find(s => s.id === p.skillId)!;
		view.stage = "lesson"; view.lesson = { title: skill.title, steps: skill.lesson.slice(0, work.lessonStep + 1), total: skill.lesson.length, illustration: skill.illustration };
	} else {
		view.stage = "question";
		view.task = { key: a.key, skillId: p.skillId, text: p.text, source: p.source, options: p.options,
			fields: p.fields.map(f => ({ label: f.label })), figure: p.figure,
   hintLevel: a.hintLevel ?? (a.hintUsed ? 1 : 0),
   ...(a.hintUsed ? { solutionParts: solutionFor(a.problem, content).slice(0, a.hintLevel ?? 1) } : {}),
   ...(a.reasoning ? { reasoning: a.reasoning } : {}),
   ...(a.outcome ? { outcome: a.outcome, answers: a.answers,
    explanation: solutionFor(a.problem, content).flatMap(part => part.paragraphs), teachingFigure: p.teachingFigure } : {}) };
		const award = course.awards.findLast(award => award.taskKey === a.key);
		if (a.outcome && award) view.reward = { rank: award.rank, topic: topic.rewardName };
	}
	return view;
}

export function parseCourseCommand(body: unknown): { revision: number; action: CourseAction } {
	if (!body || typeof body !== "object") throw new KidsError("Невалидна заявка.");
	const { revision, action } = body as Record<string, unknown>;
	if (!Number.isSafeInteger(revision) || (revision as number) < 0 || !action || typeof action !== "object") throw new KidsError("Невалидна заявка.");
	const a = action as Record<string, unknown>;
	if (a.type === "selectTopic" && typeof a.topicId === "string" && (a.review === undefined || typeof a.review === "boolean")) return { revision: revision as number, action: { type: a.type, topicId: a.topicId, review: a.review as boolean | undefined } };
	if (a.type === "answer" || a.type === "dontKnow" || a.type === "hint" || a.type === "reveal") {
		if (typeof a.taskKey !== "string" || a.taskKey.length > 200 || (a.reasoning !== undefined && (typeof a.reasoning !== "string" || a.reasoning.length > 500))) throw new KidsError("Невалиден отговор.");
		if (a.type === "dontKnow" || a.type === "hint" || a.type === "reveal") return { revision: revision as number, action: { type: a.type, taskKey: a.taskKey, reasoning: a.reasoning as string | undefined } };
		if (!Array.isArray(a.answers) || a.answers.length > 12 || a.answers.some(n => typeof n !== "string" || n.length > 20)) throw new KidsError("Невалиден числов отговор.");
		return { revision: revision as number, action: { type: a.type, taskKey: a.taskKey, answers: a.answers as string[], reasoning: a.reasoning as string | undefined } };
	}
	if (a.type === "startQuest" || a.type === "pause" || a.type === "resume" || a.type === "dashboard" || a.type === "lessonNext" || a.type === "nextQuestion") return { revision: revision as number, action: { type: a.type } };
	throw new KidsError("Непознато действие.");
}

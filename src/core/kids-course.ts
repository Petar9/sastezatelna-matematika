import {firstIndependentWholeProblem, type Appreciation, type LearningAppreciation} from "./accomplishments.ts";
import { currentPreparationScope, ensurePreparationScope, preparationProgress, type PreparationProgress, type PreparationScope } from "./preparation.ts";
import { courseGoldAwards, courseGoldBalance, goldAmounts, islandGoldTargets, awardProblemGold, topicProblemGold, problemGoldPreview, problemAwardAmount, type ProblemGoldAward, type GoldAward, type GoldGain } from "./kids-gold.ts";
import { KidsError, type KidsOutcome } from "./kids.ts";
import { chooseSkillProblem, problemSource, isCompetitionProblem, overlaps, reviewDate, skillReviewDue, skillPrerequisitesReady } from "./kids-selection.ts";
import { chooseQuestProblem, hasQuestProblem, learningMapView, learningSkillView, questAchievement } from "./kids-quest.ts";

export type CourseMode = "core" | "challenge" | "review" | "practice";
export interface CourseField { label: string; answer: string }
export interface CourseSolutionPart { title: string; paragraphs: string[] }
export type CourseSolution = [CourseSolutionPart, CourseSolutionPart, CourseSolutionPart];
export interface CourseProblem {
 naturalUnit?: { sourceId: string; unitId: string; total: number; groupId?: string; legacyGoldKeys?: string[] };
 difficulty?: { level: "standard" | "hard"; rationale: string };
	id: string; skillId: string; text: string; source: string; options?: string[];
	fields: CourseField[]; hint: string; hints?: [string, string, string]; explanation: string[]; solution?: CourseSolution;
	figure?: { src: string; alt: string };
	provenance?: { year: number; objective: string; page: number; video?: string };
	teachingFigure?: { src: string; alt: string };
 practiceSource?: { year: number; problemId: string };
 archive?: { sourceId: string; kind: "original" | "part" | "scaffold"; covers: string[] };
}
export interface ConnectedCourseUnit {
 id: string; skillId: string; text: string; fields: CourseField[]; options?: string[];
 solution: CourseSolution; figure?: CourseProblem["figure"]; dependsOn?: string[]; difficulty?: CourseProblem["difficulty"];
}
export interface ConnectedCourseProblem {
 sourceId: string; text: string; introduction?: string; figure?: CourseProblem["figure"];
 figures?: NonNullable<CourseProblem["figure"]>[]; units: ConnectedCourseUnit[]; legacyGoldKeys?: string[];
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
 completed: number; total?: number; diagnostic: boolean; diagnosticFor?: string; work?: CourseWork;
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
 rewardDifficulty?: "easy" | "medium" | "hard";
 preparationBaseline?: PreparationScope;
	version: string; topics: CourseTopic[]; navigationGroups?: { id: string; title: string; topicIds: string[]; sourceIds: string[] }[]; introductions?: Record<string, { problemId?: string; rationale: string }>; concepts?: CourseConcept[]; objectiveMap?: Record<string, CourseObjectiveMap>;
	problem(skillId: string, index: number, harder: boolean): CourseProblem | null;
 connectedProblem?(problem: CourseProblem): ConnectedCourseProblem | undefined;
 solutionFor?(problem: CourseProblem): CourseSolution | undefined;
}
export interface CourseAttempt {
	key: string; problem: CourseProblem; mode: CourseMode; hintUsed: boolean; hintLevel?: number; questId?: string;
	answers?: string[]; reasoning?: string; outcome?: KidsOutcome; completedAt?: string;
 // Explicit exclusions apply only to new attempts; historical awards stay unchanged.
 goldEligible?: false;
 problemGoldEligible?: false;
 draft?: { partIndex: number; answers: string[] };
 sourceComplete?: boolean;
 partIndex?: number; partOutcome?: KidsOutcome; partIncorrect?: boolean; freshEvidence?: boolean; personalProgress?: true; appreciations?: LearningAppreciation[];
}
export interface CourseSkillProgress {
	streak: number; target: number; confirmedAt?: string; gap: boolean; revisit: boolean;
	nextCore: number; nextHard: number; reviewDueAt?: string; lastReviewAt?: string;
}
export interface CourseWork { attempt: CourseAttempt; lessonStep?: number; connected?: { problem: ConnectedCourseProblem; index: number; completed: CourseAttempt[] } }
export interface CourseTopicProgress {
	skills: Record<string, CourseSkillProgress>; work: Partial<Record<CourseMode, CourseWork>>;
	learningMode?: Exclude<CourseMode, "review">;
	skillWork?: Record<string, CourseWork>;
	challengeStreak: number; reviewStreak: number; doctorAt?: string; professorAt?: string;
	reviewDueAt?: string; lastReviewAt?: string; challengeNext: number; reviewNext: number;
}
export interface KidsCourse {
 preparationScope?: PreparationScope;
 questContinuation?: CourseWork;
 goldAwards?: GoldAward[];
 problemGoldAwards?: ProblemGoldAward[];
 islandGoldTargets?: Record<string, number>;
	version: 2; questVersion?: 1; journey?: "quest" | "topic"; quest?: CourseQuest; stamps?: QuestStamp[]; diagnostics?: { initialDone: boolean; checked: Record<string, number> }; contentVersion: string; revision: number; createdAt: string; updatedAt: string;
	paused: boolean; active?: { topicId: string; mode: CourseMode; skillId?: string; groupId?: string }; topics: Record<string, CourseTopicProgress>;
	attempts: CourseAttempt[]; awards: { topicId: string; rank: "doctor" | "professor"; earnedAt: string; taskKey: string }[];
	completedAt?: string;
	previousCompletions?: { contentVersion: string; completedAt: string }[];
}
export type CourseAction =
	| { type: "selectTopic"; topicId: string; review?: boolean; skillId?: string }
	| { type: "saveDraft"; taskKey: string; partIndex: number; answers: string[] }
	| { type: "answer"; taskKey: string; answers: string[]; reasoning?: string }
	| { type: "dontKnow"; taskKey: string; reasoning?: string }
	| { type: "hint"; taskKey: string; reasoning?: string }
	| { type: "reveal"; taskKey: string; reasoning?: string }
	| { type: "startQuest" }
	| { type: "nextQuestion" | "lessonNext" | "pause" | "resume" | "dashboard" };
export interface CourseTopicView {
 gold: { earned: number; total: number };
	id: string; title: string; rewardName: string; doctor: boolean; professor: boolean;
	confirmed: number; total: number; reviewDue: boolean; reviewDueAt?: string; needsPractice: boolean;
	concepts?: LearningConceptView[];
	leaves?: LearningSkillView[];
	skills: { id: string; title: string; confirmed: boolean; streak: number; target: number; revisit: boolean }[];
}
export interface KidsCourseView {
 preparation: PreparationProgress;
 gold: number; goldGain?: GoldGain; appreciations?: Appreciation[]; lastTopicId?: string;
	revision: number; paused: boolean; active?: { topicId: string; mode: CourseMode; skillId?: string; groupId?: string };
	topics: CourseTopicView[]; doctors: number; professors: number; professorGoal: number; complete: boolean; previouslyCompleted?: boolean;
	quest?: { id: string; completed: number; total: number; step: number; finished: boolean; exhausted: boolean; achievement?: string };
 stamps?: QuestStamp[]; inQuest?: boolean; questAvailable?: boolean; nextReviewAt?: string;
 stage: "dashboard" | "question" | "lesson" | "questComplete"; streak?: number; target?: number; exhausted?: boolean;
	task?: { personalProgress?: true; goldReward?: { amount: number }; key: string; skillId: string; text: string; source: string; sourceYear?: number; sourceProblemId?: string; sourceIsPractice?: boolean; options?: string[];
		connected?: { sourceId: string; text: string; introduction?: string; figures?: NonNullable<CourseProblem["figure"]>[]; index: number; total: number; completed: { id: string; text: string; outcome: KidsOutcome; answers: string[]; fields: { label: string }[]; explanation: string[] }[] };
		fields: { label: string }[]; part?: { index: number; total: number; completed: boolean }; figure?: CourseProblem["figure"]; hint?: string; hints?: string[]; hintLevel?: number; solutionParts?: CourseSolutionPart[];
		draft?: string[]; outcome?: KidsOutcome; answers?: string[]; explanation?: string[]; reasoning?: string; teachingFigure?: CourseProblem["figure"] };
	lesson?: { title: string; steps: string[]; total: number; illustration?: CourseProblem["figure"] };
	reward?: { rank: "doctor" | "professor"; topic: string };
}
export interface KidsCourseStore {
 claimDailyRecords?(before: KidsCourse, next: KidsCourse, now: string): Appreciation[];
 goldBalance?(current: KidsCourse): number;
	read(content?: KidsCourseContent): KidsCourse | null;
	update(revision: number, action: CourseAction, content: KidsCourseContent): KidsCourse;
}

export function newKidsCourse(content: KidsCourseContent, now: string): KidsCourse {
	const course: KidsCourse = { version: 2, questVersion: 1, journey: "topic", stamps: [], diagnostics: { initialDone: false, checked: {} }, contentVersion: content.version, revision: 0, createdAt: now, updatedAt: now,
		paused: false, attempts: [], awards: [], topics: Object.fromEntries(content.topics.map(topic => [topic.id, {
			skills: Object.fromEntries(topic.skills.map(skill => [skill.id, { streak: 0, target: 2, gap: false, revisit: false, nextCore: 0, nextHard: 0 }])),
			work: {}, challengeStreak: 0, reviewStreak: 0, challengeNext: 0, reviewNext: 0,
		}])) };
 course.preparationScope = currentPreparationScope(content);
 course.islandGoldTargets = islandGoldTargets(course, content);
 return course;
}

export function migrateKidsCourse(record: KidsCourse, content: KidsCourseContent, now: string): KidsCourse {
	if (record.contentVersion === content.version) {
  if (record.questVersion === 1) return refreshUntriedPractice(record, content, now);
  const upgraded = structuredClone(record);
  upgraded.questVersion = 1; upgraded.journey = "topic"; upgraded.stamps = [];
  upgraded.diagnostics = { initialDone: record.attempts.length > 0, checked: {} };
  for (const topic of Object.values(upgraded.topics)) for (const work of Object.values(topic.work)) {
   if (work) work.attempt.hintLevel = work.attempt.hintUsed ? 1 : 0;
  }
  upgraded.revision++; upgraded.updatedAt = now;
  return refreshUntriedPractice(upgraded, content, now);
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
	return refreshUntriedPractice(course, content, now);
}

function refreshUntriedPractice(record: KidsCourse, content: KidsCourseContent, now: string): KidsCourse {
 const course = structuredClone(record);
 let changed = false;
 const replace = (work: CourseWork | undefined, slot: string) => {
  if (!work) return;
  const a = work.attempt;
  if (isCompetitionProblem(a.problem) || a.outcome || a.completedAt || a.hintUsed || a.hintLevel || a.answers?.length || a.draft || a.reasoning || a.partIndex || a.partOutcome || a.partIncorrect || work.lessonStep !== undefined) return;
  const chosen = chooseSkillProblem(course, content, a.problem.skillId, a.mode === "challenge", now, a.mode === "review", a.key);
  if (!chosen || !isCompetitionProblem(chosen.problem)) return;
  const problem = structuredClone(chosen.problem);
  const key = `${record.revision + 1}:archive:${slot}:${problem.id}`;
  work.attempt = { key, problem, mode: a.mode, hintUsed: false, hintLevel: 0,
   ...(a.questId ? { questId: a.questId } : {}),
   ...(problem.provenance && problem.fields.length > 1 ? { partIndex: 0 } : {}) };
  if (a.questId) for (const step of course.quest?.steps ?? []) if (step.key === a.key) step.key = key;
  changed = true;
 };
 // Honour the visible task first when multiple saved slots need the same source.
 const active = course.active && course.topics[course.active.topicId];
 if (active && course.active) replace(activeWork(course, active, course.active.mode), "active");
 for (const [topicId, topic] of Object.entries(course.topics)) {
  for (const [mode, work] of Object.entries(topic.work)) replace(work, `${topicId}:${mode}`);
  for (const [skill, work] of Object.entries(topic.skillWork ?? {})) replace(work, `${topicId}:${skill}`);
 }
 replace(course.quest?.work, "quest");
 if (!changed) return record;
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

function assignedWork(content: KidsCourseContent, attempt: CourseAttempt): CourseWork {
 if (content.connectedProblem && attempt.problem.archive?.kind === "scaffold") attempt.problemGoldEligible = false;
 const connected = content.connectedProblem?.(attempt.problem);
 if (!connected?.units.length || attempt.problem.archive?.kind === "scaffold") return { attempt };
 const work: CourseWork = { attempt, connected: { problem: structuredClone(connected), index: 0, completed: [] } };
 setConnectedAttempt(work, attempt.key, attempt.mode, attempt.questId);
 const groupId = navigationGroup(content, attempt.problem)?.id;
 if (groupId) work.attempt.problem.naturalUnit!.groupId = groupId;
 return work;
}
function setConnectedAttempt(work: CourseWork, key: string, mode: CourseMode, questId?: string) {
 const session = work.connected!, source = session.problem, unit = source.units[session.index]!;
 const previous = work.attempt.problem;
 const dependencyHelp = (unit.dependsOn ?? []).some(id => session.completed.some(a => a.problem.naturalUnit?.unitId === id && a.outcome !== "independent"));
 work.attempt = { key: `${key}:unit:${unit.id}`, mode, hintUsed: dependencyHelp, hintLevel: 0, ...(questId ? { questId } : {}),
  problem: { id: `${source.sourceId}:unit:${unit.id}`, skillId: unit.skillId, text: unit.text, source: previous.source,
   fields: structuredClone(unit.fields), ...(unit.options ? { options: [...unit.options] } : {}),
   hint: unit.solution[0].paragraphs.join("\n"), solution: structuredClone(unit.solution), explanation: unit.solution.flatMap(p => p.paragraphs),
   ...((unit.difficulty ?? previous.difficulty) ? { difficulty: unit.difficulty ?? previous.difficulty } : {}),
   ...((unit.figure ?? source.figure ?? previous.figure) ? { figure: unit.figure ?? source.figure ?? previous.figure } : {}),
   ...(previous.provenance ? { provenance: previous.provenance } : {}),
   archive: { sourceId: source.sourceId, kind: "part", covers: [unit.id] },
   naturalUnit: { sourceId: source.sourceId, unitId: unit.id, total: source.units.length, ...(source.legacyGoldKeys ? { legacyGoldKeys: source.legacyGoldKeys } : {}), ...(previous.naturalUnit?.groupId ? { groupId: previous.naturalUnit.groupId } : {}) } } };
}
function advanceConnected(work: CourseWork, course: KidsCourse) {
 const session = work.connected;
 if (!session || !work.attempt.outcome) return false;
 session.completed.push(structuredClone(work.attempt));
 if (session.index + 1 >= session.problem.units.length) return false;
 session.index++;
 setConnectedAttempt(work, `${course.revision + 1}:connected`, work.attempt.mode, work.attempt.questId);
 return true;
}

function navigationGroup(content: KidsCourseContent, problem: CourseProblem) {
 const sourceId = problem.naturalUnit?.sourceId ?? content.connectedProblem?.(problem)?.sourceId ?? problem.archive?.sourceId;
 return content.navigationGroups?.find(group => sourceId && group.sourceIds.includes(sourceId))
  ?? content.navigationGroups?.find(group => !sourceId && group.topicIds.some(id => content.topics.find(t => t.id === id)?.skills.some(skill => skill.id === problem.skillId)));
}
const navigationSkillCache = new WeakMap<KidsCourseContent, Map<string, CourseSkill[]>>();
function groupSkills(content: KidsCourseContent, groupId?: string) {
 const group = content.navigationGroups?.find(g => g.id === groupId);
 if (!group) return undefined;
 let cached = navigationSkillCache.get(content);
 if (!cached) { cached = new Map(); navigationSkillCache.set(content, cached); }
 if (cached.has(group.id)) return cached.get(group.id)!;
 const ids = new Set<string>();
 for (const topic of content.topics) for (const skill of topic.skills) {
  if (group.topicIds.includes(topic.id)) ids.add(skill.id);
  for (const hard of [false, true]) for (let i = 0; i < 1000; i++) {
   const p = content.problem(skill.id, i, hard); if (!p) break;
   if (navigationGroup(content, p)?.id !== group.id) continue;
   ids.add(skill.id);
   for (const unit of content.connectedProblem?.(p)?.units ?? []) ids.add(unit.skillId);
  }
 }
 const skills = content.topics.flatMap(t => t.skills).filter(skill => ids.has(skill.id));
 cached.set(group.id, skills);
 return skills;
}
function skillState(course: KidsCourse, content: KidsCourseContent, skillId: string) {
 const owner = content.topics.find(t => t.skills.some(s => s.id === skillId))!;
 return course.topics[owner.id]!.skills[skillId]!;
}

function nextWork(course: KidsCourse, content: KidsCourseContent, preferredSkill?: string): CourseWork | undefined {
	const { topic, progress, mode } = selection(course, content);
 let harder = mode === "challenge";
 const skills = groupSkills(content, course.active?.groupId) ?? topic.skills;
 const stateFor = (id: string) => skillState(course, content, id);
 const accepts = course.active?.groupId ? (p: CourseProblem) => navigationGroup(content, p)?.id === course.active!.groupId : undefined;
 const eligible = course.active?.skillId ? skills.filter(s => s.id === course.active!.skillId)
  : mode === "core" ? skills.filter(s => !stateFor(s.id).confirmedAt || stateFor(s.id).revisit)
  : mode === "review" ? skills.filter(s => stateFor(s.id).confirmedAt && !stateFor(s.id).revisit) : [...skills];
 const rotation = mode === "challenge" ? progress.challengeNext : progress.reviewNext;
 if (mode !== "core" && eligible.length) eligible.push(...eligible.splice(0, rotation % eligible.length));
 if (preferredSkill) eligible.sort((a, b) => Number(b.id === preferredSkill) - Number(a.id === preferredSkill));
 let candidates = eligible.flatMap(skill => {
  const chosen = chooseSkillProblem(course, content, skill.id, harder, course.updatedAt, mode === "review", undefined, undefined, false, accepts);
  return chosen ? [{ skill, chosen }] : [];
 });
 if (!candidates.length && mode === "practice" && skills.every(s => stateFor(s.id).confirmedAt && !stateFor(s.id).revisit)) {
  harder = true;
  candidates = eligible.filter(skill => skillPrerequisitesReady(course, content, skill.id)).flatMap(skill => {
   const chosen = chooseSkillProblem(course, content, skill.id, true, course.updatedAt, false, undefined, undefined, false, accepts);
   return chosen ? [{ skill, chosen }] : [];
  });
 }
 // Keep challenge rotation across skills and focused recovery; otherwise prefer the archive.
 if (!harder) candidates.sort((a, b) => Number(b.skill.id === preferredSkill) - Number(a.skill.id === preferredSkill) || b.chosen.rank - a.chosen.rank);
 for (const { skill, chosen } of candidates) {
  const state = stateFor(skill.id);
  if (harder) { state.nextHard = Math.max(state.nextHard, chosen.cursor + 1); progress.challengeNext++; }
  else { state.nextCore = Math.max(state.nextCore, chosen.cursor + 1); if (mode !== "core") progress.reviewNext++; }
  const problem = structuredClone(chosen.problem);
  return assignedWork(content, { key: `${course.revision + 1}:${topic.id}:${mode}:${problem.id}`, problem, mode, hintUsed: false,
   ...(problem.provenance && problem.fields.length > 1 ? { partIndex: 0 } : {}) });
 }
}

function activeWork(course: KidsCourse, progress: CourseTopicProgress, mode: CourseMode) {
 return course.journey === "quest" ? course.quest?.work : course.active?.skillId ? progress.skillWork?.[course.active.skillId] : progress.work[mode];
}

function selectedSkillMode(progress: CourseTopicProgress, skillId: string, now: string): CourseMode {
 const skill = progress.skills[skillId]!;
 const due = skill.reviewDueAt ?? (skill.confirmedAt ? reviewDate(skill.lastReviewAt ?? skill.confirmedAt, !!skill.lastReviewAt) : undefined);
 return !skill.confirmedAt || skill.revisit ? "core" : due && due <= now ? "review" : progress.doctorAt && !progress.professorAt ? "challenge" : "practice";
}

function advanceTopicWork(course: KidsCourse, content: KidsCourseContent, preferredSkill?: string) {
 const { topic, progress, mode } = selection(course, content);
 const skillId = course.active!.skillId;
 if (skillId?.startsWith("navigation:")) {
  delete progress.skillWork![skillId];
  delete course.active!.skillId;
  const recovery = groupSkills(content, course.active?.groupId)!.some(s => !skillState(course, content, s.id).confirmedAt || skillState(course, content, s.id).revisit);
  course.active!.mode = recovery ? "core" : "challenge";
  const next = nextWork(course, content, preferredSkill);
  course.active!.skillId = skillId;
  if (next) progress.skillWork![skillId] = next;
 } else if (skillId) {
  delete progress.skillWork![skillId];
  course.active!.mode = selectedSkillMode(progress, skillId, course.updatedAt);
  const next = nextWork(course, content);
  if (next) progress.skillWork![skillId] = next;
 } else {
  const previousSkill = progress.work[mode]?.attempt.problem.skillId;
  const previousState = previousSkill ? skillState(course, content, previousSkill) : undefined;
  if (!preferredSkill && previousState?.streak && (!previousState.confirmedAt || previousState.revisit)) preferredSkill = previousSkill;
  delete progress.work[mode];
  const recovery = (groupSkills(content, course.active?.groupId) ?? topic.skills).some(s => !skillState(course, content, s.id).confirmedAt || skillState(course, content, s.id).revisit);
  course.active!.mode = recovery ? "core" : progress.professorAt ? "practice" : "challenge";
  progress.learningMode = course.active!.mode;
  progress.work[course.active!.mode] ??= nextWork(course, content, preferredSkill);
 }
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
 if (!chosen) {
  delete quest.work;
  if (quest.completed > 0) {
   quest.total = quest.completed; quest.completedAt = now;
   if (!(course.stamps ??= []).some(s => s.questId === quest.id)) course.stamps.push({ questId: quest.id, earnedAt: now, achievement: questAchievement(course) });
  } else quest.exhausted = true;
  return;
 }
 const { topicId, skillId, mode, problem, kind, cursor } = chosen;
 const progress = course.topics[topicId]!, state = progress.skills[skillId]!;
 if (mode === "challenge") { state.nextHard = cursor + 1; progress.challengeNext++; }
 else state.nextCore = cursor + 1;
 course.active = { topicId, mode };
 quest.work = assignedWork(content, { key: `${course.revision + 1}:quest:${problem.id}`, problem: structuredClone(problem), mode, hintUsed: false, hintLevel: 0, questId: quest.id, ...(problem.provenance && problem.fields.length > 1 ? { partIndex: 0 } : {}) });
 const currentSkill = quest.work.attempt.problem.skillId;
 const currentTopic = content.topics.find(t => t.skills.some(s => s.id === currentSkill))!.id;
 course.active = { topicId: currentTopic, mode };
 quest.steps.push({ key: quest.work.attempt.key, topicId: currentTopic, skillId: currentSkill, kind });
}

function finishQuestStep(course: KidsCourse, content: KidsCourseContent, now: string) {
 const attempt = course.quest!.work?.attempt;
 const preferredSkill = attempt?.outcome && attempt.outcome !== "independent" ? attempt.problem.skillId : undefined;
 if (preferredSkill) course.quest!.diagnostic = false;
 delete course.quest!.work;
 assignQuestWork(course, content, now, preferredSkill);
}


function recordOutcome(course: KidsCourse, content: KidsCourseContent, attempt: CourseAttempt, now: string) {
	const topic = content.topics.find(t => t.skills.some(s => s.id === attempt.problem.skillId))!;
 const progress = course.topics[topic.id]!, mode = attempt.mode;
	const skill = progress.skills[attempt.problem.skillId]!;
	const independent = attempt.outcome === "independent";
 const fresh = !course.attempts.some(a => overlaps(a.problem, attempt.problem, content) || !!attempt.problem.naturalUnit && a.problem.skillId === attempt.problem.skillId && (a.problem.naturalUnit?.sourceId ?? a.problem.archive?.sourceId ?? content.connectedProblem?.(a.problem)?.sourceId) === attempt.problem.naturalUnit.sourceId);
 attempt.freshEvidence = fresh;
 const previous = course.attempts.findLast(a => a.problem.skillId === attempt.problem.skillId && a.completedAt);
 const appreciations: LearningAppreciation[] = [];
 if (independent && fresh && previous?.outcome === "hinted" && previous.hintUsed) {
  attempt.personalProgress = true; appreciations.push({kind: "hint-independent"});
 }
 const connected = (course.quest?.work?.attempt === attempt ? course.quest.work : progress.work[mode]?.attempt === attempt ? progress.work[mode] : Object.values(progress.skillWork ?? {}).find(work => work.attempt === attempt))?.connected;
 if (independent && connected && attempt.sourceComplete && firstIndependentWholeProblem(course.attempts, connected.problem, [...connected.completed, attempt])) appreciations.push({kind: "whole-problem"});
 const due = skillReviewDue(course, topic.id, attempt.problem.skillId);
 if (independent && mode === "review" && due && due <= now) appreciations.push({kind: "scheduled-review"});
 if (appreciations.length) attempt.appreciations = appreciations;
	if (!independent) progress.challengeStreak = 0;
	// An outcome in another mode supersedes old feedback, never an unanswered task.
	for (const other of ["core", "challenge", "review", "practice"] as const) {
		if (course.journey !== "quest" && !course.active?.skillId && other !== mode && progress.work[other]?.attempt.outcome && progress.work[other]?.lessonStep === undefined) delete progress.work[other];
	}
	if (mode === "core" || mode === "practice") {
		if (independent && fresh) {
			skill.streak++;
			if (skill.streak >= skill.target) {
    if (!skill.confirmedAt || skill.revisit) skill.reviewDueAt = reviewDate(now);
    skill.confirmedAt ??= now; skill.revisit = false;
   }
		} else if (!independent) {
			skill.streak = 0;
			if (attempt.outcome !== "hinted") skill.gap = true;
			skill.target = skill.gap ? 2 : 1;
			skill.revisit = true;
		}
	} else if (mode === "challenge") {
		progress.challengeStreak = independent && fresh ? progress.challengeStreak + 1 : 0;
		if (!independent) {
			skill.revisit = true; skill.streak = 0;
			skill.gap ||= attempt.outcome !== "hinted"; skill.target = skill.gap ? 2 : 1;
		}
	} else {
		progress.reviewStreak = independent ? progress.reviewStreak + 1 : 0;
		if (independent) {
			progress.lastReviewAt = now; progress.reviewDueAt = reviewDate(now, true);
   skill.lastReviewAt = now; skill.reviewDueAt = reviewDate(now, true);
		} else {
			skill.streak = 0; skill.target = attempt.outcome === "hinted" && !skill.gap ? 1 : 2;
			skill.gap ||= attempt.outcome !== "hinted"; skill.revisit = true;
			progress.learningMode = "core";
			if (course.journey !== "quest" && progress.work.core?.attempt.outcome && progress.work.core.lessonStep === undefined) delete progress.work.core;
		}
	}
	attempt.completedAt = now;
 if ((attempt.hintLevel ?? 0) >= 3) attempt.goldEligible = false;
 awardProblemGold(course, content, attempt, now);
	course.attempts.push(structuredClone(attempt));
 if (course.journey === "quest" && course.quest?.work?.attempt.key === attempt.key) course.quest.completed++;
	if (!progress.doctorAt && topic.skills.every(s => progress.skills[s.id]!.confirmedAt)) {
		progress.doctorAt = now; progress.reviewDueAt = reviewDate(now);
		course.awards.push({ topicId: topic.id, rank: "doctor", earnedAt: now, taskKey: attempt.key });
	}
	const recentChallenges = course.attempts.filter(a => a.mode === "challenge" && a.freshEvidence !== false && topic.skills.some(s => s.id === a.problem.skillId)).slice(-2);
 if (mode === "challenge" && progress.doctorAt && !progress.professorAt && progress.challengeStreak >= 2 && topic.skills.every(s => progress.skills[s.id]!.confirmedAt && !progress.skills[s.id]!.revisit)
  && (topic.skills.length === 1 || new Set(recentChallenges.map(a => a.problem.skillId)).size === 2)
  && (!attempt.problem.naturalUnit || new Set(recentChallenges.map(a => a.problem.naturalUnit?.sourceId ?? a.problem.archive?.sourceId ?? a.problem.id)).size === 2)) {
		progress.professorAt = now;
		course.awards.push({ topicId: topic.id, rank: "professor", earnedAt: now, taskKey: attempt.key });
	}
	const topics = Object.values(course.topics);
	if (allSkillsConfirmed(course, content) && topics.every(t => t.doctorAt) && topics.filter(t => t.professorAt).length >= Math.ceil(content.topics.length / 2)) course.completedAt ??= now;
}

export function applyCourseAction(record: KidsCourse, content: KidsCourseContent, action: CourseAction, now: string): KidsCourse {
	if (record.contentVersion !== content.version) throw new KidsError("Учебният комплект е променен. Нужна е съвместима версия.", 409);
	const course = structuredClone(record);
 ensurePreparationScope(course, content);
 course.goldAwards = courseGoldAwards(record);
 course.islandGoldTargets = islandGoldTargets(record, content);
 course.updatedAt = now;
	if (action.type === "startQuest") {
  course.journey = "quest"; course.paused = false;
  if (course.quest?.exhausted && !course.quest.completedAt && course.quest.completed > 0) {
   delete course.quest.exhausted;
   assignQuestWork(course, content, now);
  } else if (!course.quest || course.quest.completedAt || course.quest.exhausted) {
   const previousQuest = course.quest;
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
   if (course.questContinuation) {
    course.quest.work = course.questContinuation; delete course.questContinuation;
    const a = course.quest.work.attempt; a.questId = course.quest.id;
    const topicId = content.topics.find(t => t.skills.some(s => s.id === a.problem.skillId))!.id;
    course.active = { topicId, mode: a.mode };
    course.quest.steps.push({ key: a.key, topicId, skillId: a.problem.skillId, kind: "familiar" });
   } else assignQuestWork(course, content, now);
   if (course.quest.exhausted && previousQuest?.completedAt) course.quest = previousQuest;
  } else if (course.quest.work) {
   const a = course.quest.work.attempt;
   course.active = { topicId: content.topics.find(t => t.skills.some(s => s.id === a.problem.skillId))!.id, mode: a.mode };
  }
 } else if (action.type === "pause") course.paused = true;
	else if (action.type === "resume") course.paused = false;
	else if (action.type === "dashboard") { /* Keep the resumable topic and its pause state. */ }
	else if (action.type === "selectTopic") {
		const group = content.navigationGroups?.find(g => g.id === action.topicId);
  if (group && !action.skillId) {
   const saved = Object.entries(course.topics).flatMap(([topicId, p]) => [
    ...Object.entries(p.work).map(([mode, work]) => ({ topicId, mode: mode as CourseMode, work })),
    ...Object.entries(p.skillWork ?? {}).map(([skillId, work]) => ({ topicId, mode: work.attempt.mode, skillId, work })),
   ]).sort((left, right) => {
    const active = course.active && activeWork(course, course.topics[course.active.topicId]!, course.active.mode);
    return Number(right.work?.attempt.key === active?.attempt.key) - Number(left.work?.attempt.key === active?.attempt.key);
   }).find(slot => slot.work && (!slot.work.attempt.outcome || slot.work.lessonStep !== undefined || slot.work.connected && slot.work.connected.index + 1 < slot.work.connected.problem.units.length) && navigationGroup(content, slot.work.attempt.problem)?.id === group.id && (!action.review || slot.mode === "review"));
   const topicId = saved?.topicId ?? group.topicIds[0]!;
   const progress = course.topics[topicId]!;
   const skills = groupSkills(content, group.id)!;
   const recovery = skills.some(s => !skillState(course, content, s.id).confirmedAt || skillState(course, content, s.id).revisit);
   if (action.review && !skills.some(s => skillState(course, content, s.id).confirmedAt)) throw new KidsError("Първо затвърди едно умение.");
   const mode: CourseMode = saved?.mode ?? (action.review ? "review" : recovery ? "core" : "challenge");
   course.active = { topicId, mode, groupId: group.id, ...(saved && "skillId" in saved && typeof saved.skillId === "string" ? { skillId: saved.skillId } : {}) };
   course.journey = "topic"; course.paused = false;
   if (!saved && !progress.work[mode]) {
    progress.work[mode] = nextWork(course, content);
   } else if (!saved) {
    // A historical slot can belong to another new island; keep it and use a group-specific slot.
    const slot = `navigation:${group.id}`;
    course.active.skillId = slot;
    const work = progress.skillWork ??= {};
    delete course.active.skillId;
    const next = nextWork(course, content);
    course.active.skillId = slot;
    if (next) work[slot] = next;
   }
  } else {
  const topic = content.topics.find(t => t.id === action.topicId);
		if (!topic) throw new KidsError("Тази тема не е достъпна.");
		const progress = course.topics[topic.id]!;
		if (action.review && !topic.skills.some(s => progress.skills[s.id]!.confirmedAt)) throw new KidsError("Първо затвърди едно умение.");
		if (action.skillId !== undefined && (action.review || !topic.skills.some(s => s.id === action.skillId))) throw new KidsError("Тази подтема не е достъпна в избрания остров.");
		const recovery = topic.skills.some(s => !progress.skills[s.id]!.confirmedAt || progress.skills[s.id]!.revisit);
		const mode: CourseMode = action.skillId ? progress.skillWork?.[action.skillId]?.attempt.mode ?? selectedSkillMode(progress, action.skillId, now)
   : action.review ? "review" : progress.learningMode ?? (recovery ? "core" : !progress.professorAt ? "challenge" : "practice");
		course.active = { topicId: topic.id, mode, ...(action.skillId ? { skillId: action.skillId } : {}) }; course.journey = "topic"; course.paused = false;
  if (action.skillId) {
   const work = progress.skillWork ??= {};
   const next = work[action.skillId] ?? nextWork(course, content);
   if (next) work[action.skillId] = next;
  } else {
   if (mode !== "review") progress.learningMode = mode;
   progress.work[mode] ??= nextWork(course, content);
  }
  }
	} else {
		if (course.paused) throw new KidsError("Първо продължи заниманието.", 409);
		const { topic, progress, mode } = selection(course, content);
		const work = activeWork(course, progress, mode);
		if (!work) throw new KidsError("Подготвените задачи за тази стъпка свършиха. Избери друга тема.", 409);
		const attempt = work.attempt;
		if (action.type === "saveDraft") {
   if (action.taskKey !== attempt.key || action.partIndex !== (work.connected?.index ?? attempt.partIndex ?? 0) || attempt.outcome || attempt.partOutcome || work.lessonStep !== undefined) throw new KidsError("Задачата е променена. Черновата не е записана.", 409);
   const fields = attempt.partIndex !== undefined ? 1 : attempt.problem.fields.length;
   if (attempt.problem.options ? action.answers.length !== 1 || !/^(|\d+)$/.test(action.answers[0]!) || (action.answers[0] !== "" && !attempt.problem.options[Number(action.answers[0])]) : action.answers.length !== fields || action.answers.some(a => !/^[\d.,]{0,12}$/.test(a))) throw new KidsError("Невалидна чернова.");
   attempt.draft = { partIndex: action.partIndex, answers: [...action.answers] };
  } else if (action.type === "answer" || action.type === "dontKnow" || action.type === "hint" || action.type === "reveal") {
			if (attempt.outcome || attempt.partOutcome || work.lessonStep !== undefined || action.taskKey !== attempt.key) throw new KidsError("Тази задача вече не очаква отговор.", 409);
			if (action.reasoning !== undefined) attempt.reasoning = action.reasoning.trim() || undefined;
			if (action.type === "reveal") { attempt.outcome = "revealed"; }
   else if (action.type === "dontKnow" || action.type === "hint") {
    if (action.type === "dontKnow" && (work.connected ? (attempt.hintLevel ?? 0) > 0 : attempt.hintUsed)) attempt.outcome = "revealed";
    else {
     const level = attempt.hintLevel ?? (attempt.hintUsed ? 1 : 0);
     if (level >= 3) throw new KidsError("Всички стъпки от решението вече са показани.", 409);
     attempt.hintUsed = true; attempt.hintLevel = level + 1;
     if (work.connected && attempt.hintLevel >= 3) attempt.goldEligible = false;
     if (attempt.problem.options) delete attempt.draft;
    }
   } else {
				const answers = action.answers;
				if (attempt.problem.options) {
					if (answers.length !== 1 || !/^\d+$/.test(answers[0]!) || !attempt.problem.options[Number(answers[0])]) throw new KidsError("Избери един от показаните отговори.");
				} else if ((answers.length !== attempt.problem.fields.length && !(attempt.partIndex !== undefined && answers.length === 1)) || answers.some(a => normalizeCourseNumber(a) === null)) {
					throw new KidsError("Попълни всеки числов отговор. Използвай цифри и запетая при нужда.");
				}
				if (attempt.partIndex !== undefined && answers.length === 1 && attempt.problem.fields.length > 1) {
     const index = attempt.partIndex;
     (attempt.answers ??= [])[index] = answers[0]!;
     const correct = normalizeCourseNumber(answers[0]!) === normalizeCourseNumber(attempt.problem.fields[index]!.answer);
     attempt.partIncorrect ||= !correct;
     if (index < attempt.problem.fields.length - 1) attempt.partOutcome = correct ? attempt.hintUsed ? "hinted" : "independent" : "incorrect";
     else attempt.outcome = attempt.partIncorrect ? "incorrect" : attempt.hintUsed ? "hinted" : "independent";
    } else {
    attempt.answers = answers;
				const correct = answers.every((answer, i) => attempt.problem.options ? answer === attempt.problem.fields[i]!.answer
					: normalizeCourseNumber(answer) === normalizeCourseNumber(attempt.problem.fields[i]!.answer));
				attempt.outcome = correct && !attempt.partIncorrect ? attempt.hintUsed ? "hinted" : "independent" : "incorrect";
    }
			}
			if (attempt.outcome || attempt.partOutcome) delete attempt.draft;
			if (attempt.outcome) {
    if (work.connected) attempt.sourceComplete = work.connected.index === work.connected.problem.units.length - 1;
    recordOutcome(course, content, attempt, now);
   }
		} else if (action.type === "lessonNext") {
			if (work.lessonStep === undefined) throw new KidsError("Сега не сме в обяснението.", 409);
			const skill = content.topics.flatMap(t => t.skills).find(s => s.id === attempt.problem.skillId)!;
			if (work.lessonStep + 1 < skill.lesson.length) work.lessonStep++;
			else if (course.journey === "quest") finishQuestStep(course, content, now);
   else advanceTopicWork(course, content);
		} else if (action.type === "nextQuestion") {
			if (work.connected && attempt.outcome && advanceConnected(work, course)) {
    if (course.journey === "quest") {
     if (course.quest!.completed >= 5) { course.questContinuation = work; assignQuestWork(course, content, now); }
     else {
      const next = work.attempt, topicId = content.topics.find(t => t.skills.some(s => s.id === next.problem.skillId))!.id;
      course.active = { topicId, mode: next.mode };
      course.quest!.steps.push({ key: next.key, topicId, skillId: next.problem.skillId, kind: "familiar" });
     }
    }
    course.goldAwards = courseGoldAwards(course); course.updatedAt = now; course.revision++;
    return course;
   } else if (attempt.partOutcome && !attempt.outcome) {
    attempt.partIndex = (attempt.partIndex ?? 0) + 1;
    delete attempt.partOutcome;
    delete attempt.draft;
    course.updatedAt = now; course.revision++;
    return course;
   }
   if (!attempt.outcome || work.lessonStep !== undefined) throw new KidsError("Първо опитай задачата.", 409);
			if (course.journey === "quest") finishQuestStep(course, content, now);
   else advanceTopicWork(course, content, attempt.outcome !== "independent" ? attempt.problem.skillId : undefined);
		}
	}
 course.goldAwards = courseGoldAwards(course);
	course.updatedAt = now; course.revision++;
	return course;
}

function solutionFor(problem: CourseProblem, content: KidsCourseContent): CourseSolution {
 // Use revised wording only when the content provider matches the saved question and answers.
 return content.solutionFor?.(problem) ?? problem.solution ?? [
  { title: "Първата стъпка", paragraphs: [problem.explanation[0] ?? problem.hint] },
  { title: "Продължаваме заедно", paragraphs: problem.explanation.slice(1) },
  { title: "Отговор и проверка", paragraphs: problem.fields.map(f => `${f.label}: ${problem.options ? problem.options[Number(f.answer)] : f.answer}.`) },
 ];
}

export function courseView(course: KidsCourse, content: KidsCourseContent, now: string): KidsCourseView {
 const goldAwards = courseGoldAwards(course);
 const targets = islandGoldTargets(course, content);
	let topics: CourseTopicView[] = content.topics.map(t => {
		const p = course.topics[t.id]!;
  const skillIds = new Set(t.skills.map(skill => skill.id));
  const problemGold = topicProblemGold(course, content, t.id);
  const gold = { earned: goldAwards.filter(award => skillIds.has(award.skillId)).reduce((sum, award) => sum + goldAmounts[award.milestone], 0) + problemGold.earned, total: targets[t.id]! };
		return { id: t.id, title: t.title, gold, rewardName: t.rewardName, doctor: !!p.doctorAt, professor: !!p.professorAt,
			confirmed: t.skills.filter(s => p.skills[s.id]!.confirmedAt).length, total: t.skills.length,
			reviewDue: t.skills.some(s => { const due = skillReviewDue(course, t.id, s.id); return !!due && due <= now; }), reviewDueAt: t.skills.map(s => skillReviewDue(course, t.id, s.id)).filter((due): due is string => !!due).sort()[0],
			needsPractice: t.skills.some(s => p.skills[s.id]!.revisit || (!!p.doctorAt && !p.skills[s.id]!.confirmedAt)),
			concepts: learningMapView(course, content, t.id, now),
			leaves: learningSkillView(course, content, t.id, now),
   skills: t.skills.map(s => ({ id: s.id, title: s.title, confirmed: !!p.skills[s.id]!.confirmedAt,
				streak: p.skills[s.id]!.streak, target: p.skills[s.id]!.target, revisit: p.skills[s.id]!.revisit })) };
	});
 if (content.navigationGroups) {
  const oldTopics = topics;
  topics = content.navigationGroups.map(group => {
   const members = oldTopics.filter(topic => group.topicIds.includes(topic.id));
   const skillIds = new Set(members.flatMap(topic => topic.skills.map(s => s.id)));
   const milestones = goldAwards.filter(a => skillIds.has(a.skillId)).reduce((sum, a) => sum + goldAmounts[a.milestone], 0);
   const awards = [...new Map((course.problemGoldAwards ?? []).map(a => [a.key, a])).values()];
   const earned = milestones + awards.filter(a => a.groupId ? a.groupId === group.id : skillIds.has(a.skillId)).reduce((sum, a) => sum + problemAwardAmount(a), 0);
   const skills = members.flatMap(topic => topic.skills);
   const conceptGroups = new Map<string, LearningConceptView[]>();
   for (const concept of members.flatMap(topic => topic.concepts ?? [])) {
    const list = conceptGroups.get(concept.id) ?? []; list.push(concept); conceptGroups.set(concept.id, list);
   }
   const prerequisites = (items: LearningConceptView["prerequisites"]) => items.map(p => ({ ...p, topicIds: [...new Set(p.topicIds.flatMap(id => content.navigationGroups!.filter(g => g.topicIds.includes(id)).map(g => g.id)))] }));
   const concepts = [...conceptGroups.values()].map(parts => {
    const objectives = parts.flatMap(p => p.objectives), first = parts[0]!;
    const evidence = { independent: 0, hinted: 0, incorrect: 0, revealed: 0 };
    for (const p of parts) for (const outcome of ["independent", "hinted", "incorrect", "revealed"] as const) evidence[outcome] += p.evidence[outcome];
    const status: LearningConceptView["status"] = objectives.every(o => o.confirmed && !o.revisit) ? parts.some(p => p.status === "review") ? "review" : "confirmed" : parts.some(p => p.status !== "untried") ? "practising" : "untried";
    return { ...first, status, objectives, evidence, prerequisites: prerequisites(first.prerequisites),
     milestones: { started: parts.some(p => p.milestones.started), firstCorrect: parts.find(p => p.milestones.firstCorrect)?.milestones.firstCorrect } };
   });
   return { id: group.id, title: group.title, rewardName: group.title,
    gold: { earned, total: Math.max(earned, members.reduce((sum, topic) => sum + topic.gold.total, 0)) },
    doctor: members.length > 0 && members.every(t => t.doctor), professor: members.length > 0 && members.every(t => t.professor),
    confirmed: skills.filter(s => s.confirmed).length, total: skills.length, skills,
    reviewDue: members.some(t => t.reviewDue), reviewDueAt: members.map(t => t.reviewDueAt).filter((d): d is string => !!d).sort()[0],
    needsPractice: members.some(t => t.needsPractice), concepts,
    leaves: members.flatMap(topic => topic.leaves ?? []).map(leaf => ({ ...leaf, prerequisites: prerequisites(leaf.prerequisites) })),
   };
  });
 }
	const lastSkillId = course.attempts.at(-1)?.problem.skillId;
 const activeProgress = course.active && course.topics[course.active.topicId];
 const activeProblem = activeProgress && course.active ? activeWork(course, activeProgress, course.active.mode)?.attempt.problem : undefined;
 const activeGroup = (activeProblem && navigationGroup(content, activeProblem)?.id) ?? course.active?.groupId ?? content.navigationGroups?.find(g => g.topicIds.includes(course.active?.topicId ?? ""))?.id;
 const lastProblem = course.attempts.at(-1)?.problem;
 const lastHistoricTopic = content.topics.find(t => t.skills.some(s => s.id === lastSkillId))?.id;
 const lastTopicId = (lastProblem && navigationGroup(content, lastProblem)?.id) ?? content.navigationGroups?.find(g => g.topicIds.includes(lastHistoricTopic ?? ""))?.id ?? lastHistoricTopic ?? activeGroup ?? course.active?.topicId;
 const view: KidsCourseView = { preparation: preparationProgress(course, content), gold: courseGoldBalance(course), lastTopicId, revision: course.revision, paused: course.paused, active: course.active ? { ...course.active, topicId: activeGroup ?? course.active.topicId } : undefined,
		topics, doctors: topics.filter(t => t.doctor).length, professors: topics.filter(t => t.professor).length,
		professorGoal: Math.ceil(topics.length / 2), complete: !!course.completedAt, previouslyCompleted: !!course.previousCompletions?.length, stage: "dashboard" };
	view.inQuest = course.journey === "quest";
 view.stamps = course.stamps ?? [];
 view.questAvailable = hasQuestProblem(course, content, now);
 view.nextReviewAt = topics.map(t => t.reviewDueAt).filter((date): date is string => !!date && date > now).sort()[0];
 if (course.quest) view.quest = { id: course.quest.id, completed: course.quest.completed, total: course.quest.total ?? 5,
  step: Math.min(course.quest.steps.length, course.quest.total ?? 5), finished: !!course.quest.completedAt, exhausted: !!course.quest.exhausted,
  achievement: course.stamps?.find(s => s.questId === course.quest!.id)?.achievement };
 if (!course.active || course.paused) return view;
 if (view.inQuest && course.quest?.completedAt) { view.stage = "questComplete"; return view; }
	const { topic, progress, mode } = selection(course, content);
	const work = activeWork(course, progress, mode);
	if (!work) { view.exhausted = true; return view; }
	const a = work.attempt, p = a.problem, state = course.topics[content.topics.find(t => t.skills.some(s => s.id === p.skillId))!.id]!.skills[p.skillId]!;
	view.streak = mode === "challenge" ? progress.challengeStreak : mode === "review" ? progress.reviewStreak : state.streak;
	view.target = mode === "challenge" ? 2 : mode === "review" ? 1 : state.target;
	if (work.lessonStep !== undefined) {
		const skill = content.topics.flatMap(t => t.skills).find(s => s.id === p.skillId)!;
		view.stage = "lesson"; view.lesson = { title: skill.title, steps: skill.lesson.slice(0, work.lessonStep + 1), total: skill.lesson.length, illustration: skill.illustration };
	} else {
		view.stage = "question";
		view.task = { ...(a.personalProgress ? { personalProgress: true } : {}), goldReward: a.problemGoldEligible === false || (a.hintLevel ?? 0) >= 3 ? undefined : problemGoldPreview(course, content, p), key: a.key, skillId: p.skillId, text: p.text, source: p.source, ...problemSource(p, content), options: p.options,
			fields: (a.partIndex !== undefined ? [p.fields[a.partIndex]!] : p.fields).map(f => ({ label: f.label })), figure: p.figure,
   ...(a.partIndex !== undefined ? { part: { index: a.partIndex + 1, total: p.fields.length, completed: !!a.partOutcome && !a.outcome } } : {}),
   ...(a.partOutcome && !a.outcome ? { outcome: a.partOutcome, answers: [a.answers![a.partIndex!]!], explanation: [`${p.fields[a.partIndex!]!.label}: ${p.fields[a.partIndex!]!.answer}.`] } : {}),
   draft: a.draft?.partIndex === (work.connected?.index ?? a.partIndex ?? 0) ? a.draft.answers : undefined,
   hintLevel: a.hintLevel ?? (a.hintUsed ? 1 : 0),
   ...(a.hintUsed ? { solutionParts: solutionFor(a.problem, content).slice(0, a.hintLevel ?? 1) } : {}),
   ...(a.reasoning ? { reasoning: a.reasoning } : {}),
   ...(a.outcome ? { outcome: a.outcome, answers: a.partIndex !== undefined && a.answers ? [a.answers[a.partIndex]!] : a.answers,
    explanation: solutionFor(a.problem, content).flatMap(part => part.paragraphs), teachingFigure: p.teachingFigure } : {}) };
  if (work.connected) {
   const c = work.connected;
   view.task.connected = { sourceId: c.problem.sourceId, text: c.problem.text, introduction: c.problem.introduction, figures: c.problem.figures, index: c.index + 1, total: c.problem.units.length,
    completed: c.completed.map(done => ({ id: done.problem.naturalUnit!.unitId, text: done.problem.text, outcome: done.outcome!, answers: done.answers ?? [], fields: done.problem.fields.map(f => ({ label: f.label })), explanation: done.problem.explanation })) };
   view.task.part = { index: c.index + 1, total: c.problem.units.length, completed: !!a.outcome };
  }
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
	if (a.type === "selectTopic" && typeof a.topicId === "string" && (a.review === undefined || typeof a.review === "boolean") && (a.skillId === undefined || (typeof a.skillId === "string" && a.skillId.length > 0 && a.skillId.length <= 100))) return { revision: revision as number, action: { type: a.type, topicId: a.topicId, review: a.review as boolean | undefined, skillId: a.skillId as string | undefined } };
 if (a.type === "saveDraft") {
  if (typeof a.taskKey !== "string" || a.taskKey.length > 200 || !Number.isSafeInteger(a.partIndex) || (a.partIndex as number) < 0 || !Array.isArray(a.answers) || a.answers.length > 12 || a.answers.some(n => typeof n !== "string" || n.length > 12)) throw new KidsError("Невалидна чернова.");
  return { revision: revision as number, action: { type: "saveDraft", taskKey: a.taskKey, partIndex: a.partIndex as number, answers: a.answers as string[] } };
 }
	if (a.type === "answer" || a.type === "dontKnow" || a.type === "hint" || a.type === "reveal") {
		if (typeof a.taskKey !== "string" || a.taskKey.length > 200 || (a.reasoning !== undefined && (typeof a.reasoning !== "string" || a.reasoning.length > 500))) throw new KidsError("Невалиден отговор.");
		if (a.type === "dontKnow" || a.type === "hint" || a.type === "reveal") return { revision: revision as number, action: { type: a.type, taskKey: a.taskKey, reasoning: a.reasoning as string | undefined } };
		if (!Array.isArray(a.answers) || a.answers.length > 12 || a.answers.some(n => typeof n !== "string" || n.length > 20)) throw new KidsError("Невалиден числов отговор.");
		return { revision: revision as number, action: { type: a.type, taskKey: a.taskKey, answers: a.answers as string[], reasoning: a.reasoning as string | undefined } };
	}
	if (a.type === "startQuest" || a.type === "pause" || a.type === "resume" || a.type === "dashboard" || a.type === "lessonNext" || a.type === "nextQuestion") return { revision: revision as number, action: { type: a.type } };
	throw new KidsError("Непознато действие.");
}

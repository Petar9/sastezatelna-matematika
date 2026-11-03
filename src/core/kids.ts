export type KidsOutcome = "independent" | "hinted" | "incorrect" | "revealed";
export type KidsStage = "starter" | "lesson" | "practice" | "recap";

export interface KidsProblem {
	id: string;
	topic: string;
	text: string;
	options: string[];
	correctIndex: number;
	hint: string;
	explanation: string[];
	source: string;
	lesson: { title: string; steps: string[] };
	practiceId?: string;
	extensionId?: string;
}

export interface KidsProfile {
	id: string;
	title: string;
	instructions: string;
	starterPairs: [string, string][];
	problems: Record<string, KidsProblem>;
}

export interface KidsAttempt {
	taskId: string;
	role: "starter" | "practice";
	hintUsed: boolean;
	choice?: number;
	reasoning?: string;
	outcome?: KidsOutcome;
	completedAt?: string;
}

export interface KidsRound {
	stage: KidsStage;
	tasks: KidsAttempt[];
	targetId?: string;
	extension?: boolean;
	lessonStep: number;
}

export interface KidsSession {
	version: 1;
	id: string;
	learningProfile: string;
	createdAt: string;
	updatedAt: string;
	revision: number;
	paused: boolean;
	rounds: KidsRound[];
}

export type KidsAction =
	| { type: "answer"; taskKey: string; choice: number; reasoning?: string }
	| { type: "dontKnow"; taskKey: string; reasoning?: string }
	| { type: "advance" | "lessonNext" | "pause" | "resume" | "finish" | "nextRound" };

export class KidsError extends Error {
	constructor(message: string, public status = 400) { super(message); }
}

export interface KidsSessionSummary {
	id: string;
	updatedAt: string;
	rounds: number;
	paused: boolean;
	stage: KidsStage;
	completedTasks: number;
}

export interface KidsStore {
	read(id: string): KidsSession | null;
	create(profile: KidsProfile): KidsSession;
	list(): KidsSessionSummary[];
	update(id: string, revision: number, action: KidsAction, profile: KidsProfile): KidsSession;
}

export interface KidsView {
	id: string;
	learningProfile: string;
	title: string;
	revision: number;
	paused: boolean;
	stage: KidsStage;
	roundNumber: number;
	taskNumber: number;
	canContinue: boolean;
	task?: {
		key: string;
		text: string;
		options: string[];
		source: string;
		hint?: string;
		outcome?: KidsOutcome;
		choice?: number;
		reasoning?: string;
		explanation?: string[];
	};
	lesson?: { title: string; steps: string[]; totalSteps: number; extension: boolean };
	recap?: { results: { topic: string; outcome: KidsOutcome; role: "starter" | "practice" }[]; lessonTopic?: string };
}

function currentRound(session: KidsSession): KidsRound {
	const round = session.rounds.at(-1);
	if (!round) throw new KidsError("Липсва започнат кръг.");
	return round;
}

function problem(profile: KidsProfile, id: string): KidsProblem {
	const item = profile.problems[id];
	if (!item) throw new KidsError("Тази задача не е достъпна.");
	return item;
}

function newRound(profile: KidsProfile, index: number): KidsRound {
	const pair = profile.starterPairs[index];
	if (!pair) throw new KidsError("Всички подготвени кръгове са завършени.");
	return { stage: "starter", tasks: [{ taskId: pair[0], role: "starter", hintUsed: false }], lessonStep: 0 };
}

export function newKidsSession(profile: KidsProfile, id: string, now: string): KidsSession {
	return { version: 1, id, learningProfile: profile.id, createdAt: now, updatedAt: now,
		revision: 0, paused: false, rounds: [newRound(profile, 0)] };
}

export function kidsTaskKey(session: KidsSession): string {
	return `${session.rounds.length}:${currentRound(session).tasks.length}`;
}

export function kidsSummary(session: KidsSession): KidsSessionSummary {
	return { id: session.id, updatedAt: session.updatedAt, rounds: session.rounds.length,
		paused: session.paused, stage: currentRound(session).stage,
		completedTasks: session.rounds.flatMap(r => r.tasks).filter(t => t.outcome).length };
}

export function applyKidsAction(session: KidsSession, profile: KidsProfile, action: KidsAction, now: string): KidsSession {
	if (session.learningProfile !== profile.id) throw new KidsError("Непознат учебен профил.");
	const next = structuredClone(session);
	const round = currentRound(next);
	const task = round.tasks.at(-1)!;
	if (action.type === "pause") {
		next.paused = true;
	} else if (action.type === "resume") {
		next.paused = false;
	} else {
		if (next.paused) throw new KidsError("Първо продължи заниманието.", 409);
		switch (action.type) {
			case "answer":
			case "dontKnow": {
				if ((round.stage !== "starter" && round.stage !== "practice") || task.outcome || action.taskKey !== kidsTaskKey(next)) {
					throw new KidsError("Тази задача вече не очаква отговор.", 409);
				}
				const item = problem(profile, task.taskId);
				if (action.reasoning !== undefined) {
					if (typeof action.reasoning !== "string" || action.reasoning.length > 500) throw new KidsError("Обяснението може да е до 500 знака.");
					task.reasoning = action.reasoning.trim() || undefined;
				}
				if (action.type === "dontKnow") {
					if (!task.hintUsed) task.hintUsed = true;
					else { task.outcome = "revealed"; task.completedAt = now; }
				} else {
					if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= item.options.length) throw new KidsError("Избери един от показаните отговори.");
					task.choice = action.choice;
					task.outcome = action.choice === item.correctIndex ? (task.hintUsed ? "hinted" : "independent") : "incorrect";
					task.completedAt = now;
				}
				break;
			}
			case "advance": {
				if ((round.stage !== "starter" && round.stage !== "practice") || !task.outcome) throw new KidsError("Първо опитай задачата.", 409);
				if (round.stage === "practice") { round.stage = "recap"; break; }
				if (round.tasks.length === 1) {
					const pair = profile.starterPairs[next.rounds.length - 1]!;
					round.tasks.push({ taskId: pair[1], role: "starter", hintUsed: false });
				} else {
					// A bounded sample identifies a teaching opportunity, never overall mastery.
					const target = round.tasks.find(t => t.outcome !== "independent") ?? task;
					round.targetId = target.taskId;
					round.extension = round.tasks.every(t => t.outcome === "independent");
					round.stage = "lesson";
				}
				break;
			}
			case "lessonNext": {
				if (round.stage !== "lesson" || !round.targetId) throw new KidsError("Сега не сме в обяснението.", 409);
				const target = problem(profile, round.targetId);
				if (round.lessonStep < target.lesson.steps.length - 1) round.lessonStep++;
				else {
					const practiceId = round.extension ? target.extensionId : target.practiceId;
					if (!practiceId) throw new KidsError("Липсва подготвена задача за упражнение.");
					problem(profile, practiceId);
					round.tasks.push({ taskId: practiceId, role: "practice", hintUsed: false });
					round.stage = "practice";
				}
				break;
			}
			case "finish": round.stage = "recap"; break;
			case "nextRound":
				if (round.stage !== "recap") throw new KidsError("Първо завърши текущия кръг.", 409);
				next.rounds.push(newRound(profile, next.rounds.length));
				break;
		}
	}
	next.revision++;
	next.updatedAt = now;
	return next;
}

/** Only released teaching content crosses the child API boundary. */
export function kidsView(session: KidsSession, profile: KidsProfile): KidsView {
	const round = currentRound(session);
	const view: KidsView = { id: session.id, learningProfile: profile.id, title: profile.title,
		revision: session.revision, paused: session.paused, stage: round.stage,
		roundNumber: session.rounds.length, taskNumber: round.tasks.length,
		canContinue: round.stage === "recap" && session.rounds.length < profile.starterPairs.length };
	if (session.paused) return view;
	if (round.stage === "starter" || round.stage === "practice") {
		const task = round.tasks.at(-1)!;
		const item = problem(profile, task.taskId);
		view.task = { key: kidsTaskKey(session), text: item.text, options: [...item.options], source: item.source,
			...(task.hintUsed ? { hint: item.hint } : {}),
			...(task.reasoning ? { reasoning: task.reasoning } : {}),
			...(task.outcome ? { outcome: task.outcome, choice: task.choice, explanation: [...item.explanation] } : {}) };
	} else if (round.stage === "lesson" && round.targetId) {
		const target = problem(profile, round.targetId);
		view.lesson = { title: target.lesson.title, steps: target.lesson.steps.slice(0, round.lessonStep + 1),
			totalSteps: target.lesson.steps.length, extension: round.extension === true };
	} else if (round.stage === "recap") {
		view.recap = { results: round.tasks.filter(t => t.outcome).map(t => ({ topic: problem(profile, t.taskId).topic,
			outcome: t.outcome!, role: t.role })), lessonTopic: round.targetId ? problem(profile, round.targetId).topic : undefined };
	}
	return view;
}

export function parseKidsCommand(body: unknown): { revision: number; action: KidsAction } {
	if (!body || typeof body !== "object") throw new KidsError("Невалидна заявка.");
	const { revision, action } = body as Record<string, unknown>;
	if (!Number.isSafeInteger(revision) || (revision as number) < 0 || !action || typeof action !== "object") throw new KidsError("Невалидна заявка.");
	const { type, taskKey, choice, reasoning } = action as Record<string, unknown>;
	if (type === "answer" || type === "dontKnow") {
		if (typeof taskKey !== "string" || (reasoning !== undefined && (typeof reasoning !== "string" || reasoning.length > 500))) throw new KidsError("Невалиден отговор.");
		if (type === "answer") {
			if (!Number.isSafeInteger(choice)) throw new KidsError("Избери отговор.");
			return { revision: revision as number, action: { type, taskKey, choice: choice as number, reasoning: reasoning as string | undefined } };
		}
		return { revision: revision as number, action: { type, taskKey, reasoning: reasoning as string | undefined } };
	}
	if (type === "advance" || type === "lessonNext" || type === "pause" || type === "resume" || type === "finish" || type === "nextRound") {
		return { revision: revision as number, action: { type } };
	}
	throw new KidsError("Непознато действие.");
}

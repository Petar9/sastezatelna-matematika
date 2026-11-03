import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { applyKidsAction, kidsTaskKey, kidsView, newKidsSession, parseKidsCommand, KidsError } from "../src/core/kids.ts";
import type { KidsAction, KidsSession } from "../src/core/kids.ts";
import { createKidsStore } from "../src/store/kids.ts";
import { bgGrade4Profile as profile } from "../src/server/kids-content.ts";

const now = "2026-11-01T12:00:00.000Z";
const fresh = () => newKidsSession(profile, "kids_12345678-1234-1234-1234-123456789abc", now);
function act(session: KidsSession, action: KidsAction) { return applyKidsAction(session, profile, action, now); }
function answer(session: KidsSession, correct = true) {
	const item = profile.problems[session.rounds.at(-1)!.tasks.at(-1)!.taskId]!;
	return act(session, { type: "answer", taskKey: kidsTaskKey(session), choice: correct ? item.correctIndex : (item.correctIndex + 1) % 4 });
}
function toLesson(session: KidsSession, firstCorrect = true, secondCorrect = true) {
	session = act(answer(session, firstCorrect), { type: "advance" });
	return act(answer(session, secondCorrect), { type: "advance" });
}
function throughLesson(session: KidsSession) {
	for (let i = 0; i < 3; i++) session = act(session, { type: "lessonNext" });
	return session;
}

test("first don't know releases only the hint; second reveals without choosing an answer", () => {
	const initial = fresh();
	const item = profile.problems["M1-03"]!;
	assert.equal(kidsView(initial, profile).task?.hint, undefined);
	assert.equal(kidsView(initial, profile).task?.explanation, undefined);
	assert.ok(!JSON.stringify(kidsView(initial, profile)).includes('correctIndex'));
	const hinted = act(initial, { type: "dontKnow", taskKey: "1:1", reasoning: "Не разбирам точките." });
	assert.equal(initial.rounds[0]!.tasks[0]!.hintUsed, false, "input records are immutable");
	assert.equal(hinted.rounds[0]!.tasks.length, 1);
	assert.equal(kidsView(hinted, profile).task?.hint, item.hint);
	assert.equal(kidsView(hinted, profile).task?.outcome, undefined);
	assert.equal(kidsView(hinted, profile).task?.choice, undefined);
	assert.equal(kidsView(hinted, profile).task?.explanation, undefined);
	const revealed = act(hinted, { type: "dontKnow", taskKey: "1:1" });
	assert.equal(kidsView(revealed, profile).task?.outcome, "revealed");
	assert.equal(kidsView(revealed, profile).task?.choice, undefined);
	assert.deepEqual(kidsView(revealed, profile).task?.explanation, item.explanation);
	assert.equal(revealed.rounds[0]!.tasks.length, 1);
});

test("assisted correct answers stay separate from independent diagnostic evidence", () => {
	const hinted = act(fresh(), { type: "dontKnow", taskKey: "1:1" });
	const completed = answer(hinted);
	assert.equal(completed.rounds[0]!.tasks[0]!.outcome, "hinted");
	assert.equal(answer(fresh()).rounds[0]!.tasks[0]!.outcome, "independent");
	assert.equal(answer(fresh(), false).rounds[0]!.tasks[0]!.outcome, "incorrect");
});

test("server bounds the round at two starters and one practice, then waits for explicit continuation", () => {
	let session = fresh();
	assert.throws(() => act(session, { type: "advance" }), KidsError);
	assert.throws(() => act(session, { type: "nextRound" }), KidsError);
	session = toLesson(session, false, true);
	assert.equal(session.rounds[0]!.tasks.length, 2);
	assert.equal(session.rounds[0]!.stage, "lesson");
	assert.equal(session.rounds[0]!.targetId, "M1-03");
	assert.equal(session.rounds[0]!.extension, false);
	assert.throws(() => answer(session), KidsError, "no third diagnostic question");
	assert.throws(() => act(session, { type: "advance" }), KidsError);
	assert.equal(kidsView(session, profile).lesson?.steps.length, 1);
	session = act(session, { type: "lessonNext" });
	assert.equal(kidsView(session, profile).lesson?.steps.length, 2);
	session = act(act(session, { type: "lessonNext" }), { type: "lessonNext" });
	assert.equal(session.rounds[0]!.stage, "practice");
	assert.equal(session.rounds[0]!.tasks[2]!.taskId, "P-football");
	assert.equal(kidsView(session, profile).task?.explanation, undefined, "practice answer stays secret after lesson");
	assert.throws(() => act(session, { type: "lessonNext" }), KidsError);
	session = act(answer(session), { type: "advance" });
	assert.equal(session.rounds[0]!.stage, "recap");
	assert.equal(session.rounds[0]!.tasks.length, 3);
	assert.equal(session.rounds.length, 1);
	assert.equal(kidsView(session, profile).task, undefined);
	assert.deepEqual(kidsView(session, profile).recap?.results.map(r => r.role), ["starter", "starter", "practice"]);
	assert.throws(() => act(session, { type: "advance" }), KidsError);
	assert.throws(() => answer(session), KidsError);
	const continued = act(session, { type: "nextRound" });
	assert.equal(continued.rounds.length, 2);
	assert.equal(continued.rounds[1]!.tasks[0]!.taskId, "M1-01");
});

test("two independent successes lead to an extension, without inventing a gap", () => {
	const lesson = toLesson(fresh());
	assert.equal(lesson.rounds[0]!.extension, true);
	assert.equal(kidsView(lesson, profile).lesson?.extension, true);
	assert.equal(throughLesson(lesson).rounds[0]!.tasks[2]!.taskId, "X-money");
});

test("pause and storage reload preserve the exact task and hint; stale writes cannot double-submit", () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "maths-kids-store-"));
	try {
		const store = createKidsStore(directory);
		const session = store.create(profile);
		const hinted = store.update(session.id, 0, { type: "dontKnow", taskKey: "1:1" }, profile);
		assert.throws(() => store.update(session.id, 0, { type: "dontKnow", taskKey: "1:1" }, profile), (e: unknown) => e instanceof KidsError && e.status === 409);
		assert.equal(store.read(session.id)!.rounds[0]!.tasks[0]!.outcome, undefined);
		const paused = store.update(session.id, hinted.revision, { type: "pause" }, profile);
		assert.equal(kidsView(paused, profile).task, undefined);
		assert.throws(() => store.update(session.id, paused.revision, { type: "answer", taskKey: "1:1", choice: 0 }, profile), KidsError);
		const reloadedStore = createKidsStore(directory);
		const resumed = reloadedStore.update(session.id, paused.revision, { type: "resume" }, profile);
		assert.equal(kidsView(resumed, profile).task?.hint, profile.problems["M1-03"]!.hint);
		assert.equal(kidsView(resumed, profile).task?.key, "1:1");
		assert.equal(kidsView(resumed, profile).task?.choice, undefined);
		assert.equal(store.list()[0]!.completedTasks, 0);
		assert.equal(fs.statSync(path.join(directory, `${session.id}.json`)).mode & 0o777, 0o600);
		assert.deepEqual(fs.readdirSync(directory), [`${session.id}.json`]);
		assert.throws(() => store.read("../../chats/anything"), KidsError);
	} finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("early finish records only completed attempts and cannot fabricate evidence", () => {
	const stopped = act(fresh(), { type: "finish" });
	assert.deepEqual(kidsView(stopped, profile).recap?.results, []);
	assert.equal(stopped.rounds[0]!.tasks[0]!.outcome, undefined);
	assert.throws(() => answer(stopped), KidsError);
});

test("finite source material ends after three rounds without repetition or an unbounded assessment", () => {
	let session = fresh();
	for (let i = 0; i < 3; i++) {
		session = act(answer(throughLesson(toLesson(session))), { type: "advance" });
		assert.equal(session.rounds.at(-1)!.tasks.length, 3);
		if (i < 2) session = act(session, { type: "nextRound" });
	}
	assert.equal(kidsView(session, profile).canContinue, false);
	assert.throws(() => act(session, { type: "nextRound" }), KidsError);
	assert.equal(new Set(session.rounds.flatMap(r => r.tasks.map(t => t.taskId))).size, 9);
});

test("invalid commands, choice indices, foreign task IDs and profile mismatches are rejected", () => {
	for (const input of [null, {}, { revision: -1, action: { type: "pause" } }, { revision: 0, action: { type: "inventQuestion" } },
		{ revision: 0, action: { type: "answer", taskKey: "1:1", choice: "0" } },
		{ revision: 0, action: { type: "answer", taskKey: "1:1", choice: 0, reasoning: "x".repeat(501) } }]) {
		assert.throws(() => parseKidsCommand(input), KidsError);
	}
	assert.throws(() => act(fresh(), { type: "answer", taskKey: "1:1", choice: 99 }), KidsError);
	assert.throws(() => act(fresh(), { type: "answer", taskKey: "2:1", choice: 0 }), KidsError);
	assert.throws(() => applyKidsAction(fresh(), { ...profile, id: "other" }, { type: "pause" }, now), KidsError);
	assert.deepEqual(parseKidsCommand({ revision: 0, action: { type: "pause" } }), { revision: 0, action: { type: "pause" } });
});

test("all authored tasks have distinct choices, valid keys, Bulgarian help and checked numerical answers", () => {
	const expected: Record<string, string> = {
		"M1-03": "4", "M1-04": "27 лв. и 50 ст.", "M1-01": "79", "M1-02": "1924", "M1-12": "18 часът", "M1-13": "20",
		"P-football": "3", "X-football": "5", "P-money": "12 лв.", "X-money": "17 лв. и 40 ст.",
		"P-years": "68", "X-years": "22", "P-inverse": "550", "X-inverse": "890",
		"P-clock": "11 часът", "X-clock": "4 часът", "P-ages": "12", "X-ages": "15",
	};
	assert.equal(Object.keys(profile.problems).length, 18);
	for (const item of Object.values(profile.problems)) {
		assert.equal(new Set(item.options).size, 4, item.id);
		assert.equal(item.options[item.correctIndex], expected[item.id], item.id);
		assert.match(item.hint, /[а-я]/i);
		assert.equal(item.explanation.length, 3);
		assert.equal(item.lesson.steps.length, 3);
		assert.ok(!/[A-Za-z]{3,}/.test([item.text, item.hint, ...item.explanation, ...item.lesson.steps].join(" ").replace(/\bXXII\b/g, "")), item.id);
	}
	assert.match(profile.instructions, /бутони.*Не знам/);
});

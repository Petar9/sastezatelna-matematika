import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { nvoCourseContent as content } from "../src/server/nvo-course-content.ts";
import { applyCourseAction, courseView, newKidsCourse, type CourseAction, type CourseProblem, type KidsCourseContent } from "../src/core/kids-course.ts";
import { originalStatement } from "../src/server/original-statement.ts";
import { localStores } from "../src/server/stores.ts";
import { kidsCourseContent as existing } from "../src/server/kids-course-content.ts";
const now = "2026-11-04T09:00:00.000Z";
function problems() {
 const all: CourseProblem[] = [];
 for (const topic of content.topics) for (const skill of topic.skills) for (const hard of [false, true]) {
  let index = 0, problem;
  while ((problem = content.problem(skill.id, index++, hard))) { all.push(problem); assert.ok(index <= 100); }
 }
 return all;
}
function harness(source = content) {
 let record = newKidsCourse(source, now);
 const go = (action: CourseAction) => { record = applyCourseAction(record, source, action, now); return courseView(record, source, now); };
 const work = () => record.journey === "quest" ? record.quest!.work! : (record.active!.skillId ? record.topics[record.active!.topicId]!.skillWork![record.active!.skillId]! : record.topics[record.active!.topicId]!.work[record.active!.mode]!);
 const correct = () => {
  const view = courseView(record, source, now), p = work().attempt.problem;
  return go({ type: "answer", taskKey: work().attempt.key, answers: view.task?.part ? [p.fields[view.task.part.index - 1]!.answer] : p.fields.map(f => f.answer) });
 };
 const next = () => { go({ type: "nextQuestion" }); while (courseView(record, source, now).stage === "lesson") go({ type: "lessonNext" }); };
 return { get record() { return record; }, go, correct, next, work, view: () => courseView(record, source, now) };
}
// Independent fixture transcribed from the four supplied official answer sheets.
const keys = [
 [2022, "Б В А Б В В А Б А В А А В В Б А В Б", [4536, 9000, 31, 1500, 30, 3078], [60, 22, 96]],
 [2023, "Б Б Б Б В В В А В А А Б В В А Б А В", [99, 1400, 222, 7200, 350, 94], [30, 440, 90]],
 [2024, "Б А В А А Б Б Б Б Б В А Б В А А А Б", [120, 2240, 432, 17, 6, 244], [700, 15, 10000]],
 [2025, "Б В Б Б Б Б В В А Б Б А А Б А В", [6, 1018, 75, 421, 450, 530, 120, 1400], [1750, 330, 420]],
] as const;

test("NVO contains 100 distinct full originals, 108 answer conditions and ten approved islands", () => {
 assert.equal(content.topics.length, 10);
 assert.equal(content.topics.flatMap(t => t.skills).length, 27);
 const all = problems(); assert.equal(all.length, 100); assert.equal(new Set(all.map(p => p.id)).size, 100);
 assert.equal(all.reduce((sum, p) => sum + p.fields.length, 0), 108);
 for (const p of all) {
  assert.equal(p.archive?.kind, "original"); assert.equal(p.provenance?.video, undefined);
  assert.equal(p.solution?.length, 3); assert.equal(p.hints?.length, 3);
  assert.ok(p.solution!.every(part => part.paragraphs.every(text => text.trim().length > 10)));
  assert.deepEqual(content.solutionFor!(p), p.solution);
  assert.equal(content.solutionFor!({ ...p, text: "edited" }), undefined);
  if (p.options) assert.ok(p.options[Number(p.fields[0]!.answer)]);
 }
 for (const [year, letters, numbers, parts] of keys) {
  const expected = [...letters.split(" ").map(c => [String("АБВ".indexOf(c))]), ...numbers.map(n => [String(n)]), parts.map(String)];
  const yearly = all.filter(p => p.provenance?.year === year).sort((a, b) => Number(a.archive!.sourceId.split("p")[1]) - Number(b.archive!.sourceId.split("p")[1]));
  assert.equal(yearly.length, 25);
  assert.deepEqual(yearly.map(p => p.fields.map(f => f.answer)), expected, `Official key ${year}`);
 }
 for (const t of content.topics) for (const skill of t.skills) {
  const introduction = content.introductions![skill.id]!;
  assert.ok(all.some(p => p.skillId === skill.id && p.id === introduction.problemId));
  assert.ok(introduction.rationale.length > 25);
 }
 const first = all[0]!; const original = content.problem(first.skillId, 0, false)!;
 original.fields[0]!.answer = "mutated";
 assert.notEqual(content.problem(first.skillId, 0, false)!.fields[0]!.answer, "mutated");
 for (const i of [-1, .5, NaN, Infinity]) assert.equal(content.problem(first.skillId, i, false), null);
 assert.equal(content.problem("unknown", 0, false), null);
});

test("all 40 original figure crops exist and source views preserve choices without answer or solution data", () => {
 const figures = problems().filter(p => p.figure); assert.equal(figures.length, 40);
 for (const p of figures) {
  const png = fs.readFileSync(path.join(process.cwd(), "assets/images", p.figure!.src));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.ok(png.readUInt32BE(16) > 100 && png.readUInt32BE(20) > 70);
 }
 const p = problems().find(p => p.options)!;
 const source = originalStatement(content, p.id)!;
 assert.deepEqual(source.options, p.options);
 assert.ok(!("fields" in source) && !("explanation" in source) && !("solution" in source));
 source.options![0] = "edited"; assert.notEqual(originalStatement(content, p.id)!.options![0], "edited");
 assert.equal(originalStatement(content, "missing"), undefined);
});

test("every NVO original can be graded; multipart answers earn one completed-problem bonus", () => {
 for (const problem of problems()) {
  const skill = content.topics.flatMap(t => t.skills).find(s => s.id === problem.skillId)!;
  const isolated: KidsCourseContent = { ...content, topics: [{ id: "only", title: "Проверка", rewardName: "проверка", skills: [skill] }],
   introductions: { [skill.id]: { problemId: problem.id, rationale: "Изолиран оригинал за проверка." } },
   problem: (id, index, hard) => id === skill.id && index === 0 && !hard ? structuredClone(problem) : null };
  const h = harness(isolated); h.go({ type: "selectTopic", topicId: "only", skillId: skill.id });
  for (let part = 0; part < problem.fields.length; part++) {
   const result = h.correct();
   assert.equal(result.task?.outcome, "independent", `${problem.id} part ${part}`);
   if (part < problem.fields.length - 1) {
    assert.equal(h.record.attempts.length, 0); assert.equal(h.record.problemGoldAwards?.length ?? 0, 0); h.next();
   }
  }
  assert.equal(h.record.attempts.length, 1, problem.id);
  assert.equal(h.record.problemGoldAwards?.length, 1, problem.id);
  assert.equal(h.view().gold, problem.difficulty?.level === "hard" ? 30 : 25, problem.id);
  assert.equal(h.view().task?.sourceYear, problem.provenance?.year);
 }
});

test("NVO reveals three partial solutions, records supported success and prefers a fresh original follow-up", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "nvo-multiplication", skillId: "nvo-multiply" });
 const key = h.work().attempt.key, id = h.work().attempt.problem.id;
 for (let i = 1; i <= 3; i++) {
  h.go({ type: "hint", taskKey: key }); assert.equal(h.view().task?.solutionParts?.length, i);
 }
 assert.equal(h.correct().task?.outcome, "hinted"); assert.equal(h.view().gold, 0);
 h.next(); assert.notEqual(h.work().attempt.problem.id, id);
 assert.equal(h.work().attempt.problem.archive?.kind, "original");
});

test("NVO adventures contain five distinct originals and at most three diagnostic questions", () => {
 const h = harness(); h.go({ type: "startQuest" }); const ids = new Set<string>();
 for (let i = 0; i < 5; i++) {
  const p = h.work().attempt.problem; assert.ok(!ids.has(p.archive!.sourceId)); ids.add(p.archive!.sourceId);
  assert.equal(h.view().quest?.completed, i); h.correct(); h.next();
 }
 assert.equal(h.view().stage, "questComplete"); assert.equal(h.record.stamps?.length, 1);
 assert.ok(h.record.quest!.steps.filter(step => step.kind === "diagnostic").length <= 3);
});

test("NVO progress and answer drafts persist separately without changing existing competition history", () => {
 const prior = { ...process.env }, directory = fs.mkdtempSync(path.join(os.tmpdir(), "maths-nvo-"));
 try {
  for (const key of ["VERCEL", "NETLIFY", "RENDER", "FLY_APP_NAME"]) delete process.env[key];
  process.env.MATHS_MODE = "local"; process.env.MATHS_DATA_DIR = directory;
  localStores().kidsCourseStore.update(0, { type: "selectTopic", topicId: "matches" }, existing);
  const file = path.join(directory, "kids", "course-v2.json"), before = fs.readFileSync(file, "utf8");
  const store = localStores("nvo").kidsCourseStore;
  let record = store.update(0, { type: "selectTopic", topicId: "nvo-expressions", skillId: "nvo-unknown" }, content);
  const taskKey = courseView(record, content, now).task!.key;
  record = store.update(record.revision, { type: "saveDraft", taskKey, partIndex: 0, answers: ["1"] }, content);
  assert.deepEqual(courseView(localStores("nvo").kidsCourseStore.read(content)!, content, now).task?.draft, ["1"]);
  assert.equal(fs.readFileSync(file, "utf8"), before);
  assert.equal(localStores("olimpiada").kidsCourseStore.read(), null);
  assert.equal(record.attempts.length, 0); assert.equal(record.goldAwards?.length ?? 0, 0);
 } finally { process.env = prior; fs.rmSync(directory, { recursive: true, force: true }); }
});

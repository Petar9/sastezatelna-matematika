import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, courseView, newKidsCourse } from "../src/core/kids-course.ts";
import type { CourseAction, CourseAttempt, CourseProblem, KidsCourseContent } from "../src/core/kids-course.ts";
import { awardProblemGold, courseGoldBalance, newGoldGain, problemGoldKey, topicProblemGold } from "../src/core/kids-gold.ts";
import { catalogueProblems, isCompetitionProblem, teachingMethod } from "../src/core/kids-selection.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";

const now = "2026-11-04T09:00:00Z";
function question(id: string, skillId: string, year?: number): CourseProblem {
 return { id, skillId, text: `Задача ${id}`, source: year ? `Състезание · ${year}` : "Учебно упражнение",
  fields: [{ label: "Отговор", answer: "7" }], hint: "Пресметни 3 + 4.", explanation: ["3 + 4 = 7."],
  ...(year ? { provenance: { year, objective: skillId, page: 1, video: "" } } : {}) };
}
function fixture(): KidsCourseContent {
 const pools: Record<string, CourseProblem[]> = {
  a: [question("a-practice", "a"), question("a-2024", "a", 2024), question("a-next", "a")],
  b: [question("b-2025", "b", 2025), question("b-practice", "b")],
  c: [question("c-2024", "c", 2024), question("c-2025", "c", 2025), question("c-practice", "c")],
 };
 return { version: "methods-test", topics: [{ id: "island", title: "Остров", rewardName: "Откритие",
  skills: ["a", "b", "c"].map(id => ({ id, title: id, lesson: ["3 + 4 = 7."] })) }],
  objectiveMap: { a: { primary: "addition", related: [] }, b: { primary: "addition", related: [] }, c: { primary: "other", related: [] } },
  introductions: { addition: { problemId: "a-2024", rationale: "Едно действие." }, other: { problemId: "c-2024", rationale: "Друг метод." } },
  problem: (skill, index, harder) => harder ? null : pools[skill]?.[index] ?? null };
}
function harness() {
 const content = fixture(); let record = newKidsCourse(content, now);
 const view = () => courseView(record, content, now);
 const go = (action: CourseAction) => { record = applyCourseAction(record, content, action, now); };
 const work = () => record.quest!.work!.attempt;
 const answer = (right = true) => go({ type: "answer", taskKey: work().key, answers: [right ? "7" : "8"] });
 const next = () => { go({ type: "nextQuestion" }); while (view().stage === "lesson") go({ type: "lessonNext" }); };
 return { content, get record() { return record; }, go, work, answer, next, view,
  reload: () => { record = JSON.parse(JSON.stringify(record)); } };
}

test("every existing method has a documented provisional entry point, with only the ungradable source exception", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) {
  const questions = new Map(catalogueProblems(content).map(p => [p.id, p]));
  const methods = new Set(content.topics.flatMap(t => t.skills.map(s => teachingMethod(content, s.id))));
  assert.deepEqual(new Set(Object.keys(content.introductions!)), methods);
  for (const [method, entry] of Object.entries(content.introductions!)) {
   assert.ok(entry.rationale.length > 15, method);
   if (!entry.problemId) { assert.equal(method, "oli-overlap-groups"); continue; }
   const p = questions.get(entry.problemId); assert.ok(p, entry.problemId);
   assert.ok(isCompetitionProblem(p)); assert.equal(teachingMethod(content, p.skillId), method);
  }
 }
});

test("an explicit introduction leads to a different-year real application across skills, then another method", () => {
 const h = harness(); h.go({ type: "startQuest" }); assert.equal(h.work().problem.id, "a-2024");
 h.answer(); h.next(); assert.equal(h.work().problem.id, "b-2025");
 h.answer(); h.next(); assert.equal(h.work().problem.id, "c-2024");
 h.answer(); h.next(); assert.equal(h.work().problem.id, "c-2025");
 h.answer(); h.next(); assert.notEqual(teachingMethod(h.content, h.work().problem.skillId), "other");
 assert.notEqual(h.work().mode, "challenge");
});

test("a return visit starts with fresh work in a previously successful method", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "island", skillId: "a" });
 const task = h.view().task!; h.go({ type: "answer", taskKey: task.key, answers: ["7"] });
 h.go({ type: "dashboard" }); h.go({ type: "startQuest" });
 assert.equal(h.work().problem.id, "b-2025");
});

test("help is preserved on reload, followed by a fresh related task; repeated difficulty switches method", () => {
 const h = harness(); h.go({ type: "startQuest" }); const key = h.work().key;
 h.go({ type: "hint", taskKey: key }); h.reload(); h.go({ type: "startQuest" });
 assert.equal(h.work().key, key); assert.equal(h.work().hintLevel, 1);
 h.answer(false); h.next(); assert.equal(h.work().problem.id, "b-2025");
 assert.equal(h.record.quest!.diagnostic, false);
 h.answer(false); h.next(); assert.equal(h.work().problem.id, "c-2024");
 assert.equal(h.record.quest!.completed, 2);
});

function goldFixture() {
 const full = question("full", "a", 2024); full.archive = { sourceId: "2024-p1", kind: "original", covers: ["a", "b"] };
 const partA = question("part-a", "a", 2024); partA.archive = { sourceId: "2024-p1", kind: "part", covers: ["a"] };
 const partB = question("part-b", "a", 2024); partB.archive = { sourceId: "2024-p1", kind: "part", covers: ["b"] };
 const authored = question("practice", "a"), duplicate = { ...authored, id: "duplicate" };
 const content: KidsCourseContent = { version: "gold-test", topics: [{ id: "island", title: "Остров", rewardName: "Откритие", skills: [{ id: "a", title: "Сбор", lesson: [] }] }],
  problem: (_, i, hard) => hard ? null : [full, partA, partB, authored, duplicate][i] ?? null };
 const course = newKidsCourse(content, now);
 const attempt = (problem: CourseProblem, outcome: CourseAttempt["outcome"] = "independent"): CourseAttempt => ({ key: problem.id, problem, mode: "core", hintUsed: outcome === "hinted", outcome, completedAt: now });
 return { content, course, full, partA, partB, authored, duplicate, attempt };
}

test("one +10 entitlement covers a full source and disjoint parts, and helped correctness earns it", () => {
 const f = goldFixture(); const before = structuredClone(f.course);
 awardProblemGold(f.course, f.content, f.attempt(f.partA, "hinted"), now);
 assert.equal(newGoldGain(before, f.course)?.amount, 10);
 f.course.attempts.push(f.attempt(f.partA, "hinted"));
 for (const p of [f.partA, f.partB, f.full]) awardProblemGold(f.course, f.content, f.attempt(p), now);
 assert.equal(f.course.problemGoldAwards!.length, 1);
 assert.equal(topicProblemGold(f.course, f.content, "island").total, 20);
 assert.equal(problemGoldKey(f.authored, f.content), problemGoldKey(f.duplicate, f.content));
});

test("historical reads do not backfill problem gold, while future correctness recovers it once", () => {
 for (const outcome of ["revealed", "incorrect", "independent", "hinted"] as const) {
  const f = goldFixture(); f.course.attempts.push(f.attempt(f.partA, outcome));
  const before = courseGoldBalance(f.course);
  courseView(f.course, f.content, now);
  assert.equal(f.course.problemGoldAwards, undefined); assert.equal(courseGoldBalance(f.course), before);
  awardProblemGold(f.course, f.content, f.attempt(f.partB), now);
  assert.equal(courseGoldBalance(f.course), before + 10);
  awardProblemGold(f.course, f.content, f.attempt(f.full), now);
  assert.equal(f.course.problemGoldAwards!.length, 1); assert.equal(courseGoldBalance(f.course), before + 10);
 }
 const f = goldFixture(); awardProblemGold(f.course, f.content, f.attempt(f.full, "revealed"), now);
 assert.equal(f.course.problemGoldAwards, undefined);
});

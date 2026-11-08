import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, courseView, migrateKidsCourse, newKidsCourse } from "../src/core/kids-course.ts";
import type { CourseAction, CourseProblem, KidsCourseContent } from "../src/core/kids-course.ts";
import { catalogueProblems, problemSource, chooseSkillProblem, isCompetitionProblem, overlaps } from "../src/core/kids-selection.ts";
import { kidsCourseContent as currentKidsContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent as currentOlympiadContent } from "../src/server/olimpiada-course-content.ts";
import { nvoCourseContent as currentNvoContent } from "../src/server/nvo-course-content.ts";
import { originalStatement } from "../src/server/original-statement.ts";

// Saved assignments keep the original field-level contract after content upgrades.
const kidsCourseContent = { ...currentKidsContent, connectedProblem: undefined, navigationGroups: undefined };
const olympiadCourseContent = { ...currentOlympiadContent, connectedProblem: undefined, navigationGroups: undefined };
const nvoCourseContent = { ...currentNvoContent, connectedProblem: undefined, navigationGroups: undefined };
const now = "2026-11-03T12:00:00.000Z", later = "2026-11-05T12:00:00.000Z";
function harness(content: KidsCourseContent) {
 let course = newKidsCourse(content, now);
 const go = (action: CourseAction, date = now) => { course = applyCourseAction(course, content, action, date); return courseView(course, content, date); };
 const task = () => course.journey === "quest" ? course.quest!.work!.attempt : course.active!.skillId ? course.topics[course.active!.topicId]!.skillWork![course.active!.skillId]!.attempt : course.topics[course.active!.topicId]!.work[course.active!.mode]!.attempt;
 return { get course() { return course; }, go, task, view: () => courseView(course, content, now) };
}
function catalogue(content: KidsCourseContent, skillId: string) {
 const all: CourseProblem[] = [];
 for (const hard of [false, true]) for (let i = 0; i < 1000; i++) { const p = content.problem(skillId, i, hard); if (!p) break; all.push(p); }
 return all;
}

test("both competitions start with real sources in island, exact-skill and diagnostic routes", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) {
  for (const topic of content.topics) {
   const island = harness(content); island.go({ type: "selectTopic", topicId: topic.id });
   assert.ok(isCompetitionProblem(island.task().problem), topic.id);
   for (const skill of topic.skills) {
    const h = harness(content); h.go({ type: "selectTopic", topicId: topic.id, skillId: skill.id });
    assert.equal(h.task().problem.skillId, skill.id);
    const hasSource = catalogue(content, skill.id).some(isCompetitionProblem);
    assert.equal(isCompetitionProblem(h.task().problem), hasSource, skill.id);
    assert.match(h.task().problem.source, hasSource ? /202[2-6]/ : /Учебно упражнение/);
   }
  }
  const h = harness(content); h.go({ type: "startQuest" });
  for (let i = 0; i < 5; i++) {
   if (h.course.quest!.steps.at(-1)!.kind === "diagnostic") assert.ok(isCompetitionProblem(h.task().problem));
   h.go({ type: "answer", taskKey: h.task().key, answers: h.task().problem.fields.map(f => f.answer) });
   h.go({ type: "nextQuestion" });
  }
  assert.ok(h.course.quest!.steps.filter(s => s.kind === "diagnostic").length <= 3);
 }
});

test("advanced legacy cursors cannot skip unseen originals and pending snapshots stay reserved", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) {
  const h = harness(content), topic = content.topics[0]!, skill = topic.skills[0]!;
  h.course.topics[topic.id]!.skills[skill.id]!.nextCore = 999;
  h.course.topics[topic.id]!.skills[skill.id]!.nextHard = 999;
  h.go({ type: "selectTopic", topicId: topic.id, skillId: skill.id });
  const saved = structuredClone(h.task());
  assert.ok(isCompetitionProblem(saved.problem));
  h.go({ type: "hint", taskKey: saved.key });
  const hinted = structuredClone(h.task());
  h.go({ type: "startQuest" });
  assert.ok(!overlaps(hinted.problem, h.task().problem, content));
  h.go({ type: "selectTopic", topicId: topic.id, skillId: skill.id });
  assert.deepEqual(h.task(), hinted);
 }
});

test("another real question precedes authored confirmation; full originals and parts share exposure", () => {
 const h = harness({ ...olympiadCourseContent, introductions: undefined });
 h.go({ type: "selectTopic", topicId: "oli-numbers", skillId: "oli-order-actions" });
 const first = structuredClone(h.task().problem);
 assert.equal(first.archive?.kind, "original");
 h.go({ type: "reveal", taskKey: h.task().key });
 // Older persisted snapshots lack archive metadata. Matching canonical content supplies it.
 delete h.course.attempts[0]!.problem.archive;
 h.go({ type: "nextQuestion" });
 assert.ok(isCompetitionProblem(h.task().problem));
 assert.ok(!overlaps(first, h.task().problem, olympiadCourseContent));
 const related = catalogue(olympiadCourseContent, first.skillId).filter(p => p.archive?.sourceId === first.archive!.sourceId);
 assert.ok(related.length > 1);
 for (const part of related) assert.ok(overlaps(h.course.attempts[0]!.problem, part, olympiadCourseContent));
 const chosen = chooseSkillProblem(h.course, olympiadCourseContent, first.skillId, false, now);
 assert.ok(!chosen || chosen.problem.archive?.sourceId !== first.archive!.sourceId);
});

test("sequential original answers survive serialization and record one result only after the last part", () => {
 const content = kidsCourseContent, h = harness(content);
 h.go({ type: "selectTopic", topicId: "grids", skillId: "M2-2a" });
 const key = h.task().key;
 for (const [i, answer] of ["56", "66", "4"].entries()) {
  const before = h.view().task!;
  assert.equal(before.fields.length, 1); assert.equal(before.part!.index, i + 1);
  assert.equal(before.answers, undefined); assert.equal(before.explanation, undefined);
  h.go({ type: "answer", taskKey: key, answers: [answer] });
  if (i < 2) {
   assert.equal(h.course.attempts.length, 0); assert.equal(h.view().gold, 0);
   assert.equal(h.view().task!.part!.completed, true);
   assert.throws(() => h.go({ type: "answer", taskKey: key, answers: [answer] }), { status: 409 });
   const restored = JSON.parse(JSON.stringify(h.course));
   assert.deepEqual(courseView(restored, content, now), h.view());
   assert.deepEqual(h.view().task!.explanation, [`${h.task().problem.fields[i]!.label}: ${answer}.`]);
   h.go({ type: "nextQuestion" });
  }
 }
 assert.equal(h.course.attempts.length, 1); assert.equal(h.course.attempts[0]!.outcome, "independent");
 assert.equal(h.course.topics.grids!.skills["M2-2a"]!.streak, 1);
 assert.equal(h.view().gold, 40);
 // A pending original from before this change keeps its all-fields contract.
 const old = harness(content); old.go({ type: "selectTopic", topicId: "grids" }); delete old.task().partIndex;
 assert.equal(old.view().task!.fields.length, 3);
 old.go({ type: "answer", taskKey: old.task().key, answers: ["56", "66", "4"] });
 assert.equal(old.course.attempts.length, 1);
});

test("a wrong or helped early subcondition cannot become independent evidence at the final answer", () => {
 for (const batch of [false, true]) for (const helped of [false, true]) {
  const h = harness(kidsCourseContent); h.go({ type: "selectTopic", topicId: "grids", skillId: "M2-2a" });
  if (helped) h.go({ type: "hint", taskKey: h.task().key });
  h.go({ type: "answer", taskKey: h.task().key, answers: [helped ? "56" : "55"] });
  if (batch) { h.go({ type: "nextQuestion" }); h.go({ type: "answer", taskKey: h.task().key, answers: ["56", "66", "4"] }); }
  else for (const answer of ["66", "4"]) { h.go({ type: "nextQuestion" }); h.go({ type: "answer", taskKey: h.task().key, answers: [answer] }); }
  assert.equal(h.course.attempts[0]!.outcome, helped ? "hinted" : "incorrect");
  assert.equal(h.course.topics.grids!.skills["M2-2a"]!.streak, 0);
 }
});

test("retention is due per skill after two days before island Doctor and repeats grant no new mastery", () => {
 const content = kidsCourseContent, h = harness(content), topic = "backwards", skillId = "M1-02";
 h.go({ type: "selectTopic", topicId: topic, skillId });
 for (let i = 0; i < 2; i++) { h.go({ type: "answer", taskKey: h.task().key, answers: h.task().problem.fields.map(f => f.answer) }); if (!i) h.go({ type: "nextQuestion" }); }
 assert.ok(h.course.topics[topic]!.skills[skillId]!.confirmedAt); assert.equal(h.course.topics[topic]!.doctorAt, undefined);
 assert.equal(courseView(h.course, content, now).topics.find(t => t.id === topic)!.reviewDue, false);
 assert.equal(courseView(h.course, content, later).topics.find(t => t.id === topic)!.reviewDueAt, later);
 assert.equal(courseView(h.course, content, later).topics.find(t => t.id === topic)!.leaves!.find(l => l.id === skillId)!.status, "review");
 const gold = h.view().gold, streak = h.course.topics[topic]!.skills[skillId]!.streak;
 h.go({ type: "nextQuestion" }, later); assert.equal(h.course.active!.mode, "review");
 h.go({ type: "answer", taskKey: h.task().key, answers: h.task().problem.fields.map(f => f.answer) }, later);
 assert.equal(h.course.topics[topic]!.skills[skillId]!.lastReviewAt, later);
 assert.equal(h.course.topics[topic]!.skills[skillId]!.streak, streak); assert.equal(h.view().gold, gold + 20);
 // An archive-only bank can be revisited after spacing, but never earn a fresh confirmation.
 const only: KidsCourseContent = { ...content, problem: (id, i, hard) => !i && !hard ? content.problem(id, 0, false) : null };
 const r = harness(only); r.go({ type: "selectTopic", topicId: topic, skillId });
 r.go({ type: "answer", taskKey: r.task().key, answers: r.task().problem.fields.map(f => f.answer) });
 const state = r.course.topics[topic]!.skills[skillId]!; state.confirmedAt = now; state.streak = 2;
 assert.equal(chooseSkillProblem(r.course, only, skillId, false, "2026-11-05T11:59:59.999Z", true), undefined);
 r.go({ type: "nextQuestion" }, later); assert.equal(r.course.active!.mode, "review");
 r.go({ type: "answer", taskKey: r.task().key, answers: r.task().problem.fields.map(f => f.answer) }, later);
 assert.equal(r.course.attempts.at(-1)!.freshEvidence, false); assert.equal(r.course.topics[topic]!.skills[skillId]!.streak, 2);
});

test("original statement lookup whitelists content and cannot expose solutions, authored tasks or excluded sources", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) {
  for (const topic of content.topics) for (const skill of topic.skills) for (const p of catalogue(content, skill.id)) {
   const original = originalStatement(content, p.id);
   const expected = p.archive ? p.archive.kind !== "scaffold" : p.id.endsWith(":original");
   assert.equal(!!original, expected, p.id);
   if (original) { assert.deepEqual(Object.keys(original).sort(), ["figure", "id", ...(p.options ? ["options"] : []), "source", "text"]); assert.equal(original.text, p.text); assert.deepEqual(original.options, p.options); }
  }
 }
 assert.equal(originalStatement(olympiadCourseContent, "oli-g4-municipal-2023-p3:original"), undefined);
 assert.equal(originalStatement(kidsCourseContent, "../../data/kids/course-v2.json"), undefined);
});


test("legacy untouched exercises become real tasks without resetting history, awards or quest position", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) for (const route of ["island", "skill", "quest"]) {
  const h = harness(content), topic = content.topics[0]!, skill = topic.skills[0]!;
  h.go(route === "quest" ? { type: "startQuest" } : { type: "selectTopic", topicId: topic.id, ...(route === "skill" ? { skillId: skill.id } : {}) });
  const authored = catalogue(content, h.task().problem.skillId).find(p => !isCompetitionProblem(p))!;
  assert.ok(authored);
  h.task().problem = structuredClone(authored); delete h.task().partIndex;
  const saved = structuredClone(h.course), gold = h.view().gold;
  const refreshed = migrateKidsCourse(saved, content, later);
  assert.ok(courseView(refreshed, content, later).task!.sourceYear);
  assert.equal(refreshed.revision, saved.revision + 1);
  assert.equal(courseView(refreshed, content, later).gold, gold);
  assert.deepEqual(refreshed.attempts, saved.attempts); assert.deepEqual(refreshed.awards, saved.awards);
  assert.deepEqual(refreshed.active, saved.active);
  if (route === "quest") {
   assert.equal(refreshed.quest!.completed, saved.quest!.completed);
   assert.equal(refreshed.quest!.steps.length, saved.quest!.steps.length);
   assert.equal(refreshed.quest!.steps.at(-1)!.key, refreshed.quest!.work!.attempt.key);
  }
  assert.deepEqual(saved, h.course);
  assert.deepEqual(migrateKidsCourse(refreshed, content, later), refreshed);
 }
});

test("refresh preserves help, input, feedback, lesson steps and confirmation after real sources run out", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent]) {
  const topic = content.topics[0]!, skill = topic.skills[0]!;
  for (const touched of [{ hintUsed: true }, { hintLevel: 1 }, { answers: ["1"] }, { reasoning: "Пробвам" }, { partIndex: 1 }, { partOutcome: "independent" as const }, { outcome: "revealed" as const }]) {
   const h = harness(content); h.go({ type: "selectTopic", topicId: topic.id });
   h.task().problem = structuredClone(catalogue(content, h.task().problem.skillId).find(p => !isCompetitionProblem(p))!);
   Object.assign(h.task(), touched);
   assert.deepEqual(migrateKidsCourse(h.course, content, later), h.course);
  }
  const h = harness(content); h.go({ type: "selectTopic", topicId: topic.id, skillId: skill.id });
  h.task().problem = structuredClone(catalogue(content, skill.id).find(p => !isCompetitionProblem(p))!);
  const authored = h.task().problem;
  h.course.topics[topic.id]!.skillWork![skill.id]!.lessonStep = 0;
  assert.deepEqual(migrateKidsCourse(h.course, content, later), h.course);
  delete h.course.topics[topic.id]!.skillWork![skill.id]!.lessonStep;
  h.course.attempts = catalogue(content, skill.id).filter(isCompetitionProblem).map((problem, i) => ({key:`seen-${i}`,problem,mode:"core",hintUsed:false,outcome:"independent",completedAt:now}));
  const refreshed = migrateKidsCourse(h.course, content, now);
  assert.ok(courseView(refreshed, content, now).task!.sourceYear);
  assert.equal(courseView(refreshed, content, now).task!.sourceIsPractice, true);
  assert.equal(courseView(refreshed, content, now).task!.text, authored.text);
 }
});


test("all competition problems and linked practice resolve honest year and original source metadata",()=>{
 for(const content of [kidsCourseContent,olympiadCourseContent,nvoCourseContent]){
  const problems=catalogueProblems(content);
  for(const problem of problems){
   const source=problemSource(problem,content);
   assert.ok(source.sourceYear,problem.id);
   assert.equal(source.sourceIsPractice,!isCompetitionProblem(problem),problem.id);
   if(problem.practiceSource?.problemId === "oli-g4-municipal-2023-p3:original") {
    assert.equal(source.sourceYear,2023);assert.equal(source.sourceProblemId,undefined);continue;
   }
   assert.ok(source.sourceProblemId,problem.id);
   const original=originalStatement(content,source.sourceProblemId!);
   assert.ok(original,problem.id);
   const linked=problems.find(p=>p.id===source.sourceProblemId)!;
   assert.equal(source.sourceYear,linked.provenance!.year,problem.id);
  }
 }
});

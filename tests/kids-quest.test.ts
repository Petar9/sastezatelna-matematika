import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { applyCourseAction, courseView, migrateKidsCourse, newKidsCourse, parseCourseCommand } from "../src/core/kids-course.ts";
import type { CourseAction, KidsCourse, KidsCourseContent } from "../src/core/kids-course.ts";
import { kidsCourseContent as currentContent } from "../src/server/kids-course-content.ts";
import { isCompetitionProblem, teachingMethod } from "../src/core/kids-selection.ts";
import { createKidsCourseStore } from "../src/store/kids-course.ts";
// Keep the saved, pre-connected contract covered by the legacy regression suite.
const content = { ...currentContent, connectedProblem: undefined, navigationGroups: undefined };
const now = "2026-11-02T12:00:00.000Z";
function harness(material: KidsCourseContent = content, initial = newKidsCourse(material, now)) {
 let record = initial;
 const view = () => courseView(record, material, now);
 const go = (a: CourseAction) => { record = applyCourseAction(record, material, a, now); return view(); };
 const work = () => record.journey === "quest" ? record.quest!.work! : (record.active!.skillId ? record.topics[record.active!.topicId]!.skillWork![record.active!.skillId] : record.topics[record.active!.topicId]!.work[record.active!.mode])!;
 const answer = (right = true) => go({ type: "answer", taskKey: work().attempt.key, answers: work().attempt.problem.fields.map(f => right ? f.answer : String(work().attempt.problem.options ? (Number(f.answer) + 1) % work().attempt.problem.options!.length : Number(f.answer) + 1)) });
 const next = () => { go({ type: "nextQuestion" }); while (view().stage === "lesson") go({ type: "lessonNext" }); return view(); };
 return { get record() { return record; }, view, go, work, answer, next };
}

test("reviewed concept catalog covers every objective and has an acyclic prerequisite map and three worked parts", () => {
 const ids = new Set(content.concepts!.map(c => c.id));
 const visit = (id: string, stack: string[] = []) => {
  assert.ok(ids.has(id), id); assert.ok(!stack.includes(id), `cycle: ${[...stack, id]}`);
  for (const p of content.concepts!.find(c => c.id === id)!.prerequisites) visit(p, [...stack, id]);
 };
 for (const c of content.concepts!) visit(c.id);
 for (const skill of content.topics.flatMap(t => t.skills)) {
  const mapped = content.objectiveMap![skill.id]!; assert.ok(ids.has(mapped.primary), skill.id);
  for (const id of mapped.related) assert.ok(ids.has(id));
  for (const hard of [false, true]) for (let i = 0;; i++) {
   const p = content.problem(skill.id, i, hard); if (!p) break;
   assert.equal(p.solution!.length, 3); for (const part of p.solution!) { assert.ok(part.paragraphs.length, p.id); assert.ok(part.paragraphs.every(text => text.length > 0 && !/NaN|undefined|Infinity/.test(text)), p.id); }
  }
 }
 assert.ok(content.concepts!.length < 78);
});

test("first quest diagnoses with at most three originals inside five, saves one stamp, and never auto-continues", () => {
 const h = harness(); h.go({ type: "startQuest" });
 for (let i = 0; i < 5; i++) {
  assert.equal(h.view().quest!.step, i + 1);
  if (h.record.quest!.steps.at(-1)!.kind === "diagnostic") assert.ok(isCompetitionProblem(h.work().attempt.problem));
  h.answer(); assert.equal(h.record.quest!.completed, i + 1); h.next();
 }
 assert.equal(h.record.quest!.steps.length, 5); assert.equal(h.view().stage, "questComplete");
 assert.equal(h.record.quest!.steps.filter(s => s.kind === "diagnostic").length, 1);
 assert.equal(h.record.stamps!.length, 1); assert.match(h.view().quest!.achievement!, /5 задачи самостоятелно/);
 assert.equal(h.view().task, undefined);
 assert.throws(() => h.go({ type: "nextQuestion" }));
 h.go({ type: "pause" }); h.go({ type: "resume" }); assert.equal(h.record.stamps!.length, 1);
 h.go({ type: "startQuest" }); assert.equal(h.record.quest!.completed, 0);
 assert.equal(h.record.quest!.diagnostic, false); assert.equal(h.record.stamps!.length, 1);
});

test("the quest pairs fresh applications then mixes methods without a forced hard fifth", () => {
 const initial = newKidsCourse(content, now); initial.diagnostics!.initialDone = true;
 for (const id of ["matches", "digits"]) {
  initial.topics[id]!.doctorAt = now;
  for (const p of Object.values(initial.topics[id]!.skills)) p.confirmedAt = now;
 }
 for (const id of ["money", "backwards"]) {
  const first = content.topics.find(t => t.id === id)!.skills[0]!.id;
  Object.assign(initial.topics[id]!.skills[first]!, { gap: true, revisit: true });
 }
 const h = harness(content, initial); h.go({ type: "startQuest" });
 for (let i = 0; i < 5; i++) { h.answer(); h.next(); }
 const methods = h.record.quest!.steps.map(s => teachingMethod(content,s.skillId));
 assert.equal(methods[0],methods[1]);assert.notEqual(methods[1],methods[2]);assert.equal(methods[2],methods[3]);
 assert.notEqual(h.record.attempts.at(-1)!.mode,"challenge");
});

test("three worked parts expose only requested help and reveal works without any part", () => {
 const h = harness(); h.go({ type: "startQuest" });
 const key = h.view().task!.key;
 assert.equal(h.view().task!.solutionParts, undefined); assert.equal(h.view().task!.explanation, undefined);
 for (let level = 1; level <= 3; level++) {
  h.go({ type: "hint", taskKey: key });
  assert.equal(h.view().task!.solutionParts!.length, level); assert.equal(h.view().task!.hintLevel, level);
  assert.deepEqual(h.view().task!.solutionParts, h.work().attempt.problem.solution!.slice(0, level));
  assert.equal(h.view().task!.explanation, undefined); assert.equal(h.record.quest!.completed, 0);
 }
 assert.throws(() => h.go({ type: "hint", taskKey: key }));
 h.answer(); assert.equal(h.view().task!.outcome, "hinted"); h.next();
 h.go({ type: "reveal", taskKey: h.view().task!.key });
 assert.equal(h.view().task!.outcome, "revealed"); assert.equal(h.view().task!.answers, undefined);
 assert.ok(h.view().task!.explanation); assert.equal(h.record.quest!.completed, 2);
});

test("help and mistakes still allow a completion stamp, never an unearned academic award", () => {
 const h = harness(); h.go({ type: "startQuest" });
 for (let i = 0; i < 5; i++) { h.go({ type: "reveal", taskKey: h.view().task!.key }); h.next(); }
 assert.equal(h.record.stamps!.length, 1); assert.equal(h.record.awards.length, 0);
 assert.match(h.record.stamps![0]!.achievement, /Разгледа 5 задачи/);
 assert.equal(h.record.quest!.steps.filter(s => s.kind === "diagnostic").length, 1);
});

test("switching modes and reload preserve separate pending work, hints and lesson position", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" });
 const manualKey = h.view().task!.key; h.go({ type: "hint", taskKey: manualKey });
 h.go({ type: "startQuest" }); const questKey = h.view().task!.key;
 assert.notEqual(questKey, manualKey); h.answer(false); h.work().lessonStep = 0; h.go({ type: "lessonNext" });
 const lesson = structuredClone(h.view().lesson);
 h.go({ type: "selectTopic", topicId: "matches" }); assert.equal(h.view().task!.key, manualKey); assert.equal(h.view().task!.hintLevel, 1);
 h.go({ type: "startQuest" }); assert.deepEqual(h.view().lesson, lesson);
 h.go({ type: "pause" }); const reloaded = harness(content, JSON.parse(JSON.stringify(h.record)));
 reloaded.go({ type: "resume" }); assert.deepEqual(reloaded.view().lesson, lesson);
 while (reloaded.view().stage === "lesson") reloaded.go({ type: "lessonNext" });
 assert.equal(reloaded.record.quest!.completed, 1);
 assert.equal(new Set(reloaded.record.quest!.steps.map(s => s.key)).size, reloaded.record.quest!.steps.length);
});

test("a multi-concept failure does not assign a failure to associated concepts", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "perimeters", skillId: "M1-10" }); h.answer(false);
 const map = h.view().topics.flatMap(t => t.concepts ?? []);
 assert.ok(map.filter(c => c.id === "boundary").some(c => c.evidence.incorrect === 1));
 assert.ok(map.filter(c => c.id === "area").every(c => c.evidence.incorrect === 0 && c.status === "untried"));
});

test("quest outcomes preserve an unfinished manual lesson in the same topic", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" }); h.answer(false);
 h.work().lessonStep = 0; h.go({ type: "lessonNext" });
 const pending = structuredClone(h.record.topics.matches!.work.core);
 h.record.diagnostics!.initialDone = true; h.go({ type: "startQuest" });
 for (let i = 0; i < 5; i++) { h.answer(); h.next(); }
 assert.deepEqual(h.record.topics.matches!.work.core, pending);
 h.go({ type: "selectTopic", topicId: "matches" });
 assert.equal(h.view().stage, "lesson"); assert.equal(h.view().lesson!.steps.length, 2);
});

test("diagnostics reuse existing evidence, trigger after repeated unresolved difficulty, and stop early", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" });
 h.answer(false); h.next(); h.answer(false); h.next();
 h.record.diagnostics!.initialDone = true; h.go({ type: "startQuest" });
 assert.equal(h.record.quest!.diagnosticFor, "M1-03");
 h.answer(); h.next(); assert.equal(h.record.quest!.diagnostic, false);
 for (let i = 1; i < 5; i++) { h.answer(); h.next(); }
 h.go({ type: "startQuest" }); assert.equal(h.record.quest!.diagnostic, false);
});

test("finite content completes a shorter final adventure once without repeating material", () => {
 const base = content.problem("M1-03", 0, false)!;
 const small: KidsCourseContent = { version: "small", topics: [{ id: "matches", title: "Тест", rewardName: "тест", skills: [{ id: base.skillId, title: "Тест", lesson: ["Идея"] }] }], problem: (_id, index, hard) => !hard && index === 0 ? base : null };
 const h = harness(small); h.go({ type: "startQuest" }); h.answer(); h.next();
 assert.equal(h.view().quest!.total, 1); assert.equal(h.view().quest!.finished, true);
 assert.equal(h.record.stamps!.length, 1); assert.equal(h.record.attempts.length, 1); assert.equal(h.view().questAvailable, false);
 h.go({ type: "startQuest" }); assert.equal(h.view().quest!.finished, true); assert.equal(h.record.attempts.length, 1); assert.equal(h.record.stamps!.length, 1);
});

test("legacy upgrade projects without writes and preserves pending single-hint content and awards", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" }); h.go({ type: "dontKnow", taskKey: h.view().task!.key }); h.go({ type: "pause" });
 const old = structuredClone(h.record); delete old.questVersion; delete old.journey; delete old.stamps; delete old.diagnostics;
 delete old.topics.matches!.work.core!.attempt.hintLevel; delete old.topics.matches!.work.core!.attempt.problem.hints;
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), "maths-quest-migration-")); const file = path.join(dir, "course-v2.json");
 try {
  fs.writeFileSync(file, JSON.stringify(old)); const bytes = fs.readFileSync(file, "utf8");
  const store = createKidsCourseStore(dir); const projected = store.read(content)!;
  assert.equal(fs.readFileSync(file, "utf8"), bytes); assert.equal(projected.revision, old.revision + 1);
  assert.equal(projected.paused, true); assert.equal(projected.topics.matches!.work.core!.attempt.hintLevel, 1);
  assert.deepEqual(projected.attempts, old.attempts); assert.deepEqual(projected.awards, old.awards);
  assert.throws(() => store.update(old.revision, { type: "resume" }, content));
  const resumed = store.update(projected.revision, { type: "resume" }, content);
  assert.deepEqual(courseView(resumed, content, now).task!.solutionParts, old.topics.matches!.work.core!.attempt.problem.solution!.slice(0, 1));
  assert.equal(migrateKidsCourse(resumed, content, now), resumed);
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("quest commands validate inputs and stale task keys cannot add evidence or stamps", () => {
 for (const type of ["startQuest", "hint", "reveal"] as const) assert.equal(parseCourseCommand({ revision: 0, action: { type, taskKey: "key" } }).action.type, type);
 assert.throws(() => parseCourseCommand({ revision: 0, action: { type: "hint", taskKey: 42 } }));
 const h = harness(); h.go({ type: "startQuest" }); const key = h.view().task!.key; h.answer(); h.next();
 const snapshot = structuredClone(h.record); assert.throws(() => h.go({ type: "answer", taskKey: key, answers: ["0"] })); assert.deepEqual(h.record, snapshot);
});


test("early milestones derive only from completed primary-objective evidence and survive later struggle", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" });
 const concept = () => h.view().topics.find(t => t.id === "matches")!.concepts![0]!;
 assert.deepEqual(concept().milestones, { started: false });
 h.go({ type: "hint", taskKey: h.view().task!.key });
 assert.deepEqual(concept().milestones, { started: false });
 h.answer(false);
 assert.deepEqual(concept().milestones, { started: true });
 h.next(); h.go({ type: "hint", taskKey: h.view().task!.key }); h.answer();
 assert.deepEqual(concept().milestones, { started: true, firstCorrect: "hinted" });
 assert.equal(h.record.awards.length, 0);
 h.next(); h.answer(); h.next(); h.answer();
 assert.equal(concept().status, "confirmed");
 assert.equal(concept().milestones.firstCorrect, "hinted");
 h.next(); h.answer(false);
 assert.deepEqual(concept().milestones, { started: true, firstCorrect: "hinted" });
 const saved = JSON.stringify(h.record);
 assert.deepEqual(harness(content, JSON.parse(saved)).view(), h.view());
 assert.equal(JSON.stringify(h.record), saved);
});

test("reviewing a solution starts only its primary leaf without a first-correct milestone", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "perimeters" });
 h.answer(); h.next(); h.answer(); h.next();
 h.go({ type: "reveal", taskKey: h.view().task!.key });
 const concepts = h.view().topics.flatMap(t => t.concepts ?? []);
 assert.ok(concepts.filter(c => c.id === "boundary").some(c => c.milestones.started));
 assert.ok(concepts.filter(c => c.id === "area").every(c => !c.milestones.started && !c.milestones.firstCorrect));
 const current = concepts.find(c => c.objectives.some(o => o.id === h.view().task!.skillId))!;
 assert.equal(current.evidence.revealed, 1);
});

test("every island has one leaf per skill and backwards skills keep separate discoveries", () => {
 const h = harness();
 for (const topic of h.view().topics) {
  const skills = content.topics.find(t => t.id === topic.id)!.skills;
  assert.deepEqual(topic.leaves!.map(l => [l.id, l.title]), skills.map(s => [s.id, s.title]));
 }
 h.go({ type: "selectTopic", topicId: "backwards" });
 const leaves = () => h.view().topics.find(t => t.id === "backwards")!.leaves!;
 assert.equal(leaves().length, 5);
 const skillId = h.view().task!.skillId;
 h.go({ type: "hint", taskKey: h.view().task!.key });
 assert.ok(leaves().every(l => !l.milestones.started));
 h.answer(false);
 assert.deepEqual(leaves().find(l => l.id === skillId)!.milestones, { started: true });
 assert.ok(leaves().filter(l => l.id !== skillId).every(l => !l.milestones.started && l.status === "untried"));
 h.next(); h.go({ type: "hint", taskKey: h.view().task!.key }); h.answer();
 assert.equal(leaves().find(l => l.id === skillId)!.milestones.firstCorrect, "hinted");
 h.next(); h.answer();
 assert.deepEqual(leaves().find(l => l.id === skillId)!.confirmation, { earned: false, streak: 1, target: 2, revisit: true });
 h.next(); h.answer();
 assert.equal(leaves().find(l => l.id === skillId)!.confirmation.earned, true);
 const saved = JSON.stringify(h.record);
 assert.deepEqual(harness(content, JSON.parse(saved)).view().topics, h.view().topics);
 assert.equal(JSON.stringify(h.record), saved);
});

test("skill discoveries include revealed solutions and preserve earned confirmation during recovery", () => {
 const h = harness(); h.go({ type: "selectTopic", topicId: "matches" });
 const leaf = () => h.view().topics.find(t => t.id === "matches")!.leaves![0]!;
 h.go({ type: "reveal", taskKey: h.view().task!.key });
 assert.deepEqual(leaf().milestones, { started: true });
 assert.equal(leaf().confirmation.earned, false);
 h.next(); h.answer(); h.next(); h.answer();
 assert.equal(leaf().status, "confirmed");
 h.next(); h.answer(false);
 assert.equal(leaf().status, "practising");
 assert.equal(leaf().confirmation.earned, true);
 assert.equal(leaf().confirmation.revisit, true);
 assert.deepEqual(leaf().milestones, { started: true, firstCorrect: "independent" });
});

test("difficulty routes straight to a fresh similar problem within the five-question adventure", () => {
 for (const outcome of ["hinted", "incorrect", "revealed"] as const) {
  const h = harness(); h.go({type:"startQuest"});
  const before = h.work().attempt.problem;
  if (outcome === "hinted") { h.go({type:"hint",taskKey:h.view().task!.key}); h.answer(); }
  else if (outcome === "incorrect") h.answer(false);
  else h.go({type:"reveal",taskKey:h.view().task!.key});
  h.go({type:"nextQuestion"});
  assert.equal(h.view().stage,"question");
  assert.equal(h.view().task!.skillId,before.skillId);
  assert.notEqual(h.work().attempt.problem.id,before.id);
  assert.equal(h.record.quest!.completed,1);
  assert.equal(h.record.quest!.diagnostic,false);
  assert.equal(h.record.quest!.steps.length,2);
 }
});

test("old pending snapshots gain exact worked parts without rewriting history or exposing later parts", () => {
 const h = harness(); h.go({type:"selectTopic",topicId:"backwards"});
 const saved = h.work().attempt;
 delete saved.problem.solution; delete saved.problem.hints;
 assert.ok(content.solutionFor!(saved.problem), "saved problem changes must not mutate the catalogue");
 saved.hintUsed=true; saved.hintLevel=1;
 const before = JSON.stringify(h.record);
 const shown=h.view().task!;
 assert.equal(JSON.stringify(h.record),before);
 assert.equal(shown.key,saved.key);
 assert.deepEqual(shown.solutionParts,content.solutionFor!(saved.problem)!.slice(0,1));
 assert.equal(shown.explanation,undefined); assert.equal(shown.answers,undefined);
 assert.ok(shown.fields.every(f=>!Object.hasOwn(f,"answer")));
 const reloaded=harness(content,JSON.parse(before));
 reloaded.go({type:"hint",taskKey:saved.key});
 assert.equal(reloaded.view().task!.solutionParts!.length,2);
 reloaded.go({type:"hint",taskKey:saved.key});
 assert.equal(reloaded.view().task!.solutionParts!.length,3);
 reloaded.answer(); assert.equal(reloaded.view().task!.outcome,"hinted");
});

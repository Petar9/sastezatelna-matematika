import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { applyCourseAction, courseView, migrateKidsCourse, newKidsCourse } from "../src/core/kids-course.ts";
import type { CourseAttempt, KidsCourseContent } from "../src/core/kids-course.ts";
import { awardProblemGold, courseGoldBalance, problemGoldKey } from "../src/core/kids-gold.ts";
import { catalogueProblems, chooseSkillProblem, isCompetitionProblem, overlaps } from "../src/core/kids-selection.ts";
import { active2023Rows, competition2023Rows, original2023 } from "../src/server/kids-course-2023.ts";
import { kidsCourseContent as content } from "../src/server/kids-course-content.ts";
import { originalStatement } from "../src/server/original-statement.ts";

const now = "2026-11-04T12:00:00Z";
const all = catalogueProblems(content), added = all.filter(p => p.provenance?.year === 2023);
const previous: KidsCourseContent = { ...content, problem: (skill, index, hard) => {
 const pool = all.filter(p => p.skillId === skill && p.provenance?.year !== 2023 &&
  Array.from({ length: 100 }, (_, i) => content.problem(skill, i, hard)?.id).includes(p.id));
 return pool[index] ?? null;
} };

test("2023 transcription keeps all official ordered answers and withholds unresolved interpretations", () => {
 const answers = [[2],[0],[1],[3],[2],[2],[2],[1],[0],[3],[2],[0],[2],[2],[1],[43],[14],[17],[21],[19],[86,1219],[10,154],[406],[120],[612],[96]];
 assert.equal(competition2023Rows.length, 26);
 assert.deepEqual(competition2023Rows.map(row => original2023(row).fields.map(f => Number(f.answer))), answers);
 assert.equal(active2023Rows.length, 24); assert.equal(added.length, 24);
 assert.deepEqual(competition2023Rows.filter(r => r.reviewStatus).map(r => r.id), ["2023-M1-06", "2023-M1-17"]);
 for (const row of competition2023Rows.filter(r => r.reviewStatus)) assert.equal(all.find(p => p.id === `${row.id}:original`), undefined);
 assert.equal(content.topics.length, 17); assert.equal(content.topics.flatMap(t => t.skills).length, 78);
 assert.equal(content.version, "bg4-2024-2026-v2");
 for (const row of active2023Rows) {
  const p = added.find(p => p.id === `${row.id}:original`)!;
  assert.ok(content.topics.find(t => t.id === row.topic)?.skills.some(s => s.id === p.skillId));
  assert.equal(p.text, row.text); assert.deepEqual(p.options, row.options ?? undefined);
  assert.equal(p.solution?.length, 3); assert.deepEqual(p.solution!.flatMap(s => s.paragraphs), row.explanation);
  assert.equal(p.difficulty!.level, row.difficulty); assert.equal(p.provenance!.video, undefined);
  if (p.figure) assert.ok(fs.statSync(`assets/images${p.figure.src}`).size > 0);
  const statement = originalStatement(content, p.id)!;
  assert.equal(statement.text, row.text); assert.equal("fields" in statement, false); assert.equal("solution" in statement, false);
 }
 assert.equal(new Set(added.flatMap(p => p.figure ? [p.figure.src] : [])).size, 6);
});

test("every 2023 original is reachable after old sources, even with exhausted legacy cursors", () => {
 for (const p of added) {
  const course = newKidsCourse(content, now);
  const topic = content.topics.find(t => t.skills.some(s => s.id === p.skillId))!;
  Object.assign(course.topics[topic.id]!.skills[p.skillId]!, { nextCore: 999, nextHard: 999 });
  course.attempts = all.filter(q => q.skillId === p.skillId && isCompetitionProblem(q) && !overlaps(p, q, content))
   .map(q => ({ key: q.id, problem: q, mode: "core", hintUsed: false, outcome: "independent", completedAt: now }));
  assert.equal(chooseSkillProblem(course, content, p.skillId, false, now)?.problem.id, p.id);
 }
});

test("2023 long tasks retain ordered drafts and progressive help; source parts share one gold entitlement", () => {
 const p = added.find(p => p.id === "2023-M2-1a:original")!;
 const single: KidsCourseContent = { ...content, problem: (skill, index, hard) => skill === p.skillId && index === 0 && !hard ? p : null };
 let course = applyCourseAction(newKidsCourse(single, now), single, { type: "selectTopic", topicId: "sequences", skillId: p.skillId }, now);
 let task = courseView(course, single, now).task!;
 assert.equal(task.sourceYear, 2023); assert.equal(task.sourceProblemId, p.id); assert.equal(task.part!.total, 2);
 course = applyCourseAction(course, single, { type: "saveDraft", taskKey: task.key, partIndex: 0, answers: ["86"] }, now);
 course = applyCourseAction(course, single, { type: "hint", taskKey: task.key }, now);
 task = courseView(course, single, now).task!; assert.deepEqual(task.draft, ["86"]); assert.equal(task.solutionParts!.length, 1);
 course = JSON.parse(JSON.stringify(course)); assert.equal(courseView(course, single, now).task!.solutionParts!.length, 1);
 course = applyCourseAction(course, single, { type: "hint", taskKey: task.key }, now);
 assert.equal(courseView(course, single, now).task!.solutionParts!.length, 2);
 for (const source of ["2023-M2-1", "2023-M2-2"]) {
  const parts = added.filter(q => q.archive?.sourceId === source);
  assert.equal(parts.length, 3); assert.equal(new Set(parts.map(q => problemGoldKey(q, content))).size, 1);
  const record = newKidsCourse(content, now);
  for (const q of parts) awardProblemGold(record, content, { key: q.id, problem: q, mode: "core", hintUsed: true, outcome: "hinted" } as CourseAttempt, now);
  assert.equal(record.problemGoldAwards!.length, 1); assert.equal(courseGoldBalance(record), 15);
 }
});

test("2023 appending preserves existing snapshots, rewards, saved targets and skill identities", () => {
 let course = applyCourseAction(newKidsCourse(previous, now), previous, { type: "selectTopic", topicId: "digits" }, now);
 const task = courseView(course, previous, now).task!;
 course = applyCourseAction(course, previous, { type: "hint", taskKey: task.key }, now);
 course.goldAwards = [{ skillId: "M1-01", milestone: "started", earnedAt: now }];
 course.awards = [{ topicId: "digits", rank: "doctor", earnedAt: now, taskKey: "legacy" }];
 const before = structuredClone(course);
 assert.deepEqual(migrateKidsCourse(course, content, now), before);
 assert.equal(courseGoldBalance(course), courseGoldBalance(before));
 for (const topic of previous.topics) for (const skill of topic.skills) for (const hard of [false, true]) {
  for (let i = 0; ; i++) { const old = previous.problem(skill.id, i, hard); if (!old) break; assert.deepEqual(content.problem(skill.id, i, hard), old); }
 }
});

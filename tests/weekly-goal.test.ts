import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, courseView, newKidsCourse, type KidsCourseContent, type QuestStamp } from "../src/core/kids-course.ts";
import { weeklyAdventureGoal } from "../src/core/weekly-goal.ts";

const now = "2026-11-20T12:00:00.000Z";
const stamp = (earnedAt: string, questId = "quest-1"): QuestStamp => ({ questId, earnedAt, achievement: "Запазено постижение" });

test("weekly goal uses this course's saved completions without changing or exposing history", () => {
 const course = { stamps: [stamp("2026-11-16T10:00:00Z")] };
 const saved = JSON.stringify(course);
 assert.deepEqual(weeklyAdventureGoal(course, now), { weekStart: "2026-11-16", achieved: true });
 assert.deepEqual(weeklyAdventureGoal({}, now), { weekStart: "2026-11-16", achieved: false });
 assert.equal(JSON.stringify(course), saved);
 course.stamps.push(course.stamps[0]!);
 assert.deepEqual(weeklyAdventureGoal(course, now), { weekStart: "2026-11-16", achieved: true });
});

test("Sofia Monday boundary credits the completion week and resets only the projection", () => {
 const before = { stamps: [stamp("2026-11-15T21:59:59.999Z")] };
 const after = { stamps: [stamp("2026-11-15T22:00:00.000Z")] };
 assert.equal(weeklyAdventureGoal(before, now)!.achieved, false);
 assert.equal(weeklyAdventureGoal(after, now)!.achieved, true);
 assert.deepEqual(weeklyAdventureGoal(after, "2026-11-22T21:59:59.999Z"), { weekStart: "2026-11-16", achieved: true });
 assert.deepEqual(weeklyAdventureGoal(after, "2026-11-22T22:00:00.000Z"), { weekStart: "2026-11-23", achieved: false });
 assert.equal(after.stamps.length, 1);
});

test("weekly completion handles the year boundary and Sofia daylight saving changes", () => {
 for (const [completedAt, at, expected] of [
  ["2026-12-31T22:30:00Z", "2027-01-03T12:00:00Z", "2026-12-28"],
  ["2026-03-29T20:59:59Z", "2026-03-29T20:59:59Z", "2026-03-23"],
  ["2026-03-29T21:00:00Z", "2026-03-29T21:00:00Z", "2026-03-30"],
  ["2026-10-25T21:59:59Z", "2026-10-25T21:59:59Z", "2026-10-19"],
  ["2026-10-25T22:00:00Z", "2026-10-25T22:00:00Z", "2026-10-26"],
 ]) assert.deepEqual(weeklyAdventureGoal({ stamps: [stamp(completedAt!)] }, at!), { weekStart: expected, achieved: true });
});

test("future, missing and invalid completion dates cannot achieve a goal", () => {
 for (const earnedAt of ["", "invalid", "2026-11-20", "2026-11-20T13:00:00Z", "2026-02-30T12:00:00Z", "2026-11-23T00:00:00Z"])
  assert.equal(weeklyAdventureGoal({ stamps: [stamp(earnedAt)] }, now)!.achieved, false, earnedAt);
 assert.equal(weeklyAdventureGoal({}, "invalid"), undefined);
 assert.equal(weeklyAdventureGoal({}, "2026-11-20"), undefined);
});

const content: KidsCourseContent = {
 version: "weekly-test", topics: [{ id: "topic", title: "Тема", rewardName: "Награда", skills: [{ id: "skill", title: "Умение", lesson: ["Идея"] }] }],
 problem: (_id, index, hard) => !hard && index === 0 ? {
  id: "source:original", skillId: "skill", text: "1 + 1?", source: "Тест · 2025", fields: [{ label: "Отговор", answer: "2" }],
  hint: "Събери.", explanation: ["1 + 1 = 2"], provenance: { year: 2025, page: 1, objective: "source" },
  archive: { sourceId: "source", kind: "original", covers: ["skill"] },
 } : null,
};

test("a saved short adventure earns the goal only on existing completion, including helped and revealed work", () => {
 for (const outcome of ["independent", "hinted", "incorrect", "revealed"] as const) {
  const started = "2026-11-15T12:00:00Z";
  let course = applyCourseAction(newKidsCourse(content, started), content, { type: "startQuest" }, started);
  const key = course.quest!.work!.attempt.key;
  if (outcome === "hinted") course = applyCourseAction(course, content, { type: "hint", taskKey: key }, now);
  course = applyCourseAction(course, content, outcome === "revealed" ? { type: "reveal", taskKey: key }
   : { type: "answer", taskKey: key, answers: [outcome === "incorrect" ? "3" : "2"] }, now);
  assert.equal(courseView(course, content, now).weeklyGoal!.achieved, false);
  course = applyCourseAction(course, content, { type: "nextQuestion" }, now);
  assert.equal(course.quest!.total, 1);
  assert.equal(course.quest!.completedAt, now);
  assert.equal(course.stamps!.length, 1);
  assert.equal(courseView(course, content, now).weeklyGoal!.achieved, true);
  const saved = JSON.stringify(course);
  assert.deepEqual(courseView(JSON.parse(saved), content, now).weeklyGoal, { weekStart: "2026-11-16", achieved: true });
  assert.equal(JSON.stringify(course), saved);
  const continuing = applyCourseAction(course, content, { type: "startQuest" }, now);
  assert.equal(continuing.quest!.completed, 0);
  assert.equal(courseView(continuing, content, now).weeklyGoal!.achieved, true);
  assert.deepEqual(continuing.goldAwards, course.goldAwards);
  assert.deepEqual(continuing.problemGoldAwards, course.problemGoldAwards);
 }
});

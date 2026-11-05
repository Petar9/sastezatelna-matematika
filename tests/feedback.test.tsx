import React from "react";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { state, reset } from "./helpers/feedback-server.ts";
import { KidsError } from "../src/core/kids.ts";
import { applyCourseAction, newKidsCourse } from "../src/core/kids-course.ts";
import { kidsCourseContent as content } from "../src/server/kids-course-content.ts";
import { lastCourseAttempt, lastCourseStatement, courseProblemForTask } from "../src/server/pilot-summary.ts";
const fixture = new URL("./helpers/feedback-server.ts", import.meta.url).href;
const server = new URL("../src/server/index.ts", import.meta.url).href;
registerHooks({ load(url, context, nextLoad) {
 if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
 if (url.endsWith("/next/image.js")) return { format: "module", source: 'import React from "react"; export default function Image({unoptimized, ...props}) { return React.createElement("img", props); }', shortCircuit: true };
 if (url === server) return { format: "module", source: `export { mode,accountContext,parentContext,failure } from ${JSON.stringify(fixture)};`, shortCircuit: true };
 return nextLoad(url, context);
} });
Object.assign(globalThis, { React });
process.env.MATHS_APP_URL = "https://maths.example";
const { POST: report } = await import("../app/api/reports/route.ts");
const { default: LastTask } = await import("../app/parent/task/page.tsx");
const { default: Parent } = await import("../app/parent/page.tsx");
const now = "2026-11-05T12:00:00Z";
const started = () => applyCourseAction(newKidsCourse(content, now), content, { type: "selectTopic", topicId: "matches" }, now);
const request = (body: unknown, origin = "https://maths.example") => new Request("https://maths.example/api/reports", {
 method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const page = (child = "child-a", competition = "matematika-za-vseki") => LastTask({ searchParams: Promise.resolve({ child, competition }) });

test("last statement prefers saved current task, then completed attempt, with no grading data", () => {
 const course = started(), current = lastCourseAttempt(course)!;
 assert.ok(current);
 current.answers = ["PRIVATE-ANSWER"]; current.reasoning = "PRIVATE-REASONING";
 course.attempts.push({ ...current, key: "older", problem: { ...current.problem, text: "OLDER-TASK" }, outcome: "incorrect" });
 assert.equal(lastCourseAttempt(course)?.key, current.key);
 const projection = lastCourseStatement(course)!;
 assert.deepEqual(Object.keys(projection).sort(), ["id", "text", "source", "year", ...(current.problem.figure ? ["figure"] : []), ...(current.problem.options ? ["options"] : [])].sort());
 assert.ok(!JSON.stringify(projection).includes("PRIVATE"));
 assert.equal(courseProblemForTask(course, current.key), current.problem.id);
 assert.equal(courseProblemForTask(course, "foreign"), undefined);
 current.outcome = "revealed";
 assert.equal(lastCourseStatement(course)?.text, "OLDER-TASK");
 assert.equal(lastCourseStatement(null), undefined);
 assert.equal(lastCourseStatement(newKidsCourse(content, now)), undefined);
});

test("last task supports skill work, adventure work and authored snapshot statements", () => {
 let course = started();
 course = applyCourseAction(course, content, { type: "selectTopic", topicId: "matches", skillId: content.topics.find(topic => topic.id === "matches")!.skills[0]!.id }, now);
 // Use the actual selected task, independent of current catalogue indexes.
 const current = lastCourseAttempt(course)!;
 assert.ok(current); current.problem = { ...current.problem, id: "authored-snapshot", text: "SNAPSHOT-ONLY" };
 assert.equal(lastCourseStatement(course)?.text, "SNAPSHOT-ONLY");
 assert.equal(courseProblemForTask(course, current.key), "authored-snapshot");
 course = applyCourseAction(newKidsCourse(content, now), content, { type: "startQuest" }, now);
 assert.equal(lastCourseAttempt(course), course.quest?.work?.attempt);
 assert.equal(courseProblemForTask(course, course.quest!.work!.attempt.key), course.quest!.work!.attempt.problem.id);
});

test("parent last-task page is read-only, family scoped and excludes answers and solutions", async () => {
 reset(); const course = started(), current = lastCourseAttempt(course)!;
 current.problem = { ...current.problem, text: "SAVED-TASK-STATEMENT", explanation: ["PRIVATE-SOLUTION"], fields: [{ label: "Answer", answer: "PRIVATE-GRADING" }] };
 current.answers = ["PRIVATE-ANSWER"]; current.reasoning = "PRIVATE-REASONING"; state.course = course;
 const before = JSON.stringify(course);
 const markup = renderToStaticMarkup(await page());
 assert.ok(markup.includes("SAVED-TASK-STATEMENT")); assert.ok(!markup.includes("PRIVATE-"));
 assert.deepEqual(state.reads, [[["parent_id", "parent-a"], ["child_id", "child-a"], ["competition_id", "matematika-za-vseki"]]]);
 assert.deepEqual(state.writes, []); assert.equal(JSON.stringify(course), before);
 await assert.rejects(Parent({ searchParams: Promise.resolve({}) }), /NEXT_REDIRECT/);
 assert.ok(markup.includes("/progress?child=child-a"));
 reset(); assert.ok(renderToStaticMarkup(await page()).includes("Все още няма записана задача."));
 await assert.rejects(page("foreign-child"), /NEXT_HTTP_ERROR_FALLBACK;404/);
 await assert.rejects(page("child-a", "unpublished"), /NEXT_HTTP_ERROR_FALLBACK;404/);
 state.role = "child"; await assert.rejects(page(), /NEXT_REDIRECT/);
 state.authError = new KidsError("Sign in", 401); await assert.rejects(page(), /NEXT_REDIRECT/);
 assert.deepEqual(state.writes, []);
});

test("feedback accepts parent general messages and child messages with validated current task context", async () => {
 reset(); let response = await report(request({ description: "  Неясен текст.  ", parent_id: "foreign" }));
 assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store");
 assert.deepEqual(state.writes[0], { parent_id: "parent-a", child_id: null, competition_id: null, problem_id: null, submitted_by: "parent", description: "Неясен текст." });
 reset(); state.role = "child"; state.course = started(); const current = lastCourseAttempt(state.course)!;
 response = await report(request({ description: "Подсказката е неясна.", competitionId: "matematika-za-vseki", taskKey: current.key }));
 assert.equal(response.status, 200); assert.equal(state.writes[0]?.child_id, "child-a");
 assert.equal(state.writes[0]?.problem_id, current.problem.id); assert.equal(state.writes[0]?.submitted_by, "child");
 assert.deepEqual(state.reads, [[["parent_id", "parent-a"], ["child_id", "child-a"], ["competition_id", "matematika-za-vseki"]]]);
 reset(); state.role = "child"; response = await report(request({ description: "Обща обратна връзка" }));
 assert.equal(response.status, 200); assert.equal(state.writes[0]?.child_id, "child-a");
});

test("feedback refuses unauthenticated, cross-family, invalid and foreign-origin submissions", async () => {
 for (const role of ["parent", "child"] as const) {
  for (const body of [{ description: "" }, { description: " \n " }, { description: "x".repeat(1001) }, [], null,
   { description: "Hi", taskKey: "unknown" }, { description: "Hi", childId: "foreign" },
   { description: "Hi", competitionId: "unpublished" }, { description: "Hi", childId: {} },
   { description: "Hi", childId: "child-a", competitionId: "matematika-za-vseki", taskKey: "unknown" }]) {
   reset(); state.role = role; assert.ok((await report(request(body))).status >= 400); assert.deepEqual(state.writes, []);
  }
 }
 reset(); state.authError = new KidsError("Sign in", 401);
 assert.equal((await report(request({ description: "Hi" }))).status, 401); assert.deepEqual(state.writes, []);
 reset(); assert.equal((await report(request({ description: "Hi" }, "https://foreign.example"))).status, 403);
 assert.deepEqual(state.writes, []);
 reset(); state.deployment = "local"; assert.equal((await report(request({ description: "Hi" }))).status, 404);
});

test("failed feedback writes remain retryable without claiming success", async () => {
 reset(); state.databaseError = true;
 assert.equal((await report(request({ description: "Повторен опит" }))).status, 503); assert.deepEqual(state.writes, []);
 state.databaseError = false;
 assert.equal((await report(request({ description: "Повторен опит" }))).status, 200); assert.equal(state.writes.length, 1);
});

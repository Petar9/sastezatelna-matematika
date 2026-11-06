import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import type { CourseAttempt } from "../src/core/kids-course.ts";
import { newKidsCourse } from "../src/core/kids-course.ts";
import { chooseQuestProblem, hasQuestProblem } from "../src/core/kids-quest.ts";
import { catalogueProblems } from "../src/core/kids-selection.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { selectionFixture, selectionNow, selectionOld } from "../tests/helpers/selection-performance-fixture.ts";
import { referenceQuestProblem } from "../tests/helpers/selection-performance-reference.ts";

const runs = 5;
function median(run: () => unknown) {
 run();
 const times = Array.from({ length: runs }, () => { const start = performance.now(); run(); return performance.now() - start; }).sort((a, b) => a - b);
 return Number(times[Math.floor(runs / 2)]!.toFixed(3));
}
function realCatalogueFixture(historySize: number) {
 const content = kidsCourseContent, course = newKidsCourse(content, selectionNow), catalogue = catalogueProblems(content);
 course.attempts = Array.from({ length: historySize }, (_, i): CourseAttempt => ({
  key: `synthetic-attempt-${i}`, problem: structuredClone(catalogue[i % catalogue.length]!), mode: "core", hintUsed: false,
  outcome: (["independent", "hinted", "incorrect", "revealed"] as const)[i % 4], completedAt: selectionOld,
 }));
 course.quest = { id: "synthetic-benchmark-quest", startedAt: selectionNow, steps: [], completed: 0, diagnostic: false };
 return { content, course };
}
const fixtures = process.argv.includes("--real") ? [realCatalogueFixture(100), realCatalogueFixture(1000)] : [selectionFixture(1000, 16)];
for (const { course, content } of fixtures) {
 function preview() {
  const copy = structuredClone(course);
  copy.quest = { id: "preview", startedAt: selectionNow, steps: [], completed: 0, diagnostic: false };
  return copy;
 }
 const saved = JSON.stringify(course);
 assert.deepEqual(chooseQuestProblem(structuredClone(course), content, selectionNow), referenceQuestProblem(structuredClone(course), content, selectionNow));
 assert.equal(hasQuestProblem(course, content, selectionNow), !!referenceQuestProblem(preview(), content, selectionNow, undefined, true));
 console.log(JSON.stringify({ fixture: { content: content.version, skills: content.topics.flatMap(topic => topic.skills).length,
  catalogueProblems: catalogueProblems(content).length, attempts: course.attempts.length, learnerData: false, runs },
  parity: { rankedQuest: true, availability: true },
  questMs: { before: median(() => referenceQuestProblem(course, content, selectionNow)), after: median(() => chooseQuestProblem(course, content, selectionNow)) },
  availabilityMs: { includesOriginalDeepClone: true, before: median(() => referenceQuestProblem(preview(), content, selectionNow, undefined, true)), after: median(() => hasQuestProblem(course, content, selectionNow)) },
 }, null, 2));
 assert.equal(JSON.stringify(course), saved, "benchmark must not mutate its generated course");
}

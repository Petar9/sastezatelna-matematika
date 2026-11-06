import assert from "node:assert/strict";
import { test } from "node:test";
import type { CourseAttempt, CourseProblem, KidsCourse, KidsCourseContent } from "../src/core/kids-course.ts";
import { newKidsCourse } from "../src/core/kids-course.ts";
import { chooseSkillProblem } from "../src/core/kids-selection.ts";
import { chooseQuestProblem, hasQuestProblem } from "../src/core/kids-quest.ts";
import { selectionFixture, selectionNow, selectionOld } from "./helpers/selection-performance-fixture.ts";
import { referenceQuestProblem, referenceSkillProblem } from "./helpers/selection-performance-reference.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";
import { nvoCourseContent } from "../src/server/nvo-course-content.ts";

const attempt = (problem: CourseProblem, key = "seen", completedAt: string | undefined = selectionOld): CourseAttempt => ({ key, problem: structuredClone(problem), mode: "core", hintUsed: false, outcome: "independent", completedAt });
function preview(course: KidsCourse) { return { ...course, quest: { id: "preview", startedAt: selectionNow, steps: [], completed: 0, diagnostic: false } }; }

test("indexed selection preserves archive, duplicate, reservation, review and stable tie semantics", () => {
 const { content, course, bank } = selectionFixture(0, 2);
 const skill = "skill-0", problems = bank.get(skill)!;
 const select = (review = false, replacingKey?: string) => {
  const actual = chooseSkillProblem(course, content, skill, false, selectionNow, review, replacingKey);
  assert.deepEqual(actual, referenceSkillProblem(course, content, skill, false, selectionNow, review, replacingKey));
  return actual;
 };
 assert.equal(select()!.problem.id, problems[0]!.id, "equal-ranked originals keep catalogue order");
 const legacy = attempt(problems[0]!); delete legacy.problem.archive;
 course.attempts = [legacy];
 assert.equal(select()!.problem.id, problems[2]!.id, "canonical legacy original also excludes its part");
 const changed = attempt(problems[2]!); changed.problem.id = "saved-identical-copy";
 delete changed.problem.archive;
 course.attempts.push(changed);
 assert.equal(select()!.problem.id, problems[4]!.id, "identical text/options/answers exclude a renamed snapshot");
 const reserved = { attempt: { ...attempt(problems[4]!, "pending"), outcome: undefined } };
 course.topics["topic-0"]!.skillWork = { [skill]: reserved };
 assert.equal(select()!.problem.id, problems[3]!.id, "identity-only duplicate does not invent archive overlap with sibling");
 assert.equal(select(false, "pending")!.problem.id, problems[4]!.id, "replacement excludes its own reservation");
 course.topics["topic-0"]!.skillWork = {};
 course.attempts = problems.map((problem, i) => attempt(problem, `seen-${i}`));
 assert.equal(select(), undefined);
 assert.equal(select(true)!.problem.id, problems[0]!.id, "exactly two days permits review");
 course.attempts.push(attempt(problems[0]!, "recent", "2026-11-04T12:00:00.001Z"));
 assert.equal(select(true)!.problem.id, problems[2]!.id, "any recent overlapping attempt blocks original and part");
 course.attempts.at(-1)!.completedAt = undefined;
 assert.equal(select(true)!.problem.id, problems[2]!.id, "missing completion also blocks review");
 course.attempts.at(-1)!.completedAt = "invalid legacy date";
 assert.equal(select(true)!.problem.id, problems[0]!.id, "legacy unparseable dates retain their existing eligibility");
 // No history/context cache survives a call, even when callers mutate the same course.
 course.attempts.length = 0;
 assert.equal(select()!.problem.id, problems[0]!.id);
});

test("archive recovery requires identical saved content and does not transitively expand overlaps", () => {
 const { content, course, bank } = selectionFixture(0, 2);
 const problems = bank.get("skill-0")!;
 const saved = attempt(problems[0]!); delete saved.problem.archive;
 saved.problem.text += " changed historical wording";
 course.attempts = [saved];
 assert.equal(chooseSkillProblem(course, content, "skill-0", false, selectionNow)!.problem.id, problems[2]!.id);
 // Same ID excludes the original, but altered content cannot recover its archive to exclude the part.
 const onlyPart: KidsCourseContent = { ...content, problem: (id, index, hard) => id === "skill-0" && !index && !hard ? structuredClone(problems[1]!) : null };
 assert.equal(chooseSkillProblem(course, onlyPart, "skill-0", false, selectionNow)!.problem.id, problems[1]!.id);
 const disjoint = attempt(problems[1]!); disjoint.problem.id = "other-part";
 disjoint.problem.text = "A different historical part"; disjoint.problem.archive!.covers = ["b"];
 course.attempts = [disjoint];
 assert.deepEqual(chooseSkillProblem(course, content, "skill-0", false, selectionNow), referenceSkillProblem(course, content, "skill-0", false, selectionNow));
 assert.equal(chooseSkillProblem(course, onlyPart, "skill-0", false, selectionNow)!.problem.id, problems[1]!.id, "sharing a source alone is insufficient");
});

test("pool deduplication and harder authored exclusions preserve first encountered IDs", () => {
 const { content, bank } = selectionFixture(0, 2);
 const core = structuredClone(bank.get("skill-0")![6]!);
 const duplicate = { ...structuredClone(core), text: "Changed duplicate pool entry", archive: { sourceId: "duplicate", kind: "original" as const, covers: ["x"] } };
 const hard = { ...structuredClone(core), id: "hard-authored", text: "Hard authored task" };
 const finite: KidsCourseContent = { ...content, problem: (_id, index, harder) => index ? null : structuredClone(harder ? duplicate : core) };
 const course = newKidsCourse(finite, selectionNow);
 assert.deepEqual(chooseSkillProblem(course, finite, "skill-0", false, selectionNow), referenceSkillProblem(course, finite, "skill-0", false, selectionNow));
 assert.equal(chooseSkillProblem(course, finite, "skill-0", false, selectionNow)!.problem.text, core.text);
 const hardOnly: KidsCourseContent = { ...content, problem: (_id, index, harder) => !index && harder ? structuredClone(hard) : null };
 assert.equal(chooseSkillProblem(course, hardOnly, "skill-0", false, selectionNow), undefined);
 assert.equal(chooseSkillProblem(course, hardOnly, "skill-0", true, selectionNow)!.problem.id, hard.id);
});

test("quest choices match the original rankings across deterministic historical and progress states", () => {
 for (let seed = 0; seed < 24; seed++) {
  const { content, course, bank } = selectionFixture(48 + seed, 6);
  for (const [i, topic] of content.topics.entries()) for (const skill of topic.skills) {
   const state = course.topics[topic.id]!.skills[skill.id]!;
   state.confirmedAt = (seed + i) % 3 ? selectionOld : undefined;
   state.revisit = (seed + i) % 4 === 0;
   state.streak = (seed + i) % 3;
   state.reviewDueAt = seed % 2 ? selectionNow : "2026-11-08T12:00:00.000Z";
  }
  course.quest!.diagnostic = seed % 3 === 0;
  course.quest!.diagnosticFor = seed % 4 === 0 ? "skill-3" : undefined;
  course.quest!.completed = seed % 5;
  course.quest!.steps = Array.from({ length: seed % 4 }, (_, i) => ({ key: `step-${i}`, topicId: `topic-${i % 3}`, skillId: `skill-${i % 6}`, kind: "diagnostic" }));
  if (seed % 2) {
   const prior = attempt(bank.get("skill-3")![0]!, "quest-prior"); prior.questId = course.quest!.id; prior.outcome = seed % 3 ? "independent" : "incorrect";
   course.attempts.push(prior);
   if (seed % 5 === 0) course.attempts.push({ ...structuredClone(prior), key: "paired" });
  }
  if (seed % 3) course.topics["topic-0"]!.work.core = { attempt: { ...attempt(bank.get("skill-0")![2]!, "manual"), outcome: undefined } };
  for (const availabilityOnly of [false, true]) {
   const actual = structuredClone(course), expected = structuredClone(course);
   assert.deepEqual(chooseQuestProblem(actual, content, selectionNow, undefined, availabilityOnly), referenceQuestProblem(expected, content, selectionNow, undefined, availabilityOnly), `seed ${seed}, availability ${availabilityOnly}`);
   assert.deepEqual(actual, expected, "diagnostic mutations also match");
  }
  const before = structuredClone(course);
  assert.equal(hasQuestProblem(course, content, selectionNow), !!referenceQuestProblem(preview(course), content, selectionNow, undefined, true));
  assert.deepEqual(course, before, "availability never modifies learner history or quest");
 }
});

test("availability replaces current quest reservations while retaining all manual reservations", () => {
 const { content, bank } = selectionFixture(0, 2);
 const problem = bank.get("skill-0")![0]!;
 const single: KidsCourseContent = { ...content, problem: (id, index, hard) => id === problem.skillId && !index && !hard ? structuredClone(problem) : null };
 const course = newKidsCourse(single, selectionNow);
 course.quest = { id: "current", startedAt: selectionNow, steps: [], completed: 0, diagnostic: false, work: { attempt: { ...attempt(problem, "quest-pending"), outcome: undefined } } };
 assert.equal(hasQuestProblem(course, single, selectionNow), true);
 course.topics["topic-0"]!.work.core = { attempt: { ...attempt(problem, "manual-pending"), outcome: undefined } };
 assert.equal(hasQuestProblem(course, single, selectionNow), false);
 course.topics["topic-0"]!.work.core!.attempt.outcome = "hinted";
 assert.equal(hasQuestProblem(course, single, selectionNow), true);
 course.attempts.push(attempt(problem));
 assert.equal(hasQuestProblem(course, single, selectionNow), false);
});

test("all published catalogues retain skill and quest choices with legacy synthetic history", () => {
 for (const content of [kidsCourseContent, olympiadCourseContent, nvoCourseContent]) {
  const course = newKidsCourse(content, selectionNow);
  for (const topic of content.topics) for (const skill of topic.skills) {
   const original = content.problem(skill.id, 0, false);
   if (original) { const legacy = attempt(original, `legacy-${skill.id}`); delete legacy.problem.archive; course.attempts.push(legacy); }
  }
  for (const topic of content.topics) for (const skill of topic.skills) for (const harder of [false, true]) for (const review of [false, true]) {
   assert.deepEqual(chooseSkillProblem(course, content, skill.id, harder, selectionNow, review), referenceSkillProblem(course, content, skill.id, harder, selectionNow, review), `${content.version}: ${skill.id}, harder ${harder}, review ${review}`);
  }
  course.quest = { id: "synthetic-quest", startedAt: selectionNow, steps: [], completed: 0, diagnostic: true };
  const expected = structuredClone(course);
  assert.deepEqual(chooseQuestProblem(course, content, selectionNow), referenceQuestProblem(expected, content, selectionNow), content.version);
  assert.deepEqual(course, expected);
  assert.equal(hasQuestProblem(course, content, selectionNow), !!referenceQuestProblem(preview(course), content, selectionNow, undefined, true));
 }
});

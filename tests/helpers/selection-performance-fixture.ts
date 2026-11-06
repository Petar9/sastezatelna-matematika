import { newKidsCourse } from "../../src/core/kids-course.ts";
import type { CourseAttempt, CourseProblem, KidsCourseContent } from "../../src/core/kids-course.ts";

export const selectionNow = "2026-11-06T12:00:00.000Z";
export const selectionOld = "2026-11-04T12:00:00.000Z";
export function selectionFixture(historySize = 600, skillCount = 12) {
 const bank = new Map<string, CourseProblem[]>();
 const topics = Array.from({ length: skillCount / 2 }, (_, topic) => ({
  id: `topic-${topic}`, title: `Synthetic topic ${topic}`, rewardName: "fixture",
  skills: [0, 1].map(offset => ({ id: `skill-${topic * 2 + offset}`, title: "Synthetic skill", lesson: ["Fixture"] }))
 }));
 const objectiveMap = Object.fromEntries(topics.flatMap((topic, i) => topic.skills.map(skill => [skill.id, { primary: `method-${i}`, related: [] }])));
 for (const skill of topics.flatMap(topic => topic.skills)) {
  bank.set(skill.id, Array.from({ length: 12 }, (_, i): CourseProblem => ({
   id: `${skill.id}-problem-${i}`, skillId: skill.id, text: `Synthetic ${skill.id} exercise ${i}`, source: "Synthetic fixture",
   fields: [{ label: "Answer", answer: `${i + 1}` }], hint: "Fixture", explanation: ["Fixture"],
   ...(i < 6 ? { archive: { sourceId: `${skill.id}-source-${Math.floor(i / 2)}`, kind: i % 2 ? "part" : "original", covers: ["a", ...(i % 2 ? [] : ["b"])] } } : {}),
  })));
 }
 const content: KidsCourseContent = {
  version: "synthetic-selection-performance", topics, objectiveMap,
  concepts: topics.map((_, i) => ({ id: `method-${i}`, title: "Synthetic method", prerequisites: i ? [`method-${i - 1}`] : [], attention: "", idea: "", workedStep: "" })),
  introductions: Object.fromEntries(topics.map((topic, i) => [`method-${i}`, { problemId: `${topic.skills[1]!.id}-problem-4`, rationale: "Synthetic editorial fixture" }])),
  problem: (id, index, harder) => {
   const problem = bank.get(id)?.[index + (harder ? 8 : 0)];
   return problem && index < (harder ? 4 : 8) ? structuredClone(problem) : null;
  },
 };
 const course = newKidsCourse(content, selectionNow);
 const skills = topics.flatMap(topic => topic.skills);
 course.attempts = Array.from({ length: historySize }, (_, i): CourseAttempt => {
  const skill = skills[i % skills.length]!;
  const exposed = i < skills.length;
  const problem = structuredClone(bank.get(skill.id)![0]!);
  if (!exposed) { problem.id = `historic-${i}`; problem.text = `Unrelated historical synthetic exercise ${i}`; problem.archive = { sourceId: `historic-source-${i}`, kind: "original", covers: ["a"] }; }
  return { key: `attempt-${i}`, problem, mode: "core", hintUsed: false, outcome: ["independent", "hinted", "incorrect", "revealed"][i % 4] as CourseAttempt["outcome"], completedAt: selectionOld };
 });
 course.quest = { id: "synthetic-quest", startedAt: selectionNow, steps: [], completed: 0, diagnostic: false };
 return { content, course, bank };
}

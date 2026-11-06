import assert from "node:assert/strict";
import test from "node:test";
import type { ConnectedCourseProblem, CourseProblem, KidsCourseContent } from "../src/core/kids-course.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { nvoCourseContent } from "../src/server/nvo-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";
import { proletnoCourseContent } from "../src/server/proletno-course-content.ts";
import { originalStatement } from "../src/server/original-statement.ts";

function inventory(content: KidsCourseContent) {
 const originals = new Map<string, ConnectedCourseProblem>();
 const aliases = new Map<string, CourseProblem>();
 for (const topic of content.topics) for (const skill of topic.skills) for (const harder of [false, true]) {
  for (let index = 0; ; index++) {
   const problem = content.problem(skill.id, index, harder);
   if (!problem) break;
   const connected = content.connectedProblem?.(problem);
   if (!connected) continue;
   assert.equal(JSON.stringify(originals.get(connected.sourceId) ?? connected), JSON.stringify(connected), `Alias disagreement: ${problem.id}`);
   originals.set(connected.sourceId, connected);
   aliases.set(problem.id, problem);
  }
 }
 return { originals, aliases };
}

for (const [name, content, sourceCount, unitCount, islandCounts] of [
 ["Maths", kidsCourseContent, 86, 102, [3, 7, 1, 6, 9, 4, 9, 11, 3, 7, 8, 8, 3, 1, 2, 4]],
 ["NVO", nvoCourseContent, 100, 108, [47, 5, 9, 26, 5, 8]],
 ["Olympiad", olympiadCourseContent, 11, 21, [4, 4, 2, 1]],
 ["Spring", proletnoCourseContent, 19, 38, [5, 6, 5, 3]],
] as const) {
 test(`${name}: every natural part links to the full original without answer keys`, () => {
  for (const source of inventory(content).originals.values()) {
   for (const unit of source.units) {
    const statement = originalStatement(content, `${source.sourceId}:unit:${unit.id}`)!;
    assert.ok(statement, `${source.sourceId}/${unit.id}`);
    assert.equal(statement.text, source.text);
    assert.deepEqual(statement.figures, source.figures ?? (source.figure ? [source.figure] : []));
    assert.ok(Object.keys(statement).every(key => ["id", "text", "source", "figure", "figures", "options"].includes(key)));
   }
   assert.equal(originalStatement(content, `${source.sourceId}:unit:missing`), undefined);
  }
 });
 test(`${name}: every eligible original has one island and reviewed natural units`, () => {
  const { originals, aliases } = inventory(content);
  assert.equal(originals.size, sourceCount);
  assert.equal([...originals.values()].reduce((sum, source) => sum + source.units.length, 0), unitCount);
  assert.deepEqual(content.navigationGroups!.map(group => group.sourceIds.length), islandCounts);
  const ownership = content.navigationGroups!.flatMap(group => group.sourceIds);
  assert.equal(new Set(ownership).size, ownership.length);
  assert.deepEqual([...ownership].sort(), [...originals.keys()].sort());
  const skills = new Set(content.topics.flatMap(topic => topic.skills.map(skill => skill.id)));
  for (const source of originals.values()) {
   assert.ok(source.text.trim());
   const completed = new Set<string>();
   for (const unit of source.units) {
    assert.ok(skills.has(unit.skillId));
    assert.equal(unit.solution.length, 3);
    assert.ok(unit.fields.length > 0);
    for (const step of unit.solution) assert.ok(step.paragraphs.length > 0 && step.paragraphs.every(text => text.trim()));
    for (const dependency of unit.dependsOn ?? []) assert.ok(completed.has(dependency));
    completed.add(unit.id);
    if (source.units.length > 1 && source.introduction) assert.ok(!unit.text.includes(source.introduction), `Duplicated intro: ${source.sourceId}/${unit.id}`);
   }
  }
  for (const [id, problem] of aliases) {
   const source = content.connectedProblem!(problem)!;
   assert.ok(source.legacyGoldKeys!.includes(`problem:${id}`));
   if (problem.archive?.kind === "original") assert.deepEqual(source.units.flatMap(unit => unit.fields), problem.fields, `Lost or duplicated answer: ${id}`);
  }
 });
}

test("Maths preserves all parts of eight M2 originals and their distinct figures", () => {
 const { originals } = inventory(kidsCourseContent);
 const sources = [...originals.values()].filter(source => source.sourceId.includes("M2-"));
 assert.equal(sources.length, 8);
 assert.deepEqual(Object.fromEntries(sources.map(source => [source.sourceId, source.units.length])), {
  "2023-M2-1": 3, "2025-M2-1": 4, "2023-M2-2": 3, "2025-M2-2": 3,
  "M2-1": 3, "2026-M2-2": 3, "2026-M2-1": 3, "M2-2": 2,
 });
 assert.equal(originals.get("M2-2")!.units[0]!.fields.length, 3);
 assert.equal(originals.get("2026-M2-1")!.units[2]!.fields.length, 3);
 assert.equal(originals.get("M2-2")!.figures!.length, 2);
 assert.notEqual(originals.get("M2-2")!.units[0]!.figure!.src, originals.get("M2-2")!.units[1]!.figure!.src);
 for (const source of sources) assert.equal(kidsCourseContent.navigationGroups!.filter(group => group.sourceIds.includes(source.sourceId)).length, 1);
 assert.ok(!originals.has("2023-M1-06"));
 assert.ok(!originals.has("2023-M1-17"));
});

test("unlettered originals stay one natural question, with scaffolds inside the solution", () => {
 const { originals: olympiad } = inventory(olympiadCourseContent);
 for (const year of [2022, 2023, 2025]) {
  const source = olympiad.get(`oli-g4-municipal-${year}-p1`)!;
  assert.equal(source.units.length, 1);
  assert.equal(source.units[0]!.fields.length, 1);
 }
 assert.deepEqual(olympiad.get("oli-g4-municipal-2025-p1")!.units[0]!.options, ["MMXV", "MMXXV", "MMXXIV", "MMXXXV"]);
 assert.ok(!olympiad.has("oli-g4-municipal-2023-p3"));
 const { originals: spring } = inventory(proletnoCourseContent);
 for (const year of [2024, 2025]) assert.equal(spring.get(`pms-g4-${year}-p1`)!.units.length, 1);
 assert.equal(spring.get("pms-g4-2023-p3")!.units[0]!.fields.length, 3);
 assert.ok(!spring.has("pms-g4-2024-p6"));
 assert.match(spring.get("pms-g4-2024-p3")!.units[1]!.text, /1 = Пипи, 2 = Томи, 3 = Аника/);
});

test("NVO task 25 has three independent natural parts, each with its own three worked stages", () => {
 const { originals } = inventory(nvoCourseContent);
 for (const year of [2022, 2023, 2024, 2025]) {
  const source = originals.get(`nvo-${year}-p25`)!;
  assert.deepEqual(source.units.map(unit => unit.id), ["a", "b", "c"]);
  for (const unit of source.units) {
   assert.equal(unit.fields.length, 1);
   assert.equal(unit.solution.length, 3);
   assert.equal(unit.dependsOn, undefined);
  }
 }
 assert.match(originals.get("nvo-2025-p25")!.units[2]!.solution[2].paragraphs.join(" "), /420/);
});


test("Maths geometry separates boundary and area methods while keeping full originals together", () => {
 const groups=kidsCourseContent.navigationGroups!;
 const perimeter=groups.find(g=>g.id==="perimeters")!, area=groups.find(g=>g.id==="areas")!;
 assert.equal(perimeter.title,"Обиколки на фигури");
 assert.equal(area.title,"Лица и мрежи");
 for(const id of ["2023-M2-2","2025-M2-2"]) assert.ok(perimeter.sourceIds.includes(id));
 for(const id of ["M2-2","2026-M2-2"]) assert.ok(area.sourceIds.includes(id));
 assert.deepEqual(area.topicIds,["areas","grids"]);
 assert.equal(groups.length,16);
});

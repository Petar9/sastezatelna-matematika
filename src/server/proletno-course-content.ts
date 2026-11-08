import { preparationBaselines } from "../core/preparation-baselines.ts";
import { competitionRewardDifficulty } from "../core/competitions.ts";
import { connectedRegistry, connectedUnit, letteredStatement, navigationGroups, singleConnected } from "./connected-course-content.ts";
import archive from "../../content/proletno/2023-2026.json" with { type: "json" };
import { originalDifficulty, proletnoPracticeDifficulty } from "./problem-difficulty.ts";
import type { CourseProblem, CourseSolution, CourseTopic, KidsCourseContent } from "../core/kids-course.ts";

interface Field { label: string; answer: number | string; unit?: string }
interface Unit { id: string; family: string; prompt: string; fields: Field[]; steps: string[]; scaffold: boolean }
interface Original { id: string; year: number; problem: number; text: string; units: Unit[]; owner: string; page: number; figure: string | null; blocked?: string }
interface Practice { id: string; pool: string; text: string; fields: Field[]; steps: string[] }
interface Family { id: string; island: string; title: string; prerequisites: string[]; unitIds: string[]; items: Practice[] }
const pack: { originals: Original[]; families: Family[]; videos: Record<string, string> } = archive;
const version = "bg4-proletno-2023-2026-draft-v1";
const islands = [
 { key: "numbers", title: "Числа и пресмятане" },
 { key: "parts", title: "Части и разпределяне" },
 { key: "weight", title: "Тегло и цени" },
 { key: "geometry", title: "Фигури и мерки" },
 { key: "motion", title: "Движение и работа" },
 { key: "logic", title: "Броене и логика" },
];
const skillId = (family: Family) => `pms-${family.id}`;
const eligible = pack.originals.filter(original => !original.blocked);
function solution(steps: string[]): CourseSolution {
 if (steps.length !== 3 || steps.some(step => !step.trim())) throw new Error("Expected three concrete solution parts");
 return steps.map((step, i) => ({ title: `Стъпка ${i + 1}`, paragraphs: [step] })) as CourseSolution;
}
function fullSolution(units: Unit[]): CourseSolution {
 if (units.length === 1) return solution(units[0]!.steps);
 if (units.length === 2) return [
  { title: "Стъпка 1", paragraphs: units[0]!.steps },
  { title: "Стъпка 2", paragraphs: units[1]!.steps.slice(0, 2) },
  { title: "Стъпка 3", paragraphs: units[1]!.steps.slice(2) },
 ];
 return [
  { title: "Стъпка 1", paragraphs: units.slice(0, -2).flatMap(unit => unit.steps) },
  { title: "Стъпка 2", paragraphs: units.at(-2)!.steps },
  { title: "Стъпка 3", paragraphs: units.at(-1)!.steps },
 ];
}
function problem(id: string, owner: Family, text: string, source: string, input: Field[], worked: CourseSolution): CourseProblem {
 return { id, skillId: skillId(owner), text, source,
  fields: input.map(field => ({ label: `${field.label}${field.unit ? ` (${field.unit})` : ""}`, answer: String(field.answer) })),
  hint: worked[0].paragraphs.join("\n"), hints: worked.map(part => part.paragraphs.join("\n")) as [string, string, string],
  explanation: worked.flatMap(part => part.paragraphs), solution: worked };
}
function sourceProblem(original: Original, owner: Family, unit?: Unit): CourseProblem {
 const requested = unit ? [unit] : original.units;
 // The source asks for a name; the explicit numeric mapping preserves keypad input without pretending to grade prose.
 const clarification = original.year === 2024 && original.problem === 3 && (!unit || unit.id.endsWith("-b"))
  ? "\n\nЗа въвеждане на отговора на б): 1 = Пипи, 2 = Томи, 3 = Аника." : "";
 const p = problem(unit?.id ?? `${original.id}:original`, owner,
  original.text + (unit ? `\n\nУчебна стъпка: ${unit.prompt}` : "") + clarification,
  `Пролетни математически състезания · ${original.year} г. · 4. клас · задача ${original.problem}${unit ? " · учебна стъпка по оригиналното условие" : " · оригинално условие"}`,
  requested.flatMap(item => item.fields), unit ? solution(unit.steps) : fullSolution(original.units));
 p.difficulty = originalDifficulty(original.id);
 p.archive = { sourceId: original.id, kind: !unit ? "original" : unit.scaffold ? "scaffold" : "part", covers: requested.map(item => item.id) };
 p.provenance = { year: original.year, page: original.page, objective: unit?.id ?? original.id, video: `https://www.youtube.com/watch?v=${pack.videos[String(original.year)]}` };
 if (original.figure) p.figure = { src: `/kids/figures/proletno/${original.year}-p${original.problem}.png`, alt: original.figure };
 return p;
}
function practiceSource(family: Family) {
 const original = eligible.find(item => item.units.some(unit => family.unitIds.includes(unit.id)));
 if (!original) throw new Error(`Missing original for Spring skill: ${family.id}`);
 return { year: original.year, problemId: `${original.id}:original` };
}
const pools = new Map<string, { core: CourseProblem[]; hard: CourseProblem[] }>();
const all = new Map<string, CourseProblem>();
for (const family of pack.families) {
 const authored = (pool: string) => family.items.filter(item => item.pool === pool).map(item => ({
  ...problem(item.id, family, item.text, "Учебно упражнение · Пролетни математически състезания · 4. клас", item.fields, solution(item.steps)),
  practiceSource: practiceSource(family), difficulty: proletnoPracticeDifficulty(item.id),
 }));
 const core: CourseProblem[] = authored("core"), hard: CourseProblem[] = [];
 for (const original of eligible) {
  for (const unit of original.units) if (family.unitIds.includes(unit.id)) core.push(sourceProblem(original, family, unit));
  if (original.owner === family.id) hard.push(sourceProblem(original, family));
 }
 hard.push(...authored("hard"));
 pools.set(skillId(family), { core, hard });
 for (const p of [...core, ...hard]) {
  if (all.has(p.id)) throw new Error(`Duplicate Spring problem: ${p.id}`);
  all.set(p.id, p);
 }
}
const topics: CourseTopic[] = islands.map(island => ({ id: `pms-${island.key}`, title: island.title, rewardName: island.title.toLocaleLowerCase("bg"),
 skills: pack.families.filter(family => family.island === island.key).map(family => ({ id: skillId(family), title: family.title, lesson: family.items[0]!.steps })) }));
const dependencies: Record<string, number[][]> = {
 "2023-p2": [[], [0]], "2023-p3": [[], [0]], "2023-p4": [[], [0]], "2023-p5": [[], [0]],
 "2024-p2": [[], [0], []], "2024-p4": [[], [0]], "2024-p5": [[], [0]],
 "2025-p2": [[], [0]], "2025-p3": [[], [0]], "2026-p1": [[], [0]],
 "2026-p2": [[], [0], [0]], "2026-p3": [[], [0], [1]], "2026-p4": [[], [0], [0]],
};
const connected = connectedRegistry(eligible.map(original => {
 const full = all.get(`${original.id}:original`)!;
 const unlettered = ["2023-p1", "2023-p6", "2024-p1", "2025-p1"].includes(`${original.year}-p${original.problem}`);
 const statement = unlettered ? undefined : letteredStatement(original.text, original.units.length);
 const descriptor = unlettered ? singleConnected(full) : {
  sourceId: original.id, text: original.text, introduction: statement!.introduction, figure: full.figure,
  units: original.units.map((unit, index) => {
   const text = statement!.parts[index]! + (original.year === 2024 && original.problem === 3 && index === 1
    ? "\n\nЗа въвеждане на отговора: 1 = Пипи, 2 = Томи, 3 = Аника." : "");
   const result = connectedUnit(all.get(unit.id)!, unit.id, text);
   const deps = dependencies[`${original.year}-p${original.problem}`]?.[index];
   if (deps?.length) result.dependsOn = deps.map(i => original.units[i]!.id);
   return result;
  }),
 };
 return { problem: descriptor, aliases: [full.id, ...original.units.map(unit => unit.id)] };
}));
const sourceHomes: Record<string, string> = {};
for (const [home, sources] of Object.entries({
 "pms-numbers": ["2023-p1", "2023-p5", "2024-p1", "2025-p1", "2026-p1"],
 "pms-parts": ["2023-p2", "2023-p3", "2024-p3", "2024-p4", "2025-p2", "2026-p3"],
 "pms-geometry": ["2023-p4", "2024-p2", "2024-p5", "2025-p3", "2026-p2"],
 "pms-logic": ["2023-p6", "2025-p4", "2026-p4"],
})) for (const source of sources) sourceHomes[`pms-g4-${source}`] = home;
const groups = navigationGroups(topics, [
 { id: "pms-numbers", title: "Числови загадки" },
 { id: "pms-parts", title: "Истории с количества", topicIds: ["pms-parts", "pms-weight", "pms-motion"] },
 { id: "pms-geometry", title: "Фигури и измервания" }, { id: "pms-logic" },
], connected.sources, source => sourceHomes[source.sourceId]!);
export const proletnoCourseContent: KidsCourseContent = {
 rewardDifficulty: competitionRewardDifficulty("proletno"),
 preparationBaseline: preparationBaselines["proletno"],
 version, topics, navigationGroups: groups, connectedProblem: connected.connectedProblem,
 introductions: Object.fromEntries(pack.families.map(family => {
  const original = eligible.find(item => item.owner === family.id);
  const unit = eligible.flatMap(item => item.units).find(item => family.unitIds.includes(item.id));
  return [skillId(family), { problemId: original ? `${original.id}:original` : unit?.id,
   rationale: `Първо упражняваме: ${family.title.toLocaleLowerCase("bg")}.` }];
 })),
 concepts: pack.families.map(family => ({ id: skillId(family), title: family.title, prerequisites: family.prerequisites.map(id => `pms-${id}`),
  attention: family.items[0]!.text, idea: family.items[0]!.steps[0]!, workedStep: family.items[0]!.steps.slice(1).join(" ") })),
 objectiveMap: Object.fromEntries(pack.families.map(family => [skillId(family), { primary: skillId(family), related: family.prerequisites.map(id => `pms-${id}`) }])),
 problem(id, index, harder) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const p = pools.get(id)?.[harder ? "hard" : "core"][index];
  return p ? structuredClone(p) : null;
 },
 solutionFor(saved) {
  const p = all.get(saved.id);
  return p && p.text === saved.text && JSON.stringify(p.fields) === JSON.stringify(saved.fields) && JSON.stringify(p.options) === JSON.stringify(saved.options)
   ? structuredClone(p.solution) : undefined;
 },
};
export const proletnoDraftReview = {
 status: "draft-human-review-required", originals: pack.originals.length, availableOriginals: eligible.length,
 learningUnits: eligible.reduce((count, original) => count + original.units.length, 0),
 authoredExercises: pack.families.reduce((count, family) => count + family.items.length, 0),
 excludedFromGrading: pack.originals.filter(original => original.blocked).map(original => original.id),
 missingOfficialSolutions: [2026],
} as const;

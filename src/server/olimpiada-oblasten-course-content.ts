import { connectedRegistry, connectedUnit, letteredStatement, navigationGroups, singleConnected } from "./connected-course-content.ts";
import archive from "../../content/olimpiada-oblasten/2023-2026.json" with { type: "json" };
import { originalDifficulty, regionalOlympiadPracticeDifficulty } from "./problem-difficulty.ts";
import type { CourseProblem, CourseSolution, CourseTopic, KidsCourseContent } from "../core/kids-course.ts";

interface Field { label: string; answer: number | string; unit?: string }
interface Unit { id: string; family: string; prompt: string; fields: Field[]; steps: string[]; scaffold: boolean; dependsOn: number[] }
interface Original { id: string; year: number; problem: number; text: string; units: Unit[]; owner: string; page: number; figure: string | null; blocked?: string }
interface Practice { id: string; pool: string; text: string; fields: Field[]; steps: string[] }
interface Family { id: string; island: string; title: string; prerequisites: string[]; unitIds: string[]; items: Practice[] }
const pack: { originals: Original[]; families: Family[]; videos: Record<string, string> } = archive;
const version = "bg4-olimpiada-oblasten-2023-2026-draft-v1";
const islands = [
 { key: "numbers", title: "Числови загадки" },
 { key: "stories", title: "Истории с числа" },
 { key: "geometry", title: "Геометрични открития" },
 { key: "motion", title: "Срещи и обиколки" },
];
const skillId = (family: Family) => `oli-ob-${family.id}`;
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
 const clarification = original.year === 2023 && original.problem === 2 && (!unit || unit.id.endsWith("-c"))
  ? "\n\nЗа въвеждане на отговора на в): 1 = да, 0 = не. Въведи също броя на пъстрите кокошки и колко най-много могат да се настанят в клетките." : "";
 const p = problem(unit?.id ?? `${original.id}:original`, owner,
  original.text + (unit ? `\n\nУчебна стъпка: ${unit.prompt}` : "") + clarification,
  `Олимпиада (областен кръг) · ${original.year} г. · 4. клас · задача ${original.problem}${unit ? " · учебна стъпка по оригиналното условие" : " · оригинално условие"}`,
  requested.flatMap(item => item.fields), unit ? solution(unit.steps) : fullSolution(original.units));
 p.difficulty = originalDifficulty(original.id);
 p.archive = { sourceId: original.id, kind: !unit ? "original" : unit.scaffold ? "scaffold" : "part", covers: requested.map(item => item.id) };
 p.provenance = { year: original.year, page: original.page, objective: unit?.id ?? original.id, video: `https://www.youtube.com/watch?v=${pack.videos[String(original.year)]}` };
 if (original.figure) p.figure = figureFor(original, unit?.id.endsWith("-b") ? 1 : 0);
 return p;
}
function figureFor(original: Original, index = 0) {
 const suffix = original.year === 2023 && original.problem === 3 ? (index === 1 ? "-b" : "-a") : "";
 return { src: `/kids/figures/olimpiada-oblasten/${original.year}-p${original.problem}${suffix}.png`,
  alt: original.year === 2023 && original.problem === 3 ? (index === 1 ? "Оригинален чертеж на KLMN с редуващи се квадрати." : "Оригинален чертеж на ABCD с три големи и два малки квадрата.") : original.figure! };
}
function practiceSource(family: Family) {
 const original = eligible.find(item => item.units.some(unit => family.unitIds.includes(unit.id)));
 if (!original) throw new Error(`Missing original for regional Olympiad skill: ${family.id}`);
 return { year: original.year, problemId: `${original.id}:original` };
}
const pools = new Map<string, { core: CourseProblem[]; hard: CourseProblem[] }>();
const all = new Map<string, CourseProblem>();
for (const family of pack.families) {
 const authored = (pool: string) => family.items.filter(item => item.pool === pool).map(item => ({
  ...problem(item.id, family, item.text, "Учебно упражнение · Олимпиада (областен кръг) · 4. клас", item.fields, solution(item.steps)),
  practiceSource: practiceSource(family), difficulty: regionalOlympiadPracticeDifficulty(item.id),
 }));
 const core: CourseProblem[] = authored("core"), hard: CourseProblem[] = [];
 for (const original of eligible) {
  for (const unit of original.units) if (family.unitIds.includes(unit.id)) core.push(sourceProblem(original, family, unit));
  if (original.owner === family.id) hard.push(sourceProblem(original, family));
 }
 hard.push(...authored("hard"));
 pools.set(skillId(family), { core, hard });
 for (const p of [...core, ...hard]) {
  if (all.has(p.id)) throw new Error(`Duplicate regional Olympiad problem: ${p.id}`);
  all.set(p.id, p);
 }
}
const topics: CourseTopic[] = islands.map(island => ({ id: `oli-ob-${island.key}`, title: island.title, rewardName: island.title.toLocaleLowerCase("bg"),
 skills: pack.families.filter(family => family.island === island.key).map(family => ({ id: skillId(family), title: family.title, lesson: family.items[0]!.steps })) }));
const connected = connectedRegistry(eligible.map(original => {
 const full = all.get(`${original.id}:original`)!;
 const unlettered = original.problem === 1;
 const statement = unlettered ? undefined : letteredStatement(original.text, original.units.length);
 const descriptor = unlettered ? singleConnected(full) : {
  sourceId: original.id, text: original.text, introduction: statement!.introduction, figure: full.figure,
  ...(original.year === 2023 && original.problem === 3 ? { figures: [figureFor(original), figureFor(original, 1)] } : {}),
  units: original.units.map((unit, index) => {
   const text = statement!.parts[index]! + (original.year === 2023 && original.problem === 2 && index === 2
    ? "\n\nЗа въвеждане на отговора: 1 = да, 0 = не. Въведи също броя на пъстрите кокошки и колко най-много могат да се настанят в клетките." : "");
   const result = connectedUnit(all.get(unit.id)!, unit.id, text);
   const deps = unit.dependsOn;
   if (deps?.length) result.dependsOn = deps.map(i => original.units[i]!.id);
   return result;
  }),
 };
 return { problem: descriptor, aliases: [full.id, ...original.units.map(unit => unit.id)] };
}));
const familyHomes = Object.fromEntries(pack.families.map(family => [family.id, `oli-ob-${family.island}`]));
const sourceHomes = Object.fromEntries(eligible.map(original => [original.id, familyHomes[original.owner]!]));
const groups = navigationGroups(topics, islands.map(island => ({ id: `oli-ob-${island.key}`, title: island.title })),
 connected.sources, source => sourceHomes[source.sourceId]!);
export const regionalOlympiadCourseContent: KidsCourseContent = {
 version, topics, navigationGroups: groups, connectedProblem: connected.connectedProblem,
 introductions: Object.fromEntries(pack.families.map(family => {
  const original = eligible.find(item => item.owner === family.id);
  const unit = eligible.flatMap(item => item.units).find(item => family.unitIds.includes(item.id));
  return [skillId(family), { problemId: original ? `${original.id}:original` : unit?.id,
   rationale: `Първо упражняваме: ${family.title.toLocaleLowerCase("bg")}.` }];
 })),
 concepts: pack.families.map(family => ({ id: skillId(family), title: family.title, prerequisites: family.prerequisites.map(id => `oli-ob-${id}`),
  attention: family.items[0]!.text, idea: family.items[0]!.steps[0]!, workedStep: family.items[0]!.steps.slice(1).join(" ") })),
 objectiveMap: Object.fromEntries(pack.families.map(family => [skillId(family), { primary: skillId(family), related: family.prerequisites.map(id => `oli-ob-${id}`) }])),
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
export const regionalOlympiadDraftReview = {
 status: "draft-human-review-required", originals: pack.originals.length, availableOriginals: eligible.length,
 learningUnits: eligible.reduce((count, original) => count + original.units.length, 0),
 authoredExercises: pack.families.reduce((count, family) => count + family.items.length, 0),
 excludedFromGrading: pack.originals.filter(original => original.blocked).map(original => original.id),
 missingOfficialSolutions: [],
} as const;

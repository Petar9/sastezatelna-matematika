import { originalDifficulty, olympiadPracticeDifficulty } from "./problem-difficulty.ts";
import { olympiadIntroductions } from "./kids-teaching-introductions.ts";
import archive from "../../content/olimpiada/municipal-2022-2025.json" with { type: "json" };
import type { CourseProblem, CourseSolution, CourseTopic, KidsCourseContent } from "../core/kids-course.ts";

interface Field { id: string; label_bg: string; type: string; answer: number | string; unit_bg?: string; options?: string[] }
interface Unit { id: string; island: string; primary_skill: string; learning_prompt_bg: string; fields: Field[]; worked_steps_bg: string[] }
interface Original {
 id: string; year: number; problem: number; original_text_bg: string; units: Unit[];
 source: { page: number }; diagram_required: boolean; diagram: { description_bg: string } | null;
}
interface Practice { id: string; difficulty: string; statement_bg: string; fields: Field[]; worked_steps_bg: string[] }
interface Family { id: string; island: string; skill_bg: string; original_unit_ids: string[]; items: Practice[] }
const pack: { originals: { originals: Original[] }; practice: { families: Family[] } } = archive;
const version = "bg4-olimpiada-2022-2025-draft-v1";
const videos: Record<number, string> = {
 2022: "https://www.youtube.com/watch?v=UMtePket5Xs",
 2023: "https://www.youtube.com/watch?v=xO36ETZK9s4",
 2024: "https://www.youtube.com/watch?v=HZJsiC4P2i0",
 2025: "https://www.youtube.com/watch?v=IyYHs2601U0",
};
const islands = [
 { id: "oli-numbers", key: "numbers-calculation", title: "Числови загадки" },
 { id: "oli-geometry", key: "geometry", title: "Геометрични открития" },
 { id: "oli-stories", key: "word-problems", title: "Истории с числа" },
 { id: "oli-logic", key: "logic", title: "Логически загадки" },
];
const names: Record<string, string> = {
 "order-actions": "Сметки с удобни стъпки", "unknown-subtrahend": "Кое число липсва?",
 "place-value-constraints": "Цифри на своите места", roman: "Римски цифри",
 "rectangle-ratio": "Страни и равни части", "rectangle-difference": "Страни със зададена разлика",
 "composite-perimeters": "Обиколки на съставни фигури", "pairs-to-items": "От чифтове към бройки",
 "sum-difference": "Сбор и разлика", "dates-fees": "Дни, такси и намаления",
 "overlap-groups": "Броим без повторения", "magic-lines": "Магически сборове",
};
const skillId = (family: Family) => `oli-${family.id}`;
const source = (o: Original) => `Олимпиада · общински кръг · ${o.year} г. · 4. клас · задача ${o.problem}`;
const blockedOriginal = "oli-g4-municipal-2023-p3";
const unitOwners = new Map(pack.practice.families.flatMap(f => f.original_unit_ids.map(id => [id, f] as const)));
const originalOwners: Record<string, string> = {
 "2022-p1": "order-actions", "2022-p2": "sum-difference", "2022-p3": "composite-perimeters",
 "2023-p1": "order-actions", "2023-p2": "rectangle-ratio",
 "2024-p1": "order-actions", "2024-p2": "rectangle-difference", "2024-p3": "dates-fees",
 "2025-p1": "roman", "2025-p2": "composite-perimeters", "2025-p3": "magic-lines",
};
function solution(steps: string[]): CourseSolution {
 if (steps.length !== 3 || steps.some(step => !step.trim())) throw new Error("Expected three concrete solution parts");
 return steps.map((step, i) => ({ title: `Стъпка ${i + 1}`, paragraphs: [step] })) as CourseSolution;
}
function fullSolution(units: Unit[]): CourseSolution {
 if (units.length === 1) return solution(units[0]!.worked_steps_bg);
 const paragraphs = (group: Unit[]) => group.flatMap(unit => unit.worked_steps_bg);
 if (units.length === 2) return [
  { title: "Стъпка 1", paragraphs: units[0]!.worked_steps_bg },
  { title: "Стъпка 2", paragraphs: units[1]!.worked_steps_bg.slice(0, 2) },
  { title: "Стъпка 3", paragraphs: units[1]!.worked_steps_bg.slice(2) },
 ];
 return [
  { title: "Стъпка 1", paragraphs: paragraphs(units.slice(0, -2)) },
  { title: "Стъпка 2", paragraphs: paragraphs(units.slice(-2, -1)) },
  { title: "Стъпка 3", paragraphs: paragraphs(units.slice(-1)) },
 ];
}
function fields(input: Field[]) {
 return input.map(field => {
  if (field.type === "text") throw new Error(`Unsupported text answer: ${field.id}`);
  return { label: `${field.label_bg}${field.unit_bg ? ` (${field.unit_bg})` : ""}`, answer: String(field.answer) };
 });
}
function problem(id: string, owner: Family, text: string, label: string, input: Field[], worked: CourseSolution): CourseProblem {
 const options = input.find(field => field.options)?.options;
 return { id, skillId: skillId(owner), text, source: label, fields: fields(input), ...(options ? { options } : {}),
  hint: worked[0].paragraphs.join("\n"), hints: worked.map(part => part.paragraphs.join("\n")) as [string, string, string],
  explanation: worked.flatMap(part => part.paragraphs), solution: worked };
}
function sourceProblem(o: Original, owner: Family, unit?: Unit): CourseProblem {
 const requested = unit ? [unit] : o.units;
 let input = requested.flatMap(u => u.fields);
 // These originals ask for the final result; intermediate values remain in the worked solution.
 if (!unit && o.year === 2022 && o.problem === 1) input = o.units.at(-1)!.fields;
 if (!unit && o.year === 2023 && o.problem === 1) input = o.units.at(-1)!.fields;
 if (input.some(field => field.type === "text")) input = [{ id: "romanOption", label_bg: "Учебен избор на отговор", type: "choice", answer: 1,
  options: ["MMXV", "MMXXV", "MMXXIV", "MMXXXV"] }];
 const roman = input.some(field => field.options);
 const p = problem(unit?.id ?? `${o.id}:original`, owner,
  o.original_text_bg + (unit ? `\n\nУчебна стъпка: ${unit.learning_prompt_bg}` : "") + (roman ? "\n\nУчебен избор на отговор: избери правилния римски запис." : ""),
  source(o) + (unit ? " · учебна стъпка по оригиналното условие" : " · оригинално условие") + (roman ? " · добавени учебни отговори за избор" : ""),
  input, unit ? solution(unit.worked_steps_bg) : fullSolution(o.units));
 const helper = !!unit && ((o.problem === 1 && (o.year === 2022 || o.year === 2023 || o.year === 2025)) && unit !== o.units.at(-1));
 p.difficulty = originalDifficulty(o.id);
 p.archive = { sourceId: o.id, kind: !unit ? "original" : helper ? "scaffold" : "part", covers: unit ? [unit.id] : o.units.map(u => u.id) };
 p.provenance = { year: o.year, page: o.source.page, objective: unit?.id ?? o.id, video: videos[o.year]! };
 if (o.diagram_required) p.figure = { src: `/kids/figures/olimpiada/${o.year}-p${o.problem}.png`, alt: o.diagram?.description_bg ?? "Оригинален чертеж към задачата" };
 return p;
}
function practiceSource(family: Family) {
 const original = pack.originals.originals.find(o => o.units.some(u => family.original_unit_ids.includes(u.id)))!;
 return { year: original.year, problemId: `${original.id}:original` };
}
const pools = new Map<string, { core: CourseProblem[]; hard: CourseProblem[] }>();
const all = new Map<string, CourseProblem>();
for (const family of pack.practice.families) {
 const authored = (difficulty: string): CourseProblem[] => family.items.filter(item => item.difficulty === difficulty).map(item =>
  ({ ...problem(item.id, family, item.statement_bg, "Учебно упражнение · Олимпиада · 4. клас", item.fields, solution(item.worked_steps_bg)), practiceSource: practiceSource(family), difficulty: olympiadPracticeDifficulty(item.id) }));
 const core = authored("core"), hard = authored("hard");
 const full: CourseProblem[] = [];
 for (const original of pack.originals.originals) {
  if (original.id === blockedOriginal) continue;
  for (const unit of original.units) if (unitOwners.get(unit.id) === family) core.push(sourceProblem(original, family, unit));
  if (originalOwners[`${original.year}-p${original.problem}`] === family.id) full.push(sourceProblem(original, family));
 }
 // Full originals are available to core selection; old saved snapshots remain valid.
 hard.unshift(...full);
 pools.set(skillId(family), { core, hard });
 for (const p of [...core, ...hard]) {
  if (all.has(p.id)) throw new Error(`Duplicate Olympiad problem: ${p.id}`);
  all.set(p.id, p);
 }
}
const topics: CourseTopic[] = islands.map(island => ({ id: island.id, title: island.title, rewardName: island.title.toLocaleLowerCase("bg"),
 skills: pack.practice.families.filter(family => family.island === island.key).map(family => ({ id: skillId(family), title: names[family.id]!,
  lesson: family.items[0]!.worked_steps_bg })) }));

// Published for the owner-approved pilot; outstanding source-review notes remain below.
export const olympiadCourseContent: KidsCourseContent = {
 version, topics, introductions: olympiadIntroductions,
 concepts: pack.practice.families.map(family => ({ id: skillId(family), title: names[family.id]!, prerequisites: [],
  attention: family.items[0]!.statement_bg, idea: family.items[0]!.worked_steps_bg[0]!, workedStep: family.items[0]!.worked_steps_bg.slice(1).join(" ") })),
 objectiveMap: Object.fromEntries(pack.practice.families.map(family => [skillId(family), { primary: skillId(family), related: [] }])),
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
export const olympiadDraftReview = {
 status: "draft-human-review-required", originals: 12, learningUnits: 29, authoredExercises: 60,
 excludedFromGrading: [blockedOriginal], availableOriginals: 11,
 missingOfficialSolutions: [2024],
} as const;

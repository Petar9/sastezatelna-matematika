import { preparationBaselines } from "../core/preparation-baselines.ts";
import { competitionRewardDifficulty } from "../core/competitions.ts";
import { nvoConnectedContent } from "./nvo-connected-content.ts";
import practice from "../../content/nvo/practice.json" with { type: "json" };
import archive from "../../content/nvo/grade4-2022-2025.json" with { type: "json" };
import type { CourseProblem, CourseSolution, KidsCourseContent } from "../core/kids-course.ts";

import { originalDifficulty } from "./problem-difficulty.ts";

const pools = new Map<string, { core: CourseProblem[]; hard: CourseProblem[] }>();
const all = new Map<string, CourseProblem>();
for (const item of archive.problems) {
 const solution = item.steps.map((step, i) => ({ title: `Стъпка ${i + 1}`, paragraphs: [step] })) as CourseSolution;
 const sourceId = `nvo-${item.year}-p${item.number}`;
 const problem: CourseProblem = {
  id: item.id, skillId: item.skill, text: item.text, difficulty: originalDifficulty(sourceId),
  source: `НВО · ${item.year} г. · 4. клас · задача ${item.number}`,
  fields: item.fields.map(field => ({ ...field })),
  ...(item.options ? { options: [...item.options] } : {}),
  ...(item.figure ? { figure: { ...item.figure } } : {}),
  hint: item.steps[0]!, hints: [...item.steps] as [string, string, string],
  explanation: [...item.steps], solution,
  provenance: { year: item.year, page: item.page, objective: sourceId },
  archive: { sourceId, kind: "original", covers: [sourceId] },
 };
 const pool = pools.get(item.skill) ?? { core: [], hard: [] };
 pool[item.challenge ? "hard" : "core"].push(problem);
 pools.set(item.skill, pool);
 if (all.has(problem.id)) throw new Error(`Duplicate NVO problem: ${problem.id}`);
 all.set(problem.id, problem);
}
const connected = nvoConnectedContent([...all.values()], archive.topics);
for (const item of practice) {
 const problem: CourseProblem = {
  id: item.id, skillId: item.skill, text: item.text, source: "Учебно упражнение · НВО",
  practiceSource: { year: 2022, problemId: "nvo-2022-p22:original" },
  difficulty: { level: "standard", rationale: "Преобразуваме декари в квадратни метри и прилагаме връзката между тях." },
  fields: item.fields.map(field => ({ ...field })), hint: item.steps[0]!, hints: [...item.steps] as [string, string, string],
  explanation: [...item.steps], solution: item.steps.map((step, i) => ({ title: `Стъпка ${i + 1}`, paragraphs: [step] })) as CourseSolution,
 };
 if (all.has(problem.id)) throw new Error(`Duplicate NVO problem: ${problem.id}`);
 pools.get(item.skill)!.core.push(problem); all.set(problem.id, problem);
}
// Editorial entry points use a single method before a combined application.
// Challenge flags are provisional teaching choices, not measured difficulty.
const rationales: Record<string, string> = {
 "nvo-place": "Четем разредите на едно число преди сравняване на няколко числа.",
 "nvo-sequence": "Една постоянна промяна между съседни числа.",
 "nvo-add": "Един сбор преди съчетаване на няколко действия.",
 "nvo-subtract": "Изваждаме кръгло число преди изваждане с повече заемания.",
 "nvo-missing-digit": "Проследяваме пренасянето в едно събиране.",
 "nvo-multiply": "Умножение с едноцифрено число преди двуцифрен множител.",
 "nvo-divide": "Деление с едноцифрено число преди двуцифрен делител.",
 "nvo-unknown": "Едно неизвестно число и проверка с обратното действие.",
 "nvo-order": "Разпознаваме действието в скоби преди пресмятане на цял израз.",
 "nvo-shaded": "Разпознаваме една от равните части по чертеж.",
 "nvo-quantity-fraction": "Намираме една равна част чрез деление.",
 "nvo-length": "Едно преобразуване между метри и километри.",
 "nvo-mass": "Събираме познати теглилки и превръщаме грамове в килограми.",
 "nvo-time": "Работим с една връзка между мерни единици за време.",
 "nvo-area-units": "Едно преобразуване между мерни единици за лице.",
 "nvo-triangles": "Разпознаваме равните страни на триъгълник по чертеж.",
 "nvo-angles": "Сравняваме ъгъл с правия ъгъл преди броене на съставни ъгли.",
 "nvo-circles": "Разпознаваме радиус по центъра и окръжността.",
 "nvo-shapes": "Разпознаваме фигура по нейните страни.",
 "nvo-count-shapes": "Броим първо малките, после съставените от тях фигури.",
 "nvo-perimeter": "Проследяваме цялата външна граница на фигурата.",
 "nvo-area": "Лице на квадрат със зададена страна преди съставни фигури.",
 "nvo-tables": "Прочитаме стойностите от редовете и колоните на една таблица.",
 "nvo-charts": "Разчитаме еднаквите деления преди сравняване на стойности.",
 "nvo-groups": "Намираме броя чрез групиране в равни части.",
 "nvo-unit-price": "Намираме стойност за един преди стойността за повече.",
 "nvo-multi": "Едно оригинално условие с три подусловия, представени последователно.",
};
const entry = (skill: string) => pools.get(skill)?.core[0] ?? pools.get(skill)?.hard[0];

export const nvoCourseContent: KidsCourseContent = {
 rewardDifficulty: competitionRewardDifficulty("nvo"),
 preparationBaseline: preparationBaselines["nvo"],
 version: archive.version,
 ...connected,
 topics: archive.topics.map(topic => ({ ...topic, rewardName: topic.title.toLocaleLowerCase("bg"),
  skills: topic.skills.map(skill => ({ ...skill, lesson: [...entry(skill.id)!.explanation] })) })),
 introductions: Object.fromEntries(archive.topics.flatMap(topic => topic.skills.map(skill => [skill.id,
  { problemId: entry(skill.id)!.id, rationale: rationales[skill.id]! }]))),
 concepts: archive.topics.flatMap(topic => topic.skills.map(skill => {
  const problem = entry(skill.id)!;
  return { ...skill, prerequisites: [], attention: problem.text,
   idea: problem.explanation[0]!, workedStep: problem.explanation.slice(1).join(" ") };
 })),
 objectiveMap: Object.fromEntries(archive.topics.flatMap(topic => topic.skills.map(skill => [skill.id, { primary: skill.id, related: [] }]))),
 problem(skill, index, harder) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const problem = pools.get(skill)?.[harder ? "hard" : "core"][index];
  return problem ? structuredClone(problem) : null;
 },
 solutionFor(saved) {
  const problem = all.get(saved.id);
  return problem && problem.text === saved.text && JSON.stringify(problem.fields) === JSON.stringify(saved.fields)
   && JSON.stringify(problem.options) === JSON.stringify(saved.options) ? structuredClone(problem.solution) : undefined;
 },
};

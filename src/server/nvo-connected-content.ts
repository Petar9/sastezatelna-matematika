import type { CourseProblem } from "../core/kids-course.ts";
import { connectedRegistry, connectedUnit, letteredStatement, navigationGroups, singleConnected, threeSteps } from "./connected-course-content.ts";

// Authored stages expand the arithmetic already recorded in the archive's worked solutions.
const parts: Record<number, { skill: string; steps: [string, string, string] }[]> = {
 2022: [
  { skill: "nvo-area", steps: ["Лицето на правоъгълник е дължина по ширина. Тук страните са 15 м и 12 м.", "Цялата площадка е 15 · 12 = 180 кв. м. Фитнесът заема една от три равни части.", "180 : 3 = 60 кв. м са предназначени за фитнес."] },
  { skill: "nvo-perimeter", steps: ["Мрежата следва четирите страни на площадката. Обиколката е 2 · (15 + 12) = 54 м.", "За 54 м мрежа са нужни 54 · 7 = 378 лв.", "От предвидените 400 лв. остават 400 − 378 = 22 лв."] },
  { skill: "nvo-groups", steps: ["Децата във фитнеса са една част, а в другата част на площадката са две такива части.", "Общо 288 деца съответстват на 1 + 2 = 3 равни части.", "288 : 3 = 96 деца са използвали фитнеса. Останалите 192 са два пъти повече."] },
 ],
 2023: [
  { skill: "nvo-area", steps: ["Цялата леха е правоъгълник със страни 12 м и 5 м.", "Лицето ѝ е 12 · 5 = 60 кв. м. Хризантемите заемат половината.", "60 : 2 = 30 кв. м са засадени с хризантеми."] },
  { skill: "nvo-perimeter", steps: ["От чертежа правоъгълникът с рози има страни 12 : 2 = 6 м и 5 м.", "Оградата е по всички страни: 2 · (6 + 5) = 22 м.", "Всеки метър струва 20 лв., затова цената е 22 · 20 = 440 лв."] },
  { skill: "nvo-quantity-fraction", steps: ["Общата сума е 270 лв. За хризантемите е платена една третинка от нея.", "За да намерим третинка, разделяме цялата сума на 3 равни части.", "270 : 3 = 90 лв. струват хризантемите. Проверка: 3 · 90 = 270."] },
 ],
 2024: [
  { skill: "nvo-charts", steps: ["Прочети от диаграмата разстоянието за всеки от трите дни: 400 км, 100 км и 200 км.", "За първите два дни са изминати 400 + 100 = 500 км.", "Прибавяме третия ден: 500 + 200 = 700 км общо."] },
  { skill: "nvo-groups", steps: ["В 40 стаи по двама са настанени 40 · 2 = 80 ученици.", "За стаите по трима остават 125 − 80 = 45 ученици.", "Необходимите стаи са 45 : 3 = 15. Проверка: 80 + 15 · 3 = 125."] },
  { skill: "nvo-multi", steps: ["От платените 350 лв. на ученик отделяме 180 лв. за нощувки и 90 лв. за храна.", "За транспорт на един ученик остават 350 − 180 − 90 = 80 лв.", "За всички 125 ученици транспортът струва 125 · 80 = 10 000 лв."] },
 ],
 2025: [
  { skill: "nvo-tables", steps: ["Сравни цените в таблицата: най-скъпи са ските за 950 лв. и обувките за 800 лв.", "Търсим общата цена на по един от тези два артикула: 950 + 800.", "950 + 800 = 1750 лв. струват двата най-скъпи артикула."] },
  { skill: "nvo-multi", steps: ["От таблицата: яке 180 лв., ръкавици 50 лв., шал 40 лв., шапка 20 лв.", "Двата шала струват 2 · 40 = 80 лв. Другите артикули са по един.", "Общата цена е 180 + 50 + 80 + 20 = 330 лв."] },
  { skill: "nvo-multi", steps: ["Намалението е само за артикули над 100 лв. Якето става 180 : 2 = 90 лв., а ръкавиците остават 50 лв.", "Едно яке и един чифт ръкавици струват 90 + 50 = 140 лв.", "За три такива комплекта семейството плаща 3 · 140 = 420 лв."] },
 ],
};
export function nvoConnectedContent(problems: CourseProblem[], topics: { id: string; title: string; skills: { id: string }[] }[]) {
 const connected = connectedRegistry(problems.map(problem => {
  const match = /^nvo-(\d+)-p25:original$/.exec(problem.id);
  if (!match) return { problem: singleConnected(problem), aliases: [problem.id] };
  const statement = letteredStatement(problem.text, 3);
  return { aliases: [problem.id], problem: { sourceId: problem.archive!.sourceId, text: problem.text, introduction: statement.introduction,
   figure: problem.figure, units: parts[Number(match[1])]!.map((part, i) => ({
    ...connectedUnit(problem, ["a", "b", "c"][i]!, statement.parts[i]!), skillId: part.skill,
    fields: [structuredClone(problem.fields[i]!)], solution: threeSteps(part.steps),
   })),
  } };
 }));
 const topicBySkill = new Map(topics.flatMap(topic => topic.skills.map(skill => [skill.id, topic.id] as const)));
 const aliases: Record<string, string> = { "nvo-addition": "nvo-numbers", "nvo-multiplication": "nvo-numbers", "nvo-expressions": "nvo-numbers", "nvo-areas": "nvo-geometry" };
 return { connectedProblem: connected.connectedProblem, navigationGroups: navigationGroups(topics, [
  { id: "nvo-numbers", title: "Числа и пресмятане", topicIds: ["nvo-numbers", "nvo-addition", "nvo-multiplication", "nvo-expressions"] },
  { id: "nvo-fractions" }, { id: "nvo-measures" },
  { id: "nvo-geometry", title: "Фигури и измервания", topicIds: ["nvo-geometry", "nvo-areas"] },
  { id: "nvo-data" }, { id: "nvo-stories", title: "Истории с количества" },
 ], connected.sources, source => {
  if (/nvo-202[23]-p25$/.test(source.sourceId)) return "nvo-geometry";
  if (/nvo-202[45]-p25$/.test(source.sourceId)) return "nvo-stories";
  const topic = topicBySkill.get(source.units[0]!.skillId)!;
  return aliases[topic] ?? topic;
 }) };
}

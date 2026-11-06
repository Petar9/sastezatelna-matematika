import type { ConnectedCourseProblem, CourseProblem, CourseTopic } from "../core/kids-course.ts";
import { connectedRegistry, connectedUnit, navigationGroups, singleConnected } from "./connected-course-content.ts";

const shared: Record<string, string> = {
 "2023-M2-1": "Професор Книголюб подрежда книгите си в огромната си нова библиотека. Тя е разделена на три секции (части на библиотеката). Всяка секция има по много рафтове.",
 "2023-M2-2": "Квадратите и правоъгълниците са любимите четириъгълници на Иван. Любимите му фигури са като тази на чертежа вдясно и се състоят от четири еднакви квадрата и четири еднакви правоъгълника с дължини на страните цели числа сантиметри.",
 "M2-1": "Числата от 1 до 2024 са написани последователно в нарастващ ред в редица 1, 2, ..., 2023, 2024.",
 "M2-2": "Всеки от двата квадрата на чертежите в тази задача е разделен на 9 правоъгълника с дължини на страните цели числа сантиметри.",
 "2025-M2-1": "Иван има игра с 2025 жетона. Всички жетони се раздават на играчите, като всеки получава различен брой жетони и записва на листче броя им.",
 "2025-M2-2": "Разполагам с две еднакви правоъгълни картончета К1 и К2 с широчина 20 см и дължина 25 см и с още едно правоъгълно картонче К3. От всяко картонче отрязвам фигурки с дължини на страните цели числа сантиметри, като правя разрези успоредни на страните.",
 "2026-M2-1": "Хикс пише в редица последователни естествени числа, като започва от 26 и завършва с 2026.",
 "2026-M2-2": "QR-код ще наричаме квадрат, в който са разположени 3 фигурки от тип1, няколко фигурки от тип2 и няколко фигурки от тип3.",
};
const homes: Record<string, string> = {
 "2023-M2-1": "totals", "2023-M2-2": "perimeters", "M2-1": "sequences", "M2-2": "areas",
 "2025-M2-1": "totals", "2025-M2-2": "perimeters", "2026-M2-1": "sequences", "2026-M2-2": "areas",
};
export function mathsConnectedContent(problems: CourseProblem[], topics: CourseTopic[]) {
 const originals = problems.filter(problem => problem.id.endsWith(":original"));
 const grouped = new Map<string, CourseProblem[]>();
 for (const problem of originals) {
  const match = /^((?:\d{4}-)?M2-[12])[a-d]:original$/.exec(problem.id);
  const sourceId = match?.[1] ?? problem.archive?.sourceId ?? problem.id.replace(/:original$/, "");
  grouped.set(sourceId, [...(grouped.get(sourceId) ?? []), problem]);
 }
 const connected = connectedRegistry([...grouped].map(([sourceId, originalParts]) => {
  if (!shared[sourceId]) return { aliases: originalParts.map(part => part.id), problem: singleConnected(originalParts[0]!) };
  originalParts.sort((a, b) => a.id.localeCompare(b.id));
  const introduction = shared[sourceId]!;
  const units = originalParts.map((part, index) => {
   const prefix = sourceId === "M2-1" && index > 0
    ? "Числата от 1 до 2024 са написани последователно в нарастващ ред." : introduction;
   if (!part.text.startsWith(prefix)) throw new Error(`Missing shared introduction: ${part.id}`);
   const body = part.text.slice(prefix.length).trim().replace(/^[абвг]\)\s*/, "");
   const unit = connectedUnit(part, ["a", "b", "c", "d"][index]!, `${["а", "б", "в", "г"][index]}) ${body}`);
   if (sourceId === "2026-M2-1" && index === 2) unit.dependsOn = ["a"];
   return unit;
  });
  const figures = [...new Map(originalParts.filter(part => part.figure).map(part => [part.figure!.src, part.figure!] as const)).values()];
  const problem: ConnectedCourseProblem = { sourceId, introduction, text: introduction + "\n\n" + units.map(unit => unit.text).join("\n\n"), units,
   ...(figures.length === 1 ? { figure: figures[0] } : {}), ...(figures.length ? { figures } : {}) };
  return { problem, aliases: originalParts.map(part => part.id) };
 }));
 const topicBySkill = new Map(topics.flatMap(topic => topic.skills.map(skill => [skill.id, topic.id] as const)));
 const specs = topics.filter(topic => topic.id !== "grids").map(topic => ({ id: topic.id,
  ...(topic.id === "totals" ? { title: "Количества и разпределяне" } : {}),
  ...(topic.id === "perimeters" ? { title: "Обиколки на фигури" } : {}),
  ...(topic.id === "areas" ? { title: "Лица и мрежи", topicIds: ["areas", "grids"] } : {}),
 }));
 return { connectedProblem: connected.connectedProblem, navigationGroups: navigationGroups(topics, specs, connected.sources, source => {
  if (homes[source.sourceId]) return homes[source.sourceId]!;
  const topic = topicBySkill.get(source.units[0]!.skillId)!;
  return topic === "grids" ? "areas" : topic;
 }) };
}

import reviewed from "../../content/kids/competition-2023.json" with { type: "json" };
import type { CourseProblem, CourseSolution } from "../core/kids-course.ts";
import { originalDifficulty } from "./problem-difficulty.ts";

export const competition2023Rows = reviewed;
export const active2023Rows = reviewed.filter(row => row.reviewStatus !== "pending-clarification");

export function original2023(row: typeof reviewed[number]): CourseProblem {
 const solution = row.explanation.map((paragraph, index) => ({
  title: ["Първа стъпка", "Следваща стъпка", "Да завършим и проверим"][index]!, paragraphs: [paragraph],
 })) as CourseSolution;
 const part = row.id.match(/^(2023-M2-[12])([abc])$/);
 return {
  id: `${row.id}:original`, skillId: row.skillId, text: row.text,
  source: `Математика за всеки · 13.05.2023 · 4. клас · ${row.id}`,
  ...(row.options ? { options: [...row.options] } : {}),
  fields: row.answers.map((answer, index) => ({
   label: row.options ? "Избери отговор" : row.labels?.[index] ?? "Числов отговор", answer: String(answer),
  })),
  hint: row.explanation[0]!, hints: [...row.explanation] as [string, string, string],
  explanation: [...row.explanation], solution, difficulty: originalDifficulty(row.id),
  provenance: { year: 2023, objective: row.id, page: row.page },
  ...(row.figure ? { figure: { src: `/kids/figures/${row.figure}.png`, alt: `Оригинален чертеж: ${row.title}.` } } : {}),
  ...(part ? { archive: { sourceId: part[1]!, kind: "part" as const, covers: [part[2]!] } } : {}),
 };
}

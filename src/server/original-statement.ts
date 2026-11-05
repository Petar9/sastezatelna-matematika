import type { KidsCourseContent } from "../core/kids-course.ts";

// Only statement data crosses this boundary; answer keys and worked solutions stay private.
export function originalStatement(content: KidsCourseContent, id: string) {
 for (const topic of content.topics) for (const skill of topic.skills) for (const hard of [false, true]) for (let i = 0; i < 1000; i++) {
  const problem = content.problem(skill.id, i, hard);
  if (!problem) break;
  if (problem.id === id && ((problem.archive && problem.archive.kind !== "scaffold") || (!problem.archive && problem.id.endsWith(":original")))) {
   return { id: problem.id, text: problem.text, source: problem.source, figure: problem.figure, ...(problem.options ? { options: [...problem.options] } : {}) };
  }
 }
 return undefined;
}

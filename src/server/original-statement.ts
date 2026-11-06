import type { CourseProblem, KidsCourseContent } from "../core/kids-course.ts";

interface OriginalStatement {
 id: string; text: string; source: string; figure?: CourseProblem["figure"];
 figures?: NonNullable<CourseProblem["figure"]>[]; options?: string[];
}

// Only statement data crosses this boundary; answer keys and worked solutions stay private.
export function originalStatement(content: KidsCourseContent, id: string): OriginalStatement | undefined {
 for (const topic of content.topics) for (const skill of topic.skills) for (const hard of [false, true]) for (let i = 0; i < 1000; i++) {
  const problem = content.problem(skill.id, i, hard);
  if (!problem) break;
  if (id.includes(":unit:") && ((problem.archive && problem.archive.kind !== "scaffold") || (!problem.archive && problem.id.endsWith(":original")))) {
   const connected = content.connectedProblem?.(problem);
   if (connected?.units.some(unit => `${connected.sourceId}:unit:${unit.id}` === id)) {
    return { id, text: connected.text, source: problem.source, figure: connected.figure,
     figures: (connected.figures ?? (connected.figure ? [connected.figure] : [])).map(figure => ({ ...figure })),
     ...(connected.units.length === 1 && connected.units[0]!.options ? { options: [...connected.units[0]!.options] } : {}) };
   }
  }
  if (problem.id === id && ((problem.archive && problem.archive.kind !== "scaffold") || (!problem.archive && problem.id.endsWith(":original")))) {
   const connected = content.connectedProblem?.(problem);
   return { id: problem.id, text: problem.text, source: problem.source, figure: problem.figure,
    ...(connected?.figures ? {figures: connected.figures.map(figure => ({...figure}))} : {}), ...(problem.options ? { options: [...problem.options] } : {}) };
  }
 }
 return undefined;
}

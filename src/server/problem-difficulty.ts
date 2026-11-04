import review from "../../content/problem-difficulty.json" with { type: "json" };
import type { CourseProblem } from "../core/kids-course.ts";

type Difficulty = NonNullable<CourseProblem["difficulty"]>;
const originals = review.originals as Record<string, Difficulty>;
export function originalDifficulty(id: string): Difficulty {
 const difficulty = originals[id];
 if (!difficulty) throw new Error(`Missing original difficulty review: ${id}`);
 return { ...difficulty };
}
export function mathsDifficulty(problem: CourseProblem): Difficulty {
 const original = originalDifficulty(problem.skillId);
 if (problem.id.endsWith(":original")) return original;
 const rules = (review.mathsPractice as Record<string, { core: Difficulty; challenge?: Difficulty }>)[problem.skillId];
 return { ...(rules ? problem.id.includes(":h") ? rules.challenge ?? rules.core : rules.core : original) };
}
export function olympiadPracticeDifficulty(id: string): Difficulty {
 const difficulty = (review.olympiadPractice as Record<string, Difficulty>)[id];
 if (!difficulty) throw new Error(`Missing practice difficulty review: ${id}`);
 return { ...difficulty };
}

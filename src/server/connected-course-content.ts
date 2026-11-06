import type { ConnectedCourseProblem, ConnectedCourseUnit, CourseProblem, CourseSolution, CourseTopic } from "../core/kids-course.ts";

export function connectedUnit(problem: CourseProblem, id: string, text = problem.text): ConnectedCourseUnit {
 if (!problem.solution || problem.solution.length !== 3) throw new Error(`Missing worked solution: ${problem.id}`);
 return { id, skillId: problem.skillId, text, fields: structuredClone(problem.fields), solution: structuredClone(problem.solution),
  ...(problem.options ? { options: [...problem.options] } : {}), ...(problem.figure ? { figure: { ...problem.figure } } : {}),
  ...(problem.difficulty ? { difficulty: problem.difficulty } : {}) };
}

// Only call for editorially identified lettered sources; answer fields never determine boundaries.
export function letteredStatement(text: string, count: number) {
 const matches = [...text.matchAll(/(?:^|\s)([аАбБвВгГ])\)/g)];
 const expected = ["а", "б", "в", "г"].slice(0, count);
 if (matches.length !== count || matches.some((match, i) => match[1]!.toLowerCase() !== expected[i])) {
  throw new Error(`Unexpected natural parts: ${text.slice(0, 70)}`);
 }
 const starts = matches.map(match => match.index! + match[0].indexOf(match[1]!));
 return { introduction: text.slice(0, starts[0]).trim(), parts: starts.map((start, i) => text.slice(start, starts[i + 1]).trim()) };
}

export function connectedRegistry(entries: { problem: ConnectedCourseProblem; aliases: string[] }[]) {
 const sources = new Map<string, ConnectedCourseProblem>(), aliases = new Map<string, string>();
 for (const entry of entries) {
  const p = entry.problem;
  if (!p.figures && p.figure) p.figures = [{ ...p.figure }];
  if (sources.has(p.sourceId) || !p.units.length) throw new Error(`Duplicate/empty connected source: ${p.sourceId}`);
  const ids = new Set<string>();
  for (const unit of p.units) {
   if (ids.has(unit.id) || !unit.fields.length || unit.solution.length !== 3 || unit.solution.some(step => !step.paragraphs.length || step.paragraphs.some(p => !p.trim()))) throw new Error(`Invalid connected unit: ${unit.id}`);
   if (unit.dependsOn?.some(id => !ids.has(id))) throw new Error(`Forward/missing dependency: ${unit.id}`);
   ids.add(unit.id);
  }
  p.legacyGoldKeys = [...new Set([...(p.legacyGoldKeys ?? []), ...entry.aliases.map(id => `problem:${id}`)])];
  sources.set(p.sourceId, p);
  for (const alias of entry.aliases) {
   if (aliases.has(alias)) throw new Error(`Duplicate connected alias: ${alias}`);
   aliases.set(alias, p.sourceId);
  }
 }
 return { sources: [...sources.values()], connectedProblem(problem: CourseProblem) {
  const source = aliases.get(problem.id);
  return source ? structuredClone(sources.get(source)) : undefined;
 } };
}

export function singleConnected(problem: CourseProblem): ConnectedCourseProblem {
 return { sourceId: problem.archive?.sourceId ?? problem.id.replace(/:original$/, ""), text: problem.text,
  ...(problem.figure ? { figure: { ...problem.figure } } : {}), units: [connectedUnit(problem, "question")] };
}

export function navigationGroups(topics: Pick<CourseTopic, "id" | "title">[], specs: { id: string; title?: string; topicIds?: string[] }[], sources: ConnectedCourseProblem[], home: (source: ConnectedCourseProblem) => string) {
 return specs.map(spec => ({ id: spec.id, title: spec.title ?? topics.find(topic => topic.id === spec.id)!.title,
  topicIds: spec.topicIds ?? [spec.id], sourceIds: sources.filter(source => home(source) === spec.id).map(source => source.sourceId) }));
}

export function threeSteps(steps: [string, string, string]): CourseSolution {
 return steps.map((step, i) => ({ title: `Стъпка ${i + 1}`, paragraphs: [step] })) as CourseSolution;
}

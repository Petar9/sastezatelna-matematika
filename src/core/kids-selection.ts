import type { CourseProblem, KidsCourse, KidsCourseContent } from "./kids-course.ts";

export const problemIdentity = (p: CourseProblem) => p.naturalUnit ? JSON.stringify(["natural", p.naturalUnit.sourceId, p.naturalUnit.unitId]) : JSON.stringify([p.text, p.options, p.fields.map(f => f.answer)]);
export const isCompetitionProblem = (p: CourseProblem) => p.archive ? p.archive.kind !== "scaffold" : !!p.provenance || p.id.endsWith(":original");
const catalogues = new WeakMap<KidsCourseContent, Map<string, CourseProblem>>();
function catalogueFor(content: KidsCourseContent) {
 let catalogue = catalogues.get(content);
 if (!catalogue) {
  catalogue = new Map();
  for (const topic of content.topics) for (const skill of topic.skills) for (const hard of [false, true]) for (let i = 0; i < 1000; i++) {
   const item = content.problem(skill.id, i, hard); if (!item) break; catalogue.set(item.id, item);
  }
  catalogues.set(content, catalogue);
 }
 return catalogue;
}
export function catalogueProblems(content: KidsCourseContent): CourseProblem[] {
 return [...catalogueFor(content).values()];
}
export function problemSource(problem: CourseProblem, content: KidsCourseContent) {
 const catalogue = catalogueFor(content);
 const canonical = catalogue.get(problem.id) ?? (problem.naturalUnit ? [...catalogue.values()].find(p => p.archive?.sourceId === problem.naturalUnit!.sourceId && p.archive.kind === "original") : undefined);
 const archive = archiveFor(problem, content);
 const practice = archive ? archive.kind === "scaffold" : !isCompetitionProblem(problem);
 const reference = problem.practiceSource ?? canonical?.practiceSource;
 const linkedId = reference?.problemId ?? (archive ? `${archive.sourceId}:original` : undefined);
 const original = linkedId ? catalogue.get(linkedId) ?? (!practice ? canonical ?? problem : undefined) : practice
  ? [...catalogue.values()].find(p => p.skillId === problem.skillId && (p.archive?.kind === "original" || (!p.archive && p.id.endsWith(":original"))))
  : canonical ?? problem;
 return { sourceIsPractice: practice, sourceYear: practice ? original?.provenance?.year ?? reference?.year : problem.provenance?.year ?? original?.provenance?.year,
  sourceProblemId: original?.provenance ? original.id : undefined };
}
export function difficultyFor(p: CourseProblem, content?: KidsCourseContent) {
 if (p.difficulty || !content) return p.difficulty;
 const canonical = catalogueFor(content).get(p.id);
 return canonical && problemIdentity(canonical) === problemIdentity(p) ? canonical.difficulty : undefined;
}
export function archiveFor(p: CourseProblem, content?: KidsCourseContent) {
 if (p.archive || !content) return p.archive;
 const canonical = catalogueFor(content).get(p.id);
 return canonical && problemIdentity(canonical) === problemIdentity(p) ? canonical.archive : undefined;
}
export const teachingMethod = (content: KidsCourseContent, skillId: string) => content.objectiveMap?.[skillId]?.primary ?? skillId;
export function skillPrerequisitesReady(course: KidsCourse, content: KidsCourseContent, skillId: string) {
 const method = teachingMethod(content, skillId);
 const prerequisites = content.concepts?.find(c => c.id === method)?.prerequisites ?? [];
 return prerequisites.every(concept => content.topics.some(topic => topic.skills.some(skill => {
  const state = course.topics[topic.id]!.skills[skill.id]!;
  return teachingMethod(content, skill.id) === concept && !state.revisit && (!!state.confirmedAt || state.streak > 0);
 })));
}
export function isIntroduction(course: KidsCourse, content: KidsCourseContent, problem: CourseProblem, independentMethods?: ReadonlySet<string>) {
 const method = teachingMethod(content, problem.skillId);
 return content.introductions?.[method]?.problemId === problem.id && isCompetitionProblem(problem)
  && !(independentMethods ? independentMethods.has(method) : course.attempts.some(a => teachingMethod(content, a.problem.skillId) === method && a.outcome === "independent"));
}
export function overlaps(a: CourseProblem, b: CourseProblem, content?: KidsCourseContent): boolean {
 if (a.id === b.id || problemIdentity(a) === problemIdentity(b)) return true;
 const left = archiveFor(a, content), right = archiveFor(b, content);
 return !!left && !!right && left.sourceId === right.sourceId && left.covers.some(id => right.covers.includes(id));
}
export function pendingProblems(course: KidsCourse, replacingKey?: string) {
 return [...Object.values(course.topics).flatMap(topic => [...Object.values(topic.work), ...Object.values(topic.skillWork ?? {})]), course.quest?.work, course.questContinuation]
  .filter(work => work && (!work.attempt.outcome || work.connected && work.connected.index + 1 < work.connected.problem.units.length) && work.attempt.key !== replacingKey).map(work => work!.connected ? { ...work!.attempt.problem, archive: { sourceId: work!.connected.problem.sourceId, kind: "original" as const, covers: work!.connected.problem.units.map(unit => unit.id) } } : work!.attempt.problem);
}
export function reviewDate(now: string, repeated = false) {
 return new Date(Date.parse(now) + (repeated ? 30 : 2) * 86400000).toISOString();
}
export function skillReviewDue(course: KidsCourse, topicId: string, skillId: string): string | undefined {
 const state = course.topics[topicId]!.skills[skillId]!;
 return state.reviewDueAt ?? (state.confirmedAt ? reviewDate(state.lastReviewAt ?? state.confirmedAt, !!state.lastReviewAt) : undefined);
}

type Exposure = { seen: boolean; blocked: boolean; reserved: boolean };
export type SelectionContext = ReturnType<typeof createSelectionContext>;

// A selection call owns this snapshot. Never retain it across commands: history,
// pending work and saved problem snapshots can all change without changing identity.
export function createSelectionContext(course: KidsCourse, content: KidsCourseContent, now: string, replacingKey?: string) {
 const identities = new WeakMap<CourseProblem, string>();
 const identity = (problem: CourseProblem) => {
  let value = identities.get(problem);
  if (value === undefined) { value = problemIdentity(problem); identities.set(problem, value); }
  return value;
 };
 const archive = (problem: CourseProblem) => {
  if (!problem.naturalUnit && problem.archive?.kind !== "scaffold") {
   const connected = content.connectedProblem?.(problem);
   if (connected) return { sourceId: connected.sourceId, kind: "original" as const, covers: connected.units.map(u => u.id) };
  }
  if (problem.archive) return problem.archive;
  const canonical = catalogueFor(content).get(problem.id);
  return canonical && identity(canonical) === identity(problem) ? canonical.archive : undefined;
 };
 const byId = new Map<string, Exposure>(), byIdentity = new Map<string, Exposure>();
 const bySource = new Map<string, Map<string, Exposure>>();
 const independentSkills = new Set<string>(), independentMethods = new Set<string>(), lastMethodIndices = new Map<string, number>();
 const merge = (index: Map<string, Exposure>, key: string, value: Exposure) => {
  const existing = index.get(key);
  if (existing) { existing.seen ||= value.seen; existing.blocked ||= value.blocked; existing.reserved ||= value.reserved; }
  else index.set(key, { ...value });
 };
 const add = (problem: CourseProblem, value: Exposure) => {
  merge(byId, problem.id, value); merge(byIdentity, identity(problem), value);
  const source = archive(problem);
  if (source) {
   let covers = bySource.get(source.sourceId);
   if (!covers) { covers = new Map(); bySource.set(source.sourceId, covers); }
   for (const cover of source.covers) merge(covers, cover, value);
  }
 };
 const time = Date.parse(now);
 for (const [index, attempt] of course.attempts.entries()) {
  const method = teachingMethod(content, attempt.problem.skillId);
  lastMethodIndices.set(method, index);
  if (attempt.outcome === "independent") { independentSkills.add(attempt.problem.skillId); independentMethods.add(method); }
  add(attempt.problem, { seen: true, blocked: !attempt.completedAt || time - Date.parse(attempt.completedAt) < 2 * 86400000, reserved: false });
 }
 for (const problem of pendingProblems(course, replacingKey)) add(problem, { seen: false, blocked: false, reserved: true });
 return { independentSkills, independentMethods, lastMethodIndices, exposure(problem: CourseProblem): Exposure {
  const result = { seen: false, blocked: false, reserved: false };
  const include = (value?: Exposure) => { if (value) { result.seen ||= value.seen; result.blocked ||= value.blocked; result.reserved ||= value.reserved; } };
  include(byId.get(problem.id)); include(byIdentity.get(identity(problem)));
  const source = archive(problem);
  if (source) { const covers = bySource.get(source.sourceId); for (const cover of source.covers) include(covers?.get(cover)); }
  return result;
 } };
}

// Enumerate finite catalogues from the beginning. Saved cursors remain compatible,
// but cannot hide newly prioritised originals after a content-order change.
export function chooseSkillProblem(course: KidsCourse, content: KidsCourseContent, skillId: string, harder: boolean, now: string, review = false, replacingKey?: string, context = createSelectionContext(course, content, now, replacingKey), existenceOnly = false, accepts?: (problem: CourseProblem) => boolean) {
 let chosen: { problem: CourseProblem; cursor: number; rank: number } | undefined;
 const ids = new Set<string>();
 const lastReview = review ? course.attempts.findLast(a => a.problem.skillId === skillId && a.mode === "review" && a.outcome === "independent") : undefined;
 const preferPractice = lastReview && isCompetitionProblem(lastReview.problem);
 for (const pool of harder ? [true] : [false, true]) for (let cursor = 0; cursor < 1000; cursor++) {
  const problem = content.problem(skillId, cursor, pool);
  if (!problem) break;
  if (ids.has(problem.id) || accepts && !accepts(problem)) continue;
  ids.add(problem.id);
  // Harder authored tasks can support review, but never fill exhausted core pools.
  if (!harder && !review && pool && !isCompetitionProblem(problem)) continue;
  const exposure = context.exposure(problem);
  if (exposure.reserved || exposure.seen && (!review || exposure.blocked)) continue;
  if (existenceOnly) return { problem, cursor, rank: 0 };
  const rank = isCompetitionProblem(problem) ? problem.archive?.kind === "part" ? 3 : 4 : problem.archive?.kind === "scaffold" ? 1 : 0;
  const candidate = { problem, cursor, rank: rank + (preferPractice && !isCompetitionProblem(problem) ? 5 : 0) + (exposure.seen ? -10 : 0) + (!harder && isIntroduction(course, content, problem, context.independentMethods) ? 2 : 0) };
  // Strict comparison preserves catalogue order for equal ranks, including pools.
  if (!chosen || candidate.rank > chosen.rank) chosen = candidate;
 }
 return chosen;
}

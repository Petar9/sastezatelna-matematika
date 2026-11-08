import type { CourseAttempt, CourseProblem, KidsCourse, KidsCourseContent } from "./kids-course.ts";
import { catalogueProblems, isCompetitionProblem, overlaps, problemIdentity } from "./kids-selection.ts";

export interface PreparationScope {
 version: 1;
 contentVersion: string;
 sources: { id: string; unitIds: string[] }[];
 skills: { topicId: string; skillId: string }[];
}
export interface PreparationProgress {
 status: "available" | "unavailable";
 percent: number;
 tasks: { completed: number; total: number };
 coverage: { solved: number; total: number; fraction: number };
 confirmation: { completed: number; total: number };
 review: { completed: number; total: number };
 scope: { version: number; contentVersion: string };
}
const REVIEW_INTERVAL = 2 * 86400000;
const catalogues = new WeakMap<KidsCourseContent, ReturnType<typeof buildCatalogue>>();
const sameFields = (left: CourseProblem["fields"], right: CourseProblem["fields"]) => JSON.stringify(left) === JSON.stringify(right);

function buildCatalogue(content: KidsCourseContent) {
 const sources = new Map<string, Set<string>>();
 const aliases = new Map<string, { problem: CourseProblem; sourceId: string; unitIds: string[] }>();
 for (const problem of catalogueProblems(content)) {
  if (!isCompetitionProblem(problem) || problem.archive?.kind === "scaffold" || !problem.fields.length) continue;
  const connected = content.connectedProblem?.(problem);
  if (!connected && !problem.naturalUnit && problem.archive?.kind === "part") continue;
  const sourceId = connected?.sourceId ?? problem.naturalUnit?.sourceId ?? problem.archive?.sourceId ?? problem.id.replace(/:original$/, "");
  const units = connected?.units.map(unit => unit.id) ?? [problem.naturalUnit?.unitId ?? "question"];
  const source = sources.get(sourceId) ?? new Set<string>();
  units.forEach(id => source.add(id)); sources.set(sourceId, source);
  // Historical aliases may represent one part or all fields. A source alias alone
  // does not prove every part: match its actual grading contract to known units.
  let unitIds = units;
  if (connected) {
   unitIds = connected.units.filter(unit => sameFields(problem.fields, unit.fields)).map(unit => unit.id);
   if (sameFields(problem.fields, connected.units.flatMap(unit => unit.fields))) unitIds = units;
   else if (unitIds.length !== 1) unitIds = [];
  }
  aliases.set(problem.id, { problem, sourceId, unitIds });
 }
 return { sources, aliases };
}
function catalogue(content: KidsCourseContent) {
 let value = catalogues.get(content);
 if (!value) { value = buildCatalogue(content); catalogues.set(content, value); }
 return value;
}
export function currentPreparationScope(content: KidsCourseContent): PreparationScope {
 return { version: 1, contentVersion: content.version,
  sources: [...catalogue(content).sources].map(([id, units]) => ({ id, unitIds: [...units].sort() })).sort((a,b) => a.id.localeCompare(b.id)),
  skills: content.topics.flatMap(topic => topic.skills.map(skill => ({ topicId: topic.id, skillId: skill.id }))),
 };
}
// Existing profiles without scope metadata retain the initial release scope even
// when they only read progress between catalogue additions. Never write on GET.
function existingPreparationScope(content: KidsCourseContent): PreparationScope {
 return structuredClone(content.preparationBaseline ?? currentPreparationScope(content));
}
export function ensurePreparationScope(course: KidsCourse, content: KidsCourseContent): void {
 course.preparationScope ??= existingPreparationScope(content);
}
function successfulUnits(attempt: CourseAttempt, content: KidsCourseContent) {
 if (attempt.outcome !== "independent" && attempt.outcome !== "hinted") return undefined;
 const p = attempt.problem;
 if (p.archive?.kind === "scaffold") return undefined;
 if (p.naturalUnit) return { sourceId: p.naturalUnit.sourceId, unitIds: [p.naturalUnit.unitId] };
 const alias = catalogue(content).aliases.get(p.id);
 if (!alias || problemIdentity(alias.problem) !== problemIdentity(p)) return undefined;
 return alias;
}
export function preparationProgress(course: KidsCourse, content: KidsCourseContent): PreparationProgress {
 const scope = course.preparationScope ?? existingPreparationScope(content);
 const totals = { tasks: { completed: 0, total: scope.sources.reduce((sum, source) => sum + new Set(source.unitIds).size, 0) }, coverage: { solved: 0, total: scope.sources.length, fraction: 0 }, confirmation: { completed: 0, total: scope.skills.length }, review: { completed: 0, total: scope.skills.length } };
 const result: PreparationProgress = { status: "unavailable", percent: 0, ...totals, scope: { version: scope.version, contentVersion: scope.contentVersion } };
 if (scope.version !== 1 || !scope.sources.length || !scope.skills.length || scope.sources.some(source => !source.unitIds.length)) return result;
 result.status = "available";
 const succeeded = new Map<string, Set<string>>();
 for (const attempt of course.attempts) {
  const evidence = successfulUnits(attempt, content);
  if (!evidence) continue;
  const units = succeeded.get(evidence.sourceId) ?? new Set<string>();
  evidence.unitIds.forEach(id => units.add(id)); succeeded.set(evidence.sourceId, units);
 }
 let covered = 0;
 for (const source of scope.sources) {
  const required = [...new Set(source.unitIds)];
  const count = required.filter(id => succeeded.get(source.id)?.has(id)).length;
  result.tasks.completed += count;
  covered += count / required.length;
  if (count === required.length) result.coverage.solved++;
 }
 result.coverage.fraction = covered / scope.sources.length;
 for (const target of scope.skills) {
  const state = course.topics[target.topicId]?.skills[target.skillId];
  if (!state?.confirmedAt) continue;
  const confirmed = Date.parse(state.confirmedAt);
  if (!Number.isFinite(confirmed)) continue;
  result.confirmation.completed++;
  const reviewed = course.attempts.some((attempt, index) => {
   const at = Date.parse(attempt.completedAt ?? "");
   if (attempt.problem.skillId !== target.skillId || attempt.mode !== "review" || attempt.outcome !== "independent" || !Number.isFinite(at) || at < confirmed + REVIEW_INTERVAL) return false;
   return !course.attempts.slice(0, index).some(previous => overlaps(previous.problem, attempt.problem, content) && (!previous.completedAt || !Number.isFinite(Date.parse(previous.completedAt)) || at - Date.parse(previous.completedAt) < REVIEW_INTERVAL));
  });
  if (reviewed) result.review.completed++;
 }
 const complete = result.coverage.solved === result.coverage.total && result.confirmation.completed === result.confirmation.total && result.review.completed === result.review.total;
 result.percent = complete ? 100 : Math.min(99, Math.floor(80 * result.coverage.fraction + 10 * result.confirmation.completed / result.confirmation.total + 10 * result.review.completed / result.review.total));
 return result;
}

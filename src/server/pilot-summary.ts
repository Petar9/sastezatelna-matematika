import type { CourseAttempt, KidsCourse } from "../core/kids-course";

function asCourse(value: unknown): KidsCourse | undefined {
 if (!value || typeof value !== "object") return;
 const course = value as KidsCourse;
 if (Array.isArray(course.attempts) && course.topics && typeof course.topics === "object") return course;
}

function currentAttempt(course: KidsCourse) {
 const active = course.active;
 if (!active) return;
 const topic = course.topics[active.topicId];
 return course.journey === "quest" ? course.quest?.work?.attempt
  : active.skillId ? topic?.skillWork?.[active.skillId]?.attempt : topic?.work?.[active.mode]?.attempt;
}

export function lastCourseAttempt(value: unknown) {
 const course = asCourse(value);
 if (!course) return;
 const current = currentAttempt(course);
 return current && !current.outcome ? current : course.attempts.at(-1) ?? current;
}

// Project saved snapshots explicitly: grading fields and child answers never cross this boundary.
export function lastCourseStatement(value: unknown) {
 const problem = lastCourseAttempt(value)?.problem;
 if (!problem) return;
 return { id: problem.id, text: problem.text, source: problem.source, year: problem.provenance?.year,
  ...(problem.figure ? { figure: { src: problem.figure.src, alt: problem.figure.alt } } : {}),
  ...(problem.options ? { options: [...problem.options] } : {}) };
}

function courseAttempts(course: KidsCourse): CourseAttempt[] {
 return [...course.attempts, ...Object.values(course.topics).flatMap(topic =>
  [...Object.values(topic.work ?? {}), ...Object.values(topic.skillWork ?? {})].flatMap(work => work ? [work.attempt] : [])),
  ...(course.quest?.work ? [course.quest.work.attempt] : [])];
}

export function courseProblemForTask(value: unknown, taskKey: string) {
 const course = asCourse(value);
 return course && courseAttempts(course).find(attempt => attempt.key === taskKey)?.problem.id;
}

export function summarizeCourse(value: unknown) {
 const course = asCourse(value);
 if (!course) return null;
 const skills = Object.values(course.topics).flatMap(topic => Object.values(topic.skills ?? {}));
 return { attempts: course.attempts.length, confirmed: skills.filter(skill => !!skill.confirmedAt).length,
  revisit: skills.filter(skill => skill.revisit).length, problemId: lastCourseAttempt(course)?.problem?.id };
}

export function hasCourseProblem(value: unknown, problemId: string) {
 const course = asCourse(value);
 return !!course && courseAttempts(course).some(attempt => attempt.problem?.id === problemId);
}

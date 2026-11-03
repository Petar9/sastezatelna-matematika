import type {KidsCourse} from "../core/kids-course";
export function summarizeCourse(value:unknown){
 if(!value||typeof value!=="object")return null;
 const course=value as KidsCourse;
 if(!Array.isArray(course.attempts)||!course.topics||typeof course.topics!=="object")return null;
 const skills=Object.values(course.topics).flatMap(topic=>Object.values(topic.skills??{}));
 return {attempts:course.attempts.length,confirmed:skills.filter(skill=>!!skill.confirmedAt).length,revisit:skills.filter(skill=>skill.revisit).length,problemId:course.attempts.at(-1)?.problem?.id};
}
export function hasCourseProblem(value:unknown,problemId:string){
 if(!value||typeof value!=="object")return false;
 const course=value as KidsCourse;
 return Array.isArray(course.attempts)&&course.attempts.some(attempt=>attempt.problem?.id===problemId);
}

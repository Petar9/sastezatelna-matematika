import {KidsError} from "../core/kids.ts";
import {courseView,newKidsCourse,parseCourseCommand} from "../core/kids-course.ts";
import type {KidsCourse,KidsCourseContent,CourseAction} from "../core/kids-course.ts";
import {kidsCourseContent} from "./kids-course-content.ts";
export interface CourseStore {read(content?:KidsCourseContent):KidsCourse|null|Promise<KidsCourse|null>;update(revision:number,action:CourseAction,content:KidsCourseContent):KidsCourse|Promise<KidsCourse>;}
export async function readKidsCourseView(store:CourseStore, content:KidsCourseContent = kidsCourseContent){
 const now=new Date().toISOString();const course=await store.read(content)??newKidsCourse(content,now);
 if(course.contentVersion!==content.version)throw new KidsError("Учебният комплект е от несъвместима версия.",409);
 return courseView(course,content,now);
}
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export function failure(error:unknown){if(error instanceof KidsError)return json({error:error.message},error.status);console.error("Course request failed",error);return json({error:"Не успяхме да запазим. Опитай отново."},500);}
export async function kidsCourseResponse(request:Request,store:CourseStore,content:KidsCourseContent = kidsCourseContent){try{
 if(request.method==="GET")return json({course:await readKidsCourseView(store,content)});
 const {revision,action}=parseCourseCommand(await request.json().catch(()=>null));
 return json({course:courseView(await store.update(revision,action,content),content,new Date().toISOString())});
}catch(error){return failure(error);}}

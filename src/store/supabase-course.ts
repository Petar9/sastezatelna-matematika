import {DEFAULT_COMPETITION_ID} from "../core/competitions.ts";
import type {SupabaseClient} from "@supabase/supabase-js";
import {KidsError} from "../core/kids.ts";
import {applyCourseAction,migrateKidsCourse,newKidsCourse} from "../core/kids-course.ts";
import type {KidsCourse} from "../core/kids-course.ts";
import type {CourseStore} from "../server/kids-course.ts";
export function createSupabaseCourseStore(db:SupabaseClient,parentId:string,childId:string,competitionId:string = DEFAULT_COMPETITION_ID):CourseStore {
 async function readRaw(){const {data,error}=await db.from("course_progress").select("course,revision").eq("parent_id",parentId).eq("child_id",childId).eq("competition_id",competitionId).maybeSingle();if(error)throw error;if(!data)return null;const course=data.course as KidsCourse;if(course.version!==2||course.revision!==data.revision||!Array.isArray(course.attempts)||!course.topics)throw new KidsError("Несъвместим запис на напредъка.",409);return course;}
 return {async read(content){const course=await readRaw();return course&&content?migrateKidsCourse(course,content,new Date().toISOString()):course;},async update(revision,action,content){
  const raw=await readRaw();const course=raw?migrateKidsCourse(raw,content,new Date().toISOString()):newKidsCourse(content,new Date().toISOString());
  if(course.revision!==revision)throw new KidsError("Напредъкът е променен в друг прозорец. Показваме последния запис.",409);
  const next=applyCourseAction(course,content,action,new Date().toISOString());
  if(!raw){const {error}=await db.from("course_progress").insert({parent_id:parentId,child_id:childId,competition_id:competitionId,revision:next.revision,course:next});if(error?.code==="23505")throw new KidsError("Напредъкът е променен в друг прозорец.",409);if(error)throw error;}
  else{const {data,error}=await db.from("course_progress").update({course:next,revision:next.revision,updated_at:new Date().toISOString()}).eq("parent_id",parentId).eq("child_id",childId).eq("competition_id",competitionId).eq("revision",raw.revision).select("child_id").maybeSingle();if(error)throw error;if(!data)throw new KidsError("Напредъкът е променен в друг прозорец. Показваме последния запис.",409);}
  return next;
 }};
}

import {DEFAULT_COMPETITION_ID} from "../core/competitions.ts";
import type {SupabaseClient} from "@supabase/supabase-js";
import {courseGoldBalance} from "../core/kids-gold.ts";
import {KidsError} from "../core/kids.ts";
import {applyCourseAction,migrateKidsCourse,newKidsCourse} from "../core/kids-course.ts";
import type {KidsCourse,KidsCourseContent,CourseAction} from "../core/kids-course.ts";
import type {CourseStore} from "../server/kids-course.ts";
export function createSupabaseCourseStore(db:SupabaseClient,parentId:string,childId:string,competitionId:string = DEFAULT_COMPETITION_ID):CourseStore {
 function checked(course:KidsCourse,revision:unknown){if(course.version!==2||course.revision!==revision||!Array.isArray(course.attempts)||!course.topics)throw new KidsError("Несъвместим запис на напредъка.",409);return course;}
 async function readRaw(){const {data,error}=await db.from("course_progress").select("course,revision").eq("parent_id",parentId).eq("child_id",childId).eq("competition_id",competitionId).maybeSingle();if(error)throw error;if(!data)return null;return checked(data.course as KidsCourse,data.revision);}
 async function updateWithPrevious(revision:number,action:CourseAction,content:KidsCourseContent){
  const raw=await readRaw();const course=raw?migrateKidsCourse(raw,content,new Date().toISOString()):newKidsCourse(content,new Date().toISOString());
  if(course.revision!==revision)throw new KidsError("Напредъкът е променен в друг прозорец. Показваме последния запис.",409);
  const next=applyCourseAction(course,content,action,new Date().toISOString());
  if(!raw){const {error}=await db.from("course_progress").insert({parent_id:parentId,child_id:childId,competition_id:competitionId,revision:next.revision,course:next});if(error?.code==="23505")throw new KidsError("Напредъкът е променен в друг прозорец.",409);if(error)throw error;}
  else{const {data,error}=await db.from("course_progress").update({course:next,revision:next.revision,updated_at:new Date().toISOString()}).eq("parent_id",parentId).eq("child_id",childId).eq("competition_id",competitionId).eq("revision",raw.revision).select("child_id").maybeSingle();if(error)throw error;if(!data)throw new KidsError("Напредъкът е променен в друг прозорец. Показваме последния запис.",409);}
  return {before:course,next};
 }
 return {async readSnapshot(content){
  // One request-local database snapshot supplies both the selected course and wallet.
  const {data,error}=await db.from("course_progress").select("course,revision,competition_id").eq("parent_id",parentId).eq("child_id",childId);
  if(error)throw error;
  const row=data?.find(row=>row.competition_id===competitionId);
  const course=row?migrateKidsCourse(checked(row.course as KidsCourse,row.revision),content,new Date().toISOString()):null;
  return {course,gold:(course?courseGoldBalance(course):0)+(data??[]).filter(row=>row.competition_id!==competitionId).reduce((sum,row)=>sum+courseGoldBalance(row.course as KidsCourse),0)};
 },async goldBalance(current){
  // Sum competition ledgers instead of updating a shared wallet: simultaneous
  // awards in different competitions cannot overwrite one another's balance.
  const {data,error}=await db.from("course_progress").select("course,competition_id").eq("parent_id",parentId).eq("child_id",childId).neq("competition_id",competitionId);
  if(error)throw error;
  return courseGoldBalance(current)+(data??[]).reduce((sum,row)=>sum+courseGoldBalance(row.course as KidsCourse),0);
 },async read(content){const course=await readRaw();return course&&content?migrateKidsCourse(course,content,new Date().toISOString()):course;},updateWithPrevious,async update(revision,action,content){
  return (await updateWithPrevious(revision,action,content)).next;
 }};
}

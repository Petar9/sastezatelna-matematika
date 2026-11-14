import type {Appreciation} from "../core/accomplishments.ts";
import {completedLearningAction} from "./competition-resume.ts";
import {KidsError} from "../core/kids.ts";
import {courseView,newKidsCourse,parseCourseCommand} from "../core/kids-course.ts";
import type {KidsCourse,KidsCourseContent,CourseAction} from "../core/kids-course.ts";
import {newGoldGain} from "../core/kids-gold.ts";
import {kidsCourseContent} from "./kids-course-content.ts";
export interface CourseStore {
 claimDailyRecords?(before:KidsCourse,next:KidsCourse,now:string):Appreciation[]|Promise<Appreciation[]>;
 readSnapshot?(content:KidsCourseContent):Promise<{course:KidsCourse|null;gold:number}>;
 goldBalance?(current:KidsCourse):number|Promise<number>;
 read(content?:KidsCourseContent):KidsCourse|null|Promise<KidsCourse|null>;
 update(revision:number,action:CourseAction,content:KidsCourseContent):KidsCourse|Promise<KidsCourse>;
 // Return the migrated input used by the successful revision-guarded update.
 updateWithPrevious?(revision:number,action:CourseAction,content:KidsCourseContent):Promise<{before:KidsCourse;next:KidsCourse}>;
}
export async function readKidsCourseView(store:CourseStore, content:KidsCourseContent = kidsCourseContent){
 const now=new Date().toISOString();const snapshot=await store.readSnapshot?.(content);const course=(snapshot?snapshot.course:await store.read(content))??newKidsCourse(content,now);
 if(course.contentVersion!==content.version)throw new KidsError("Учебният комплект е от несъвместима версия.",409);
 const view=courseView(course,content,now);
 if(snapshot)view.gold=snapshot.gold;
 else if(store.goldBalance)view.gold=await store.goldBalance(course);
 return view;
}
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
export function failure(error:unknown){if(error instanceof KidsError)return json({error:error.message},error.status);console.error("Course request failed",error);return json({error:"Не успяхме да запазим. Опитай отново."},500);}
export async function kidsCourseResponse(request:Request,store:CourseStore,content:KidsCourseContent = kidsCourseContent, workedCookie?:string){try{
 if(request.method==="GET")return json({course:await readKidsCourseView(store,content)});
 const {revision,action}=parseCourseCommand(await request.json().catch(()=>null));
 const {before,next}=store.updateWithPrevious
  ?await store.updateWithPrevious(revision,action,content)
  :{before:await store.read(content)??newKidsCourse(content,new Date().toISOString()),next:await store.update(revision,action,content)};
 const view=courseView(next,content,new Date().toISOString());
 if(store.goldBalance)view.gold=await store.goldBalance(next);
 view.goldGain=newGoldGain(before,next);
 if(action.type==="answer") {
  const completed=next.attempts.find(attempt=>attempt.key===action.taskKey);
  if(completed?.completedAt && !before.attempts.some(attempt=>attempt.key===action.taskKey)) {
   const appreciations:Appreciation[]=[...(completed.appreciations??[])];
   // Recognition must never turn a successfully saved answer into an error.
   try { appreciations.push(...await store.claimDailyRecords?.(before,next,completed.completedAt)??[]); }
   catch(error) { console.error("Daily appreciation could not be claimed",error); }
   if(appreciations.length)view.appreciations=appreciations;
  }
 }
 const response=json({course:view});
 if(workedCookie&&completedLearningAction(action,before,next))response.headers.append("Set-Cookie",workedCookie);
 return response;
}catch(error){return failure(error);}}

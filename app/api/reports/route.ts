import {NextResponse} from "next/server";
import {KidsError} from "@/src/core";
import {mode,parentContext,appOrigin,failure} from "@/src/server";
import {publishedCompetitions} from "@/src/server/competitions";
import {hasCourseProblem} from "@/src/server/pilot-summary";
export async function POST(request:Request){try{
 if(mode()!=="hosted")throw new KidsError("Недостъпно.",404);const parent=await parentContext();const form=await request.formData();
 const child=String(form.get("child")??""),competition=String(form.get("competition")??""),problem=String(form.get("problem")??""),description=String(form.get("description")??"").trim();
 if(!parent.children.some(c=>c.id===child)||!publishedCompetitions().some(c=>c.id===competition)||!description||description.length>1000||problem.length>200)throw new KidsError("Невалиден сигнал.");
 const {data,error}=await parent.db.from("course_progress").select("course").eq("parent_id",parent.parentId).eq("child_id",child).eq("competition_id",competition).maybeSingle();if(error)throw error;if(!hasCourseProblem(data?.course,problem))throw new KidsError("Задачата не е намерена.",404);
 const result=await parent.db.from("problem_reports").insert({parent_id:parent.parentId,child_id:child,competition_id:competition,problem_id:problem,description});if(result.error)throw result.error;
 return NextResponse.redirect(`${appOrigin()}/parent?reported=1`,303);
 }catch(error){return failure(error);}}

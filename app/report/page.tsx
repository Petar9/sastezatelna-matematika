import {redirect} from "next/navigation";
import Link from "next/link";
import {mode,parentContext} from "@/src/server";
import {KidsError} from "@/src/core";
import {hasCourseProblem} from "@/src/server/pilot-summary";
import {publishedCompetitions} from "@/src/server/competitions";
import s from "@/components/kids.module.css";
export const dynamic="force-dynamic";
export default async function Report({searchParams}:{searchParams:Promise<{child?:string;competition?:string;problem?:string}>}){
 if(mode()!=="hosted")redirect("/profiles");const parent=await parentContext().catch(error=>{if(error instanceof KidsError)redirect("/login");throw error;});
 const {child,competition,problem}=await searchParams;if(!child||!competition||!problem||!parent.children.some(c=>c.id===child)||!publishedCompetitions().some(c=>c.id===competition))redirect("/parent");
 const {data,error}=await parent.db.from("course_progress").select("course").eq("parent_id",parent.parentId).eq("child_id",child).eq("competition_id",competition).maybeSingle();if(error)throw error;if(!hasCourseProblem(data?.course,problem))redirect("/parent");
 return <main className={s.shell}><div className={s.content}><Link href="/parent" className={s.secondary}>← Напредък</Link><section className={s.card}><h1>Съобщи за неясна задача</h1><p>Задачата ще бъде посочена автоматично. Не включвай лични данни в описанието.</p><form method="post" action="/api/reports"><input type="hidden" name="child" value={child}/><input type="hidden" name="competition" value={competition}/><input type="hidden" name="problem" value={problem}/><label className={s.reasoning}>Какво е неясно?<textarea name="description" required maxLength={1000}/></label><button className={s.button}>Изпрати сигнал</button></form></section></div></main>;
}

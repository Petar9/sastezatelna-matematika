import {redirect} from "next/navigation";
import Link from "next/link";
import {KidsError} from "@/src/core";
import {mode,parentContext} from "@/src/server";
import {publishedCompetitions} from "@/src/server/competitions";
import {summarizeCourse} from "@/src/server/pilot-summary";
import s from "@/components/kids.module.css";
export const dynamic="force-dynamic";
export default async function Parent({searchParams}:{searchParams:Promise<{reported?:string}>}){
 if(mode()!=="hosted")redirect("/profiles");
 const parent=await parentContext().catch(error=>{if(error instanceof KidsError)redirect(error.status===401?"/login":"/login?denied=1");throw error;});
 const {data,error}=await parent.db.from("course_progress").select("child_id,competition_id,course").eq("parent_id",parent.parentId);if(error)throw error;
 const published=publishedCompetitions();const {reported}=await searchParams;
 return <main className={s.shell}><div className={s.content}><Link href="/profiles" className={s.secondary}>← Профили</Link><h1>Напредък за родители</h1>{reported&&<p role="status">Сигналът е записан за преглед.</p>}{parent.children.map(child=><section className={s.card} key={child.id}><h2>{child.nickname}</h2>{published.map(competition=>{const row=(data??[]).find(row=>row.child_id===child.id&&row.competition_id===competition.id);const summary=summarizeCourse(row?.course);return <div key={competition.id}><h3>{competition.title}</h3>{summary?<><p>Решени задачи: {summary.attempts}. Потвърдени умения: {summary.confirmed}. Умения за упражнение: {summary.revisit}.</p>{summary.problemId&&<form action="/report" method="get"><input type="hidden" name="child" value={child.id}/><input type="hidden" name="competition" value={competition.id}/><input type="hidden" name="problem" value={summary.problemId}/><button className={s.secondary}>Съобщи за последната задача</button></form>}</>:<p>Все още няма записан напредък.</p>}</div>})}</section>)}</div></main>;
}

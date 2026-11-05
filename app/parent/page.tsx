import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { KidsError } from "@/src/core";
import { mode, parentContext } from "@/src/server";
import { publishedCompetitions } from "@/src/server/competitions";
import { summarizeCourse } from "@/src/server/pilot-summary";
import { FeedbackButton } from "@/components/feedback";
import s from "@/components/kids.module.css";

export const dynamic = "force-dynamic";
export default async function Parent() {
 if (mode() !== "hosted") redirect("/profiles");
 const parent = await parentContext().catch(error => {
  if (error instanceof KidsError) redirect(error.status === 401 ? "/login" : "/login?denied=1");
  throw error;
 });
 const { data, error } = await parent.db.from("course_progress").select("child_id,competition_id,course").eq("parent_id", parent.parentId);
 if (error) throw error;
 const published = publishedCompetitions();
 return <main className={s.shell}><div className={s.content}>
  <ButtonLink href="/profiles" className={s.secondary}>← Профили</ButtonLink><h1>Напредък за родители</h1>
  {parent.children.map(child => <section className={s.card} key={child.id}><h2>{child.nickname}</h2>
   {published.map(competition => {
    const row = (data ?? []).find(row => row.child_id === child.id && row.competition_id === competition.id);
    const summary = summarizeCourse(row?.course);
    return <div key={competition.id}><h3>{competition.title}</h3>{summary ? <>
     <p>Опити за решаване: {summary.attempts}. Затвърдени умения: {summary.confirmed}. Умения за упражнение: {summary.revisit}.</p>
     {summary.problemId && <ButtonLink className={s.secondary} href={`/parent/task?child=${encodeURIComponent(child.id)}&competition=${encodeURIComponent(competition.id)}`}>Виж последната задача</ButtonLink>}
    </> : <p>Все още няма записан напредък.</p>}</div>;
   })}</section>)}
  <footer className={s.footer}><FeedbackButton/></footer>
 </div></main>;
}

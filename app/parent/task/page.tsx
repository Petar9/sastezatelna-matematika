import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KidsError } from "@/src/core";
import { publicImage } from "@/src/core/public-images";
import { mode, parentContext } from "@/src/server";
import { publishedCompetitions } from "@/src/server/competitions";
import { lastCourseStatement } from "@/src/server/pilot-summary";
import { AppHeader } from "@/components/app-header";
import s from "@/components/kids.module.css";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function LastTask({ searchParams }: { searchParams: Promise<{ child?: string; competition?: string }> }) {
 if (mode() !== "hosted") notFound();
 const parent = await parentContext().catch(error => {
  if (error instanceof KidsError) redirect(error.status === 401 ? "/login" : "/login?denied=1");
  throw error;
 });
 const params = await searchParams;
 const child = parent.children.find(child => child.id === params.child);
 const competition = publishedCompetitions().find(competition => competition.id === params.competition);
 if (!child || !competition) notFound();
 const { data, error } = await parent.db.from("course_progress").select("course")
  .eq("parent_id", child.parentId).eq("child_id", child.id).eq("competition_id", competition.id).maybeSingle();
 if (error) throw error;
 const statement = lastCourseStatement(data?.course);
 return <main className={s.shell}><div className={s.content}>
  <AppHeader childId={child.id} competitionId={competition.id}/>
  <Link href={`/progress?child=${encodeURIComponent(child.id)}`} className={s.secondary}>← Напредък</Link>
  <section className={s.card}><h1>Последната задача на {child.nickname}</h1>
   {statement ? <>
    <p className={s.small}>{statement.year ? `${competition.title} · ${statement.year}` : statement.source}</p>
    <p className={s.question} style={{ whiteSpace: "pre-line" }}>{statement.text}</p>
    {statement.figure && <figure className={s.figure}><Image src={publicImage(statement.figure.src)} alt={statement.figure.alt} width={360} height={360} unoptimized/></figure>}
    {statement.options && <ol className={s.list}>{statement.options.map((option, index) => <li key={index}>{["А", "Б", "В", "Г"][index] ?? index + 1}) {option}</li>)}</ol>}
   </> : <p>Все още няма записана задача.</p>}
  </section>
 </div></main>;
}

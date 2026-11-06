import Link from "next/link";
import Image from "next/image";
import { publicImage } from "@/src/core/public-images";
import { notFound, redirect } from "next/navigation";
import { learnerContext, mode } from "@/src/server";
import { KidsError } from "@/src/core";
import { originalStatement } from "@/src/server/original-statement";
import s from "@/components/kids.module.css";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Source({ searchParams }: { searchParams: Promise<{ competition?: string; problem?: string }> }) {
 const params = await searchParams;
 if (!params.problem || (mode() === "hosted" && process.env.VERCEL_ENV === "preview")) notFound();
 try {
  const context = await learnerContext({ api: false, competitionId: params.competition });
  const statement = originalStatement(context.content, params.problem);
  if (!statement) notFound();
  return <main className={s.shell}><div className={s.content}>
   <Link className={s.secondary} href={`/?competition=${encodeURIComponent(context.competitionId)}`}>← Начало</Link>
   <section className={s.card}><h1>Оригинално условие</h1><p>{statement.source}</p>
    <p className={s.question} style={{ whiteSpace: "pre-line" }}>{statement.text}</p>
    {(statement.figures ?? (statement.figure ? [statement.figure] : [])).map(figure => <figure key={figure.src} className={s.figure}><Image src={publicImage(figure.src)} alt={figure.alt} width={360} height={360} unoptimized /></figure>)}
    {statement.options && <ol className={s.list}>{statement.options.map((option, i) => <li key={i}>{["А", "Б", "В", "Г"][i]}) {option}</li>)}</ol>}
   </section></div></main>;
 } catch (error) {
  if (error instanceof KidsError) {
   if (error.status === 401) redirect("/login");
   if (error.status === 428) redirect("/profiles");
   if (error.status === 403) redirect("/login?denied=1");
   if (error.status === 404) notFound();
  }
  throw error;
 }
}

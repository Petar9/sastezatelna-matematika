import { redirect } from "next/navigation";
import Link from "next/link";
import { mode, parentContext } from "@/src/server";
import { KidsError } from "@/src/core";
import { ChildProfiles } from "@/components/onboarding";
import s from "@/components/kids.module.css";
export const dynamic = "force-dynamic";
export default async function Profiles({ searchParams }: { searchParams: Promise<{ full?: string; error?: string }> }) {
  if (mode() === "local") return <main className={s.shell}><div className={s.content}><Link href="/" className={s.secondary}>← Начало</Link><h1>Твоето приключение</h1><p>Напредъкът се пази на този компютър.</p></div></main>;
  const parent = await parentContext().catch(error => {
    if (error instanceof KidsError) redirect(error.status === 401 ? "/login" : "/login?denied=1");
    throw error;
  });
  const { full, error } = await searchParams;
  const issue = full ? "full" : error === "nickname" ? "nickname" : error === "missing" ? "missing" : error ? "unavailable" : undefined;
  return <ChildProfiles children={parent.children} issue={issue} />;
}

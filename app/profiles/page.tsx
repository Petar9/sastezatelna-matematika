import { redirect } from "next/navigation";
import Link from "next/link";
import { mode, accountContext } from "@/src/server";
import { KidsError } from "@/src/core";
import type { ProfileIssue } from "@/components/onboarding";
import { ChildProfiles } from "@/components/onboarding";
import s from "@/components/kids.module.css";
export const dynamic = "force-dynamic";
export default async function Profiles({ searchParams }: { searchParams: Promise<{ full?: string; error?: string; setup?: string; status?: string }> }) {
  if (mode() === "local") return <main className={s.shell}><div className={s.content}><Link href="/" className={s.secondary}>← Начало</Link><h1>Твоето приключение</h1><p>Напредъкът се пази на този компютър.</p></div></main>;
  const account = await accountContext().catch(error => {
    if (error instanceof KidsError) redirect(error.status === 401 ? "/login" : "/login?denied=1");
    throw error;
  });
  if (account.role === "child") redirect("/");
  const { full, error, setup, status } = await searchParams;
  const issue = full ? "full" : error === "nickname" ? "nickname" : error === "missing" ? "missing" : error === "email" ? "email" : error === "email-used" ? "email-used" : error && ["create-unavailable", "select-unavailable", "save-email-unavailable", "remove-email-unavailable"].includes(error) ? error as ProfileIssue : error ? "unavailable" : undefined;
  return <ChildProfiles children={account.children} issue={issue} setup={setup} status={status === "saved" || status === "removed" ? status : undefined} />;
}

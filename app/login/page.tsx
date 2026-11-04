import { redirect } from "next/navigation";
import { mode } from "@/src/server";
import { LoginWelcome } from "@/components/onboarding";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ denied?: string; error?: string }> }) {
  if (mode() === "local") redirect("/");
  const { denied, error } = await searchParams;
  const issue = denied ? "denied" : error === "cancelled" ? "cancelled" : error ? "unavailable" : undefined;
  return <LoginWelcome issue={issue} />;
}

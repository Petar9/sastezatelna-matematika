import { redirect } from "next/navigation";

export default async function Parent({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
 const { child } = await searchParams;
 redirect(child ? `/progress?child=${encodeURIComponent(child)}` : "/progress");
}

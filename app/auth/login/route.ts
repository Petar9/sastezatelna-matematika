import { NextResponse } from "next/server";
import { authClient } from "@/src/server/supabase";
import { mode, appOrigin } from "@/src/server";
export async function POST() {
  if (mode() !== "hosted") return new Response(null, { status: 404 });
  try {
    const client = await authClient();
    const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${appOrigin()}/auth/callback` } });
    if (!error && data.url) return NextResponse.redirect(data.url, 303);
  } catch { /* Keep configuration and network failures on the retry screen. */ }
  return NextResponse.redirect(`${appOrigin()}/login?error=unavailable`, 303);
}

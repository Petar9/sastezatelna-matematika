import { NextResponse } from "next/server";
import { authClient } from "@/src/server/supabase";
import { mode, appOrigin, parentContext } from "@/src/server";
import { KidsError } from "@/src/core";
export async function GET(request: Request) {
  if (mode() !== "hosted") return new Response(null, { status: 404 });
  const params = new URL(request.url).searchParams;
  const login = (query: string) => NextResponse.redirect(`${appOrigin()}/login?${query}`, 303);
  if (params.get("error") === "access_denied") return login("error=cancelled");
  const code = params.get("code");
  if (!code || params.has("error")) return login("error=unavailable");
  try {
    const client = await authClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return login("error=unavailable");
    try {
      await parentContext();
      return NextResponse.redirect(`${appOrigin()}/`, 303);
    } catch (error) {
      await client.auth.signOut();
      return login(error instanceof KidsError && error.status === 403 ? "denied=1" : "error=unavailable");
    }
  } catch {
    return login("error=unavailable");
  }
}

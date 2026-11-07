import { NextResponse } from "next/server";
import { authClient } from "@/src/server/supabase";
import { mode, appOrigin } from "@/src/server";
import {cookies} from "next/headers";
import {invitationCookie,pendingInvitation} from "@/src/server/child-sharing";
export async function POST(request?:Request) {
  if (mode() !== "hosted") return new Response(null, { status: 404 });
  try {
    const invitation=request&&(await request.formData()).get("invitation")==="1";
    const pending=invitation?await pendingInvitation():null;
    if(invitation&&!pending)return NextResponse.redirect(`${appOrigin()}/invite`,303);
    if(!invitation)(await cookies()).delete(invitationCookie);
    const client = await authClient();
    const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${appOrigin()}/auth/callback`, ...(pending?{queryParams:{prompt:"select_account"}}:{}) } });
    if (!error && data.url) return NextResponse.redirect(data.url, 303);
  } catch { /* Keep configuration and network failures on the retry screen. */ }
  return NextResponse.redirect(`${appOrigin()}/login?error=unavailable`, 303);
}

import {NextResponse} from "next/server";
import {authClient} from "@/src/server/supabase";
import {mode,appOrigin} from "@/src/server";
export async function POST(){if(mode()!=="hosted")return new Response(null,{status:404});const client=await authClient();const {data,error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${appOrigin()}/auth/callback`}});if(error||!data.url)return new Response("Входът не е достъпен. Опитай отново.",{status:503});return NextResponse.redirect(data.url,303);}

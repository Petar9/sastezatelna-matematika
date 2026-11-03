import {NextResponse} from "next/server";
import {authClient} from "@/src/server/supabase";
import {mode,appOrigin,parentContext} from "@/src/server";
export async function GET(request:Request){if(mode()!=="hosted")return new Response(null,{status:404});const client=await authClient();const code=new URL(request.url).searchParams.get("code");if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(!error){try{await parentContext();return NextResponse.redirect(`${appOrigin()}/`,303);}catch{await client.auth.signOut();}}}return NextResponse.redirect(`${appOrigin()}/login?denied=1`,303);}

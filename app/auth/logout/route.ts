import {NextResponse} from "next/server";
import {authClient} from "@/src/server/supabase";
import {mode,appOrigin} from "@/src/server";
export async function POST(){if(mode()!=="hosted")return new Response(null,{status:404});await (await authClient()).auth.signOut();const response=NextResponse.redirect(`${appOrigin()}/login`,303);response.cookies.delete("maths_child");return response;}

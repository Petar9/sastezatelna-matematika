import {NextResponse,type NextRequest} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {mode,isLoopbackHost,mutationAllowed,required} from "./src/server/config";
export async function proxy(request:NextRequest){
 const deployment=mode();
 if(deployment==="local"&&!isLoopbackHost(request.headers.get("host")))return new NextResponse("Local access only",{status:403});
 if(!mutationAllowed(request,deployment))return new NextResponse("Invalid request origin",{status:403});
 let response=NextResponse.next({request});response.headers.set("Cache-Control","no-store");
 if(deployment==="hosted"&&process.env.VERCEL_ENV!=="preview"){
  const supabase=createServerClient(required("SUPABASE_URL"),required("SUPABASE_PUBLISHABLE_KEY"),{cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));response.headers.set("Cache-Control","no-store");}}});
  // Refresh cookies here; protected routes still authorize against a fresh getUser response.
  await supabase.auth.getClaims();
 }
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|assets/images/|kids/figures/|kids/lessons/).*)"]};

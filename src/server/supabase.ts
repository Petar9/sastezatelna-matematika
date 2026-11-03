import {createServerClient} from "@supabase/ssr";
import {createClient} from "@supabase/supabase-js";
import {cookies} from "next/headers";
import {assertHostedDataAccess,required} from "./config.ts";
export async function authClient(){assertHostedDataAccess();const jar=await cookies();return createServerClient(required("SUPABASE_URL"),required("SUPABASE_PUBLISHABLE_KEY"),{cookies:{getAll:()=>jar.getAll(),setAll:values=>{try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Proxy refreshes cookies before Server Component rendering. */}}}});}
export function database(){assertHostedDataAccess();return createClient(required("SUPABASE_URL"),required("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}

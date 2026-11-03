import {competitionContent,requirePublishedCompetition} from "./competitions.ts";
import {cookies,headers} from "next/headers";
import {KidsError} from "../core/kids.ts";
import {mode,isLoopbackHost} from "./config.ts";
import {authClient,database} from "./supabase.ts";
import {localStores} from "./stores.ts";
import {createSupabaseCourseStore} from "../store/supabase-course.ts";
export const childCookie="maths_child";
export function approvedGoogleUser(user:{id:string;email?:string;email_confirmed_at?:string;app_metadata:{provider?:string}}|null){return !!user?.email&&!!user.email_confirmed_at&&user.app_metadata.provider==="google";}
export async function parentContext(){
 const auth=await authClient();const {data:{user},error}=await auth.auth.getUser();
 if(error||!user)throw new KidsError("Влез с родителския профил.",401);
 if(!approvedGoogleUser(user))throw new KidsError("Необходим е потвърден Google профил.",403);
 const db=database();const {data:allowed,error:allowError}=await db.from("allowed_parent_emails").select("email").eq("email",user.email!.toLowerCase()).maybeSingle();
 if(allowError)throw allowError;if(!allowed)throw new KidsError("Този профил още няма достъп.",403);
 const {error:parentError}=await db.from("parents").upsert({id:user.id,email:user.email!.toLowerCase()},{onConflict:"id"});if(parentError)throw parentError;
 const {data:children,error:childError}=await db.from("child_profiles").select("id,nickname").eq("parent_id",user.id).eq("active",true).order("created_at");if(childError)throw childError;
 return {auth,db,parentId:user.id,children:(children??[]) as {id:string;nickname:string}[]};
}
export function selectedChild(children:{id:string;nickname:string}[],selected:string|undefined){return children.find(child=>child.id===selected)??(children.length===1?children[0]:undefined);}
export async function learnerContext(request?:{childId?:string;competitionId?:string;api:boolean}){
 const competitionId=requirePublishedCompetition(request?.competitionId).id;
 const content=competitionContent(competitionId);
 if(mode()==="local"){
  if(!isLoopbackHost((await headers()).get("host")))throw new KidsError("Локалният режим е достъпен само на този компютър.",403);
  const stores=localStores(competitionId);return {courseStore:stores.kidsCourseStore,legacyStore:stores.kidsStore,childId:undefined,competitionId,content};
 }
 const parent=await parentContext();const child=request?.api ? parent.children.find(child=>child.id===request.childId) : selectedChild(parent.children,(await cookies()).get(childCookie)?.value);
 if(!child)throw new KidsError("Избери детски профил.",428);
 return {courseStore:createSupabaseCourseStore(parent.db,parent.parentId,child.id,competitionId),legacyStore:undefined,childId:child.id,competitionId,content};
}

import {competitionContent,requireAvailableCompetition} from "./competitions.ts";
import {cookies,headers} from "next/headers";
import {KidsError} from "../core/kids.ts";
import {mode,isLoopbackHost} from "./config.ts";
import {authClient,database} from "./supabase.ts";
import {localStores} from "./stores.ts";
import {createSupabaseCourseStore} from "../store/supabase-course.ts";
export const childCookie="maths_child";
export function approvedGoogleUser(user:{id:string;email?:string;email_confirmed_at?:string;app_metadata:{provider?:string}}|null){return !!user?.email&&!!user.email_confirmed_at&&user.app_metadata.provider==="google";}
export async function accountContext({learningOnly=false}:{learningOnly?:boolean}={}){
 const auth=await authClient();const {data:{user},error}=await auth.auth.getUser();
 if(error||!user)throw new KidsError("Влез с Google профила си.",401);
 if(!approvedGoogleUser(user))throw new KidsError("Необходим е потвърден Google профил.",403);
 const db=database();const email=user.email!.toLowerCase();
 const {data:allowed,error:allowError}=await db.from("allowed_parent_emails").select("email").eq("email",email).maybeSingle();
 if(allowError)throw allowError;
 if(allowed){
  if(!learningOnly){const {error:parentError}=await db.from("parents").upsert({id:user.id,email},{onConflict:"id"});if(parentError)throw parentError;}
  const {data:children,error:childError}=await db.from("child_profiles").select("id,nickname").eq("parent_id",user.id).eq("active",true).order("created_at");if(childError)throw childError;
  const {data:logins,error:loginError}=learningOnly?{data:null,error:null}:await db.from("child_profile_logins").select("child_id,email,auth_user_id").eq("parent_id",user.id);if(loginError)throw loginError;
  return {role:"parent" as const,auth,db,parentId:user.id,children:(children??[]).map(child=>{
   const login=logins?.find(login=>login.child_id===child.id);
   return {id:child.id as string,nickname:child.nickname as string,loginEmail:login?.email as string|undefined,loginConnected:!!login?.auth_user_id};
  })};
 }
 const {data:links,error:linkError}=await db.rpc("resolve_child_login",{p_email:email,p_auth_user_id:user.id});if(linkError)throw linkError;
 const child=links?.[0] as {parent_id:string;child_id:string;nickname:string}|undefined;
 if(!child)throw new KidsError("Този профил още няма достъп.",403);
 return {role:"child" as const,auth,db,parentId:child.parent_id,children:[{id:child.child_id,nickname:child.nickname}]};
}
export async function parentContext(){
 const account=await accountContext();
 if(account.role!=="parent")throw new KidsError("Тази страница е за родителя.",403);
 return account;
}
export function selectedChild(children:{id:string;nickname:string}[],selected:string|undefined){return children.find(child=>child.id===selected)??(children.length===1?children[0]:undefined);}
export async function learnerContext(request?:{childId?:string;competitionId?:string;api:boolean}){
 const competitionId=requireAvailableCompetition(request?.competitionId).id;
 const content=competitionContent(competitionId);
 if(mode()==="local"){
  if(!isLoopbackHost((await headers()).get("host")))throw new KidsError("Локалният режим е достъпен само на този компютър.",403);
  const stores=localStores(competitionId);return {courseStore:stores.kidsCourseStore,legacyStore:stores.kidsStore,childId:undefined,childNickname:undefined,competitionId,content};
 }
 const parent=await accountContext({learningOnly:true});const child=request?.api ? parent.children.find(child=>child.id===request.childId) : selectedChild(parent.children,(await cookies()).get(childCookie)?.value);
 if(!child)throw new KidsError("Избери детски профил.",428);
 return {courseStore:createSupabaseCourseStore(parent.db,parent.parentId,child.id,competitionId),legacyStore:undefined,childId:child.id,childNickname:child.nickname,competitionId,content};
}

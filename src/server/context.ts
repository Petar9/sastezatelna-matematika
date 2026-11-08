import {availableCompetitions,competitionContent,requireAvailableCompetition} from "./competitions.ts";
import {cookies,headers} from "next/headers";
import {KidsError} from "../core/kids.ts";
import {mode,isLoopbackHost} from "./config.ts";
import {authClient,database} from "./supabase.ts";
import {localStores} from "./stores.ts";
import {createSupabaseCourseStore} from "../store/supabase-course.ts";
import {competitionCookieName,resumedCompetition} from "./competition-resume.ts";
export const childCookie="maths_child";
export function approvedGoogleUser(user:{id:string;email?:string;email_confirmed_at?:string;app_metadata:{provider?:string}}|null){return !!user?.email&&!!user.email_confirmed_at&&user.app_metadata.provider==="google";}
export type AccountChild={id:string;nickname:string;parentId:string;isOwner:boolean;loginEmail?:string;loginConnected?:boolean};
export async function accountContext({learningOnly=false}:{learningOnly?:boolean}={}){
 const auth=await authClient();const {data:{user},error}=await auth.auth.getUser();
 if(error||!user)throw new KidsError("Влез с Google профила си.",401);
 if(!approvedGoogleUser(user))throw new KidsError("Необходим е потвърден Google профил.",403);
 const db=database();const email=user.email!.toLowerCase();
 const [allowResult,sharedResult]=await Promise.all([
  db.from("allowed_parent_emails").select("email").eq("email",email).maybeSingle(),
  db.rpc("shared_children",{p_auth_user_id:user.id}),
 ]);
 if(allowResult.error)throw allowResult.error;
 if(sharedResult.error)throw sharedResult.error;
 const allowed=!!allowResult.data;
 const children:AccountChild[]=[];
 if(allowed){
  if(!learningOnly){const {error:parentError}=await db.from("parents").upsert({id:user.id,email},{onConflict:"id"});if(parentError)throw parentError;}
  const {data:owned,error:childError}=await db.from("child_profiles").select("id,nickname").eq("parent_id",user.id).eq("active",true).order("created_at");if(childError)throw childError;
  const {data:logins,error:loginError}=learningOnly?{data:null,error:null}:await db.from("child_profile_logins").select("child_id,email,auth_user_id").eq("parent_id",user.id);if(loginError)throw loginError;
  for(const child of owned??[]){
   const login=logins?.find(login=>login.child_id===child.id);
   children.push({id:child.id,nickname:child.nickname,parentId:user.id,isOwner:true,loginEmail:login?.email,loginConnected:!!login?.auth_user_id});
  }
 }
 for(const child of sharedResult.data??[]){
  if(!children.some(item=>item.id===child.child_id))children.push({id:child.child_id,nickname:child.nickname,parentId:child.parent_id,isOwner:false});
 }
 if(allowed||children.length)return {role:"parent" as const,auth,db,actorId:user.id,canCreateChildren:allowed,children};
 const {data:links,error:linkError}=await db.rpc("resolve_child_login",{p_email:email,p_auth_user_id:user.id});if(linkError)throw linkError;
 const child=links?.[0] as {parent_id:string;child_id:string;nickname:string}|undefined;
 if(!child)throw new KidsError("Този профил още няма достъп.",403);
 return {role:"child" as const,auth,db,actorId:user.id,canCreateChildren:false,children:[{id:child.child_id,nickname:child.nickname,parentId:child.parent_id,isOwner:false}] as AccountChild[]};
}
export async function parentContext(){
 const account=await accountContext();
 if(account.role!=="parent")throw new KidsError("Тази страница е за родителя.",403);
 return account;
}
export function selectedChild<T extends {id:string;nickname:string}>(children:T[],selected:string|undefined){return children.find(child=>child.id===selected)??(children.length===1?children[0]:undefined);}
export async function learnerContext(request?:{childId?:string;competitionId?:string;api:boolean}){
 const resolveCompetition=async(childId?:string)=>{
  const remembered=request?.api?undefined:(await cookies()).get(competitionCookieName(childId))?.value;
  return requireAvailableCompetition(resumedCompetition(request?.competitionId,remembered,availableCompetitions().map(item=>item.id))).id;
 };
 if(mode()==="local"){
  if(!isLoopbackHost((await headers()).get("host")))throw new KidsError("Локалният режим е достъпен само на този компютър.",403);
  const competitionId=await resolveCompetition();const content=competitionContent(competitionId);
  const stores=localStores(competitionId);return {courseStore:stores.kidsCourseStore,legacyStore:stores.kidsStore,childId:undefined,childNickname:undefined,competitionId,content};
 }
 const parent=await accountContext({learningOnly:true});const child=request?.api ? parent.children.find(child=>child.id===request.childId) : selectedChild(parent.children,(await cookies()).get(childCookie)?.value);
 if(!child)throw new KidsError("Избери детски профил.",428);
 const competitionId=await resolveCompetition(child.id);const content=competitionContent(competitionId);
 return {courseStore:createSupabaseCourseStore(parent.db,child.parentId,child.id,competitionId),legacyStore:undefined,childId:child.id,childNickname:child.nickname,competitionId,content};
}

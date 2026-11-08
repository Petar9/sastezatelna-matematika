import {mode,appOrigin,mutationAllowed} from "@/src/server/config";
import {parentContext} from "@/src/server/context";
import {invitationEmail} from "@/src/server/invitations";
import {uuid} from "@/src/server/child-sharing";
import {KidsError} from "@/src/core";
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function owner(childId:unknown){
 const account=await parentContext();
 const child=account.children.find(child=>child.id===childId&&child.isOwner);
 if(!child)throw new KidsError("Този профил вече не е достъпен.",403);
 return {account,child};
}
function failure(error:unknown){
 const status=error instanceof KidsError?error.status:503;
 return reply({message:status===401?"Влез отново с Google профила си.":status===403?"Само родителят, създал профила, може да управлява достъпа.":"Не успяхме да обновим достъпа. Опитай отново."},status);
}
export async function GET(request:Request){
 if(mode()!=="hosted")return new Response(null,{status:404});
 try{
  const {account,child}=await owner(new URL(request.url).searchParams.get("childId"));
  const [invites,...connections]=await Promise.all([
   account.db.from("child_access_invitations").select("id,email,expires_at").eq("child_id",child.id).eq("parent_id",account.actorId).is("cancelled_at",null).is("accepted_at",null).gt("expires_at",new Date().toISOString()).order("created_at"),
   ...["child_email_access","child_adult_memberships","child_profile_logins"].map(table=>account.db.from(table).select("email").eq("child_id",child.id).eq("parent_id",account.actorId).order("created_at")),
  ]);
  for(const result of [invites,...connections])if(result.error)throw result.error;
  const emails=[...new Set(connections.flatMap(result=>(result.data??[]).map(row=>row.email as string)))];
  return reply({invitations:invites.data??[],emails});
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 if(mode()!=="hosted")return new Response(null,{status:404});
 if(!mutationAllowed(request,"hosted"))return reply({message:"Невалидна заявка."},403);
 try{
  const body=await request.json();
  if(!body||typeof body!=="object")return reply({message:"Невалидна заявка."},400);
  const {account,child}=await owner(body.childId);
  if(body.action==="add"||body.action==="remove"){
   const email=invitationEmail(typeof body.email==="string"?body.email:null);
   if(!email)return reply({message:"Напиши валиден имейл адрес."},400);
   const {error}=await account.db.rpc(body.action==="add"?"add_child_email_access":"remove_child_email_access",{p_parent_id:account.actorId,p_child_id:child.id,p_email:email});
   if(error?.code==="23505")return reply({message:"Този имейл вече има достъп като собственик на профила."},409);
   if(error?.code==="P0001")return reply({message:"Добавени са твърде много имейли. Опитай отново след час."},429);
   if(error)throw error;
   return reply(body.action==="add"?{message:`Здравей направих ти профил в Състезателна математика за ${child.nickname}. Можеш да влезеш с гугъл профила ти оттук ${appOrigin()}/login.`}:{ok:true});
  }
  // Compatibility for invitations created before direct email access.
  if(body.action!=="cancel"||!uuid(body.invitationId))return reply({message:"Невалидна заявка."},400);
  const {error}=await account.db.rpc("remove_child_access",{p_parent_id:account.actorId,p_child_id:child.id,p_invitation_id:body.invitationId,p_auth_user_id:null});
  if(error)throw error;
  return reply({ok:true});
 }catch(error){return failure(error);}
}

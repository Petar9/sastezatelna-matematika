import {NextResponse} from "next/server";
import {mode,mutationAllowed} from "@/src/server/config";
import {authClient,database} from "@/src/server/supabase";
import {approvedGoogleUser,childCookie} from "@/src/server/context";
import {invitationCookie,invitationCookieOptions,invitationHash,invitationToken,pendingInvitation} from "@/src/server/child-sharing";
export async function POST(request:Request){
 if(mode()!=="hosted")return new Response(null,{status:404});
 const reply=(code:string,status:number,token?:string|null,clear=false)=>{
  const response=NextResponse.json({code},{status,headers:{"Cache-Control":"no-store"}});
  if(token)response.cookies.set(invitationCookie,token,invitationCookieOptions());
  if(clear)response.cookies.set(invitationCookie,"",{...invitationCookieOptions(),maxAge:0});
  return response;
 };
 if(!mutationAllowed(request,"hosted"))return reply("invalid_request",403);
 let token:string|null=null;
 try{
  const body=await request.json();
  token=body&&typeof body==="object"&&"token" in body?invitationToken(body.token):await pendingInvitation();
  if(!token)return reply("invalid",400,null,true);
  const auth=await authClient();const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return reply("login",401,token);
  if(!approvedGoogleUser(user))return reply("wrong_account",403,token);
  const {data,error}=await database().rpc("accept_child_access_invitation",{p_token_hash:invitationHash(token),p_auth_user_id:user.id,p_email:user.email!.toLowerCase()});
  if(error?.code==="22023")return reply("invalid",410,null,true);
  if(error?.code==="42501")return reply("wrong_account",403,token);
  if(error)throw error;
  if(!data?.[0]?.child_id)throw new Error("Missing child");
  const response=reply("accepted",200,null,true);
  response.cookies.set(childCookie,data[0].child_id,{...invitationCookieOptions(),maxAge:60*60*24*365});
  return response;
 }catch{return reply("unavailable",503,token);}
}

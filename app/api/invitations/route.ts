import {NextResponse} from "next/server";
import {mode,appOrigin} from "@/src/server";
import {database} from "@/src/server/supabase";
import {invitationEmail} from "@/src/server/invitations";
export async function POST(request:Request){
 if(mode()!=="hosted")return new Response("Not available",{status:404});
 const form=await request.formData();const email=invitationEmail(form.get("email"));
 if(!email)return NextResponse.redirect(`${appOrigin()}/welcome?request=invalid#invitation`,303);
 try{
  const {data,error}=await database().rpc("request_invitation",{p_email:email});
  if(error||!data)return NextResponse.redirect(`${appOrigin()}/welcome?request=unavailable#invitation`,303);
 }catch{
  return NextResponse.redirect(`${appOrigin()}/welcome?request=unavailable#invitation`,303);
 }
 return NextResponse.redirect(`${appOrigin()}/welcome?request=received#invitation`,303);
}

import {NextResponse} from "next/server";
import {mode,parentContext,appOrigin,childCookie,failure} from "@/src/server";
import {KidsError} from "@/src/core";
export async function POST(request:Request){try{
 if(mode()!=="hosted")throw new KidsError("Профилите са достъпни в онлайн режима.",404);
 const parent=await parentContext();const body=await request.formData();let childId:string;
 if(body.get("action")==="create"){
  const nickname=String(body.get("nickname")??"").trim();if(!nickname||nickname.length>40)throw new KidsError("Избери прякор до 40 знака.");
  const {data,error}=await parent.db.from("child_profiles").insert({parent_id:parent.parentId,nickname}).select("id").single();
  if(error?.code==="P0001"&&error.message.includes("active_child_limit"))return NextResponse.redirect(`${appOrigin()}/profiles?full=1`,303);
  if(error)throw error;childId=data.id;
 }else if(body.get("action")==="select"){
  const child=parent.children.find(child=>child.id===body.get("childId"));if(!child)throw new KidsError("Профилът не е намерен.",404);childId=child.id;
 }else throw new KidsError("Непознато действие.");
 const response=NextResponse.redirect(`${appOrigin()}/`,303);response.cookies.set(childCookie,childId,{httpOnly:true,secure:appOrigin().startsWith("https:"),sameSite:"lax",path:"/",maxAge:60*60*24*365});return response;
}catch(error){return failure(error);}}

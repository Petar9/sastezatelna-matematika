import {learnerContext,kidsCourseResponse,failure} from "@/src/server";
import {competitionCookie} from "@/src/server/competition-resume";
export const runtime="nodejs";
async function handle(request:Request){try{
 const context=await learnerContext({childId:request.headers.get("X-Maths-Child")??undefined,competitionId:request.headers.get("X-Maths-Competition")??undefined,api:true});
 return await kidsCourseResponse(request,context.courseStore,context.content,competitionCookie(context.childId,context.competitionId,new URL(request.url).protocol==="https:"));
}catch(error){return failure(error);}}
export {handle as GET,handle as POST};

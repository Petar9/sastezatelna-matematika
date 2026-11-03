import {learnerContext,kidsCourseResponse,failure} from "@/src/server";
export const runtime="nodejs";
async function handle(request:Request){try{
 const context=await learnerContext({childId:request.headers.get("X-Maths-Child")??undefined,competitionId:request.headers.get("X-Maths-Competition")??undefined,api:true});
 return await kidsCourseResponse(request,context.courseStore,context.content);
}catch(error){return failure(error);}}
export {handle as GET,handle as POST};

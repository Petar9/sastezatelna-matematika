import {learnerContext,kidsSessionResponse,failure} from "@/src/server";
import {KidsError} from "@/src/core";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
async function handle(request:Request,context:Context){try{const store=(await learnerContext({childId:request.headers.get("X-Maths-Child")??undefined,api:true})).legacyStore;if(!store)throw new KidsError("Заниманието е в локалния архив.",404);return kidsSessionResponse(request,(await context.params).id,store);}catch(error){return failure(error);}}
export {handle as GET,handle as POST};

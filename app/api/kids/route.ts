import {learnerContext,kidsCollectionResponse,failure} from "@/src/server";
import {KidsError} from "@/src/core";
export const runtime="nodejs";
async function handle(request:Request){try{const store=(await learnerContext({childId:request.headers.get("X-Maths-Child")??undefined,api:true})).legacyStore;if(!store)throw new KidsError("Кратките занимания са в локалния архив.",404);return kidsCollectionResponse(request,store);}catch(error){return failure(error);}}
export {handle as GET,handle as POST};

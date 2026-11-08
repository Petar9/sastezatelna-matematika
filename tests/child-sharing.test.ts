import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {beforeEach,test} from "node:test";
import {state,reset} from "./helpers/sharing-server.ts";
const fixture=new URL("./helpers/sharing-server.ts",import.meta.url).href;
const contextModule=new URL("../src/server/context.ts",import.meta.url).href;
const supabase=new URL("../src/server/supabase.ts",import.meta.url).href;
registerHooks({resolve(specifier,context,next){if(specifier==="next/headers")return {url:fixture,shortCircuit:true};return next(specifier,context);},load(url,context,next){if(url===contextModule)return {format:"module",source:`export {parentContext,approvedGoogleUser,childCookie} from ${JSON.stringify(fixture)};`,shortCircuit:true};if(url===supabase)return {format:"module",source:`export {authClient,database} from ${JSON.stringify(fixture)};`,shortCircuit:true};return next(url,context);}});
process.env.MATHS_MODE="hosted";process.env.MATHS_APP_URL="https://maths.example";
const {GET:list,POST:manage}=await import("../app/api/sharing/route.ts");
const acceptance=await import("../app/api/sharing/accept/route.ts");
const {newInvitationToken,invitationHash,invitationToken}=await import("../src/server/child-sharing.ts");
const request=(body:unknown,origin="https://maths.example")=>new Request("https://maths.example/api/sharing",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{reset();process.env.MATHS_MODE="hosted";});
test("invitation tokens have cryptographic entropy, fixed validation and hash-only storage",()=>{
 const tokens=Array.from({length:64},newInvitationToken);assert.equal(new Set(tokens).size,64);
 for(const token of tokens){assert.equal(token.length,43);assert.equal(invitationToken(token),token);assert.match(invitationHash(token),/^[0-9a-f]{64}$/);assert.notEqual(invitationHash(token),token);}
 for(const value of [null,42,{},"a".repeat(42),"a".repeat(44),"/".repeat(43)])assert.equal(invitationToken(value),null);
});
test("owner adds normalized email directly and receives a canonical plain-login message",async()=>{
 const response=await manage(request({action:"add",childId:"child-a",email:"  FAMILY@Example.COM  ",parentId:"attacker"}));
 assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
 assert.deepEqual(await response.json(),{message:"Здравей направих ти профил в Състезателна математика за Ема. Можеш да влезеш с гугъл профила ти оттук https://maths.example/login."});
 assert.deepEqual(state.rpcCalls,[{name:"add_child_email_access",args:{p_parent_id:"owner-user",p_child_id:"child-a",p_email:"family@example.com"}}]);
});
test("nonowners, foreign children and foreign origins cannot manage or list access",async()=>{
 state.owner=false;
 assert.equal((await manage(request({action:"add",childId:"child-a",email:"family@example.com"}))).status,403);
 assert.equal((await list(new Request("https://maths.example/api/sharing?childId=child-a"))).status,403);
 reset();assert.equal((await manage(request({action:"add",childId:"sibling",email:"family@example.com"}))).status,403);
 assert.equal((await manage(request({action:"add",childId:"child-a",email:"family@example.com"},"https://evil.example"))).status,403);
 assert.equal(state.rpcCalls.length,0);
});
test("listing merges legacy and direct email grants without exposing identity IDs or tokens",async()=>{
 state.rows={child_email_access:[{email:"new@example.com"}],child_adult_memberships:[{email:"adult@example.com"}],child_profile_logins:[{email:"child@example.com"},{email:"new@example.com"}]};
 const response=await list(new Request("https://maths.example/api/sharing?childId=child-a"));assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{invitations:[],emails:["new@example.com","adult@example.com","child@example.com"]});
 assert.equal(state.queries.length,4);
 for(const query of state.queries){assert.ok(!query.columns.includes("token"));assert.ok(!query.columns.includes("auth_user_id"));assert.deepEqual(query.filters.slice(0,2),[["child_id","child-a"],["parent_id","owner-user"]]);}
 state.tableError=true;assert.equal((await list(new Request("https://maths.example/api/sharing?childId=child-a"))).status,503);
});
test("invalid targets and storage failures remain recoverable; removal and legacy cancellation stay scoped",async()=>{
 for(const body of [{action:"add",childId:"child-a",email:"bad"},{action:"remove",childId:"child-a",email:"bad"},{action:"cancel",childId:"child-a",invitationId:"bad"},{action:"create",childId:"child-a",email:"family@example.com"}])assert.equal((await manage(request(body))).status,400);
 assert.equal(state.rpcCalls.length,0);
 for(const [code,status] of [["23505",409],["P0001",429],["XX000",503]] as const){state.rpcError={code,message:"secret database"};const response=await manage(request({action:"add",childId:"child-a",email:"family@example.com"}));assert.equal(response.status,status);assert.ok(!(await response.text()).includes("secret"));}
 state.rpcError=null;
 assert.equal((await manage(request({action:"remove",childId:"child-a",email:"family@example.com"}))).status,200);
 assert.deepEqual(state.rpcCalls.at(-1),{name:"remove_child_email_access",args:{p_parent_id:"owner-user",p_child_id:"child-a",p_email:"family@example.com"}});
 const target="10000000-0000-0000-0000-000000000003";
 assert.equal((await manage(request({action:"cancel",childId:"child-a",invitationId:target}))).status,200);
 assert.deepEqual(state.rpcCalls.at(-1),{name:"remove_child_access",args:{p_parent_id:"owner-user",p_child_id:"child-a",p_invitation_id:target,p_auth_user_id:null}});
});
test("acceptance requires POST, same-origin and verified Google identity; login retains HttpOnly token",async()=>{
 assert.equal("GET" in acceptance,false);
 const token=newInvitationToken();state.user=null;
 const response=await acceptance.POST(request({token}));assert.equal(response.status,401);assert.deepEqual(await response.json(),{code:"login"});
 const cookie=response.headers.get("set-cookie")!;for(const text of [token,"HttpOnly","Secure","SameSite=lax"])assert.ok(cookie.includes(text));
 assert.equal((await acceptance.POST(request({token},"https://evil.example"))).status,403);
 state.user={id:"user",email:"adult@example.com",app_metadata:{provider:"google"}};
 assert.equal((await acceptance.POST(request({token}))).status,403);assert.equal(state.rpcCalls.length,0);
});
test("acceptance uses auth identity and hash, selects the original child and clears pending token",async()=>{
 state.pending=newInvitationToken();state.rpcData=[{child_id:"stable-child"}];
 const response=await acceptance.POST(request({p_auth_user_id:"attacker",email:"evil@example.com"}));assert.equal(response.status,200);
 assert.deepEqual(state.rpcCalls,[{name:"accept_child_access_invitation",args:{p_token_hash:invitationHash(state.pending),p_auth_user_id:"adult-user",p_email:"adult@example.com"}}]);
 const cookie=response.headers.get("set-cookie")!;assert.ok(cookie.includes("maths_child=stable-child"));assert.ok(cookie.includes("Max-Age=0"));assert.equal(response.headers.get("cache-control"),"no-store");
});
test("wrong account and transient errors retain invitation, while invalid links clear it",async()=>{
 const token=newInvitationToken();
 for(const [code,status,result,retains] of [["42501",403,"wrong_account",true],["XX000",503,"unavailable",true],["22023",410,"invalid",false]] as const){state.rpcError={code,message:"secret"};const response=await acceptance.POST(request({token}));assert.equal(response.status,status);assert.deepEqual(await response.json(),{code:result});assert.equal(response.headers.get("set-cookie")!.includes(token),retains);}
 assert.equal((await acceptance.POST(request({token:"bad"}))).status,400);
});
test("all sharing endpoints are disabled in local data mode",async()=>{
 process.env.MATHS_MODE="local";
 assert.equal((await list(new Request("https://maths.example/api/sharing?childId=child-a"))).status,404);
 assert.equal((await manage(request({}))).status,404);assert.equal((await acceptance.POST(request({}))).status,404);
});

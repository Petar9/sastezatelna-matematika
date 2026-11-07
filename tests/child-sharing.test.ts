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
test("owner creates a normalized email-bound link with only a hashed token reaching the database",async()=>{
 state.rpcData=[{id:"invite-id",expires_at:"2026-11-14"}];
 const response=await manage(request({action:"create",childId:"child-a",email:"  ADULT@Example.COM  ",parentId:"attacker"}));
 assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
 const body=await response.json();const link=new URL(body.link);assert.equal(link.pathname,"/invite");assert.equal(link.search,"");
 const token=new URLSearchParams(link.hash.slice(1)).get("token")!;
 assert.deepEqual(state.rpcCalls,[{name:"create_child_access_invitation",args:{p_parent_id:"owner-user",p_child_id:"child-a",p_email:"adult@example.com",p_token_hash:invitationHash(token)}}]);
 assert.ok(!JSON.stringify(state.rpcCalls).includes(token));
});
test("shared adults, children, foreign IDs and foreign-origin requests cannot manage access",async()=>{
 for(const mutation of [{owner:false},{role:"child"}]){Object.assign(state,mutation);assert.equal((await manage(request({action:"create",childId:"child-a",email:"adult@example.com"}))).status,403);assert.equal((await list(new Request("https://maths.example/api/sharing?childId=child-a"))).status,403);reset();}
 assert.equal((await manage(request({action:"create",childId:"sibling",email:"adult@example.com"}))).status,403);
 assert.equal((await manage(request({action:"create",childId:"child-a",email:"adult@example.com"},"https://evil.example"))).status,403);
 assert.equal(state.rpcCalls.length,0);
});
test("access listing excludes token hashes and scopes both tables to the owner and child",async()=>{
 const response=await list(new Request("https://maths.example/api/sharing?childId=child-a"));assert.equal(response.status,200);
 assert.equal(state.queries.length,2);
 for(const query of state.queries){assert.ok(!query.columns.includes("token"));assert.deepEqual(query.filters.slice(0,2),[["child_id","child-a"],["parent_id","owner-user"]]);}
});
test("management validates targets and keeps rate-limit and conflict failures recoverable",async()=>{
 for(const body of [{action:"create",childId:"child-a",email:"bad"},{action:"revoke",childId:"child-a",authUserId:"bad"},{action:"other",childId:"child-a"}])assert.equal((await manage(request(body))).status,400);
 assert.equal(state.rpcCalls.length,0);
 for(const [code,status] of [["23505",409],["P0001",429],["XX000",503]] as const){state.rpcError={code,message:"secret database"};const response=await manage(request({action:"create",childId:"child-a",email:"adult@example.com"}));assert.equal(response.status,status);assert.ok(!(await response.text()).includes("secret"));}
 state.rpcError=null;
 for(const action of ["revoke","cancel"]){const target="10000000-0000-0000-0000-000000000003";assert.equal((await manage(request({action,childId:"child-a",authUserId:target,invitationId:target}))).status,200);assert.deepEqual(state.rpcCalls.at(-1)?.args,{p_parent_id:"owner-user",p_child_id:"child-a",p_invitation_id:action==="cancel"?target:null,p_auth_user_id:action==="revoke"?target:null});}
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

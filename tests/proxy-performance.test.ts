import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {test} from "node:test";
import {NextRequest} from "next/server.js";

let claimsCalls=0;
const authFixture="data:text/javascript,"+encodeURIComponent(`export function createServerClient(url,key,options){return globalThis.__proxyAuthClient(options);}`);
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==="@supabase/ssr")return{url:authFixture,shortCircuit:true};
 if(specifier==="next/server")return nextResolve("next/server.js",context);
 return nextResolve(specifier,context);
}});
Object.assign(globalThis,{__proxyAuthClient:(options:{cookies:{getAll:()=>unknown;setAll:(values:{name:string;value:string;options:{path:string}}[])=>void}})=>({auth:{
 getUser:()=>{throw new Error("Proxy must not duplicate the route authorization request");},
 getClaims:async()=>{claimsCalls++;assert.ok(Array.isArray(options.cookies.getAll()));options.cookies.setAll([{name:"session-test",value:"refreshed",options:{path:"/"}}]);return{data:{claims:{sub:"fixture"}},error:null};}
}})});
const {proxy}=await import("../proxy.ts");

test("proxy refreshes verified claims and forwards refreshed cookies without duplicating route authorization",async()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.MATHS_APP_URL="https://maths.example";process.env.SUPABASE_URL="https://example.supabase.co";process.env.SUPABASE_PUBLISHABLE_KEY="fixture";delete process.env.VERCEL_ENV;
  const request=new NextRequest("https://maths.example/api/kids/course");
  const before=claimsCalls,response=await proxy(request);
  assert.equal(claimsCalls,before+1);assert.equal(response.headers.get("Cache-Control"),"no-store");
  assert.equal(request.cookies.get("session-test")?.value,"refreshed");
  assert.equal(response.cookies.get("session-test")?.value,"refreshed");
  assert.ok(response.headers.get("x-middleware-request-cookie")?.includes("session-test=refreshed"));
 }finally{process.env=original;}
});

test("proxy rejects cross-origin writes and keeps previews disconnected from hosted authentication",async()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.MATHS_APP_URL="https://maths.example";
  const before=claimsCalls;
  assert.equal((await proxy(new NextRequest("https://maths.example/api/kids/course",{method:"POST",headers:{origin:"https://other.example"}}))).status,403);
  process.env.VERCEL_ENV="preview";
  const response=await proxy(new NextRequest("https://maths.example/"));
  assert.equal(response.status,200);assert.equal(response.headers.get("Cache-Control"),"no-store");assert.equal(claimsCalls,before);
 }finally{process.env=original;}
});

test("public articles bypass Supabase for GET/HEAD even with cookies, but mutations retain origin checks",async()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.VERCEL_ENV="production";process.env.MATHS_APP_URL="https://maths.example";
  const before=claimsCalls;
  for(const path of ["/about","/materiali","/materiali/priem-sled-4-klas-smg-npmg","/robots.txt","/sitemap.xml"]){
   for(const method of ["GET","HEAD"]){const response=await proxy(new NextRequest("https://maths.example"+path,{method,headers:{cookie:"sb-fixture-auth-token=private"}}));assert.equal(response.status,200);assert.equal(response.headers.get("set-cookie"),null);assert.equal(response.headers.get("cache-control"),null);}
   assert.equal((await proxy(new NextRequest("https://maths.example"+path,{method:"POST",headers:{origin:"https://other.example"}}))).status,403);
  }
  assert.equal(claimsCalls,before);
  process.env.VERCEL_ENV="preview";
  assert.equal((await proxy(new NextRequest("https://maths.example/materiali"))).headers.get("x-robots-tag"),"noindex, nofollow");
 }finally{process.env=original;}
});

import React from "react";
import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {test} from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import {parseHTML} from "linkedom";
import {state,reset} from "./helpers/invitations-server.ts";

const fixture=new URL("./helpers/invitations-server.ts",import.meta.url).href;
const server=new URL("../src/server/index.ts",import.meta.url).href;
const supabase=new URL("../src/server/supabase.ts",import.meta.url).href;
registerHooks({load(url,context,nextLoad){
 if(url.endsWith(".module.css"))return{format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};
 if(url===server)return{format:"module",source:`export {mode,appOrigin} from ${JSON.stringify(fixture)};`,shortCircuit:true};
 if(url===supabase)return{format:"module",source:`export {database} from ${JSON.stringify(fixture)};`,shortCircuit:true};
 return nextLoad(url,context);
}});
Object.assign(globalThis,{React});
const {POST}=await import("../app/api/invitations/route.ts");
const {Landing}=await import("../components/landing.tsx");
const request=(email?:string)=>new Request("https://maths.example/api/invitations",{method:"POST",body:new URLSearchParams(email===undefined?{}:{email})});
const result=(response:Response,state:string)=>{assert.equal(response.status,303);assert.equal(response.headers.get("location"),`https://maths.example/welcome?request=${state}#invitation`);};
const documentFor=(state?:string)=>parseHTML(`<html><body>${renderToStaticMarkup(<Landing request={state}/>)}</body></html>`).document;

test("invitation accepts a normalized email without a consent field and keeps duplicate submissions successful",async()=>{
 reset();
 result(await POST(request(" Parent@Example.com ")),"received");
 result(await POST(request("parent@example.com")),"received");
 assert.deepEqual(state.calls,[{name:"request_invitation",args:{p_email:"parent@example.com"}},{name:"request_invitation",args:{p_email:"parent@example.com"}}]);
});

test("invalid or missing invitation email never reaches the database",async()=>{
 reset();
 for(const email of [undefined,"invalid","x".repeat(250)+"@example.com"]){result(await POST(request(email)),"invalid");}
 assert.deepEqual(state.calls,[]);
});

test("invitation rejection, RPC error and network failure return a recoverable unavailable state",async()=>{
 reset();state.result={data:false,error:null};result(await POST(request("parent@example.com")),"unavailable");
 reset();state.result={data:true,error:{message:"database detail"}};result(await POST(request("parent@example.com")),"unavailable");
 reset();state.throws=true;result(await POST(request("parent@example.com")),"unavailable");
});

test("local mode does not accept invitation requests",async()=>{
 reset();state.mode="local";
 assert.equal((await POST(request("parent@example.com"))).status,404);
 assert.deepEqual(state.calls,[]);
});

test("landing has one parent email form before decorative artwork with connected instructions",()=>{
 const doc=documentFor();
 assert.equal(doc.querySelectorAll("form").length,1);
 const form=doc.querySelector("form")!;
 assert.equal(form.getAttribute("action"),"/api/invitations");
 assert.equal(form.getAttribute("method"),"post");
 const input=form.querySelector("input")!;
 assert.equal(form.querySelectorAll("input").length,1);
 assert.equal(input.getAttribute("name"),"email");
 assert.equal(input.getAttribute("type"),"email");
 assert.ok(input.hasAttribute("required"));
 assert.equal(form.querySelector("label")?.getAttribute("for"),input.id);
 assert.equal(doc.querySelector(`#${input.getAttribute("aria-describedby")}`)?.textContent,"Ще използваме имейла само за поканата.");
 assert.equal(form.querySelector("button")?.textContent,"Заяви покана");
 assert.equal(doc.querySelector('input[name="consent"]'),null);
 const html=doc.body.innerHTML;
 assert.ok(html.indexOf("<form")<html.indexOf('aria-hidden="true"'));
 assert.equal(doc.querySelectorAll('a[href="#invitation"]').length,0);
 assert.ok(html.indexOf('aria-hidden="true"')<html.indexOf("Наличният комплект"));
});

test("landing keeps accessible success and error feedback without asking for consent",()=>{
 const success=documentFor("received");
 assert.equal(success.querySelector("form"),null);
 assert.equal(success.querySelector('[role="status"]')?.textContent,"Благодарим! Получихме заявката за покана.");
 for(const state of ["invalid","unavailable"]){
  const doc=documentFor(state);
  const alert=doc.querySelector('[role="alert"]')!;
  assert.ok(alert.textContent);
  assert.ok(!alert.textContent!.includes("съгласи"));
  assert.ok(doc.querySelector("input")?.getAttribute("aria-describedby")?.includes(alert.id));
 }
 assert.equal(documentFor("invalid").querySelector("input")?.getAttribute("aria-invalid"),"true");
});

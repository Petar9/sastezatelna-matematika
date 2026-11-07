import React,{act} from "react";
import assert from "node:assert/strict";
import {test} from "node:test";
import {registerHooks} from "node:module";
import {parseHTML} from "linkedom";
import {renderToStaticMarkup} from "react-dom/server";
registerHooks({resolve(specifier,context,next){if(specifier==="next/link")return {url:new URL("./__sharing_link__.mjs",import.meta.url).href,shortCircuit:true};return next(specifier,context);},load(url,context,next){if(url.endsWith("/__sharing_link__.mjs"))return {format:"module",source:'import React from "react";export default function Link({href,children,...props}){return React.createElement("a",{...props,href},children);}',shortCircuit:true};if(url.endsWith(".module.css"))return {format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};return next(url,context);}});
const dom=parseHTML("<html><body></body></html>");
Object.assign(globalThis,{React,window:dom.window,self:dom.window,document:dom.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import("react-dom/client");
const {ChildSharing}=await import("../components/child-sharing.tsx");
const {ChildInvitation}=await import("../components/child-invitation.tsx");
const {OnboardingFrame}=await import("../components/onboarding.tsx");
const button=(host:HTMLElement,text:string)=>[...host.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent===text)!;
async function proof(name:string,host:HTMLElement){
 if(!process.env.MATHS_UI_PROOF_DIR)return;
 const fs=await import("node:fs/promises"),path=await import("node:path");
 const css=await Promise.all(["app/globals.css","components/ui/ui.module.css","components/onboarding.module.css"].map(file=>fs.readFile(new URL(`../${file}`,import.meta.url),"utf8")));
 const markup=host.querySelector("details")?.open?host.innerHTML.replace("<details ","<details open "):host.innerHTML;
 const content=renderToStaticMarkup(<OnboardingFrame><div dangerouslySetInnerHTML={{__html:markup}}/></OnboardingFrame>);
 await fs.mkdir(process.env.MATHS_UI_PROOF_DIR,{recursive:true});
 await fs.writeFile(path.join(process.env.MATHS_UI_PROOF_DIR,`${name}.html`),`<!doctype html><html lang="bg"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{--font-sans3:Arial,sans-serif}${css.join("\n")}</style>${content}</html>`);
}
test("sharing loads on demand, blocks duplicate creation, copies links and scopes cancel/revoke",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const oldFetch=globalThis.fetch,oldFormData=globalThis.FormData;
 const calls:{url:string;body?:Record<string,string>}[]=[];let finish!:(response:Response)=>void;let copied="";
 const longEmail="grandparent.with.a.long.email.address@example.com";
 let access={invitations:[{id:"invite-a",email:longEmail,expires_at:"2026-11-14"}],adults:[{auth_user_id:"adult-a",email:longEmail}]};
 globalThis.FormData=class extends oldFormData{constructor(form?:HTMLFormElement){super();if(form)for(const input of form.querySelectorAll<HTMLInputElement>("input[name]"))this.append(input.name,input.value);}};
 Object.defineProperty(navigator,"clipboard",{configurable:true,value:{async writeText(value:string){copied=value;}}});
 globalThis.fetch=async(url,init)=>{const body=init?.body?JSON.parse(String(init.body)):undefined;calls.push({url:String(url),body});if(body?.action==="create")return new Promise<Response>(resolve=>{finish=resolve;});if(body){access=body.action==="cancel"?{...access,invitations:[]}:{...access,adults:[]};return Response.json({ok:true});}return Response.json(access);};
 try{
  await act(async()=>root.render(<ChildSharing childId="child-a"/>));assert.equal(calls.length,0);
  const details=host.querySelector("details")!;
  await act(async()=>{details.open=true;details.dispatchEvent(new dom.window.Event("toggle"));});assert.equal(calls.length,1);
  const form=host.querySelector("form")!;host.querySelector<HTMLInputElement>('input[name="email"]')!.value="adult@example.com";
  const submit=()=>form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
  await act(async()=>{submit();submit();});assert.equal(calls.length,2);assert.equal(button(host,"Създай линк").disabled,true);
  await act(async()=>finish(Response.json({link:"https://maths.example/invite#token=synthetic-proof-token"})));
  assert.deepEqual(calls[1]!.body,{action:"create",email:"adult@example.com",childId:"child-a"});
  await act(async()=>button(host,"Копирай линка").click());assert.equal(copied,"https://maths.example/invite#token=synthetic-proof-token");assert.ok(button(host,"Копиран"));
  await proof("sharing",host);
  await act(async()=>button(host,"Отмени").click());assert.deepEqual(calls.at(-2)?.body,{action:"cancel",invitationId:"invite-a",childId:"child-a"});assert.equal(host.textContent?.includes("Чакащи покани"),false);
  await act(async()=>button(host,"Премахни достъпа").click());assert.deepEqual(calls.at(-2)?.body,{action:"revoke",authUserId:"adult-a",childId:"child-a"});assert.equal(host.textContent?.includes("Възрастни с достъп"),false);
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=oldFetch;globalThis.FormData=oldFormData;}
});
test("sharing loading failure leaves retry available and recovers",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),oldFetch=globalThis.fetch;let fail=true;
 globalThis.fetch=async()=>{if(fail)throw new Error("offline");return Response.json({invitations:[],adults:[]});};
 try{
  await act(async()=>root.render(<ChildSharing childId="child-a"/>));
  await act(async()=>{const details=host.querySelector("details")!;details.open=true;details.dispatchEvent(new dom.window.Event("toggle"));});
  assert.ok(host.querySelector('[role="alert"]'));assert.ok(button(host,"Опитай отново"));
  fail=false;await act(async()=>button(host,"Опитай отново").click());assert.equal(host.querySelector('[role="alert"]'),null);assert.equal(button(host,"Създай линк").disabled,false);
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=oldFetch;}
});
test("invitation strips URL token, retries the same token after failure and redirects after acceptance",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),oldFetch=globalThis.fetch;
 const token="a".repeat(43),bodies:unknown[]=[];let replaced="",stripped="";
 Object.defineProperty(dom.window,"location",{configurable:true,writable:true,value:{hash:`#token=${token}`,pathname:"/invite",replace(value:string){replaced=value;}}});
 Object.defineProperty(dom.window,"history",{configurable:true,value:{replaceState(_state:unknown,_unused:string,url:string){stripped=url;dom.window.location.hash="";}}});
 globalThis.fetch=async(_url,init)=>{bodies.push(JSON.parse(String(init?.body)));if(bodies.length===1)throw new Error("offline");return Response.json({code:"accepted"});};
 try{
  await act(async()=>root.render(<ChildInvitation/>));assert.equal(stripped,"/invite");assert.ok(button(host,"Опитай отново"));
  await proof("invitation-retry",host);
  await act(async()=>button(host,"Опитай отново").click());assert.deepEqual(bodies,[{token},{token}]);assert.equal(replaced,"/");
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=oldFetch;}
});
test("wrong-account invitation offers Google account switching without losing the route",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),oldFetch=globalThis.fetch;
 Object.defineProperty(dom.window,"location",{configurable:true,writable:true,value:{hash:"",pathname:"/invite"}});globalThis.fetch=async()=>Response.json({code:"wrong_account"},{status:403});
 try{
  await act(async()=>root.render(<ChildInvitation/>));assert.ok(button(host,"Опитай с друг профил"));assert.equal(host.querySelector("form")?.getAttribute("action"),"/auth/login");assert.equal(host.querySelector('input[name="invitation"]')?.getAttribute("value"),"1");
  await proof("invitation-account",host);
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=oldFetch;}
});

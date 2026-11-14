import React, {act} from "react";
import assert from "node:assert/strict";
import {test} from "node:test";
import {registerHooks} from "node:module";
import {parseHTML} from "linkedom";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime.js";
registerHooks({load(url,context,nextLoad){
 if(url.endsWith(".module.css"))return {format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};
 if(url.endsWith("/next/link.js"))return {format:"module",source:'import React from "react"; export default function Link(props){return React.createElement("a",props);}',shortCircuit:true};
 return nextLoad(url,context);
}});
const dom=parseHTML("<html><body></body></html>");
Object.assign(globalThis,{React,window:dom.window,self:dom.window,document:dom.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
document.oninput=null;
const {createRoot}=await import("react-dom/client");
const {AppMenu}=await import("../components/app-menu.tsx");
const {ProfileCard}=await import("../components/profile-card.tsx");
async function mount(view:React.ReactNode){
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 await act(async()=>root.render(<AppRouterContext.Provider value={{refresh(){}} as never}>{view}</AppRouterContext.Provider>));
 return {host,cleanup:async()=>{await act(async()=>root.unmount());host.remove();}};
}
function button(host:HTMLElement,label:string){const found=[...host.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent===label);assert.ok(found,label);return found;}

test("icon-only navigation preserves ordinary links, current page and dismissal",async()=>{
 const h=await mount(<AppMenu childId="child-a" current="profiles"/>);try{
  const trigger=h.host.querySelector<HTMLButtonElement>('[aria-label="Меню"]')!, nav=h.host.querySelector("nav")!;
  assert.equal(trigger.textContent,"");assert.equal(trigger.getAttribute("title"),"Меню");assert.equal(nav.hidden,true);
  await act(async()=>trigger.click());assert.equal(trigger.getAttribute("aria-expanded"),"true");assert.equal(nav.hidden,false);
  assert.equal(nav.getAttribute("role"),null);assert.deepEqual([...nav.querySelectorAll("a")].map(link=>link.textContent),["Напредък","Профили","Ценни материали","За сайта"]);
  assert.equal(nav.querySelector('a[aria-current="page"]')?.getAttribute("href"),"/profiles");assert.equal(nav.querySelector("a")?.getAttribute("href"),"/progress?child=child-a");
  await act(async()=>{const event=new dom.window.Event("keydown",{bubbles:true,cancelable:true});Object.assign(event,{key:"Escape"});document.dispatchEvent(event);});assert.equal(nav.hidden,true);
  await act(async()=>trigger.click());await act(async()=>document.body.dispatchEvent(new dom.window.Event("pointerdown",{bubbles:true})));assert.equal(nav.hidden,true);
  await act(async()=>trigger.click());await act(async()=>{const event=new dom.window.Event("focusout",{bubbles:true});Object.assign(event,{relatedTarget:document.body});trigger.dispatchEvent(event);});assert.equal(nav.hidden,true);
 }finally{await h.cleanup();}
});

test("logout waits for draft persistence, blocks duplicates and stays on failed saves",async()=>{
 for(const outcome of [true,false,"reject"] as const){
  let saves=0,submits=0,resolve!:(value:boolean)=>void,reject!:(reason:Error)=>void;
  const h=await mount(<AppMenu beforeLogout={()=>{saves++;return new Promise<boolean>((done,fail)=>{resolve=done;reject=fail;});}}/>);try{
   await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Меню"]')!.click());
   const form=h.host.querySelector("form")!;form.submit=()=>{submits++;};
   const submit=()=>form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
   await act(async()=>{submit();submit();});assert.equal(saves,1);assert.equal(submits,0);assert.equal(button(h.host,"Изход").disabled,true);
   await act(async()=>{if(outcome==="reject")reject(new Error("offline"));else resolve(outcome);});
   assert.equal(submits,outcome===true?1:0);assert.equal(button(h.host,"Изход").disabled,false);
  }finally{await h.cleanup();}
 }
});

test("profile tools preserve drafts, fetch sharing lazily once and hide ownership controls",async()=>{
 let calls=0;const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>{calls++;assert.equal(url,"/api/sharing?childId=child-a");return Response.json({emails:["family@example.com"],invitations:[]});};
 const h=await mount(<ProfileCard child={{id:"child-a",nickname:"Ема"}}/>);try{
  assert.equal(calls,0);await act(async()=>button(h.host,"Промени името").click());
  const rename=h.host.querySelector<HTMLInputElement>('input[name="nickname"]')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,"value")!.set!.call(rename,"Ново име");rename.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
  await act(async()=>button(h.host,"Сподели достъп").click());assert.equal(calls,1);assert.equal(button(h.host,"Промени името").getAttribute("aria-expanded"),"false");
  const email=h.host.querySelector<HTMLInputElement>('input[name="email"]')!;email.value="draft@example.com";
  assert.ok(h.host.textContent!.includes("family@example.com"));
  await act(async()=>button(h.host,"Промени името").click());assert.equal(rename.value,"Ново име");
  await act(async()=>button(h.host,"Сподели достъп").click());assert.equal(email.value,"draft@example.com");assert.equal(calls,1);
 }finally{await h.cleanup();globalThis.fetch=originalFetch;}
 const shared=await mount(<ProfileCard child={{id:"shared",nickname:"Ема",isOwner:false}}/>);try{
  assert.equal(shared.host.textContent!.includes("Сподели достъп"),false);assert.equal(shared.host.querySelector('input[name="email"]'),null);
  assert.equal(shared.host.querySelector('form')?.getAttribute("action"),"/api/profiles");assert.ok(button(shared.host,"Промени името"));
 }finally{await shared.cleanup();}
});

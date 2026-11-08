import React, { act } from "react";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { state, reset } from "./helpers/feedback-server.ts";
const fixture = new URL("./helpers/feedback-server.ts",import.meta.url).href;
const contextPath = new URL("../src/server/context.ts",import.meta.url).href;
const configPath = new URL("../src/server/config.ts",import.meta.url).href;
registerHooks({ resolve(specifier,context,nextResolve) {
 if(specifier === "next/headers") return {url:"test:progress-headers",shortCircuit:true};
 return nextResolve(specifier,context);
}, load(url,context,nextLoad) {
 if(url.endsWith(".module.css")) return {format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};
 if(url==="test:progress-headers") return {format:"module",source:'export async function cookies(){return {get(){return {value:"child-a"}}}}',shortCircuit:true};
 if(url===contextPath) return {format:"module",source:`export {accountContext} from ${JSON.stringify(fixture)}; export const childCookie="maths_child"; export async function learnerContext(){throw new Error("Hosted test");}`,shortCircuit:true};
 if(url===configPath) return {format:"module",source:`export {mode} from ${JSON.stringify(fixture)};`,shortCircuit:true};
 return nextLoad(url,context);
} });
const dom=parseHTML("<html><body></body></html>");
Object.assign(globalThis,{React,window:dom.window,self:dom.window,document:dom.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import("react-dom/client");
const {default:Progress}=await import("../app/progress/page.tsx");
const {ProgressCalendar, monthDays, shiftMonth}=await import("../components/progress-calendar.tsx");
const {default:Parent}=await import("../app/parent/page.tsx");
const page=(child?:string)=>Progress({searchParams:Promise.resolve({child})});

test("progress parent and child read the same authorized history, with no answers or management links for child",async()=>{
 reset(); state.course={attempts:[],topics:{},goldAwards:[]};
 const parent=renderToStaticMarkup(await page("child-a"));
 assert.ok(parent.includes('href="/materiali"')); assert.ok(parent.includes("Напредък")); assert.ok(parent.includes("Всички състезания")); assert.ok(parent.includes("Подай обратна връзка")); assert.ok(!parent.includes("<footer"));
 assert.deepEqual(state.reads,[[["parent_id","parent-a"],["child_id","child-a"]]]);
 state.role="child"; state.reads=[];
 const child=renderToStaticMarkup(await page("child-a"));
 assert.ok(child.includes("Предстоящи дати")); assert.ok(parent.includes("Предстоящи дати"));
 assert.ok(child.includes('href="/materiali"')); assert.ok(child.includes("Подай обратна връзка")); assert.ok(child.includes("Общо досега")); assert.ok(!child.includes("/parent/task")); assert.ok(!child.includes('href="/profiles"'));
 assert.deepEqual(state.reads,[[["parent_id","parent-a"],["child_id","child-a"]]]); assert.deepEqual(state.writes,[]);
 state.reads=[]; await assert.rejects(page("sibling"),/NEXT_HTTP_ERROR_FALLBACK;404/); assert.deepEqual(state.reads,[]);
 await assert.rejects(page("foreign"),/NEXT_HTTP_ERROR_FALLBACK;404/);
});

test("old parent URL redirects to shared progress preserving explicit child",async()=>{
 await assert.rejects(Parent({searchParams:Promise.resolve({child:"child-a"})}),error=>!!error && typeof error==="object" && "digest" in error && String(error.digest).includes("/progress?child=child-a"));
});

test("calendar has Monday-first month, accessible per-day values and inline day details",()=>{
 assert.deepEqual(monthDays("2026-11"),{offset:6,count:30});
 assert.deepEqual(monthDays("2028-02"),{offset:1,count:29});
 assert.equal(shiftMonth("2026-01",-1),"2025-12");assert.equal(shiftMonth("2026-12",1),"2027-01");
 const collection={competitionId:"one",title:"Пример",summary:{attempts:1,confirmed:0,revisit:0,hasTask:false},undatedGold:5,undatedAttempts:0,events:[{key:"a",day:"2026-11-05",kind:"attempt" as const,label:"Задача",outcome:"hinted" as const,wholeProblem:true}]};
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar collections={[collection]} initialDay="2026-11-05"/>));
 const days=document.querySelectorAll('button[aria-pressed]');assert.equal(days.length,30);
 const selected=document.querySelector('button[aria-pressed="true"]')!;
 assert.ok(selected.getAttribute("aria-label")!.includes("1 с подсказка"));
 assert.ok(document.getElementById(selected.getAttribute("aria-controls")!)?.textContent?.includes("С подсказка"));
 assert.ok(document.toString().includes("Злато без точна дата: 5"));
 assert.equal(document.querySelectorAll("dialog").length,0);
 assert.equal(document.querySelector('dl[aria-label="За месеца"]')?.textContent,"Злато0Самостоятелно0С подсказка1");
 assert.equal(document.querySelector('button[aria-label^="1 ноември"]')?.textContent,"1");
 assert.equal(selected.querySelector(".dayCounts")?.textContent,"1 задача");
 assert.ok(!document.toString().includes("В клетките:"));
});

test("calendar day selection, month navigation and competition filtering update inline without writes",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const summary={attempts:1,confirmed:0,revisit:0,hasTask:false};
 const before=JSON.stringify(state.writes);
 try {
  await act(async()=>root.render(<ProgressCalendar initialDay="2026-11-05" collections={[
   {competitionId:"one",title:"Първо",summary,undatedGold:0,undatedAttempts:0,events:[{key:"a",day:"2026-11-04",kind:"attempt",label:"RAW-ONE",skillId:"one-skill",skillTitle:"Самостоятелна задача",outcome:"independent",wholeProblem:true}]},
   {competitionId:"two",title:"Второ",summary,undatedGold:0,undatedAttempts:0,events:[{key:"b",day:"2026-11-04",kind:"attempt",label:"RAW-TWO",skillId:"two-skill",skillTitle:"Подпомогната задача",outcome:"hinted",wholeProblem:true}]},
  ]}/>));
  assert.ok(host.textContent?.includes("Няма записана активност"));
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label^="4 ноември"]')!.click());
  assert.ok(host.textContent?.includes("Самостоятелна задача"));assert.ok(host.textContent?.includes("Подпомогната задача"));
  const select=host.querySelector<HTMLSelectElement>("select")!;
  Object.defineProperty(select,"value",{value:"two",configurable:true});
  await act(async()=>select.dispatchEvent(new dom.window.Event("change",{bubbles:true})));
  assert.ok(!host.textContent?.includes("Самостоятелна задача"));assert.ok(host.textContent?.includes("Подпомогната задача"));
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Предишен месец"]')!.click());
  assert.ok(host.textContent?.includes("октомври 2026"));assert.ok(host.textContent?.includes("Няма записана активност"));
  assert.equal(host.querySelectorAll('button[aria-pressed]').length,31);
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Следващ месец"]')!.click());
  assert.ok(host.textContent?.includes("ноември 2026"));
  assert.equal(host.querySelector<HTMLButtonElement>('button[aria-label="Следващ месец"]')!.disabled,false);
  assert.equal(JSON.stringify(state.writes),before);
 }finally {await act(async()=>root.unmount());host.remove();}
});

 test("selected day distinguishes hinted wrong answers, revealed solutions and successful whole tasks", () => {
 const summary={attempts:4,confirmed:0,revisit:0,hasTask:false};
 const events=[
  {key:"independent",day:"2026-11-05",kind:"attempt" as const,label:"Самостоятелна",outcome:"independent" as const,wholeProblem:true},
  {key:"hinted",day:"2026-11-05",kind:"attempt" as const,label:"С помощ",outcome:"hinted" as const,wholeProblem:true},
  {key:"wrong",day:"2026-11-05",kind:"attempt" as const,label:"Невярна",outcome:"incorrect" as const,wholeProblem:true},
  {key:"revealed",day:"2026-11-05",kind:"attempt" as const,label:"Разгледана",outcome:"revealed" as const,wholeProblem:true},
 ];
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay="2026-11-05" collections={[{competitionId:"one",title:"Пример",summary,undatedGold:0,undatedAttempts:0,events}]}/>));
 const detail=document.querySelector('dl[aria-label="За деня"]')!;
 assert.deepEqual([...detail.querySelectorAll("div")].map(item=>[item.querySelector("dt")?.textContent,item.querySelector("dd")?.textContent]),[["Злато","0"],["Самостоятелно","1"],["С подсказка","1"],["Грешен отговор","1"],["Разгледано решение","1"]]);
 assert.equal(document.querySelector('[aria-current="date"] .dayCounts')?.textContent,"2 задачи");
 assert.ok(document.querySelector('[aria-current="date"]')?.getAttribute("aria-label")?.includes("1 грешни отговора, 1 разгледани решения"));
 });


test("day details group by competition and skill, count whole successes and omit the raw ledger",()=>{
 const summary={attempts:8,confirmed:0,revisit:1,hasTask:false};
 const base={day:"2026-11-05",kind:"attempt" as const,label:"RAW-SOURCE-CODE",wholeProblem:true,skillId:"shared",skillTitle:"Точки и мачове"};
 const events=[
  {...base,key:"1",outcome:"independent" as const},
  {...base,key:"2",outcome:"independent" as const},
  {...base,key:"3",outcome:"hinted" as const},
  {...base,key:"4",outcome:"incorrect" as const},
  {...base,key:"5",outcome:"revealed" as const},
  {...base,key:"6",outcome:"independent" as const,wholeProblem:false},
  {...base,key:"7",skillId:"failed",skillTitle:"Само упражнявано",outcome:"incorrect" as const},
  {...base,key:"8",skillId:undefined,skillTitle:undefined,outcome:"revealed" as const},
  {key:"gold",day:base.day,kind:"gold" as const,label:"RAW-GOLD-LEDGER",amount:80},
 ];
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay={base.day} collections={[
  {competitionId:"one",title:"Първо",summary,undatedGold:0,undatedAttempts:0,events},
  {competitionId:"two",title:"Второ",summary,undatedGold:0,undatedAttempts:0,events:[{...base,key:"1",outcome:"hinted"}]},
 ]}/>));
 const groups=document.querySelectorAll(".skillGroup"); assert.equal(groups.length,2);
 assert.equal(groups[0]!.querySelector("h3")?.textContent,"Първо");
 assert.deepEqual([...groups[0]!.querySelectorAll("li")].map(row=>row.textContent),["Точки и мачовеСамостоятелно: 2 · С подсказка: 1","Само упражняваноУпражнявано","Други упражненияУпражнявано"]);
 assert.equal(groups[1]!.querySelector("li")?.textContent,"Точки и мачовеС подсказка: 1");
 assert.ok(!document.toString().includes("RAW-"));
 assert.ok(document.toString().includes("Умения за припомняне: 1"));
 assert.equal(document.querySelector('dl[aria-label="За деня"] dd')?.textContent,"80");
});

test("a gold-only day retains its headline without a false no-activity message or skill row",()=>{
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay="2026-11-05" collections={[{competitionId:"one",title:"Пример",summary:{attempts:0,confirmed:0,revisit:0,hasTask:false},undatedGold:0,undatedAttempts:0,events:[{key:"g",day:"2026-11-05",kind:"gold",label:"Запис за награда",amount:10}]}]}/>));
 assert.equal(document.querySelector('dl[aria-label="За деня"] dd')?.textContent,"10");
 assert.equal(document.querySelectorAll(".skillGroup").length,0);
 assert.ok(!document.toString().includes("Няма записана активност"));
});

test("calendar combines 76 independent and 4 hinted successes as 80 tasks",()=>{
 const base={day:"2026-11-07",kind:"attempt" as const,label:"Задача",naturalPart:true};
 const events=Array.from({length:82},(_,index)=>({...base,key:`a-${index}`,outcome:index<76?"independent" as const:index<80?"hinted" as const:index===80?"incorrect" as const:"revealed" as const}));
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay={base.day} collections={[{competitionId:"one",title:"Пример",summary:{attempts:82,confirmed:0,revisit:0,hasTask:false},undatedGold:0,undatedAttempts:0,events}]}/>));
 assert.equal(document.querySelector('[aria-current="date"] .dayCounts')?.textContent,"80 задачи");
 const outcomes=[...document.querySelectorAll('dl[aria-label="За деня"] > div')].map(row=>[row.querySelector("dt")?.textContent,row.querySelector("dd")?.textContent]);
 assert.ok(outcomes.some(([label,value])=>label==="Самостоятелно"&&value==="76"));
 assert.ok(outcomes.some(([label,value])=>label==="С подсказка"&&value==="4"));
});

test("natural subparts count as tasks while whole original completion is shown separately",()=>{
 const summary={attempts:3,confirmed:0,revisit:0,hasTask:false};
 const base={day:"2026-11-05",kind:"attempt" as const,label:"Задача",wholeProblem:false,naturalPart:true,skillId:"one",skillTitle:"Фигури"};
 const events=[{...base,key:"a",outcome:"independent" as const},{...base,key:"b",outcome:"hinted" as const,wholeOriginal:true},{...base,key:"old",naturalPart:undefined,wholeProblem:true,outcome:"independent" as const}];
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay={base.day} collections={[{competitionId:"one",title:"Пример",summary,undatedGold:0,undatedAttempts:0,events}]}/>));
 const values=[...document.querySelectorAll('dl[aria-label="За деня"] > div')].map(row=>[row.querySelector("dt")?.textContent,row.querySelector("dd")?.textContent]);
 assert.ok(values.some(([label,value])=>label==="Подусловия"&&value==="2"));
 assert.ok(values.some(([label,value])=>label==="Цели задачи"&&value==="1"));
 assert.equal(document.querySelector('[aria-current="date"] .dayCounts')?.textContent,"3 задачи");
 assert.ok(document.querySelector(".skillResults")?.textContent?.includes("Самостоятелно: 2 · С подсказка: 1"));
 assert.ok(!document.toString().includes("Подусловията не се броят"));
});

test("five upcoming dates link to preparation below the calendar without changing learning history",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const collections=[{competitionId:"olimpiada-oblasten",title:"Областен кръг",summary:{attempts:0,confirmed:0,revisit:0,hasTask:false},undatedGold:0,undatedAttempts:0,events:[]}];
 const before=JSON.stringify(collections), writes=JSON.stringify(state.writes);
 const next=async()=>act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Следващ месец"]')!.click());
 try{
  await act(async()=>root.render(<ProgressCalendar collections={collections} initialDay="2026-11-06"/>));
  assert.deepEqual([...host.querySelectorAll(".upcoming li a")].map(a=>a.getAttribute("href")),[
   "/?competition=olimpiada","/?competition=olimpiada-oblasten","/?competition=proletno","/?competition=matematika-za-vseki","/?competition=nvo",
  ]);
  assert.equal(host.querySelectorAll(".upcoming button").length,0);
  assert.ok(host.innerHTML.indexOf('class="calendar"') < host.innerHTML.indexOf('class="upcoming"'));
  assert.ok(host.innerHTML.indexOf('class="details"') < host.innerHTML.indexOf('class="upcoming"'));
  assert.ok(!host.textContent?.includes("По графика на НПМГ"));
  await next();
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label^="12 декември"]')!.click());
  assert.ok(host.querySelector('button[aria-pressed="true"]')?.getAttribute("aria-label")?.includes("краен срок за провеждане"));
  assert.ok(host.querySelector('.scheduledEvent a[href="/?competition=olimpiada"]'));
  assert.ok(host.querySelector(".scheduledEvent")?.textContent?.includes("Краен срок за провеждане"));
  await next();await next();
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label^="7 февруари"]')!.click());
  const day=host.querySelector('button[aria-pressed="true"]')!;
  assert.ok(day.getAttribute("aria-label")?.includes("дата: Олимпиада"));
  assert.equal(day.querySelector(".dayGold"),null);assert.equal(day.querySelector(".eventMarker")?.textContent,"◆");
  assert.ok(host.querySelector('.scheduledEvent a[href="/?competition=olimpiada-oblasten"]'));
  assert.equal(host.querySelector('dl[aria-label="За месеца"]')?.textContent,"Злато0Самостоятелно0С подсказка0");
  assert.equal(host.querySelector('dl[aria-label="За деня"]'),null);
  for(let i=0;i<4;i++)await next();
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label^="4 юни"]')!.click());
  assert.ok(host.querySelector('.scheduledEvent a[href="/?competition=nvo"]'));
  assert.equal(host.querySelector<HTMLButtonElement>('button[aria-label="Следващ месец"]')!.disabled,true);
  const select=host.querySelector<HTMLSelectElement>("select")!;
  Object.defineProperty(select,"value",{value:"olimpiada-oblasten",configurable:true});
  await act(async()=>select.dispatchEvent(new dom.window.Event("change",{bubbles:true})));
  assert.equal(host.querySelectorAll(".upcoming li").length,1);
  assert.equal(host.querySelectorAll(".scheduledEvent").length,0);
  assert.equal(host.querySelectorAll(".eventMarker").length,0);
  assert.equal(JSON.stringify(collections),before);assert.equal(JSON.stringify(state.writes),writes);
 }finally{await act(async()=>root.unmount());host.remove();}
});
test("past competition dates stay marked but leave the upcoming list",()=>{
 const {document}=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay="2027-02-08" collections={[]}/>));
 assert.equal(document.querySelectorAll(".upcoming li").length,3);
 assert.ok(document.querySelector('button[aria-label^="7 февруари"] .eventMarker'));
 const later=parseHTML(renderToStaticMarkup(<ProgressCalendar initialDay="2028-01-01" collections={[]}/>)).document;
 assert.equal(later.querySelectorAll(".upcoming").length,0);
 assert.ok(later.querySelector('button[aria-label="Следващ месец"]')?.hasAttribute("disabled"));
});


test("preparation uses the same answer-free projection for parent and child and preserves the single history read",async()=>{
 const {newKidsCourse,courseView}=await import("../src/core/kids-course.ts");
 const {kidsCourseContent}=await import("../src/server/kids-course-content.ts");
 reset();const c=newKidsCourse(kidsCourseContent,"2026-11-08T12:00:00Z");
 for(const topic of Object.values(c.topics))for(const skill of Object.values(topic.skills))skill.confirmedAt="2026-11-08T12:00:00Z";
 state.course=c;
 const expected=courseView(c,kidsCourseContent,"2026-11-08T12:00:00Z").preparation;
 const before=JSON.stringify(c);
 for(const role of ["parent","child"] as const){
  state.role=role;state.reads=[];
  const element=await Progress({searchParams:Promise.resolve({child:"child-a",competition:"matematika-za-vseki"})});
  const markup=renderToStaticMarkup(element),page=parseHTML(markup).document;
  assert.equal(page.querySelectorAll('.panel .toggle').length,1);
  assert.equal(page.querySelector('.rowPercent')?.textContent,`${expected.percent}%`);
  assert.equal(page.querySelector('.breakdown dd')?.textContent,`0/${expected.tasks.total}`);
  assert.ok(page.querySelector('.panel [hidden]'));
  assert.equal(state.reads.length,1);assert.deepEqual(state.writes,[]);
  assert.ok(!markup.includes('"answer":'));assert.equal(JSON.stringify(c),before);
 }
});


test("preparation panel stays after day details, includes every started competition independently of the filter, and expands rows independently",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const preparation=(percent:number)=>({status:"available" as const,percent,tasks:{completed:percent===100?100:7,total:100},coverage:{solved:percent===100?86:5,total:86,fraction:percent===100?1:5/86},confirmation:{completed:percent===100?78:5,total:78},review:{completed:percent===100?78:0,total:78},scope:{version:1,contentVersion:"test"}});
 const collection=(competitionId:string,percent:number)=>({competitionId,title:competitionId,summary:{attempts:1,confirmed:1,revisit:0,hasTask:false},undatedGold:0,undatedAttempts:0,events:[],preparation:preparation(percent)});
 const collections=[{...collection("matematika-za-vseki",5),title:"partial"},collection("complete",100),collection("untouched",0),{...collection("rounded-zero",0),preparation:{...preparation(0),coverage:{solved:1,total:1000,fraction:0.001}}},{...collection("unavailable",0),preparation:{...preparation(0),status:"unavailable" as const}}];
 const before=JSON.stringify(collections),writes=JSON.stringify(state.writes);
 try{
  await act(async()=>root.render(<ProgressCalendar collections={collections} initialCompetition="matematika-za-vseki" initialDay="2026-11-08"/>));
  const panel=host.querySelector('.panel')!;
  assert.ok(panel);
  assert.deepEqual([...panel.querySelectorAll('.rowTitle')].map(row=>row.textContent),["partial","complete"]);
  assert.ok(host.innerHTML.indexOf('class="details"')<host.innerHTML.indexOf('class="panel"'));
  assert.ok(host.innerHTML.indexOf('class="panel"')<host.innerHTML.indexOf('class="upcoming"'));
  const toggles=[...panel.querySelectorAll<HTMLButtonElement>('.toggle')];
  for(const toggle of toggles){assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.ok(document.getElementById(toggle.getAttribute('aria-controls')!)?.hidden);}
  assert.ok(!panel.querySelector('svg[role="img"]'));assert.ok(!panel.textContent?.includes('Решени оригинални'));assert.ok(!panel.textContent?.includes('80%'));assert.ok(!panel.textContent?.includes('10%'));
  await act(async()=>toggles[0]!.click());
  assert.equal(toggles[0]!.getAttribute('aria-expanded'),'true');
  const details=document.getElementById(toggles[0]!.getAttribute('aria-controls')!)!;
  assert.equal(details.hidden,false);
  assert.deepEqual([...details.querySelectorAll('dl > div')].map(row=>[row.querySelector('dt')?.textContent,row.querySelector('dd')?.textContent]),[["Задачи от състезания","7/100"],["Затвърдени умения","5/78"],["Преговор","0/78"]]);
  await act(async()=>toggles[1]!.click());assert.equal(toggles[0]!.getAttribute('aria-expanded'),'true');assert.equal(toggles[1]!.getAttribute('aria-expanded'),'true');
  assert.deepEqual([...document.getElementById(toggles[1]!.getAttribute('aria-controls')!)!.querySelectorAll('dd')].map(row=>row.textContent),["100/100","78/78","78/78"]);
  const select=host.querySelector<HTMLSelectElement>('select')!;Object.defineProperty(select,'value',{value:'untouched',configurable:true});
  await act(async()=>select.dispatchEvent(new dom.window.Event('change',{bubbles:true})));
  assert.equal(panel.querySelectorAll('.toggle').length,2);assert.equal(toggles[0]!.getAttribute('aria-expanded'),'true');
  await act(async()=>toggles[0]!.click());assert.equal(details.hidden,true);assert.equal(toggles[1]!.getAttribute('aria-expanded'),'true');
  assert.equal(JSON.stringify(collections),before);assert.equal(JSON.stringify(state.writes),writes);
  await act(async()=>root.render(<ProgressCalendar collections={[collection('untouched',0),collections[3]!]} initialDay="2026-11-08"/>));
  assert.equal(host.querySelector('.panel'),null);
 }finally{await act(async()=>root.unmount());host.remove();}
});

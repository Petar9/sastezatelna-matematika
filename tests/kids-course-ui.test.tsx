import React, {act} from "react";
import assert from "node:assert/strict";
import {test} from "node:test";
import {registerHooks} from "node:module";
import {parseHTML} from "linkedom";
import {applyCourseAction,courseView,newKidsCourse} from "../src/core/kids-course.ts";
import type {CourseAction, CourseTopicView} from "../src/core/kids-course.ts";
import {kidsCourseContent as content} from "../src/server/kids-course-content.ts";
registerHooks({load(url,context,nextLoad){if(url.endsWith(".module.css"))return{format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};if(url.endsWith("/next/image.js"))return{format:"module",source:'import React from "react"; export default function Image({unoptimized, ...props}) { return React.createElement("img",props); }',shortCircuit:true};return nextLoad(url,context);}});
const dom=parseHTML("<html><body></body></html>");
Object.assign(globalThis,{React,window:dom.window,self:dom.window,document:dom.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
document.oninput=null;
const {createRoot}=await import("react-dom/client");
const {KidsCoursePlayer}=await import("../components/kids-course.tsx");
const {KidsActionBar}=await import("../components/kids-action-bar.tsx");
const {IslandScenery,islandPlaces}=await import("../components/kids-world-map.tsx");
const {LearningMap,adventureAchievement}=await import("../components/kids-quest-map.tsx");
const {Leaf,leafKey,leafPhase,knowledgeGrowthKeys}=await import("../components/kids-map-decorations.tsx");
const {IslandDiscoveryBar,KidsLearningProgress,discoveryProgress}=await import("../components/kids-learning-progress.tsx");
const now="2026-11-02T12:00:00.000Z";
function button(host:HTMLElement,label:string){const b=[...host.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===label);assert.ok(b,`Missing: ${label}`);return b;}
function primary(host:HTMLElement,label:string){const bars=host.querySelectorAll('[aria-label="Следващо действие"]');assert.equal(bars.length,1);assert.equal(bars[0]!.querySelectorAll("button").length,1);assert.equal(bars[0]!.textContent,label);return button(host,label);}
function islandButton(host:HTMLElement,topic:string){const b=host.querySelector<HTMLButtonElement>(`button[aria-label="${topic}"]`);assert.ok(b);return b;}
async function practise(host:HTMLElement,topic:string){await act(async()=>islandButton(host,topic).click());await act(async()=>button(host,"Да упражним").click());}
async function mount(topic:string|null="matches",loseResponse=false,learnerId?:string,competitionId?:string){
 let record=topic ? applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:topic},now) : newKidsCourse(content,now);
 const originalFetch=globalThis.fetch;const actions:CourseAction[]=[];const requestHeaders:Headers[]=[];
 globalThis.fetch=async(_url,init)=>{
  requestHeaders.push(new Headers(init?.headers));
  if(init?.method==="POST"){
   const command=JSON.parse(String(init.body)) as{revision:number;action:CourseAction};
   if(command.revision!==record.revision)return Response.json({error:"Напредъкът е променен в друг прозорец. Показваме последния запис."},{status:409});
   actions.push(command.action);record=applyCourseAction(record,content,command.action,now);
   if(loseResponse&&command.action.type==="answer")throw new Error("Lost response");
  }
  return Response.json({course:courseView(record,content,now)});
 };
 const host=document.createElement("div");document.body.append(host);let root=createRoot(host);
 await act(async()=>root.render(<KidsCoursePlayer learnerId={learnerId} competitionId={competitionId} initialView={courseView(record,content,now)}/>));
 if(topic) await act(async()=>button(host,`Продължи: ${content.topics.find(t=>t.id===topic)!.title}`).click());
 return{host,actions,requestHeaders,get record(){return record;},advance:(action:CourseAction)=>{record=applyCourseAction(record,content,action,now);},reload:async()=>{await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<KidsCoursePlayer learnerId={learnerId} competitionId={competitionId} initialView={courseView(record,content,now)}/>));},cleanup:async()=>{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;}};
}

test("navigation buttons recover a stale tab in one click without losing newer progress",async()=>{
 for(const entry of ["quest","resume","island"] as const){
  const h=await mount(null);try{
   if(entry==="resume"){
    await practise(h.host,"Точки и мачове");
    await act(async()=>button(h.host,"← Начало").click());
   }
   if(entry==="island"){
    await act(async()=>h.host.querySelector<HTMLButtonElement>('button[aria-label="Пари и цени"]')!.click());
   }
   h.advance({type:"selectTopic",topicId:"clocks"});
   const newerTask=courseView(h.record,content,now).task!.key;
   const label=entry==="quest"?"Започни приключение":entry==="resume"?"Продължи: Точки и мачове":"Да упражним";
   await act(async()=>button(h.host,label).click());
   assert.ok(!h.host.querySelector('[aria-label="Карта на ученето"]'),"Navigation should open the exercises");
   assert.ok(h.host.textContent!.includes(entry==="quest"?"Стъпка 1 от 5":entry==="resume"?"Часовник и денонощия":"Пари и цени"));
   assert.ok(!h.host.querySelector('[role="alert"]'),"A recovered navigation should not show an error");
   assert.equal(h.record.topics.clocks!.work.core!.attempt.key,newerTask);
   assert.equal(h.record.attempts.length,0);
  }finally{await h.cleanup();}
 }
});

test("stale answers are reconciled without automatic resubmission",async()=>{
 const h=await mount();try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  h.advance({type:"hint",taskKey:courseView(h.record,content,now).task!.key});
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.equal(h.record.attempts.length,0);
  assert.equal(h.actions.filter(a=>a.type==="answer").length,0);
  assert.ok(h.host.querySelector('[role="alert"]'));
  assert.ok(h.host.textContent!.includes("Решаваме заедно"));
 }finally{await h.cleanup();}
});

test("navigation stops after one conflict retry if another window keeps changing progress",async()=>{
 const h=await mount(null);const fetchCourse=globalThis.fetch;let posts=0;
 try{
  globalThis.fetch=async(url,init)=>{
   if(init?.method==="POST"){posts++;h.advance({type:"dashboard"});}
   return fetchCourse(url,init);
  };
  await act(async()=>button(h.host,"Започни приключение").click());
  assert.equal(posts,2);
  assert.ok(h.host.querySelector('[role="alert"]'));
  assert.equal(button(h.host,"Започни приключение").disabled,false);
  assert.equal(h.record.attempts.length,0);
 }finally{await h.cleanup();}
});

test("kids course keeps explicit choices, hint/reveal and topic switching without auto-selection",async()=>{
 const h=await mount();try{
  assert.equal(h.host.querySelectorAll('[aria-label="Отговори"] button').length,4);
  assert.equal(primary(h.host,"Провери отговора").disabled,true);
  await act(async()=>button(h.host,"Решаваме заедно").click());
  assert.equal(h.host.querySelectorAll('[aria-pressed="true"]').length,0);
  assert.ok(h.host.textContent!.includes("Решаваме заедно"));
  const key=courseView(h.record,content,now).task!.key;
  await act(async()=>button(h.host,"← Начало").click());
  await practise(h.host,"Часовник и денонощия");
  await act(async()=>button(h.host,"← Начало").click());
  await practise(h.host,"Точки и мачове");
  assert.equal(courseView(h.record,content,now).task!.key,key);
  assert.ok(h.host.textContent!.includes("Решаваме заедно"));
  await act(async()=>button(h.host,"Покажи решението").click());
  assert.ok(h.host.textContent!.includes("Да разгледаме решението"));
  primary(h.host,"Да опитам подобна");
  assert.equal(h.host.querySelectorAll('[aria-pressed="true"]').length,0);
  await act(async()=>button(h.host,"Да опитам подобна").click());
  assert.equal(courseView(h.record,content,now).task!.skillId,"M1-03");
  assert.notEqual(courseView(h.record,content,now).task!.key,key);
  primary(h.host,"Провери отговора");
 }finally{await h.cleanup();}
});

test("numeric keypad edits only the selected field and checks only on explicit submit",async()=>{
 const h=await mount("grids");try{
  assert.equal(h.host.querySelectorAll("input").length,3);
  assert.equal(h.host.querySelector("img")!.getAttribute("src"),"/kids/figures/M2-2a.png");
  const first=h.host.querySelectorAll<HTMLInputElement>("input")[0]!;
  await act(async()=>button(h.host,"5").click());await act(async()=>button(h.host,"6").click());
  assert.equal(first.value,"56");assert.equal(h.record.attempts.length,0);
  const second=h.host.querySelectorAll<HTMLInputElement>("input")[1]!;
  await act(async()=>second.dispatchEvent(new dom.window.Event("focusin",{bubbles:true})));
  await act(async()=>button(h.host,"6").click());
  assert.equal(first.value,"56");assert.equal(second.value,"6");
  const back=h.host.querySelector<HTMLButtonElement>('[aria-label="Изтрий последната цифра"]')!;
  await act(async()=>back.click());assert.equal(second.value,"");
  assert.equal(button(h.host,"Провери отговора").disabled,true);
  assert.equal(h.record.attempts.length,0);
 }finally{await h.cleanup();}
});

test("lost answer response reconciles server truth without replaying a successful submission",async()=>{
 const h=await mount("matches",true);try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  await act(async()=>{const check=primary(h.host,"Провери отговора");check.click();check.click();});
  assert.equal(h.record.attempts.length,1);assert.equal(h.actions.filter(a=>a.type==="answer").length,1);
  assert.ok(h.host.querySelector('[role="alert"]')!.textContent!.includes("Lost response"));
  assert.ok(button(h.host,"Следваща задача"));
  assert.equal(h.host.querySelectorAll("[data-growth]").length,1);
 }finally{await h.cleanup();}
});


test("owl quest home, three hints, explicit reveal and five-problem chest work through the UI",async()=>{
 const h=await mount(null);try{
  assert.equal(h.host.querySelectorAll('[id^="island-"]').length,17);
  assert.ok(h.host.querySelector('a[href="#learning-map"]'));
  await act(async()=>button(h.host,"Започни приключение").click());
  assert.ok(h.host.textContent!.includes("Стъпка 1 от 5"));
  await act(async()=>button(h.host,"Решаваме заедно").click());
  await act(async()=>button(h.host,"Следваща стъпка").click());
  await act(async()=>button(h.host,"Следваща стъпка").click());
  assert.equal(button(h.host,"Следваща стъпка").disabled,true);
  assert.equal(h.record.quest!.completed,0);
  await act(async()=>button(h.host,"Почивка").click());
  primary(h.host,"Продължи");
  await act(async()=>button(h.host,"Продължи").click());
  assert.equal(courseView(h.record,content,now).task!.hintLevel,3);
  for(let i=0;i<5;i++){
   await act(async()=>button(h.host,"Покажи решението").click());
   await act(async()=>button(h.host,i===4?"Отвори съкровището":"Да опитам подобна").click());
   while(courseView(h.record,content,now).stage==="lesson"){
    const v=courseView(h.record,content,now);
    const label=v.lesson!.steps.length<v.lesson!.total?"Следваща стъпка":v.quest!.completed===5?"Отвори съкровището":"Да пробвам нова задача";
    await act(async()=>button(h.host,label).click());
   }
  }
  assert.ok(h.host.textContent!.includes("Приключението е завършено!"));
  primary(h.host,"Ново приключение");
  assert.equal(h.record.stamps!.length,1);assert.equal(h.record.attempts.length,5);
  assert.equal(h.host.querySelectorAll('[aria-label="Отговори"] button').length,0);
  await act(async()=>button(h.host,"Към картата").click());
  assert.equal(h.host.querySelector("details.treasureCollection > summary")!.textContent,"Моите съкровища 1");
  assert.equal(h.host.querySelectorAll("details.treasureCollection li").length,1);
  assert.ok(h.host.querySelector("details.treasureCollection li")!.textContent!.includes(adventureAchievement(h.record.stamps![0]!.achievement)));
  await h.reload();assert.equal(h.host.querySelectorAll("details.treasureCollection li").length,1);
  await act(async()=>button(h.host,"Започни приключение").click());
  assert.equal(h.record.quest!.completed,0);assert.equal(h.record.stamps!.length,1);
 }finally{await h.cleanup();}
});

test("feedback celebrates correct answers while retaining assisted and incorrect evidence",async()=>{
 for(const outcome of ["independent","hinted","incorrect"] as const){
  const h=await mount();try{
   if(outcome==="hinted")await act(async()=>button(h.host,"Решаваме заедно").click());
   const attempt=h.record.topics.matches!.work.core!.attempt;
   const answer=Number(attempt.problem.fields[0]!.answer);
   const choice=outcome==="incorrect"?(answer+1)%4:answer;
   await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[choice]!.click());
   await act(async()=>primary(h.host,"Провери отговора").click());
   assert.equal(h.record.attempts[0]!.outcome,outcome);
   const feedback=h.host.querySelector('[role="status"] h3[tabindex="-1"]')!;
   assert.equal(feedback.textContent,outcome==="independent"?"Верен отговор":outcome==="hinted"?"Верен отговор с помощ":"Още не се получи");
   assert.ok(h.host.textContent!.includes(outcome==="independent"?"Браво, справи се! 🎉":outcome==="hinted"?"Откри решението с помощ! Следващата подобна задача те чака. 🌟":"Нека открием следващата стъпка заедно. 🦉"));
   primary(h.host,outcome==="independent"?"Следваща задача":"Да опитам подобна");
   assert.equal(h.record.attempts.length,1);
  }finally{await h.cleanup();}
 }
});


async function submitAnswer(h:Awaited<ReturnType<typeof mount>>,correct=true){
 const active=courseView(h.record,content,now).active!;
 const problem=h.record.topics[active.topicId]!.work[active.mode]!.attempt.problem;
 if(problem.options){
  const answer=Number(problem.fields[0]!.answer);
  await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[correct?answer:(answer+1)%problem.options!.length]!.click());
 }else{
  for(const [i,field] of problem.fields.entries()){
   await act(async()=>h.host.querySelectorAll<HTMLInputElement>("input")[i]!.dispatchEvent(new dom.window.Event("focusin",{bubbles:true})));
   for(const digit of correct?field.answer:String(Number(field.answer)+1))await act(async()=>button(h.host,digit).click());
  }
 }
 await act(async()=>primary(h.host,"Провери отговора").click());
}

test("early wins appear once for effort, reviewed solutions and first correct answers, with quiet reload",async()=>{
 for(const outcome of ["independent","hinted","incorrect","revealed"] as const){
  const h=await mount();try{
   assert.equal(h.host.querySelectorAll("[data-growth]").length,0);
   if(outcome==="hinted"){
    await act(async()=>button(h.host,"Решаваме заедно").click());
    assert.equal(h.host.querySelectorAll("[data-growth]").length,0);
   }
   if(outcome==="revealed")await act(async()=>button(h.host,"Покажи решението").click());
   else await submitAnswer(h,outcome!=="incorrect");
   const kind={independent:"correct",hinted:"hinted",incorrect:"started",revealed:"revealed"}[outcome];
   assert.equal(h.host.querySelectorAll(`[data-growth="${kind}"]`).length,1);
   await h.reload();
   await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
   assert.equal(h.host.querySelectorAll("[data-growth]").length,0);
   await act(async()=>button(h.host,"← Начало").click());
    await act(async()=>islandButton(h.host,"Точки и мачове").click());
   const panel=h.host.querySelector('[aria-label="Умения: Точки и мачове"]')!;
   assert.equal(panel.querySelectorAll('svg[data-state="practising"]').length,1);
   assert.equal(panel.querySelectorAll('[data-first-correct="true"]').length,outcome==="independent"||outcome==="hinted"?1:0);
   assert.equal(h.host.querySelectorAll('[data-growing="true"]').length,0);
  }finally{await h.cleanup();}
 }
});

test("first correct after a mistake is celebrated, and Doctor takes precedence over a green leaf",async()=>{
 const h=await mount();try{
  await submitAnswer(h,false);
  await act(async()=>button(h.host,"Да опитам подобна").click());
  while(courseView(h.record,content,now).stage==="lesson"){
   const v=courseView(h.record,content,now);
   await act(async()=>button(h.host,v.lesson!.steps.length<v.lesson!.total?"Следваща стъпка":"Да пробвам нова задача").click());
  }
  await submitAnswer(h);
  assert.equal(h.host.querySelector('[data-growth]')!.getAttribute("data-growth"),"correct");
  await act(async()=>button(h.host,"Следваща задача").click());
  await submitAnswer(h);
  assert.ok(courseView(h.record,content,now).reward);
  assert.equal(h.host.querySelectorAll('[data-growth]').length,0);
  assert.ok(h.host.textContent!.includes("Вече си доктор"));
 }finally{await h.cleanup();}
});

test("a newly confirmed concept celebrates a green leaf before the full topic award",async()=>{
 const h=await mount("digits");try{
  await submitAnswer(h);
  await act(async()=>button(h.host,"Следваща задача").click());
  await submitAnswer(h);
  assert.equal(h.host.querySelector('[data-growth]')!.getAttribute("data-growth"),"confirmed");
  assert.equal(courseView(h.record,content,now).reward,undefined);
 }finally{await h.cleanup();}
});

test("awards disclosure is collapsed inside the island map",async()=>{
 const h=await mount(null);try{
  const panels=[...h.host.querySelectorAll("details")].filter(d=>d.querySelector("summary")?.textContent==="Бухали Доктор и Професор");
  assert.equal(panels.length,1);assert.ok(h.host.querySelector("#learning-map")!.contains(panels[0]!));
  assert.equal(panels[0]!.hasAttribute("open"),false);
 }finally{await h.cleanup();}
});

test("saved achievement wording changes only for display",()=>{
 const stamp={achievement:"Реши 2 задачи самостоятелно в този куест."};
 assert.equal(adventureAchievement(stamp.achievement),"Реши 2 задачи самостоятелно в това приключение.");
 assert.equal(stamp.achievement,"Реши 2 задачи самостоятелно в този куест.");
});

test("island exploration is read-only and only one island and skill detail open at a time",async()=>{
 const h=await mount(null);try{
  const saved=JSON.stringify(h.record);
  assert.equal(h.host.querySelectorAll('[id^="island-"]').length,17);
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,0);
  assert.ok(!h.host.textContent!.includes("Дървото"));assert.ok(!h.host.querySelector("[data-discoveries]"));
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  let rows=h.host.querySelectorAll<HTMLButtonElement>('button.skillRow');assert.equal(rows.length,5);
  await act(async()=>rows[0]!.click());assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,1);
  await act(async()=>rows[1]!.click());assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,1);
  await act(async()=>islandButton(h.host,"Пари и цени").click());
  assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,1);
  assert.ok(h.host.querySelector('[aria-label="Умения: Пари и цени"]'));
  assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,0);
  await act(async()=>button(h.host,"← Към картата").click());
  assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,0);
  assert.equal(JSON.stringify(h.record),saved);assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("a topic panel opens its island exercises without selecting a competence first",async()=>{
 const h=await mount(null);try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('button[aria-label="Най-малко и най-много"]')!.click());
  assert.equal(h.host.querySelectorAll('[aria-label^="Моите малки открития:"]').length,0);
  await act(async()=>button(h.host,"Да упражним").click());
  assert.equal(courseView(h.record,content,now).active!.topicId,"constraints");
  assert.ok(h.host.querySelector('h1')!.textContent!.includes("Най-малко и най-много"));
  primary(h.host,"Провери отговора");
 }finally{await h.cleanup();}
});

function islandTopic():CourseTopicView {
 const topic=structuredClone(courseView(newKidsCourse(content,now),content,now).topics[0]!);
 topic.doctor=true;topic.professor=true;topic.needsPractice=true;
 topic.leaves=(["untried","practising","confirmed","review"] as const).map((status,i)=>({
  id:`concept-${i}`,title:`Идея ${i}`,status,prerequisites:[{id:"inverse",title:"Обратни действия",topicIds:["backwards"]}],
  milestones:{started:i>0,...(i>0?{firstCorrect:i===1?"hinted" as const:"independent" as const}:{})},
  evidence:{independent:3,hinted:2,incorrect:1,revealed:1},confirmation:{earned:i>1,streak:0,target:2,revisit:i===1},
 }));
 return topic;
}

test("island details show helped discoveries and recovery goals separately from retained awards",async()=>{
 const topic=islandTopic(),before=JSON.stringify(topic),actions:CourseAction[]=[];
 const seen=new Set(knowledgeGrowthKeys([topic]));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 let selection:{topicId?:string;conceptId?:string}={topicId:topic.id};
 const show=(busy=true)=>root.render(<LearningMap topics={[topic]} progress={{complete:false,doctors:1,professors:1,professorGoal:1}} busy={busy} act={async a=>{actions.push(a);}} seenGrowth={seen} selection={selection} select={(topicId,conceptId)=>{selection={topicId,conceptId};show();}}/>);
 try{
  await act(async()=>show());assert.equal(host.querySelectorAll('[data-growing="true"]').length,0);
  const leaves=host.querySelectorAll<HTMLButtonElement>("button.skillRow");
  assert.deepEqual([...leaves].map(b=>b.querySelector("svg")!.getAttribute("data-state")),["untried","practising","confirmed","review"]);
  assert.equal(host.querySelectorAll('[data-rank="professor"][data-earned="true"]').length,1);
  await act(async()=>leaves[1]!.click());
  assert.ok(host.textContent!.includes("С помощ"));assert.ok(host.textContent!.includes("Обратни действия"));
  assert.ok(host.textContent!.includes("Да затвърдим: още 2 верни отговора самостоятелно."));
  assert.equal(host.querySelectorAll('[role="progressbar"]').length,1);
  assert.equal(host.querySelector('[role="progressbar"]')!.getAttribute("aria-valuemax"),"12");
  assert.equal(host.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow"),"8");
  assert.equal(button(host,"Да упражним").disabled,true);
  await act(async()=>show(false));await act(async()=>button(host,"Да упражним").click());
  assert.deepEqual(actions,[{type:"selectTopic",topicId:topic.id}]);assert.equal(JSON.stringify(topic),before);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("discoveries distinguish effort, helped correctness and retained confirmation from the next practice goal",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const leaf=islandTopic().leaves![0]!;
 const show=()=>root.render(<KidsLearningProgress leaf={leaf}/>);
 const value=()=>discoveryProgress([leaf]).earned;
 try{
  await act(async()=>show());assert.equal(value(),0);
  leaf.milestones.started=true;
  await act(async()=>show());assert.equal(value(),1);
  leaf.milestones.firstCorrect="hinted";leaf.confirmation.target=1;
  await act(async()=>show());assert.equal(value(),2);
  assert.ok(host.textContent!.includes("С помощ"));
  assert.ok(host.textContent!.includes("Още 1 верен отговор самостоятелно."));
  leaf.confirmation={earned:true,streak:0,target:2,revisit:true};
  await act(async()=>show());assert.equal(value(),3);
  assert.ok(host.textContent!.includes("Да затвърдим: още 2 верни отговора самостоятелно."));
  leaf.confirmation.revisit=false;leaf.status="review";
  await act(async()=>show());assert.equal(value(),3);
  assert.ok(host.textContent!.includes("Да си припомним!"));
  assert.ok(!host.textContent!.includes("Още 0"));
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("backwards island has one fifteen-discovery bar and five skill leaves",async()=>{
 const h=await mount(null);try{
  await act(async()=>button(h.host,"Теми").click());
  const island=h.host.querySelector('#island-backwards')!;
  assert.equal(island.querySelectorAll('[role="progressbar"]').length,1);
  assert.equal(island.querySelector('[role="progressbar"]')!.getAttribute("aria-valuemax"),"15");
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  assert.equal(h.host.querySelectorAll('[aria-label="Умения: Рачешки задачи"] svg[data-state]').length,5);
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,17);
  assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,0);
  assert.ok(!h.host.textContent!.includes("Данни за възрастния"));assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("fresh skill discoveries animate once, keep earned correctness after difficulty and reload quietly",async()=>{
 const topic=islandTopic(),leaf=topic.leaves![0]!,seen=new Set(knowledgeGrowthKeys([topic]));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const show=()=>root.render(<Leaf key={`${leaf.status}:${leafPhase(leaf)}`} status={leaf.status} milestones={leaf.milestones} growthKey={leafKey(topic.id,leaf.id)} seen={seen}/>);
 try{
  await act(async()=>show());assert.equal(host.querySelector('[data-growing]'),null);
  leaf.status="practising";leaf.milestones.started=true;
  await act(async()=>show());assert.equal(host.querySelector('[data-growing]')!.getAttribute("data-growing"),"true");
  leaf.milestones.firstCorrect="hinted";
  await act(async()=>show());assert.equal(host.querySelector('[data-first-correct]')!.getAttribute("data-first-correct"),"true");
  leaf.status="confirmed";leaf.confirmation.earned=true;
  await act(async()=>show());assert.ok(host.querySelector('[data-growing="true"]'));
  leaf.status="practising";
  await act(async()=>show());assert.equal(host.querySelector('[data-growing]'),null);assert.ok(host.querySelector('[data-first-correct="true"]'));
  await act(async()=>root.render(<div/>));await act(async()=>show());assert.equal(host.querySelector('[data-growing]'),null);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("action bar reserves its measured height and follows the visual viewport above the keyboard",async()=>{
 const previousViewport=Object.getOwnPropertyDescriptor(window,"visualViewport"),previousHeight=Object.getOwnPropertyDescriptor(window,"innerHeight");
 const previousObserver=Object.getOwnPropertyDescriptor(globalThis,"ResizeObserver");
 const previousRect=HTMLElement.prototype.getBoundingClientRect;
 const listeners=new Map<string,()=>void>();let disconnected=false;
 const viewport={height:844,offsetTop:0,scale:1,addEventListener:(event:string,fn:()=>void)=>listeners.set(event,fn),removeEventListener:(event:string)=>listeners.delete(event)};
 Object.defineProperty(window,"visualViewport",{configurable:true,value:viewport});
 Object.defineProperty(window,"innerHeight",{configurable:true,value:844});
 Object.defineProperty(globalThis,"ResizeObserver",{configurable:true,value:class{observe(){}disconnect(){disconnected=true;}}});
 HTMLElement.prototype.getBoundingClientRect=()=>({height:104}) as DOMRect;
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<main><KidsActionBar label="Провери отговора" disabled={false} onClick={()=>{}}/></main>));
  const shell=host.querySelector("main")!;
  assert.equal(shell.style.getPropertyValue("--kids-action-height"),"104px");
  assert.equal(shell.style.getPropertyValue("--kids-keyboard-inset"),"0px");
  viewport.height=480;viewport.offsetTop=24;listeners.get("resize")!();
  assert.equal(shell.style.getPropertyValue("--kids-keyboard-inset"),"340px");
  viewport.height=844;viewport.offsetTop=0;listeners.get("scroll")!();
  assert.equal(shell.style.getPropertyValue("--kids-keyboard-inset"),"0px");
  await act(async()=>root.render(<main/>));
  assert.equal(listeners.size,0);assert.equal(disconnected,true);
  assert.equal(shell.style.getPropertyValue("--kids-action-height"),"");
 }finally{
  await act(async()=>root.unmount());host.remove();HTMLElement.prototype.getBoundingClientRect=previousRect;
  for(const [target,key,descriptor] of [[window,"visualViewport",previousViewport],[window,"innerHeight",previousHeight],[globalThis,"ResizeObserver",previousObserver]] as const){if(descriptor)Object.defineProperty(target,key,descriptor);else Reflect.deleteProperty(target,key);}
 }
});

test("single home control retains the exact question and worked solution parts",async()=>{
 const h=await mount(null);try{
  await practise(h.host,"Рачешки задачи");
  const key=courseView(h.record,content,now).task!.key;
  const nav=h.host.querySelector('nav[aria-label="Навигация"]')!;
  assert.deepEqual([...nav.querySelectorAll("button")].map(b=>b.textContent),["← Начало"]);
  await act(async()=>button(h.host,"Решаваме заедно").click());
  const first=h.host.querySelector('aside li')!.textContent;
  await act(async()=>button(h.host,"← Начало").click());
  assert.ok(button(h.host,"Започни приключение"));assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,0);
  await practise(h.host,"Рачешки задачи");
  assert.equal(courseView(h.record,content,now).task!.key,key);assert.equal(h.host.querySelector('aside li')!.textContent,first);
  await act(async()=>button(h.host,"Следваща стъпка").click());
  await act(async()=>button(h.host,"← Начало").click());
  assert.equal(courseView(h.record,content,now).task!.hintLevel,2);assert.equal(courseView(h.record,content,now).task!.key,key);
 }finally{await h.cleanup();}
});

test("island discovery fill represents retained earned milestones across every state",async()=>{
 const topic=islandTopic(),leaf=topic.leaves![0]!;
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const show=()=>root.render(<IslandDiscoveryBar title={topic.title} leaves={[leaf]}/>);
 const progress=()=>host.querySelector<HTMLElement>('[role="progressbar"]')!;
 try{
  await act(async()=>show());assert.equal(progress().getAttribute("aria-valuenow"),"0");assert.equal(progress().firstElementChild!.getAttribute("style"),"width:0%");
  leaf.milestones.started=true;await act(async()=>show());assert.equal(progress().getAttribute("aria-valuenow"),"1");
  leaf.milestones.firstCorrect="hinted";await act(async()=>show());assert.equal(progress().getAttribute("aria-valuenow"),"2");
  leaf.confirmation.earned=true;await act(async()=>show());assert.equal(progress().getAttribute("aria-valuenow"),"3");assert.equal((progress().firstElementChild as HTMLElement).style.width,"100%");
  leaf.status="practising";leaf.confirmation.revisit=true;leaf.evidence.incorrect++;
  await act(async()=>show());assert.equal(progress().getAttribute("aria-valuenow"),"3");
  assert.equal(progress().getAttribute("aria-valuemax"),"3");
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("world and topic views expose every island without changing saved learning",async()=>{
 const h=await mount(null);try{
  const saved=JSON.stringify(h.record);
  assert.deepEqual(content.topics.map(t=>t.id).filter(id=>!islandPlaces[id]),[]);
  assert.equal(h.host.querySelectorAll('[data-island-scenery]').length,17);
  for(const topic of content.topics){
   await act(async()=>islandButton(h.host,topic.title).click());
   assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,1);
   assert.ok(h.host.querySelector(`section[aria-label="Умения: ${topic.title}"]`));
  }
  const last=content.topics.at(-1)!;
  await act(async()=>button(h.host,"Теми").click());
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,17);
  assert.ok(h.host.querySelector(`section[aria-label="Умения: ${last.title}"]`));
  await act(async()=>button(h.host,"Карта").click());
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,1);
  assert.equal(JSON.stringify(h.record),saved);assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("world camera zoom is bounded, resets to fit and centres a selected island",async()=>{
 const h=await mount(null);try{
  const camera=()=>h.host.querySelector('[data-camera]')!.getAttribute('data-camera')!;
  const fit=camera(),floor=Number(fit.split(',')[2]);
  const more=h.host.querySelector<HTMLButtonElement>('[aria-label="Приближи картата"]')!;
  const less=h.host.querySelector<HTMLButtonElement>('[aria-label="Отдалечи картата"]')!;
  assert.equal(less.disabled,true);
  for(let i=0;i<12;i++)await act(async()=>more.click());
  assert.equal(more.disabled,true);assert.ok(Number(camera().split(',')[2])<=floor*4+.002);
  await act(async()=>button(h.host,"Цялата карта").click());assert.equal(camera(),fit);
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());assert.ok(Number(camera().split(',')[2])>floor);
  for(let i=0;i<12;i++)await act(async()=>less.click());assert.equal(less.disabled,true);
  assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("island scenery accumulates effort, helped correctness and confirmation, retains awards and restores quietly",async()=>{
 const topic=islandTopic();topic.leaves=[topic.leaves![0]!];topic.doctor=false;topic.professor=false;
 const leaf=topic.leaves[0]!,seen=new Set(knowledgeGrowthKeys([topic]));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 let visit=0;
 const show=()=>root.render(<svg><IslandScenery key={visit++} topic={topic} variant={0} seen={seen}/></svg>);
 const count=(name:string)=>host.querySelectorAll(`[data-scenery="${name}"]`).length;
 try{
  await act(async()=>show());assert.equal(count('sprout'),0);assert.equal(host.querySelector('[data-new-growth]'),null);
  leaf.milestones.started=true;await act(async()=>show());assert.equal(count('sprout'),1);assert.equal(count('flowers'),0);assert.ok(host.querySelector('[data-new-growth="true"]'));
  leaf.milestones.firstCorrect='hinted';await act(async()=>show());assert.equal(count('sprout'),1);assert.equal(count('flowers'),1);assert.equal(count('tree'),0);
  leaf.confirmation.earned=true;topic.doctor=true;topic.professor=true;
  await act(async()=>show());assert.equal(count('tree'),1);assert.equal(count('doctor-flag'),1);assert.equal(count('professor-gold'),1);
  leaf.status='practising';leaf.confirmation.revisit=true;
  await act(async()=>show());assert.equal(count('tree'),1);assert.equal(count('flowers'),1);assert.equal(count('sprout'),1);assert.equal(count('professor-gold'),1);assert.equal(host.querySelector('[data-new-growth]'),null);
  const restored=new Set(knowledgeGrowthKeys([topic]));
  await act(async()=>root.render(<svg><IslandScenery key="reload" topic={topic} variant={0} seen={restored}/></svg>));assert.equal(host.querySelector('[data-new-growth]'),null);
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("a tab keeps commands and recovery reads bound to its rendered child after another tab switches",async()=>{
 const h=await mount("matches",false,"child-a");try{
  document.cookie="maths_child=child-b";
  await act(async()=>button(h.host,"Решаваме заедно").click());
  assert.ok(h.requestHeaders.length>=2);
  assert.ok(h.requestHeaders.every(headers=>headers.get("X-Maths-Child")==="child-a"));
 }finally{await h.cleanup();}
});


test("lost replies reconcile against the tab's original child and competition without replay",async()=>{
 const h=await mount("matches",true,"child-a","competition-fixture");try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.equal(h.record.attempts.length,1);
  assert.equal(h.actions.filter(action=>action.type==="answer").length,1);
  assert.ok(h.requestHeaders.length>=3,"Includes the reconciliation read");
  assert.ok(h.requestHeaders.every(headers=>headers.get("X-Maths-Child")==="child-a"&&headers.get("X-Maths-Competition")==="competition-fixture"));
 }finally{await h.cleanup();}
});

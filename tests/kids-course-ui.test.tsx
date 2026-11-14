import React, {act} from "react";
import assert from "node:assert/strict";
import {publicImage} from "../src/core/public-images.ts";
import {test} from "node:test";
import {registerHooks} from "node:module";
import {parseHTML} from "linkedom";
import {applyCourseAction,courseView,newKidsCourse} from "../src/core/kids-course.ts";
import {catalogueProblems, isCompetitionProblem, problemSource} from "../src/core/kids-selection.ts";
import {newGoldGain} from "../src/core/kids-gold.ts";
import type {ConnectedCourseProblem, CourseAction, CourseTopicView, KidsCourseContent} from "../src/core/kids-course.ts";
import {nvoCourseContent} from "../src/server/nvo-course-content.ts";
import {proletnoCourseContent} from "../src/server/proletno-course-content.ts";
import {regionalOlympiadCourseContent} from "../src/server/olimpiada-oblasten-course-content.ts";
import {olympiadCourseContent} from "../src/server/olimpiada-course-content.ts";
import {competitions,publishedCompetitions,DEFAULT_COMPETITION_ID,competitionDifficultyLabel} from "../src/core/competitions.ts";
import {kidsCourseContent as liveContent} from "../src/server/kids-course-content.ts";
// Saved pre-connected tasks retain their original grading and draft contract.
const content:KidsCourseContent={...liveContent,connectedProblem:undefined};
registerHooks({load(url,context,nextLoad){if(url.endsWith(".module.css"))return{format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};if(url.endsWith("/next/navigation.js"))return{format:"module",source:'export function useRouter(){return {push(href){globalThis.__courseRoutes?.push(href);}}}',shortCircuit:true};if(url.endsWith("/next/image.js"))return{format:"module",source:'import React from "react"; export default function Image({unoptimized, ...props}) { return React.createElement("img",props); }',shortCircuit:true};return nextLoad(url,context);}});
const dom=parseHTML("<html><body></body></html>");
Object.assign(globalThis,{React,window:dom.window,self:dom.window,document:dom.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
document.oninput=null;
// linkedom does not implement the browser's native dialog methods.
const createElement=document.createElement.bind(document);
document.createElement=((name:string,options?:ElementCreationOptions)=>{
 const element=createElement(name,options);
 if(name==="dialog")Object.assign(element,{
  showModal(){element.setAttribute("open","");},
  close(){element.removeAttribute("open");element.dispatchEvent(new dom.window.Event("close"));}
 });
 return element;
}) as typeof document.createElement;

const {createRoot}=await import("react-dom/client");
const {KidsCoursePlayer,CompetitionPicker}=await import("../components/kids-course.tsx");
const {KidsActionBar}=await import("../components/kids-action-bar.tsx");
const {IslandScenery,islandPlaces,KidsWorldMap}=await import("../components/kids-world-map.tsx");
const {LearningMap,adventureAchievement}=await import("../components/kids-quest-map.tsx");
const {Leaf,leafKey,leafPhase,knowledgeGrowthKeys}=await import("../components/kids-map-decorations.tsx");
const {IslandGoldTotal,KidsLearningProgress,discoveryProgress}=await import("../components/kids-learning-progress.tsx");
const now="2026-11-02T12:00:00.000Z";
function button(host:HTMLElement,label:string){const b=[...host.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===label);assert.ok(b,`Missing: ${label}`);return b;}
async function openFeedback(host:HTMLElement){ await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Меню"]')!.click()); await act(async()=>button(host,"Обратна връзка").click()); }
function primary(host:HTMLElement,label:string){const bars=host.querySelectorAll('[aria-label="Следващо действие"]');assert.equal(bars.length,1);assert.equal(bars[0]!.querySelectorAll("button").length,label==="Провери отговора"?2:1);assert.ok(bars[0]!.textContent!.includes(label));return button(host,label);}
function islandButton(host:HTMLElement,topic:string){const b=host.querySelector<HTMLButtonElement>(`button[aria-label="${topic}"]`);assert.ok(b);return b;}
async function practise(host:HTMLElement,topic:string){await act(async()=>islandButton(host,topic).click());await act(async()=>button(host,"Към задачите").click());}
async function mount(topic:string|null="matches",loseResponse=false,learnerId?:string,competitionId?:string,learnerNickname?:string,legacy=false,courseContent:KidsCourseContent=content){
 const initialContent=legacy ? {...courseContent,connectedProblem:undefined} : courseContent;
 let record=topic ? applyCourseAction(newKidsCourse(courseContent,now),initialContent,{type:"selectTopic",topicId:topic},now) : newKidsCourse(courseContent,now);
 const originalFetch=globalThis.fetch;const actions:CourseAction[]=[];const requestHeaders:Headers[]=[];
 globalThis.fetch=async(_url,init)=>{
  requestHeaders.push(new Headers(init?.headers));
  let goldGain;
  if(init?.method==="POST"){
   const before=record;
   const command=JSON.parse(String(init.body)) as{revision:number;action:CourseAction};
   if(command.revision!==record.revision)return Response.json({error:"Напредъкът е променен в друг прозорец. Показваме последния запис."},{status:409});
   actions.push(command.action);record=applyCourseAction(record,courseContent,command.action,now);
   goldGain=newGoldGain(before,record);
   if(loseResponse&&command.action.type==="answer")throw new Error("Lost response");
  }
  return Response.json({course:{...courseView(record,courseContent,now),goldGain}});
 };
 const host=document.createElement("div");document.body.append(host);let root=createRoot(host);
 await act(async()=>root.render(<KidsCoursePlayer learnerId={learnerId} learnerNickname={learnerNickname} competitionId={competitionId} initialView={courseView(record,courseContent,now)}/>));
 if(topic) await act(async()=>button(host,`Продължи: ${courseView(record,courseContent,now).topics.find(t=>t.id===courseView(record,courseContent,now).active?.topicId)!.title}`).click());
 return{host,actions,requestHeaders,get record(){return record;},advance:(action:CourseAction)=>{record=applyCourseAction(record,courseContent,action,now);},reload:async()=>{await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(<KidsCoursePlayer learnerId={learnerId} learnerNickname={learnerNickname} competitionId={competitionId} initialView={courseView(record,courseContent,now)}/>));},cleanup:async()=>{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;}};
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
   const label=entry==="quest"?"Започни приключение":entry==="resume"?"Продължи: Точки и мачове":"Към задачите";
   await act(async()=>button(h.host,label).click());
   assert.ok(!h.host.querySelector('[aria-label="Карта на ученето"]'),"Navigation should open the exercises");
   assert.ok(h.host.textContent!.includes(entry==="quest"?"0/5 стъпки":entry==="resume"?"Часовник и денонощия":"Пари и цени"));
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
  assert.ok(h.host.textContent!.includes("Подсказка"));
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
  assert.equal(h.host.querySelector("textarea"),null);
  assert.ok(!h.host.textContent!.includes("Как мислиш"));
  await act(async()=>button(h.host,"Подсказка").click());
  assert.ok(button(h.host,"Следваща подсказка"));
  assert.equal(h.host.querySelectorAll('[aria-pressed="true"]').length,0);
  assert.ok(h.host.textContent!.includes("Подсказка"));
  const key=courseView(h.record,content,now).task!.key;
  await act(async()=>button(h.host,"← Начало").click());
  await practise(h.host,"Часовник и денонощия");
  await act(async()=>button(h.host,"← Начало").click());
  await practise(h.host,"Точки и мачове");
  assert.equal(courseView(h.record,content,now).task!.key,key);
  assert.ok(h.host.textContent!.includes("Подсказка"));
  await act(async()=>button(h.host,"Покажи решението").click());
  assert.ok(h.host.textContent!.includes("Да разгледаме решението"));
  primary(h.host,"Продължи");
  assert.equal(h.host.querySelectorAll('[aria-pressed="true"]').length,0);
  await act(async()=>button(h.host,"Продължи").click());
  assert.equal(courseView(h.record,content,now).task!.skillId,"M1-03");
  assert.notEqual(courseView(h.record,content,now).task!.key,key);
  primary(h.host,"Провери отговора");
 }finally{await h.cleanup();}
});

test("original subconditions advance one at a time and keypad checks only on explicit submit",async()=>{
 const h=await mount("grids",false,undefined,undefined,undefined,true);try{
  assert.equal(h.host.querySelectorAll("input").length,1);
  assert.equal(h.host.querySelector("img")!.getAttribute("src"),publicImage("/kids/figures/M2-2a.png"));
  assert.ok(h.host.querySelector('a[href*="problem=M2-2a%3Aoriginal"]'));
  for(const [index,answer] of ["56","66","4"].entries()){
   assert.ok(h.host.textContent!.includes(`Отговор ${index+1} от 3`));
   const input=h.host.querySelector<HTMLInputElement>("input")!;
   assert.equal(input.value,"");
   await act(async()=>button(h.host,"9").click());
   await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Изтрий последната цифра"]')!.click());
   assert.equal(input.value,"");
   assert.equal(button(h.host,"Провери отговора").disabled,true);
   for(const digit of answer) await act(async()=>button(h.host,digit).click());
   assert.equal(input.value,answer);assert.equal(h.record.attempts.length,0);
   await act(async()=>primary(h.host,"Провери отговора").click());
   if(index<2){
    assert.equal(h.record.attempts.length,0);
    assert.equal(h.record.goldAwards?.length,0);
    await act(async()=>primary(h.host,"Следващо подусловие").click());
   }
  }
  assert.equal(h.record.attempts.length,1);
  assert.equal(h.record.attempts[0]!.outcome,"independent");
  assert.deepEqual(h.record.attempts[0]!.answers,["56","66","4"]);
 }finally{await h.cleanup();}
});

test("lost answer response reconciles server truth without replaying a successful submission",async()=>{
 const h=await mount("matches",true);try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  await act(async()=>{const check=primary(h.host,"Провери отговора");check.click();check.click();});
  assert.equal(h.record.attempts.length,1);assert.equal(h.actions.filter(a=>a.type==="answer").length,1);
  assert.ok(h.host.querySelector('[role="alert"]')!.textContent!.includes("Lost response"));
  assert.ok(button(h.host,"Следваща задача"));
  assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
 }finally{await h.cleanup();}
});


test("otter adventure home, three solution parts, explicit reveal and five-problem chest work through the UI",async()=>{
 const h=await mount(null);try{
  assert.equal(h.host.querySelectorAll('[id^="island-"]').length,16);
  assert.ok(h.host.querySelector('a[href="#learning-map"]'));
  await act(async()=>button(h.host,"Започни приключение").click());
  assert.ok(h.host.textContent!.includes("0/5 стъпки"));
  await act(async()=>button(h.host,"Подсказка").click());
  await act(async()=>button(h.host,"Следваща подсказка").click());
  await act(async()=>button(h.host,"Следваща подсказка").click());
  assert.equal(button(h.host,"Следваща подсказка").disabled,true);
  assert.ok(h.host.textContent!.includes("Без злато след третата подсказка"));
  assert.equal(courseView(h.record,content,now).task!.goldReward,undefined);
  assert.equal(h.record.quest!.completed,0);
  await act(async()=>button(h.host,"Почивка").click());
  primary(h.host,"Продължи");
  await act(async()=>button(h.host,"Продължи").click());
  assert.equal(courseView(h.record,content,now).task!.hintLevel,3);
  for(let i=0;i<5;i++){
   await act(async()=>button(h.host,"Покажи решението").click());
   const trail=h.host.querySelector('[aria-label="Изминати стъпки в приключението"]')!;
   assert.equal(trail.getAttribute("aria-valuenow"),String(i+1));
   assert.equal(trail.getAttribute("aria-valuemax"),"5");
   assert.ok(trail.getAttribute("aria-valuetext")!.includes("включително с помощ"));
   await act(async()=>button(h.host,i===4?"Отвори съкровището":"Продължи").click());
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
  assert.ok(h.host.querySelector("details.treasureCollection li")!.textContent!.includes("×1"));
  await h.reload();assert.equal(h.host.querySelectorAll("details.treasureCollection li").length,1);
  await act(async()=>button(h.host,"Започни приключение").click());
  assert.equal(h.record.quest!.completed,0);assert.equal(h.record.stamps!.length,1);
 }finally{await h.cleanup();}
});

test("feedback celebrates correct answers while retaining assisted and incorrect evidence",async()=>{
 for(const outcome of ["independent","hinted","incorrect"] as const){
  const h=await mount();try{
   if(outcome==="hinted")await act(async()=>button(h.host,"Подсказка").click());
   const attempt=h.record.topics.matches!.work.core!.attempt;
   const answer=Number(attempt.problem.fields[0]!.answer);
   const choice=outcome==="incorrect"?(answer+1)%4:answer;
   await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[choice]!.click());
   await act(async()=>primary(h.host,"Провери отговора").click());
   assert.equal(h.record.attempts[0]!.outcome,outcome);
   const feedback=h.host.querySelector('[role="status"] h3[tabindex="-1"]')!;
   assert.equal(feedback.textContent,outcome==="independent"?"Верен отговор":outcome==="hinted"?"Верен отговор с помощ":"Отговорът не е верен.");
   assert.equal(feedback.parentElement!.parentElement!.textContent!.includes("Нека разгледаме решението стъпка по стъпка."),outcome==="incorrect");
   assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,1);
   assert.ok(!h.host.querySelector("[data-gold-gain]")!.textContent!.includes("Първо откритие!"));
   primary(h.host,outcome==="independent"?"Следваща задача":"Продължи");
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
   assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
   assert.equal(h.host.querySelector('[aria-label^="Открития за умението:"]')!.getAttribute("aria-valuenow"),"0");
   if(outcome==="hinted"){
    await act(async()=>button(h.host,"Подсказка").click());
    assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
    assert.equal(h.host.querySelector('[aria-label^="Открития за умението:"]')!.getAttribute("aria-valuenow"),"0");
   }
   if(outcome==="revealed")await act(async()=>button(h.host,"Покажи решението").click());
   else await submitAnswer(h,outcome!=="incorrect");
   const amount=outcome==="independent"||outcome==="hinted"?35:5;
   assert.equal(h.host.querySelectorAll(`[data-gold-gain="${amount}"]`).length,1);
   assert.equal(h.host.querySelector("[data-gold-wallet]")!.getAttribute("aria-label"),`${amount} злато`);
   const progress=h.host.querySelector('[aria-label^="Открития за умението:"]')!;
   assert.equal(progress.getAttribute("aria-valuenow"),outcome==="independent"||outcome==="hinted"?"2":"1");
   assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,1);
   assert.ok(h.host.querySelector('[role="status"]')!.contains(progress));
   if(outcome==="hinted")assert.ok(progress.getAttribute("aria-valuetext")!.includes("с помощ"));
   await h.reload();
   await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
   assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
   await act(async()=>button(h.host,"← Начало").click());
    await act(async()=>islandButton(h.host,"Точки и мачове").click());
   const panel=h.host.querySelector('[aria-label="Умения: Точки и мачове"]')!;
   assert.equal(panel.querySelectorAll('svg[data-state="practising"]').length,1);
   assert.equal(panel.querySelectorAll('[data-first-correct="true"]').length,outcome==="independent"||outcome==="hinted"?1:0);
   assert.equal(h.host.querySelectorAll('[data-growing="true"]').length,0);
  }finally{await h.cleanup();}
 }
});

test("first correct after a mistake earns gold, and confirmation combines with Doctor",async()=>{
 const h=await mount();try{
  await submitAnswer(h,false);
  await act(async()=>button(h.host,"Продължи").click());
  while(courseView(h.record,content,now).stage==="lesson"){
   const v=courseView(h.record,content,now);
   await act(async()=>button(h.host,v.lesson!.steps.length<v.lesson!.total?"Следваща стъпка":"Да пробвам нова задача").click());
  }
  await submitAnswer(h);
  assert.equal(h.host.querySelector('[data-gold-gain]')!.getAttribute("data-gold-gain"),"30");
  await act(async()=>button(h.host,"Следваща задача").click());
  await submitAnswer(h);
  assert.ok(courseView(h.record,content,now).reward);
  assert.equal(h.host.querySelector('[data-gold-gain]')!.getAttribute("data-gold-gain"),"40");
  assert.ok(h.host.textContent!.includes("Вече си доктор"));
 }finally{await h.cleanup();}
});

test("a newly confirmed concept earns gold before the full topic award",async()=>{
 const h=await mount("digits");try{
  await submitAnswer(h);
  await act(async()=>button(h.host,"Следваща задача").click());
  await submitAnswer(h);
  assert.equal(h.host.querySelector('[data-gold-gain]')!.getAttribute("data-gold-gain"),"40");
  assert.equal(courseView(h.record,content,now).reward,undefined);
 }finally{await h.cleanup();}
});

test("unearned awards and rank instructions stay hidden inside an island",async()=>{
 const h=await mount(null);try{
  assert.equal(h.host.querySelectorAll('details.mapAwards, [data-earned="false"]').length,0);
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  const panel=h.host.querySelector('[aria-label="Умения: Рачешки задачи"]')!;
  assert.equal(panel.querySelectorAll('[data-rank], .islandAwards').length,0);
  assert.ok(!panel.textContent!.includes("Предстои"));
  assert.equal(panel.querySelector('details'),null);
  assert.ok(!panel.textContent!.includes("Доктор и Професор"));
 }finally{await h.cleanup();}
});

test("saved achievement wording changes only for display",()=>{
 const stamp={achievement:"Реши 2 задачи самостоятелно в този куест."};
 assert.equal(adventureAchievement(stamp.achievement),"Реши 2 задачи самостоятелно в това приключение.");
 assert.equal(stamp.achievement,"Реши 2 задачи самостоятелно в този куест.");
});

test("island exploration is read-only and shows one compact island panel at a time",async()=>{
 const h=await mount(null);try{
  const saved=JSON.stringify(h.record);
  assert.equal(h.host.querySelectorAll('[id^="island-"]').length,16);
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,2);
  assert.ok(!h.host.textContent!.includes("Дървото"));assert.ok(!h.host.querySelector("[data-discoveries]"));
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  const rows=h.host.querySelectorAll<HTMLButtonElement>('button.skillRow');assert.equal(rows.length,5);
  assert.ok([...rows].every(row=>!row.hasAttribute("aria-expanded") && row.textContent!.endsWith("→")));
  assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,0);
  await act(async()=>button(h.host,"← Към картата").click());
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
  await act(async()=>button(h.host,"Към задачите").click());
  assert.equal(courseView(h.record,content,now).active!.topicId,"constraints");
  assert.ok(h.host.querySelector('h1')!.textContent!.includes("Най-малко и най-много"));
  primary(h.host,"Провери отговора");
 }finally{await h.cleanup();}
});

function islandTopic():CourseTopicView {
 const topic=structuredClone(courseView(newKidsCourse(content,now),content,now).topics[0]!);
 topic.doctor=true;topic.professor=true;topic.needsPractice=true;topic.gold={earned:50,total:140};
 topic.leaves=(["untried","practising","confirmed","review"] as const).map((status,i)=>({
  id:`concept-${i}`,title:`Идея ${i}`,status,prerequisites:[{id:"inverse",title:"Обратни действия",topicIds:["backwards"]}],
  milestones:{started:i>0,...(i>0?{firstCorrect:i===1?"hinted" as const:"independent" as const}:{})},
  evidence:{independent:3,hinted:2,incorrect:1,revealed:1},confirmation:{earned:i>1,streak:0,target:2,revisit:i===1},
 }));
 return topic;
}

test("island rows start specific skills, disable while saving and retain earned awards without repeated details",async()=>{
 const topic=islandTopic(),before=JSON.stringify(topic),actions:CourseAction[]=[];
 const seen=new Set(knowledgeGrowthKeys([topic]));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 let selection:{topicId?:string}={topicId:topic.id};
 const show=(busy=true)=>root.render(<LearningMap topics={[topic]} progress={{complete:false,doctors:1,professors:1,professorGoal:1}} busy={busy} act={async a=>{actions.push(a);}} seenGrowth={seen} selection={selection} select={topicId=>{selection={topicId};show();}}/>);
 try{
  await act(async()=>show());assert.equal(host.querySelectorAll('[data-growing="true"]').length,0);
  assert.equal(host.querySelector('details.mapAwards'),null);
  assert.equal(host.querySelectorAll('[data-earned="false"]').length,0);
  const leaves=host.querySelectorAll<HTMLButtonElement>("button.skillRow");
  assert.deepEqual([...leaves].map(b=>b.querySelector("svg")!.getAttribute("data-state")),["untried","practising","confirmed","review"]);
  assert.equal(host.querySelectorAll('[data-rank="professor"][data-earned="true"]').length,1);
  assert.ok([...leaves].every(b=>b.disabled));
  await act(async()=>leaves[1]!.click());assert.equal(actions.length,0);
  assert.equal(host.querySelectorAll('[role="progressbar"]').length,0);
  assert.equal(host.querySelector(`[aria-label="${topic.title}: 50 злато"]`)!.textContent,"50");
  assert.equal(host.querySelectorAll('[aria-label^="Стъпки:"]').length,0);
  assert.ok(!host.textContent!.includes("Моите малки открития"));
  assert.ok(!host.textContent!.includes("Как да стана"));
  assert.equal(button(host,"Към задачите").disabled,true);
  await act(async()=>show(false));await act(async()=>button(host,"Към задачите").click());
  await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label="Упражнения: Идея 1"]')!.click());
  assert.deepEqual(actions,[{type:"selectTopic",topicId:topic.id},{type:"selectTopic",topicId:topic.id,skillId:"concept-1"}]);assert.equal(JSON.stringify(topic),before);
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
  assert.ok(host.textContent!.includes("Реши самостоятелно още 1 различна задача подред."));
  leaf.confirmation={earned:true,streak:0,target:2,revisit:true};
  await act(async()=>show());assert.equal(value(),3);
  assert.ok(host.textContent!.includes("Да затвърдим: реши самостоятелно още 2 различни задачи подред."));
  leaf.confirmation.revisit=false;leaf.status="review";
  await act(async()=>show());assert.equal(value(),3);
  assert.ok(host.textContent!.includes("Да си припомним!"));
  assert.ok(!host.textContent!.includes("Още 0"));
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("backwards island shows earned gold without a target and retains five skill markers",async()=>{
 const h=await mount(null);try{
  await act(async()=>button(h.host,"Теми").click());
  const island=h.host.querySelector('#island-backwards')!;
  assert.equal(island.querySelectorAll('[role="progressbar"]').length,0);
  assert.equal(island.querySelector('[aria-label="Рачешки задачи: 0 злато"]')!.textContent,"0");
  assert.ok(!island.textContent!.includes("Събрано злато"));
  assert.ok(!island.textContent!.includes("Моите малки открития"));
  assert.ok(island.querySelector("svg"));
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  assert.equal(h.host.querySelectorAll('[aria-label="Умения: Рачешки задачи"] svg[data-state]').length,5);
  assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,0);
  assert.equal(h.host.querySelectorAll('[aria-label^="Стъпки:"]').length,0);
  assert.ok(!h.host.textContent!.includes("Данни за възрастния"));assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("fresh skill discoveries animate once, keep earned correctness after difficulty and reload quietly",async()=>{
 const topic=islandTopic(),leaf=topic.leaves![0]!,seen=new Set(knowledgeGrowthKeys([topic]));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const show=()=>root.render(<Leaf key={`${leaf.status}:${leafPhase(leaf)}`} status={leaf.status} milestones={leaf.milestones} confirmed={leaf.confirmation.earned} growthKey={leafKey(topic.id,leaf.id)} seen={seen}/>);
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
  assert.deepEqual([...nav.querySelectorAll("button")].map(b=>b.textContent),["← Начало","Карта"]);
  await act(async()=>button(h.host,"Подсказка").click());
  const first=h.host.querySelector('aside li')!.textContent;
  await act(async()=>button(h.host,"← Начало").click());
  assert.ok(button(h.host,"Започни приключение"));assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,0);
  await practise(h.host,"Рачешки задачи");
  assert.equal(courseView(h.record,content,now).task!.key,key);assert.equal(h.host.querySelector('aside li')!.textContent,first);
  await act(async()=>button(h.host,"Следваща подсказка").click());
  await act(async()=>button(h.host,"← Начало").click());
  assert.equal(courseView(h.record,content,now).task!.hintLevel,2);assert.equal(courseView(h.record,content,now).task!.key,key);
 }finally{await h.cleanup();}
});

test("island gold shows the full earned amount without a target or clamping",async()=>{
 const topic=islandTopic();topic.gold={earned:0,total:35};
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 const show=()=>root.render(<IslandGoldTotal title={topic.title} earned={topic.gold.earned}/>);
 try{
  for(const earned of [0,5,15,35,70,3370]){
   topic.gold.earned=earned;const saved=JSON.stringify(topic);
   await act(async()=>show());
   assert.equal(host.querySelector('[role="progressbar"]'),null);
   assert.equal(host.querySelector(`[aria-label="${topic.title}: ${earned} злато"]`)!.textContent,String(earned));
   assert.ok(host.querySelector(".goldAmount svg"));
   assert.equal(host.textContent,String(earned));
   assert.equal(JSON.stringify(topic),saved);
  }
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("world and topic views expose every island in a focused view without changing saved learning",async()=>{
 const h=await mount(null);try{
  const saved=JSON.stringify(h.record);
  assert.deepEqual(content.topics.map(t=>t.id).filter(id=>!islandPlaces[id]),[]);
  assert.equal(h.host.querySelectorAll('[data-island-scenery]').length,16);
  for(const mode of ["Карта","Теми"]){
   if(mode==="Теми")await act(async()=>button(h.host,"Теми").click());
   for(const topic of courseView(h.record,content,now).topics){
    const trigger=islandButton(h.host,topic.title);
    if(mode==="Теми")assert.equal(trigger.type,"button");
    await act(async()=>trigger.click());
    assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,1);
    assert.ok(h.host.querySelector(`section[aria-label="Умения: ${topic.title}"]`));
    assert.equal(h.host.querySelector('[data-camera]'),null);
    assert.equal(h.host.querySelector('[aria-label="Твоето приключение"]'),null);
    assert.equal(h.host.querySelectorAll('[role="progressbar"]').length,0);
    assert.ok(h.host.querySelector(`[aria-label="${topic.title}: ${courseView(h.record,content,now).topics.find(t=>t.id===topic.id)!.gold.earned} злато"]`));
    await act(async()=>button(h.host,"← Към картата").click());
    assert.equal(h.host.querySelectorAll('section[aria-label^="Умения:"]').length,0);
    assert.ok(islandButton(h.host,topic.title));
   }
  }
  assert.equal(JSON.stringify(h.record),saved);assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("map gestures leave island pointer activation to its button",async()=>{
 const h=await mount(null);try{
  const island=islandButton(h.host,"Рачешки задачи");
  const down=new dom.window.Event("mousedown",{bubbles:true,cancelable:true});
  Object.defineProperty(down,"button",{value:0});
  await act(async()=>{island.dispatchEvent(down);island.click();});
  assert.equal(down.defaultPrevented,false,"Map panning must not consume island activation");
  assert.equal(h.host.querySelector("[data-camera]"),null);
  assert.ok(h.host.querySelector('[aria-label="Умения: Рачешки задачи"]'));
 }finally{await h.cleanup();}
});

test("world camera zoom is bounded and focused islands replace the map",async()=>{
 const h=await mount(null);try{
  const camera=()=>h.host.querySelector('[data-camera]')!.getAttribute('data-camera')!;
  const initial=camera();
  await act(async()=>button(h.host,"Цялата карта").click());
  const fit=camera(),floor=Number(fit.split(',')[2]);
  const more=h.host.querySelector<HTMLButtonElement>('[aria-label="Приближи картата"]')!;
  const less=h.host.querySelector<HTMLButtonElement>('[aria-label="Отдалечи картата"]')!;
  assert.equal(initial,fit,"The map opens fully zoomed out");
  assert.equal(less.disabled,true);
  for(let i=0;i<12;i++)await act(async()=>more.click());
  assert.equal(more.disabled,true);assert.ok(Number(camera().split(',')[2])<=floor*4+.002);
  await act(async()=>button(h.host,"Цялата карта").click());assert.equal(camera(),fit);
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());assert.equal(h.host.querySelector("[data-camera]"),null);
  await act(async()=>button(h.host,"← Към картата").click());assert.equal(camera(),fit);
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
  const marker=()=>host.querySelector('[data-skill-marker]')!;
  await act(async()=>show());assert.equal(marker().getAttribute('data-phase'),'untried');
  leaf.milestones.started=true;await act(async()=>show());assert.equal(marker().getAttribute('data-phase'),'started');
  leaf.milestones.firstCorrect='hinted';await act(async()=>show());assert.equal(marker().getAttribute('data-phase'),'correct');
  leaf.confirmation.earned=true;topic.doctor=true;topic.professor=true;
  await act(async()=>show());assert.equal(marker().getAttribute('data-phase'),'confirmed');assert.equal(count('doctor-flag'),1);assert.equal(count('professor-gold'),1);
  leaf.status='practising';leaf.confirmation.revisit=true;
  await act(async()=>show());assert.equal(marker().getAttribute('data-phase'),'confirmed');assert.equal(host.querySelectorAll('[data-skill-marker]').length,1);assert.equal(count('professor-gold'),1);assert.equal(host.querySelector('[data-new-growth]'),null);
  const restored=new Set(knowledgeGrowthKeys([topic]));
  await act(async()=>root.render(<svg><IslandScenery key="reload" topic={topic} variant={0} seen={restored}/></svg>));assert.equal(host.querySelector('[data-new-growth]'),null);
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("a tab keeps commands and recovery reads bound to its rendered child after another tab switches",async()=>{
 const h=await mount("matches",false,"child-a");try{
  document.cookie="maths_child=child-b";
  await act(async()=>button(h.host,"Подсказка").click());
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


test("a child is welcomed by nickname without adding progress or replaying setup",async()=>{
 const h=await mount(null,false,"child-a",undefined,"Звездоброец");try{
  assert.equal(h.host.querySelector("h1")?.textContent,"Здравей, Звездоброец!");
  assert.ok(h.host.textContent!.includes("Пет стъпки. Нови открития. Твое съкровище."));
  assert.equal(h.record.attempts.length,0);
  assert.equal(h.actions.length,0);
  assert.ok(button(h.host,"Започни приключение"));
  await h.reload();
  assert.equal(h.host.querySelector("h1")?.textContent,"Здравей, Звездоброец!");
  assert.equal(h.actions.length,0);
 }finally{await h.cleanup();}
});

test("draft Olympiad map shows exactly four islands and opens each island's skills and practice",async()=>{
 const {olympiadCourseContent}=await import("../src/server/olimpiada-course-content.ts");
 const view=courseView(newKidsCourse(olympiadCourseContent,now),olympiadCourseContent,now),actions:CourseAction[]=[];
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 let selection:{topicId?:string}={};
 const show=()=>root.render(<LearningMap topics={view.topics} progress={view} busy={false} act={async a=>{actions.push(a);}} seenGrowth={new Set()} selection={selection} select={topicId=>{selection={topicId};show();}}/>);
 try{
  await act(async()=>show());assert.equal(host.querySelectorAll('[data-island-scenery]').length,4);
  for(const topic of view.topics){
   await act(async()=>islandButton(host,topic.title).click());
   assert.equal(host.querySelectorAll('button.skillRow').length,topic.skills.length);
   assert.equal(host.querySelector('[role="progressbar"]'),null);
   assert.ok(host.querySelector(`[aria-label="${topic.title}: ${topic.gold.earned} злато"]`));
   for(const skill of topic.skills){
    await act(async()=>host.querySelector<HTMLButtonElement>(`button[aria-label="Упражнения: ${skill.title}"]`)!.click());
    assert.deepEqual(actions.at(-1),{type:"selectTopic",topicId:topic.id,skillId:skill.id});
   }
   await act(async()=>button(host,"Към задачите").click());assert.deepEqual(actions.at(-1),{type:"selectTopic",topicId:topic.id});
   await act(async()=>button(host,"← Към картата").click());
  }
  await act(async()=>button(host,"Теми").click());assert.equal(host.querySelectorAll('section.island').length,4);
  assert.equal(host.querySelectorAll('[role="progressbar"]').length,0);
  assert.equal(host.querySelectorAll('.goldAmount').length,4);
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("both competitions open at whole-map fit and only zoom after choosing an island",async()=>{
 for(const catalogue of [content,olympiadCourseContent]){
  const view=courseView(newKidsCourse(catalogue,now),catalogue,now);
  const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  const buttons={current:new Map<string,HTMLButtonElement>()};
  const seen=new Set<string>();
  const render=(selectedId?:string)=>root.render(<KidsWorldMap topics={view.topics} selectedId={selectedId} panelId="island-panel" seen={seen} buttons={buttons} viewControls={null} onSelect={()=>{}}/>);
  try{
   await act(async()=>render());
   const camera=()=>host.querySelector('[data-camera]')!.getAttribute('data-camera')!;
   const initial=camera();
   const surface=()=>host.querySelector<HTMLElement>("[data-zoomed]")!;
   assert.equal(surface().getAttribute("data-zoomed"),"false");assert.equal(surface().style.touchAction,"pan-y");
   await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Приближи картата"]')!.click());
   assert.equal(surface().getAttribute("data-zoomed"),"true");assert.equal(surface().style.touchAction,"none");
   await act(async()=>button(host,"Цялата карта").click());
   assert.equal(surface().getAttribute("data-zoomed"),"false");assert.equal(surface().style.touchAction,"pan-y");
   assert.equal(host.querySelector<HTMLButtonElement>('[aria-label="Отдалечи картата"]')!.disabled,true);
   assert.equal(host.querySelectorAll('[data-island-scenery]').length,view.topics.length);
   await act(async()=>button(host,"Цялата карта").click());assert.equal(camera(),initial);
   await act(async()=>render(view.topics[1]!.id));assert.ok(Number(camera().split(',')[2])>Number(initial.split(',')[2]));
   await act(async()=>button(host,"Цялата карта").click());assert.equal(camera(),initial);
  }finally{await act(async()=>root.unmount());host.remove();}
 }
});

test("competition dropdown shows both difficulty badges, current choice and dismisses without learning commands",async()=>{
 const choices=competitions.filter(item=>item.id!=="nvo");
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  for(const current of choices){
   await act(async()=>root.render(<CompetitionPicker key={current.id} choices={choices} competitionId={current.id}/>));
   const trigger=host.querySelector<HTMLButtonElement>('button')!;
   assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.ok(trigger.textContent!.includes(current.title));
   assert.equal(host.querySelector('nav'),null);
   await act(async()=>trigger.click());
   const nav=host.querySelector('nav[aria-label="Състезания"]')!;
   assert.equal(trigger.getAttribute('aria-controls'),nav.id);
   assert.equal(nav.querySelectorAll('a').length,choices.length);
   for(const choice of choices){
    const link=nav.querySelector(`a[href="/?competition=${choice.id}"]`)!;
    assert.ok(link.textContent!.includes(choice.title));assert.ok(link.textContent!.includes(competitionDifficultyLabel(choice.difficulty)));
    assert.equal(link.getAttribute('aria-current'),choice.id===current.id?'page':null);
   }
   const escape=new dom.window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(escape,'key',{value:'Escape'});
   await act(async()=>trigger.dispatchEvent(escape));assert.equal(host.querySelector('nav'),null);
   await act(async()=>trigger.click());
   await act(async()=>document.body.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true})));
   assert.equal(host.querySelector('nav'),null);
  }
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("a chosen subtopic opens its exercises, resumes after home and removes duplicate home context",async()=>{
 const h=await mount(null,false,undefined,competitions[0]!.id);try{
  assert.equal(h.host.querySelector(".competitionTitle"),null);
  assert.ok(!h.host.textContent!.includes("Всяко умение оставя следа"));
  await act(async()=>islandButton(h.host,"Рачешки задачи").click());
  const skill=content.topics.find(t=>t.id==="backwards")!.skills[2]!;
  await act(async()=>h.host.querySelector<HTMLButtonElement>(`button[aria-label="Упражнения: ${skill.title}"]`)!.click());
  assert.equal(courseView(h.record,content,now).task!.skillId,skill.id);
  assert.equal(h.record.active!.skillId,skill.id);
  assert.ok(h.host.querySelector(".competitionTitle"));
  primary(h.host,"Провери отговора");
  await act(async()=>button(h.host,"Подсказка").click());
  const key=courseView(h.record,content,now).task!.key;
  await act(async()=>button(h.host,"← Начало").click());
  assert.equal(h.host.querySelector(".competitionTitle"),null);
  await h.reload();
  await act(async()=>button(h.host,"Продължи: Рачешки задачи").click());
  assert.equal(courseView(h.record,content,now).task!.key,key);
  assert.equal(courseView(h.record,content,now).task!.hintLevel,1);
 }finally{await h.cleanup();}
});


test("task source footer shows only competition and actual year, including old saved labels", async () => {
 for (const [catalogue, competition] of [[content, competitions[0]!], [olympiadCourseContent, competitions[1]!], [nvoCourseContent, competitions[2]!]] as const) {
  const topic = catalogue.topics[0]!;
  let record = applyCourseAction(newKidsCourse(catalogue, now), catalogue, {type:"selectTopic",topicId:topic.id}, now);
  const work = record.topics[topic.id]!.work.core!;
  work.attempt.problem.source = "Нова учебна задача · стар запазен етикет · по 2026-M1-16";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
   if (init?.method === "POST") record = applyCourseAction(record, catalogue, JSON.parse(String(init.body)).action, now);
   return Response.json({course:courseView(record,catalogue,now)});
  };
  const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  try {
   await act(async()=>root.render(<KidsCoursePlayer initialView={courseView(record,catalogue,now)} competitionId={competition.id}/>));
   await act(async()=>button(host,`Продължи: ${courseView(record,catalogue,now).topics.find(t=>t.id===courseView(record,catalogue,now).active?.topicId)!.title}`).click());
   const footer=host.querySelector('a[href^="/sources?"]')!;
   assert.ok(footer); assert.equal(footer.textContent,`${competition.title} · ${work.attempt.problem.provenance!.year}`);
   assert.equal(footer.parentElement!.textContent,footer.textContent);
   assert.ok(!host.textContent!.includes("стар запазен етикет"));
  } finally {await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;}
 }
});


test("numeric drafts flush before home and pause and restore after reload without grading",async()=>{
 const h=await mount("grids",false,undefined,undefined,undefined,true);try{
  const task=courseView(h.record,content,now).task!;
  await act(async()=>button(h.host,"5").click());
  await act(async()=>button(h.host,"6").click());
  await act(async()=>button(h.host,"← Начало").click());
  assert.equal(h.record.attempts.length,0);assert.equal(courseView(h.record,content,now).gold,0);
  assert.deepEqual(courseView(h.record,content,now).task!.draft,["56"]);
  assert.equal(h.actions.at(-1)!.type,"saveDraft");
  assert.equal(h.actions.filter(a=>a.type==="dashboard").length,0);
  await h.reload();await act(async()=>button(h.host,`Продължи: ${courseView(h.record,content,now).topics.find(t=>t.id==="areas")!.title}`).click());
  assert.equal(h.host.querySelector<HTMLInputElement>("input")!.value,"56");
  await act(async()=>button(h.host,"Провери отговора").click());
  assert.equal(courseView(h.record,content,now).task!.draft,undefined);
  await act(async()=>button(h.host,"Следващо подусловие").click());
  assert.equal(h.host.querySelector<HTMLInputElement>("input")!.value,"");
  await act(async()=>button(h.host,"6").click());
  await act(async()=>button(h.host,"Почивка").click());await h.reload();
  await act(async()=>button(h.host,`Продължи: ${courseView(h.record,content,now).topics.find(t=>t.id==="areas")!.title}`).click());
  assert.equal(h.host.querySelector<HTMLInputElement>("input")!.value,"6");
  assert.equal(courseView(h.record,content,now).task!.key,task.key);
  assert.equal(courseView(h.record,content,now).task!.part!.index,2);
  assert.equal(h.record.attempts.length,0);
 }finally{await h.cleanup();}
});

test("Home and Map keep typed work mounted when a draft save fails, then navigate after a successful retry",async()=>{
 for(const destination of ["← Начало","Карта"]){
  const h=await mount("grids",false,undefined,undefined,undefined,true),fetchCourse=globalThis.fetch;
  let failSave=true,saveRequests=0;
  try{
   globalThis.fetch=async(url,init)=>{
    if(init?.method==="POST" && JSON.parse(String(init.body)).action.type==="saveDraft"){
     saveRequests++;
     if(failSave) return Response.json({error:"Не успяхме да запазим. Опитай отново."},{status:503});
    }
    return fetchCourse(url,init);
   };
   await act(async()=>button(h.host,"5").click());
   await act(async()=>button(h.host,"6").click());
   const input=h.host.querySelector<HTMLInputElement>("input")!;
   await act(async()=>button(h.host,destination).click());
   assert.ok(h.host.querySelector("input")===input,"Failed saving must not unmount the question");
   assert.equal(input.value,"56");
   assert.ok(h.host.querySelector('[role="alert"]'));
   assert.equal(courseView(h.record,content,now).task!.draft,undefined);
   assert.equal(h.record.attempts.length,0);
   failSave=false;
   await act(async()=>button(h.host,destination).click());
   assert.equal(saveRequests,2,"Retry must save the retained draft before navigating");
   assert.deepEqual(courseView(h.record,content,now).task!.draft,["56"]);
   assert.equal(h.host.querySelector("input"),null);
   assert.equal(h.host.querySelector('[role="alert"]'),null);
   assert.equal(h.actions.filter(a=>a.type==="dashboard").length,0);
   if(destination==="Карта") assert.ok(h.host.querySelector('[aria-label="Умения: Лица и мрежи"]'));
   await h.reload();
   await act(async()=>button(h.host,`Продължи: ${courseView(h.record,content,now).topics.find(t=>t.id==="areas")!.title}`).click());
   assert.equal(h.host.querySelector<HTMLInputElement>("input")!.value,"56");
  }finally{await h.cleanup();}
 }
});

test("choice zero autosaves without submission, restores and clears when help opens",async()=>{
 const h=await mount();try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  await act(async()=>new Promise(resolve=>setTimeout(resolve,450)));
  assert.deepEqual(courseView(h.record,content,now).task!.draft,["0"]);assert.equal(h.record.attempts.length,0);
  await h.reload();await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
  assert.equal(h.host.querySelector('[aria-label="Отговори"] button')!.getAttribute("aria-pressed"),"true");
  await act(async()=>button(h.host,"Подсказка").click());
  assert.equal(h.host.querySelectorAll('[aria-label="Отговори"] [aria-pressed="true"]').length,0);
  assert.equal(courseView(h.record,content,now).gold,0);assert.equal(h.record.attempts.length,0);
  await act(async()=>button(h.host,"← Начало").click());await h.reload();
  await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
  assert.equal(primary(h.host,"Провери отговора").disabled,true);
 }finally{await h.cleanup();}
});

test("stale draft cannot overwrite another device or automatically submit a typed answer",async()=>{
 const h=await mount("grids",false,undefined,undefined,undefined,true);try{
  await act(async()=>button(h.host,"5").click());
  const key=courseView(h.record,content,now).task!.key;
  h.advance({type:"saveDraft",taskKey:key,partIndex:0,answers:["99"]});
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.ok(h.host.querySelector('[role="alert"]'));
  assert.deepEqual(courseView(h.record,content,now).task!.draft,["99"]);
  assert.equal(h.record.attempts.length,0);assert.equal(h.actions.filter(a=>a.type==="answer").length,0);
  await h.reload();await act(async()=>button(h.host,`Продължи: ${courseView(h.record,content,now).topics.find(t=>t.id==="areas")!.title}`).click());
  assert.equal(h.host.querySelector<HTMLInputElement>("input")!.value,"99");
 }finally{await h.cleanup();}
});


test("exhausted exact-subtopic practice returns to its island", async () => {
 const record = applyCourseAction(newKidsCourse(content, now), content, {type:"selectTopic", topicId:"matches", skillId:content.topics.find(t=>t.id==="matches")!.skills[0]!.id}, now);
 const view = {...courseView(record, content, now), exhausted:true, task:undefined};
 const originalFetch = globalThis.fetch;
 globalThis.fetch = async () => Response.json({course:view});
 const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
 try {
  await act(async () => root.render(<KidsCoursePlayer initialView={view}/>));
  await act(async () => button(host,"Продължи: Точки и мачове").click());
  await act(async () => primary(host,"Към острова").click());
  assert.ok(button(host,"Към задачите"));
  assert.ok(button(host,"← Към картата"));
 } finally {
  await act(async () => root.unmount()); host.remove(); globalThis.fetch = originalFetch;
 }
});


test("NVO dropdown shows all three difficulty badges and its whole map contains six islands",async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<CompetitionPicker choices={[...competitions]} competitionId="nvo"/>));
  assert.ok(host.textContent!.includes("Лесно"));
  await act(async()=>host.querySelector<HTMLButtonElement>("button")!.click());
  const links=[...host.querySelectorAll("nav a")];assert.equal(links.length,competitions.length);
  assert.ok(links.find(a=>a.textContent!.includes("НВО"))!.textContent!.includes("Лесно"));
  assert.equal(links.filter(a=>a.textContent!.includes("Трудно")).length,3);
  assert.equal(links.filter(a=>a.textContent!.includes("Средно")).length,1);
  const view=courseView(newKidsCourse(nvoCourseContent,now),nvoCourseContent,now);
  let selected="";
  await act(async()=>root.render(<KidsWorldMap topics={view.topics} panelId="nvo-panel" seen={new Set()} buttons={{current:new Map()}} viewControls={null} onSelect={id=>{selected=id;}}/>));
  assert.equal(host.querySelectorAll("[data-island-scenery]").length,6);
  for(const topic of view.topics){
   const place=islandPlaces[topic.id]!;assert.ok(place && place.x>0 && place.x<1100 && place.y>0 && place.y<710);
   const island=host.querySelector<HTMLButtonElement>(`button[aria-label="${topic.title}"]`)!;
   assert.ok(island);await act(async()=>island.click());assert.equal(selected,topic.id);
  }
  assert.equal(button(host,"−").disabled,true);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("problem gold preview stays compact and uses the actual ledger amount in feedback", async()=>{
 const {ProblemGoldPreview,GoldReward}=await import("../components/kids-adventure.tsx");
 const host=document.createElement("div"),root=createRoot(host);
 try{
  await act(async()=>root.render(<ProblemGoldPreview reward={{amount:25}}/>));
  assert.equal(host.textContent,"25");assert.ok(host.querySelector('[aria-label="Награда за задачата: 25 злато"]'));
  await act(async()=>root.render(<ProblemGoldPreview reward={{amount:10}}/>));
  assert.equal(host.textContent,"10");
  await act(async()=>root.render(<GoldReward gain={{amount:25,awards:[{skillId:"a",milestone:"correct",earnedAt:now}],problems:[{key:"source:hard",skillId:"a",earnedAt:now,amount:15}]}}/>));
  assert.ok(String(host.textContent).includes("Решена задача +15"));
 }finally{await act(async()=>root.unmount());}
});


test("Home and Map retain the selected island, view mode and exact helped task without navigation commands",async()=>{
 const h=await mount(null);try{
  await act(async()=>button(h.host,"Теми").click());
  await practise(h.host,"Рачешки задачи");
  await act(async()=>button(h.host,"Подсказка").click());
  const key=courseView(h.record,content,now).task!.key;
  const before=JSON.stringify(h.record),commands=h.actions.length;
  await act(async()=>button(h.host,"Карта").click());
  assert.ok(h.host.querySelector('[aria-label="Умения: Рачешки задачи"]'));
  assert.equal(h.host.querySelector('[aria-label="Твоето приключение"]'),null);
  assert.equal(h.actions.length,commands);
  assert.equal(JSON.stringify(h.record),before);
  await act(async()=>button(h.host,"← Към картата").click());
  assert.equal(button(h.host,"Теми").getAttribute("aria-pressed"),"true");
  assert.equal(h.host.querySelectorAll("section.island").length,16);
  await practise(h.host,"Рачешки задачи");
  assert.equal(courseView(h.record,content,now).task!.key,key);
  assert.equal(h.host.querySelectorAll("aside li").length,1);
  const navigationCommands=h.actions.length,afterResume=JSON.stringify(h.record);
  await act(async()=>button(h.host,"← Начало").click());
  assert.ok(h.host.querySelector('[aria-label="Твоето приключение"]'));
  assert.equal(h.actions.length,navigationCommands);
  assert.equal(JSON.stringify(h.record),afterResume);
 }finally{await h.cleanup();}
});

test("answering keeps Hint beside Check in the measured action bar and one compact adventure count",async()=>{
 const h=await mount(null);try{
  await act(async()=>button(h.host,"Започни приключение").click());
  const bar=h.host.querySelector('[aria-label="Следващо действие"]')!;
  assert.deepEqual([...bar.querySelectorAll("button")].map(b=>b.textContent),["Подсказка","Провери отговора"]);
  assert.equal(h.host.querySelectorAll(".questCount").length,1);
  assert.equal(h.host.querySelectorAll(".questTrail .voyageStops").length,0);
  assert.equal(h.host.querySelectorAll(".questTrail .voyageBoat").length,1);
  await act(async()=>button(h.host,"Подсказка").click());
  assert.ok(bar.contains(button(h.host,"Следваща подсказка")));
  assert.equal(h.host.querySelectorAll("aside li").length,1);
  assert.equal(h.record.quest!.completed,0);
 }finally{await h.cleanup();}
});


test("published competition dashboards keep all five choices visible",async()=>{
 const choices=publishedCompetitions();
 assert.equal(choices.length,5);
 const catalogues=[content,olympiadCourseContent,nvoCourseContent,proletnoCourseContent,regionalOlympiadCourseContent];
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  for(const [index,current] of choices.entries()){
   const catalogue=catalogues[index]!;
   await act(async()=>root.render(<KidsCoursePlayer key={current.id} competitionId={current.id} competitionChoices={choices} initialView={courseView(newKidsCourse(catalogue,now),catalogue,now)}/>));
   const trigger=host.querySelector<HTMLButtonElement>('button[aria-label^="Избери състезание:"]');
   assert.ok(trigger,`Missing selector on ${current.id}`);
   assert.ok(trigger.textContent!.includes(current.title));
   await act(async()=>trigger.click());
   const links=host.querySelectorAll('nav[aria-label="Състезания"] a');
   assert.equal(links.length,5);
   for(const choice of choices)assert.ok([...links].some(link=>link.getAttribute("href")===`/?competition=${choice.id}`));
  }
 }finally{await act(async()=>root.unmount());host.remove();}
});


test("feedback modal keeps typed exercise work mounted, preserves failed message and prevents duplicate sends", async () => {
 const h = await mount("grids", false, "child-a"), fetchCourse = globalThis.fetch;
 let fail = true, reports = 0; const bodies: Record<string, unknown>[] = [];
 try {
  globalThis.fetch = async (url, init) => {
   if (url === "/api/reports") { reports++; bodies.push(JSON.parse(String(init?.body))); return Response.json({}, { status: fail ? 503 : 200 }); }
   return fetchCourse(url, init);
  };
  const modal = h.host.querySelector<HTMLDialogElement>("dialog")!;
  modal.showModal = () => { modal.setAttribute("open", ""); };
  modal.close = () => { modal.removeAttribute("open"); modal.dispatchEvent(new dom.window.Event("close")); };
  await act(async () => button(h.host, "5").click());
  await act(async () => button(h.host, "6").click());
  const input = h.host.querySelector<HTMLInputElement>("input")!, taskKey = courseView(h.record, content, now).task!.key;
  await openFeedback(h.host);
  const textarea = modal.querySelector<HTMLTextAreaElement>("textarea")!;
  await act(async () => {
   Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "Подсказката не е ясна.");
   textarea.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  assert.equal(button(modal, "Изпрати").disabled, false);
  await act(async () => modal.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(reports, 1); assert.ok(modal.querySelector('[role="alert"]'));
  assert.equal(textarea.value, "Подсказката не е ясна.");
  assert.equal(h.host.querySelector("input"), input); assert.equal(input.value, "56");
  assert.deepEqual(bodies[0], { childId: "child-a", competitionId: "matematika-za-vseki", taskKey, description: "Подсказката не е ясна." });
  fail = false;
  await act(async () => {
   const form = modal.querySelector("form")!;
   form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
   form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  });
  assert.equal(reports, 2); assert.ok(modal.textContent!.includes("Благодарим! Получихме съобщението."));
  assert.equal(h.host.querySelector("input"), input); assert.equal(input.value, "56");
  assert.equal(h.record.attempts.length, 0); assert.equal(h.record.goldAwards?.length ?? 0, 0);
  assert.ok(!h.actions.some(action => ["answer", "selectTopic", "dashboard"].includes(action.type)));
  await act(async () => button(modal, "Затвори").click());
  await openFeedback(h.host);
  assert.equal(modal.querySelector<HTMLTextAreaElement>("textarea")!.value, "");
 } finally { await h.cleanup(); }
});

test("technical draft and version errors offer reload without resetting or resubmitting an answer", async () => {
 for (const error of ["Невалидна чернова", "Нужна е съвместима версия"]) {
  const h = await mount(), fetchCourse = globalThis.fetch;
  try {
   globalThis.fetch = async (url, init) => init?.method === "POST" ? Response.json({ error }, { status: 400 }) : fetchCourse(url, init);
   const before = JSON.stringify(h.record), actionCount = h.actions.length;
   await act(async () => button(h.host, "Подсказка").click());
   assert.ok(h.host.querySelector('[role="alert"]')!.textContent!.includes("Не успяхме да продължим. Презареди страницата."));
   assert.ok(!h.host.textContent!.includes(error));
   let reloaded = false;
   const priorLocation = window.location;
   Object.defineProperty(window, "location", { configurable: true, value: { reload() { reloaded = true; } } });
   try { await act(async () => button(h.host, "Презареди страницата").click()); assert.equal(reloaded, true); }
   finally { Object.defineProperty(window, "location", { configurable: true, value: priorLocation }); }
   assert.equal(JSON.stringify(h.record), before); assert.equal(h.actions.length, actionCount);
  } finally { await h.cleanup(); }
 }
});

const {KidsCompetitionPlayer}=await import("../components/kids-competition-player.tsx");
function mockHistory(){
 const originalLocation=Object.getOwnPropertyDescriptor(window,"location"),originalHistory=Object.getOwnPropertyDescriptor(window,"history");
 const location={search:"",assignments:[] as string[],assign(url:string){this.assignments.push(url);}};
 const history={pushState(_state:unknown,_title:string,url:string){location.search=new URL(url,"http://localhost").search;},replaceState(_state:unknown,_title:string,url:string){location.search=new URL(url,"http://localhost").search;}};
 Object.defineProperty(window,"location",{value:location,configurable:true});Object.defineProperty(window,"history",{value:history,configurable:true});
 return {location,restore(){for(const [name,descriptor] of [["location",originalLocation],["history",originalHistory]] as const){if(descriptor)Object.defineProperty(window,name,descriptor);else Reflect.deleteProperty(window,name);}}};
}
async function chooseCompetition(host:HTMLElement,id:string){
 await act(async()=>host.querySelector<HTMLButtonElement>('button[aria-label^="Избери състезание:"]')!.click());
 const link=host.querySelector<HTMLAnchorElement>(`a[href="/?competition=${id}"]`);assert.ok(link);
 await act(async()=>link.dispatchEvent(new dom.window.Event("click",{bubbles:true,cancelable:true})));
}
test("stale competition revisits render private snapshots immediately and gate actions until fresh GET",async()=>{
 const originalNow=Date.now;let clock=originalNow();Date.now=()=>clock;
 const originalFetch=globalThis.fetch,history=mockHistory(),pending:((response:Response)=>void)[]=[],headers:Headers[]=[];
 const choices=publishedCompetitions(),initial=courseView(newKidsCourse(content,now),content,now),nvo=courseView(newKidsCourse(nvoCourseContent,now),nvoCourseContent,now);
 globalThis.fetch=async(_url,init)=>{headers.push(new Headers(init?.headers));assert.equal(init?.cache,"no-store");return new Promise(resolve=>pending.push(resolve));};
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={choices} initialView={initial}/>));
  assert.equal(pending.length,0);
  await chooseCompetition(host,"nvo");assert.ok(host.textContent!.includes("Обновяване…"));assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null);
  await act(async()=>pending.shift()!(Response.json({course:nvo})));
  assert.ok(host.textContent!.includes(nvo.topics[0]!.title));
  clock+=30_001;
  await chooseCompetition(host,choices[0]!.id);
  assert.ok(host.textContent!.includes("Точки и мачове"),"cached map renders before the deferred response");
  assert.equal(button(host,"Започни приключение").disabled,true);
  const changed={...initial,revision:3,gold:123,topics:initial.topics.map((topic,index)=>index===0?{...topic,doctor:true}:topic)};
  await act(async()=>pending.shift()!(Response.json({course:changed})));
  assert.equal(button(host,"Започни приключение").disabled,false);assert.ok(host.textContent!.includes("123"));
  clock+=30_001;
  await chooseCompetition(host,"nvo");
  await act(async()=>pending.shift()!(Response.json({course:{...nvo,revision:2,gold:123}})));
  clock+=30_001;
  await chooseCompetition(host,choices[0]!.id);
  await act(async()=>pending.shift()!(Response.json({course:{...initial,revision:1,gold:0}})));
  assert.ok(host.textContent!.includes("Не успяхме да обновим"));assert.ok(host.textContent!.includes("123"));assert.equal(button(host,"Започни приключение").disabled,true);
  assert.ok(headers.every(h=>h.get("X-Maths-Child")==="child-a"));
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;Date.now=originalNow;history.restore();}
});

test("competition refresh ignores obsolete replies and clears private display on denied access",async()=>{
 const originalFetch=globalThis.fetch,history=mockHistory(),pending:((response:Response)=>void)[]=[];
 const initial=courseView(newKidsCourse(content,now),content,now),nvo=courseView(newKidsCourse(nvoCourseContent,now),nvoCourseContent,now);
 globalThis.fetch=async()=>new Promise(resolve=>pending.push(resolve));
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={initial}/>));
  await chooseCompetition(host,"nvo");await chooseCompetition(host,"olimpiada");
  await act(async()=>pending[0]!(Response.json({course:nvo})));
  assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null);assert.ok(host.textContent!.includes("Олимпиада"));
  await act(async()=>pending[1]!(Response.json({}, {status:403})));
  assert.deepEqual(history.location.assignments,["/login?denied=1"]);assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null);
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
});

test("browser competition changes flush pending drafts and retain the current exercise on save failure",async()=>{
 for(const fail of [true,false]){
  const originalFetch=globalThis.fetch,history=mockHistory();let record=applyCourseAction(newKidsCourse(content,now),{...content,connectedProblem:undefined},{type:"selectTopic",topicId:"grids"},now);const actions:CourseAction[]=[];
  globalThis.fetch=async(_url,init)=>{
   const id=new Headers(init?.headers).get("X-Maths-Competition");
   if(init?.method==="POST"){
    const {action}=JSON.parse(String(init.body)) as {action:CourseAction};
    if(fail&&action.type==="saveDraft")return Response.json({error:"Не успяхме да запазим. Опитай отново."},{status:500});
    actions.push(action);record=applyCourseAction(record,content,action,now);
   }
   return Response.json({course:id==="nvo"?courseView(newKidsCourse(nvoCourseContent,now),nvoCourseContent,now):courseView(record,content,now)});
  };
  const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={courseView(record,content,now)}/>));
   await act(async()=>button(host,`Продължи: Лица и мрежи`).click());
   await act(async()=>button(host,"7").click());
   history.location.search="?competition=nvo";
   await act(async()=>window.dispatchEvent(new dom.window.Event("popstate")));
   if(fail){assert.ok(host.querySelector('[role="alert"]'));assert.ok(host.querySelector('[aria-label="Следващо действие"]'));assert.ok(history.location.search.includes(DEFAULT_COMPETITION_ID));assert.equal(host.querySelector<HTMLInputElement>("input")!.value,"7");}
   else{assert.ok(actions.some(action=>action.type==="saveDraft"&&action.answers[0]==="7"));assert.ok(host.textContent!.includes("НВО"));}
  }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
 }
});

test("focus saves local input before refresh, restores newer remote drafts and denies obsolete account replies",async()=>{
 const originalFetch=globalThis.fetch,history=mockHistory(),pending:((response:Response)=>void)[]=[];
 let record=applyCourseAction(newKidsCourse(content,now),{...content,connectedProblem:undefined},{type:"selectTopic",topicId:"grids"},now);
 const actions:CourseAction[]=[];
 globalThis.fetch=async(_url,init)=>{
  if(init?.method==="POST"){
   const {action}=JSON.parse(String(init.body)) as {action:CourseAction};actions.push(action);record=applyCourseAction(record,content,action,now);
   return Response.json({course:courseView(record,content,now)});
  }
  return new Promise(resolve=>pending.push(resolve));
 };
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={courseView(record,content,now)}/>));
  await act(async()=>button(host,`Продължи: Лица и мрежи`).click());
  await act(async()=>button(host,"7").click());
  await act(async()=>window.dispatchEvent(new dom.window.Event("focus")));
  assert.equal(actions.at(-1)?.type,"saveDraft");assert.deepEqual(courseView(record,content,now).task!.draft,["7"]);
  assert.equal(button(host,"Провери отговора").disabled,true);
  const task=courseView(record,content,now).task!;
  record=applyCourseAction(record,content,{type:"saveDraft",taskKey:task.key,partIndex:0,answers:["8"]},now);
  await act(async()=>pending.shift()!(Response.json({course:courseView(record,content,now)})));
  assert.equal(host.querySelector<HTMLInputElement>("input")!.value,"8");assert.equal(button(host,"Провери отговора").disabled,false);
  await act(async()=>button(host,"← Начало").click());
  await chooseCompetition(host,"nvo");await chooseCompetition(host,"olimpiada");
  await act(async()=>pending.shift()!(Response.json({}, {status:401})));
  assert.deepEqual(history.location.assignments,["/login"]);
  assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null);
  await act(async()=>pending.shift()!(Response.json({course:courseView(newKidsCourse(olympiadCourseContent,now),olympiadCourseContent,now)})));
  assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null,"later success must not restore a denied learner's cache");
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
});


test("home and menu navigation await pending drafts and retain failed input",async()=>{
 for(const href of ["/about","/profiles","/progress?child=child-a"]){
  for(const fail of [false,true]){
   const h=await mount("grids",false,"child-a"),fetchCourse=globalThis.fetch,routes:string[]=[];
   Object.assign(globalThis,{__courseRoutes:routes});
   let finish:((response:Response)=>void)|undefined,submitted:CourseAction|undefined;
   try{
    globalThis.fetch=async(url,init)=>{
     if(init?.method==="POST"){
      const {action}=JSON.parse(String(init.body)) as {action:CourseAction};
      if(action.type==="saveDraft"){submitted=action;return new Promise(resolve=>{finish=resolve;});}
     }
     return fetchCourse(url,init);
    };
    await act(async()=>button(h.host,"7").click());
    const input=h.host.querySelector<HTMLInputElement>("input")!;
    assert.equal(h.host.querySelector("footer"),null);
    await act(async()=>button(h.host,"← Начало").click());
    assert.equal(submitted?.type,"saveDraft");assert.deepEqual(submitted?.answers,["7"]);assert.deepEqual(routes,[]);
    assert.equal(input.value,"7");
    const modal=h.host.querySelector<HTMLDialogElement>("dialog")!;
    modal.showModal=()=>{modal.setAttribute("open","");};
    await openFeedback(h.host);
    assert.ok(modal.hasAttribute("open"),"pending route save must not block feedback");
    if(!fail)h.advance(submitted!);
    await act(async()=>finish!(fail?Response.json({error:"Не успяхме да запазим."},{status:500}):Response.json({course:courseView(h.record,content,now)})));
    assert.deepEqual(routes,[]);
    if(!fail){
     assert.equal(h.host.querySelector("footer"),null);
     await act(async()=>h.host.querySelector<HTMLButtonElement>('button[aria-label="Меню"]')!.click());
     assert.equal(h.host.querySelectorAll('nav[aria-label="Основна навигация"] a').length,4);
     await act(async()=>h.host.querySelector<HTMLAnchorElement>(`nav[aria-label="Основна навигация"] a[href="${href}"]`)!.dispatchEvent(new dom.window.Event("click",{bubbles:true,cancelable:true})));
     assert.deepEqual(routes,[href]);
    }
    if(fail){assert.ok(h.host.querySelector('[role="alert"]'));assert.equal(h.host.querySelector("input"),input);assert.equal(input.value,"7");}
   }finally{Reflect.deleteProperty(globalThis,"__courseRoutes");await h.cleanup();}
  }
 }
});

test("all reconciliation reads and navigation retry posts purge private state on access denial",async()=>{
 for(const path of ["network","conflict-read","retry-post"] as const){
  for(const status of [401,403,428]){
   const originalFetch=globalThis.fetch,history=mockHistory(),initial=courseView(newKidsCourse(content,now),content,now),requests:string[]=[];
   globalThis.fetch=async(_url,init)=>{
    const method=init?.method??"GET";requests.push(method);
    if(requests.length===1){if(path==="network")throw new Error("Lost response");return Response.json({},{status:409});}
    if(path==="retry-post"&&method==="GET")return Response.json({course:{...initial,revision:initial.revision+1}});
    return Response.json({},{status});
   };
   const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
   try{
    await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={initial}/>));
    await act(async()=>button(host,"Започни приключение").click());
    assert.deepEqual(requests,path==="retry-post"?["POST","GET","POST"]:["POST","GET"]);
    assert.deepEqual(history.location.assignments,[status===401?"/login":status===403?"/login?denied=1":"/profiles"]);
    assert.equal(host.querySelector('[aria-label="Карта на ученето"]'),null);
    assert.equal(host.querySelector("header"),null,"denied recovery must remove private player immediately");
   }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
  }
 }
});


test("quiet feedback remains on main, island, task and pause and includes only visible task context",async()=>{
 const h=await mount("grids",false,"child-a"),fetchCourse=globalThis.fetch;
 const bodies:Record<string,unknown>[]=[];
 try{
  globalThis.fetch=async(url,init)=>{if(url==="/api/reports"){bodies.push(JSON.parse(String(init?.body)));return Response.json({});}return fetchCourse(url,init);};
  async function check(taskVisible:boolean){
   assert.equal(h.host.querySelector("footer"),null);
   assert.equal([...h.host.querySelectorAll("button")].filter(item=>item.textContent==="Обратна връзка").length,1);
   const modal=h.host.querySelector<HTMLDialogElement>("dialog")!;
   modal.showModal=()=>modal.setAttribute("open","");
   modal.close=()=>{modal.removeAttribute("open");modal.dispatchEvent(new dom.window.Event("close"));};
   await openFeedback(h.host);
   const textarea=modal.querySelector<HTMLTextAreaElement>("textarea")!;
   await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,"value")!.set!.call(textarea,"Тестова обратна връзка");textarea.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
   await act(async()=>modal.querySelector("form")!.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true})));
   assert.equal(bodies.at(-1)?.taskKey,taskVisible?courseView(h.record,content,now).task!.key:undefined);
   assert.equal(bodies.at(-1)?.childId,"child-a");
   await act(async()=>button(modal,"Затвори").click());
  }
  await check(true);
  await act(async()=>button(h.host,"← Начало").click());await check(false);
  await act(async()=>islandButton(h.host,"Точки и мачове").click());await check(false);
  await act(async()=>button(h.host,"Към задачите").click());await check(true);
  await act(async()=>button(h.host,"Почивка").click());await check(false);
  assert.equal(h.record.attempts.length,0);
 }finally{await h.cleanup();}
});


test("derived task footers use the same linked competition/year pattern without internal codes",async()=>{
 for(const [catalogue,competition] of [[content,competitions[0]!],[olympiadCourseContent,competitions[1]!]] as const){
  const practice=catalogueProblems(catalogue).find(p=>!isCompetitionProblem(p))!;
  const topic=catalogue.topics.find(t=>t.skills.some(s=>s.id===practice.skillId))!;
  const record=applyCourseAction(newKidsCourse(catalogue,now),catalogue,{type:"selectTopic",topicId:topic.id},now);
  record.topics[topic.id]!.work.core!.attempt.problem=practice;
  const originalFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({course:courseView(record,catalogue,now)});
  const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(<KidsCoursePlayer initialView={courseView(record,catalogue,now)} competitionId={competition.id}/>));
   await act(async()=>button(host,`Продължи: ${courseView(record,catalogue,now).topics.find(t=>t.id===courseView(record,catalogue,now).active?.topicId)!.title}`).click());
   const footer=host.querySelector('a[href^="/sources?"]')!;
   assert.ok(footer);assert.equal(footer.textContent,`По ${competition.title} · ${problemSource(practice,catalogue).sourceYear}`);
   assert.equal(footer.parentElement!.textContent,footer.textContent);
  }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;}
 }
});


test("fresh competition revisits reuse private snapshots and retain the latest global wallet",async()=>{
 const originalFetch=globalThis.fetch,history=mockHistory();let gets=0;
 const initial=courseView(newKidsCourse(content,now),content,now);
 globalThis.fetch=async()=>{gets++;return Response.json({course:{...courseView(newKidsCourse(nvoCourseContent,now),nvoCourseContent,now),gold:123}});};
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={initial}/>));
  await chooseCompetition(host,"nvo");assert.equal(gets,1);
  await chooseCompetition(host,DEFAULT_COMPETITION_ID);
  assert.equal(gets,1);assert.equal(button(host,"Започни приключение").disabled,false);assert.ok(host.textContent!.includes("123"));
  await chooseCompetition(host,"nvo");assert.equal(gets,1);
  await act(async()=>window.dispatchEvent(new dom.window.Event("focus")));
  assert.equal(gets,2,"focus revalidates even a fresh private snapshot");
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
});

test("an immediate answer atomically includes its matching pending draft in one save",async()=>{
 const h=await mount();try{
  await act(async()=>h.host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
  const before=h.actions.length;
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.deepEqual(h.actions.slice(before).map(action=>action.type),["answer"]);
  assert.equal(h.record.attempts.length,1);
 }finally{await h.cleanup();}
});

test("an immediate numeric answer coalesces its exact pending draft into one save",async()=>{
 const h=await mount("sequences");try{
  const attempt=h.record.topics.sequences!.work.core!.attempt;
  assert.equal(courseView(h.record,content,now).task!.part,undefined);assert.equal(attempt.problem.options,undefined);
  const before=h.actions.length,revision=h.record.revision,answers=attempt.problem.fields.map(field=>field.answer);
  for(const digit of answers[0]!)await act(async()=>button(h.host,digit).click());
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.deepEqual(h.actions.slice(before),[{type:"answer",taskKey:attempt.key,answers,reasoning:""}]);
  assert.equal(h.record.revision,revision+1);assert.equal(h.record.attempts.length,1);
  assert.deepEqual(h.record.attempts[0]!.answers,answers);assert.equal(h.record.attempts[0]!.outcome,"independent");
  assert.equal(courseView(h.record,content,now).task!.draft,undefined);
 }finally{await h.cleanup();}
});

test("immediate numeric multipart answers coalesce only the current part and award the original once",async()=>{
 const h=await mount("grids",false,undefined,undefined,undefined,true);try{
  const attempt=h.record.topics.grids!.work.core!.attempt;
  const answers=attempt.problem.fields.map(field=>field.answer);
  assert.equal(answers.length,3);
  for(const [part,answer] of answers.entries()){
   assert.equal(courseView(h.record,content,now).task!.part!.index,part+1);
   const before=h.actions.length,revision=h.record.revision;
   for(const digit of answer)await act(async()=>button(h.host,digit).click());
   await act(async()=>primary(h.host,"Провери отговора").click());
   assert.deepEqual(h.actions.slice(before),[{type:"answer",taskKey:attempt.key,answers:[answer],reasoning:""}]);
   assert.equal(h.record.revision,revision+1,"each part is submitted with one revision-guarded save");
   assert.deepEqual(h.record.topics.grids!.work.core!.attempt.answers,answers.slice(0,part+1));
   assert.equal(courseView(h.record,content,now).task!.draft,undefined);
   if(part<answers.length-1){
    assert.equal(h.record.attempts.length,0);assert.equal(courseView(h.record,content,now).gold,0);
    await act(async()=>primary(h.host,"Следващо подусловие").click());
   }
  }
  assert.equal(h.actions.filter(action=>action.type==="saveDraft").length,0);
  assert.equal(h.record.attempts.length,1);assert.equal(h.record.attempts[0]!.outcome,"independent");
  assert.equal(h.record.goldAwards!.length,2);assert.equal(h.record.problemGoldAwards!.length,1);
  assert.ok(courseView(h.record,content,now).gold>0);
 }finally{await h.cleanup();}
});

test("a coalesced answer conflict reconciles newer work and waits for an explicit answer retry",async()=>{
 const h=await mount(),fetchCourse=globalThis.fetch;const posts:CourseAction[]=[];
 try{
  globalThis.fetch=async(url,init)=>{if(init?.method==="POST")posts.push(JSON.parse(String(init.body)).action);return fetchCourse(url,init);};
  const task=h.record.topics.matches!.work.core!.attempt,answer=Number(task.problem.fields[0]!.answer);
  await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[answer]!.click());
  h.advance({type:"hint",taskKey:task.key});
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.deepEqual(posts.map(action=>action.type),["answer"]);
  assert.equal(h.actions.filter(action=>action.type==="answer").length,0);
  assert.equal(h.record.attempts.length,0);assert.equal(courseView(h.record,content,now).gold,0);
  assert.equal(courseView(h.record,content,now).task!.hintLevel,1);assert.ok(h.host.querySelector('[role="alert"]'));
  await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[answer]!.click());
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.deepEqual(posts.map(action=>action.type),["answer","answer"]);
  assert.equal(h.record.attempts.length,1);assert.equal(h.record.attempts[0]!.outcome,"hinted");
  assert.equal(h.record.goldAwards!.length,2);assert.equal(h.record.problemGoldAwards!.length,1);
  assert.equal(courseView(h.record,content,now).gold,35);
 }finally{await h.cleanup();}
});

test("a lost coalesced answer reply reconciles once without resubmitting or repeating gold",async()=>{
 const h=await mount("matches",true);try{
  const task=h.record.topics.matches!.work.core!.attempt,answer=Number(task.problem.fields[0]!.answer),before=h.actions.length;
  await act(async()=>h.host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[answer]!.click());
  await act(async()=>{const check=primary(h.host,"Провери отговора");check.click();check.click();});
  assert.deepEqual(h.actions.slice(before).map(action=>action.type),["answer"]);
  assert.equal(h.record.attempts.length,1);assert.equal(h.record.goldAwards!.length,2);assert.equal(h.record.problemGoldAwards!.length,1);
  const awards=structuredClone({skills:h.record.goldAwards,problems:h.record.problemGoldAwards});
  assert.equal(courseView(h.record,content,now).gold,35);assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
  assert.ok(h.host.querySelector('[role="alert"]')!.textContent!.includes("Lost response"));
  await act(async()=>primary(h.host,"Следваща задача").click());
  await h.reload();
  assert.equal(h.record.attempts.length,1);assert.equal(h.actions.filter(action=>action.type==="answer").length,1);
  assert.deepEqual({skills:h.record.goldAwards,problems:h.record.problemGoldAwards},awards);
  assert.equal(h.host.querySelectorAll("[data-gold-gain]").length,0);
 }finally{await h.cleanup();}
});

test("a reward POST updates the wallet on an immediate cached competition revisit",async()=>{
 const originalFetch=globalThis.fetch,history=mockHistory();let gets=0;
 const records=new Map([[DEFAULT_COMPETITION_ID,applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"matches"},now)],["nvo",newKidsCourse(nvoCourseContent,now)]]);
 const wallet=()=>courseView(records.get(DEFAULT_COMPETITION_ID)!,content,now).gold+courseView(records.get("nvo")!,nvoCourseContent,now).gold;
 globalThis.fetch=async(_url,init)=>{
  const id=new Headers(init?.headers).get("X-Maths-Competition")!,catalogue=id==="nvo"?nvoCourseContent:content;
  const before=records.get(id)!;let goldGain;
  if(init?.method==="POST"){
   const {revision,action}=JSON.parse(String(init.body)) as {revision:number;action:CourseAction};
   assert.equal(revision,before.revision);
   const next=applyCourseAction(before,catalogue,action,now);records.set(id,next);goldGain=newGoldGain(before,next);
  }else gets++;
  return Response.json({course:{...courseView(records.get(id)!,catalogue,now),gold:wallet(),goldGain}});
 };
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<KidsCompetitionPlayer learnerId="child-a" competitionChoices={publishedCompetitions()} initialView={courseView(records.get(DEFAULT_COMPETITION_ID)!,content,now)}/>));
  await chooseCompetition(host,"nvo");await chooseCompetition(host,DEFAULT_COMPETITION_ID);assert.equal(gets,1);
  await act(async()=>button(host,"Продължи: Точки и мачове").click());
  const answer=Number(records.get(DEFAULT_COMPETITION_ID)!.topics.matches!.work.core!.attempt.problem.fields[0]!.answer);
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('[aria-label="Отговори"] button')[answer]!.click());
  await act(async()=>primary(host,"Провери отговора").click());
  assert.equal(host.querySelector("[data-gold-wallet]")!.getAttribute("aria-label"),"35 злато");
  await act(async()=>button(host,"← Начало").click());await chooseCompetition(host,"nvo");
  assert.equal(gets,1,"the fresh revisit must use its existing learning snapshot");
  assert.equal(host.querySelector("[data-gold-wallet]")!.getAttribute("aria-label"),"35 злато");
  assert.equal(host.querySelectorAll("[data-gold-gain]").length,0);
  assert.equal(records.get("nvo")!.revision,0);assert.equal(records.get("nvo")!.attempts.length,0);
 }finally{await act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch;history.restore();}
});


for (const [label, mapContent, width] of [["Spring", proletnoCourseContent, 1100], ["Regional Olympiad", regionalOlympiadCourseContent, 720]] as const) test(`${label} map presents four selectable islands inside its compact world`,async()=>{
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host);
 try{
  const view=courseView(newKidsCourse(mapContent,now),mapContent,now);
  let selected="";
  await act(async()=>root.render(<KidsWorldMap topics={view.topics} panelId="spring-panel" seen={new Set()} buttons={{current:new Map()}} viewControls={null} onSelect={id=>{selected=id;}}/>));
  assert.equal(host.querySelectorAll("[data-island-scenery]").length,4);
  for(const topic of view.topics){
   const place=islandPlaces[topic.id]!;
   assert.ok(place && place.x>0 && place.x<width && place.y>0 && place.y<500);
   const island=host.querySelector<HTMLButtonElement>(`button[aria-label="${topic.title}"]`);
   assert.ok(island);await act(async()=>island.click());assert.equal(selected,topic.id);
  }
  assert.equal(button(host,"−").disabled,true);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test("connected UI groups the natural part fields, preserves drafts, and keeps earlier work collapsible",async()=>{
 const base=content.problem("M1-03",0,false)!;
 const solution=[{title:"Първа стъпка",paragraphs:["Точките от победите са 13 · 3."]},{title:"Продължаваме",paragraphs:["Равенствата са 44 − 39."]},{title:"Проверка",paragraphs:["13 + 5 + 4 = 22."]}] as const;
 const connectedContent:KidsCourseContent={...content,connectedProblem:p=>p.id===base.id?{
  sourceId:"M1-03",text:"Отбор има 44 точки от 22 мача и 13 победи. Победа носи 3 точки, равенство - 1. а) Колко точки носят победите и колко са равенствата? б) Колко са загубите?",introduction:"Отбор има 44 точки от 22 мача и 13 победи. Победа носи 3 точки, равенство - 1.",
  units:[{id:"a",skillId:"M1-03",text:"а) Колко точки носят победите и колко са равенствата?",fields:[{label:"Точки",answer:"39"},{label:"Равенства",answer:"5"}],solution:structuredClone(solution) as never},{id:"b",skillId:"M1-03",text:"б) Колко са загубите?",fields:[{label:"Загуби",answer:"4"}],dependsOn:["a"],solution:structuredClone(solution) as never}],
 }:undefined};
 const h=await mount("matches",false,undefined,undefined,undefined,false,connectedContent);try{
  assert.equal(h.host.querySelectorAll("input").length,2);
  assert.ok(h.host.textContent!.includes("Подусловие 1 от 2"));
  assert.ok(!h.host.textContent!.includes("Цялото условие"));
  const statement=h.host.querySelector(".connectedContext > .question")!;
  assert.equal(statement.closest("details"),null);
  assert.equal(statement.textContent,courseView(h.record,connectedContent,now).task!.connected!.text);
  assert.equal(statement.querySelector('[aria-current="step"]')!.textContent,"а) Колко точки носят победите и колко са равенствата?");
  assert.equal(h.host.textContent!.split("Колко точки носят победите и колко са равенствата?").length,2);
  assert.equal(h.host.textContent!.split("Отбор има 44 точки от 22 мача и 13 победи.").length,2);
  assert.ok(!h.host.textContent!.includes("Предишни подусловия"));
  await act(async()=>button(h.host,"3").click());await act(async()=>button(h.host,"9").click());
  const second=h.host.querySelectorAll<HTMLInputElement>("input")[1]!;
  await act(async()=>second.dispatchEvent(new dom.window.Event("focusin",{bubbles:true})));
  await act(async()=>button(h.host,"5").click());
  await act(async()=>button(h.host,"← Начало").click());await h.reload();
  await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
  assert.deepEqual([...h.host.querySelectorAll<HTMLInputElement>("input")].map(i=>i.value),["39","5"]);
  await act(async()=>primary(h.host,"Провери отговора").click());
  assert.equal(h.record.attempts.length,1);
  await act(async()=>primary(h.host,"Следващо подусловие").click());
  assert.equal(h.host.querySelectorAll("input").length,1);
  assert.ok(h.host.textContent!.includes("Подусловие 2 от 2"));
  assert.equal(h.host.querySelector('[aria-current="step"]')!.textContent,"б) Колко са загубите?");
  assert.equal(h.host.textContent!.split("б) Колко са загубите?").length,2);
  const previous=[...h.host.querySelectorAll("details")].find(d=>d.querySelector("summary")?.textContent==="Предишни подусловия · 1")!;
  assert.ok(previous);assert.equal(previous.hasAttribute("open"),false);assert.ok(previous.textContent!.includes("39"));
  assert.equal(courseView(h.record,connectedContent,now).task!.hintLevel,0);
  await act(async()=>button(h.host,"4").click());await act(async()=>primary(h.host,"Провери отговора").click());
  primary(h.host,"Следваща задача");assert.equal(h.record.attempts.length,2);
 }finally{await h.cleanup();}
});

function connectedSource(catalogue:KidsCourseContent,id:string):ConnectedCourseProblem {
 for(const topic of catalogue.topics)for(const skill of topic.skills)for(const harder of [false,true])for(let index=0;;index++){
  const problem=catalogue.problem(skill.id,index,harder);if(!problem)break;
  const source=catalogue.connectedProblem?.(problem);if(source?.sourceId===id)return source;
 }
 throw new Error(`Missing source: ${id}`);
}

for(const [catalogue,id,part] of [
 [olympiadCourseContent,"oli-g4-municipal-2024-p1",0],
 [regionalOlympiadCourseContent,"oli-ob-g4-2023-p2",2],
 [proletnoCourseContent,"pms-g4-2024-p3",1],
] as const)test(`${id}: the full original stays visible once with its current part and answer-entry instructions`,async()=>{
 const original=connectedSource(catalogue,id),unit=original.units[part]!;
 const connectedContent:KidsCourseContent={...content,connectedProblem:()=>({...original,sourceId:"M1-03",units:original.units.slice(part).map(unit=>({...unit,skillId:"M1-03"}))})};
 const h=await mount("matches",false,undefined,undefined,undefined,false,connectedContent);try{
  const statement=h.host.querySelector(".connectedContext > .question")!;
  assert.equal(statement.textContent,original.text);
  assert.equal(statement.closest("details"),null);
  assert.ok(!h.host.textContent!.includes("Цялото условие"));
  const originalPart=original.text.includes(unit.text)?unit.text:unit.text.split("\n\n")[0]!;
  assert.equal(h.host.textContent!.split(originalPart).length,2,"The active question must not repeat below the original");
  const instruction=unit.text.slice(originalPart.length).trim();
  if(instruction)assert.ok([...h.host.querySelectorAll(".taskCard > .question")].some(p=>p.textContent===instruction));
  assert.equal(h.host.querySelectorAll("input").length,unit.options?0:unit.fields.length);
 }finally{await h.cleanup();}
});

test("connected originals show each figure once and single-part statements need no extra control",async()=>{
 const base=content.problem("M1-03",0,false)!;
 const first={src:"/kids/figures/M1-09.png",alt:"Първи чертеж"},second={src:"/kids/figures/M2-2a.png",alt:"Втори чертеж"};
 const connectedContent:KidsCourseContent={...content,connectedProblem:()=>({sourceId:"M1-03",text:base.text,introduction:base.text,figures:[first,second,first],units:[{id:"question",skillId:base.skillId,text:base.text,fields:base.fields,figure:first,solution:base.solution!}]})};
 const h=await mount("matches",false,undefined,undefined,undefined,false,connectedContent);try{
  assert.equal(h.host.querySelector(".connectedContext > .question")!.textContent,base.text);
  assert.equal(h.host.textContent!.split(base.text).length,2);
  assert.equal(h.host.querySelectorAll(".connectedContext figure").length,2);
  assert.equal(h.host.querySelectorAll(`img[alt="${first.alt}"]`).length,1);
  assert.equal(h.host.querySelectorAll(`img[alt="${second.alt}"]`).length,1);
  assert.equal(h.host.querySelectorAll(".connectedPart, .connectedDisclosure, [aria-current=step]").length,0);
 }finally{await h.cleanup();}
});


test("competition preparation stays on the overview and uses saved evidence after an answer",async()=>{
 const h=await mount(null,false,"child-a",DEFAULT_COMPETITION_ID);try{
  const preparation=()=>h.host.querySelector('[role="progressbar"][aria-valuemin="0"][aria-valuemax="100"]');
  const initial=preparation()!;assert.ok(initial);assert.equal(initial.getAttribute("aria-valuenow"),"0");
  const card=initial.closest('section')!;
  assert.equal(card.querySelector('h2')?.textContent,"Напредък в подготовката за това състезание.");
  assert.ok(!card.textContent?.includes("Решени оригинални задачи"));
  assert.equal(card.nextElementSibling,null);
  assert.ok(h.host.querySelector(`a[href="/progress?competition=${DEFAULT_COMPETITION_ID}&child=child-a"]`));
  await act(async()=>islandButton(h.host,"Точки и мачове").click());
  assert.equal(preparation(),null);
  await act(async()=>button(h.host,"Към задачите").click());assert.equal(preparation(),null);
  await submitAnswer(h);
  await act(async()=>button(h.host,"← Начало").click());
  const expected=courseView(h.record,content,now).preparation;
  assert.equal(preparation()!.getAttribute("aria-valuenow"),String(expected.percent));
  assert.ok(expected.coverage.fraction>0);await h.reload();
  assert.equal(preparation()!.getAttribute("aria-valuenow"),String(expected.percent));
 }finally{await h.cleanup();}
});


test("personal progress opens once after a new independent answer and stays closed after reload/resume",async()=>{
 const h=await mount();try{
  await act(async()=>button(h.host,"Подсказка").click());
  await submitAnswer(h);await act(async()=>primary(h.host,"Продължи").click());
  await submitAnswer(h);
  const dialog=h.host.querySelector<HTMLDialogElement>('dialog[open]');assert.ok(dialog);
  assert.ok(dialog.textContent!.includes("Личен напредък!"));
  assert.ok(dialog.textContent!.includes("Миналият път реши този тип задача с подсказка, а сега самостоятелно. Браво!"));
  assert.equal(h.record.attempts.at(-1)!.personalProgress,true);
  const paid=h.record.problemGoldAwards!.length;
  await act(async()=>dialog.querySelector<HTMLButtonElement>('button:not([aria-label])')!.click());
  assert.equal(h.host.querySelector('dialog[open]'),null);
  await h.reload();assert.equal(h.host.querySelector('dialog[open]'),null);
  await act(async()=>button(h.host,"Продължи: Точки и мачове").click());
  assert.equal(h.host.querySelector('dialog[open]'),null);
  assert.equal(h.record.problemGoldAwards!.length,paid);
 }finally{await h.cleanup();}
});


test("menu destinations and logout flush the current exercise before leaving",async()=>{
 for(const destination of ["/materiali","/profiles","/progress?child=child-a","logout"]){
  for(const fail of [false,true]){
   const h=await mount("grids",false,"child-a"),fetchCourse=globalThis.fetch,routes:string[]=[];
   Object.assign(globalThis,{__courseRoutes:routes});
   let finish!:(response:Response)=>void,submitted:CourseAction|undefined,logouts=0;
   try{
    globalThis.fetch=async(url,init)=>{
     if(init?.method==="POST"){
      const {action}=JSON.parse(String(init.body)) as {action:CourseAction};
      if(action.type==="saveDraft"){submitted=action;return new Promise(resolve=>{finish=resolve;});}
     }
     return fetchCourse(url,init);
    };
    await act(async()=>button(h.host,"7").click());
    const input=h.host.querySelector<HTMLInputElement>("input")!;
    await act(async()=>h.host.querySelector<HTMLButtonElement>('button[aria-label="Меню"]')!.click());
    if(destination==="logout"){
     const form=h.host.querySelector<HTMLFormElement>('form[action="/auth/logout"]')!;form.submit=()=>{logouts++;};
     await act(async()=>form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true})));
    }else await act(async()=>h.host.querySelector<HTMLAnchorElement>(`nav a[href="${destination}"]`)!.dispatchEvent(new dom.window.Event("click",{bubbles:true,cancelable:true})));
    assert.equal(submitted?.type,"saveDraft");assert.deepEqual(submitted?.answers,["7"]);assert.deepEqual(routes,[]);assert.equal(logouts,0);
    if(!fail)h.advance(submitted!);
    await act(async()=>finish(fail?Response.json({error:"Не успяхме да запазим."},{status:500}):Response.json({course:courseView(h.record,content,now)})));
    assert.deepEqual(routes,!fail&&destination!=="logout"?[destination]:[]);assert.equal(logouts,!fail&&destination==="logout"?1:0);
    if(fail){assert.equal(h.host.querySelector("input"),input);assert.equal(input.value,"7");assert.ok(h.host.querySelector('[role="alert"]'));}
   }finally{Reflect.deleteProperty(globalThis,"__courseRoutes");await h.cleanup();}
  }
 }
});


test("several accomplishments share one native dialog and are not replayed by reload",async()=>{
 const h=await mount(),fetchCourse=globalThis.fetch;
 try{
  globalThis.fetch=async(url,init)=>{
   const response=await fetchCourse(url,init);const body=await response.json();
   if(init?.method==="POST" && JSON.parse(String(init.body)).action.type==="answer")body.course.appreciations=[{kind:"whole-problem"},{kind:"scheduled-review"},{kind:"daily-tasks",day:"2026-11-02",amount:1},{kind:"daily-gold",day:"2026-11-02",amount:35}];
   return Response.json(body,{status:response.status});
  };
  await submitAnswer(h);
  assert.equal(h.host.querySelectorAll('dialog[open]').length,1);
  const dialog=h.host.querySelector<HTMLDialogElement>('dialog[open]')!;
  assert.ok(dialog.textContent!.includes("Реши всички части на тази задача самостоятелно. Браво!"));
  assert.ok(dialog.textContent!.includes("При преговора реши задачата самостоятелно. Браво!"));
  assert.ok(dialog.textContent!.includes("Днес реши 1 задача - най-много досега за един ден."));
  assert.ok(dialog.textContent!.includes("Днес събра 35 злато - най-много досега за един ден."));
  assert.equal(dialog.querySelectorAll('.appreciationMessages p').length,4);
  assert.ok(dialog.getAttribute("aria-describedby"));
  await act(async()=>dialog.querySelector<HTMLButtonElement>('button:not([aria-label])')!.click());
  assert.equal(h.host.querySelector('dialog[open]'),null);
  await h.reload();assert.equal(h.host.querySelector('dialog[open]'),null);
 }finally{await h.cleanup();}
});


test("a lost personal-improvement reply reconciles saved history without opening an appreciation dialog",async()=>{
 const h=await mount();try{
  await act(async()=>button(h.host,"Подсказка").click());
  await submitAnswer(h);await act(async()=>primary(h.host,"Продължи").click());
  const fetchCourse=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
   const response=await fetchCourse(url,init);
   if(init?.method==="POST" && JSON.parse(String(init.body)).action.type==="answer")throw new Error("Lost appreciation reply");
   return response;
  };
  await submitAnswer(h);
  assert.equal(h.record.attempts.at(-1)!.personalProgress,true);
  assert.equal(h.host.querySelector('dialog[open]'),null);
  assert.ok(h.host.querySelector('[role="alert"]'));
 }finally{await h.cleanup();}
});

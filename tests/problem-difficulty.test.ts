import assert from "node:assert/strict";
import {test} from "node:test";
import {applyCourseAction,courseView,newKidsCourse} from "../src/core/kids-course.ts";
import type {CourseAttempt,CourseProblem,KidsCourseContent} from "../src/core/kids-course.ts";
import {awardProblemGold,courseGoldBalance,islandGoldTargets,newGoldGain,problemAwardAmount,problemGoldKey,problemGoldPreview,problemGoldRate,topicProblemGold} from "../src/core/kids-gold.ts";
import {catalogueProblems,problemIdentity} from "../src/core/kids-selection.ts";
import {kidsCourseContent} from "../src/server/kids-course-content.ts";
import {nvoCourseContent} from "../src/server/nvo-course-content.ts";
import {olympiadCourseContent} from "../src/server/olimpiada-course-content.ts";
import {regionalOlympiadCourseContent} from "../src/server/olimpiada-oblasten-course-content.ts";
import {proletnoCourseContent} from "../src/server/proletno-course-content.ts";
import {competitions} from "../src/core/competitions.ts";
const now="2026-11-04T12:00:00Z";
const contents=[kidsCourseContent,olympiadCourseContent,nvoCourseContent];
function fixture(){
 const question=(id:string,hard:boolean):CourseProblem=>({id,skillId:"skill",text:`Намери ${id}`,source:"Оригинално условие",fields:[{label:"Отговор",answer:"3"}],hint:"Първа стъпка",explanation:["Решение"],difficulty:{level:hard?"hard":"standard",rationale:"Проверен метод"}});
 const ordinary=question("ordinary",false),hard=question("hard",true);
 hard.archive={sourceId:"source-hard",kind:"original",covers:["a","b"]};
 const part={...hard,id:"part",archive:{...hard.archive,kind:"part" as const,covers:["b"]}};
 const content:KidsCourseContent={version:"test",topics:[{id:"island",title:"Остров",rewardName:"Откритие",skills:[{id:"skill",title:"Умение",lesson:[]}]}],problem:(_,i,h)=>h?null:[ordinary,hard,part][i]??null};
 const attempt=(problem:CourseProblem,outcome:CourseAttempt["outcome"]="independent"):CourseAttempt=>({key:problem.id,problem,mode:"core",hintUsed:outcome==="hinted",outcome,completedAt:now});
 return {ordinary,hard,part,content,attempt,course:newKidsCourse(content,now)};
}
test("every prepared original and practice has a reviewed difficulty; shared entitlements agree",()=>{
 for(const content of contents){
  const rates=new Map<string,number>(),identities=new Map<string,string>();
  for(const p of catalogueProblems(content)){
   assert.ok(p.difficulty?.rationale.trim(),p.id);assert.ok(["standard","hard"].includes(p.difficulty!.level));
   const key=problemGoldKey(p,content),rate=problemGoldRate(p,content);
   if(rates.has(key))assert.equal(rate,rates.get(key),`Conflicting source/duplicate reward: ${p.id}`);
   rates.set(key,rate);
   const identity=problemIdentity(p);if(identities.has(identity))assert.equal(key,identities.get(identity),p.id);identities.set(identity,key);
  }
 }
 const nvo=catalogueProblems(nvoCourseContent);assert.equal(nvo.filter(p=>p.difficulty!.level==="hard").length,18);
 const oli=catalogueProblems(olympiadCourseContent).filter(p=>p.archive?.kind==="original");
 assert.equal(oli.filter(p=>p.difficulty!.level==="hard").length,10);assert.equal(oli.length,11);
 assert.equal(nvo.find(p=>p.id==="nvo-2025-p5:original")!.difficulty!.level,"standard");
 assert.equal(nvo.find(p=>p.id==="nvo-2023-p13:original")!.difficulty!.level,"hard");
 assert.equal(oli.find(p=>p.id==="oli-g4-municipal-2024-p1:original")!.difficulty!.level,"standard");
 assert.equal(catalogueProblems(kidsCourseContent).find(p=>p.id==="2026-M1-16:original")!.difficulty!.level,"hard");
});
test("ordinary and hard rewards are 10 and 15 regardless of selection pool or hints",()=>{
 for(const outcome of ["independent","hinted"] as const){
  const f=fixture();awardProblemGold(f.course,f.content,f.attempt(f.ordinary,outcome),now);awardProblemGold(f.course,f.content,f.attempt(f.hard,outcome),now);
  assert.deepEqual(f.course.problemGoldAwards!.map(a=>a.amount),[10,15]);assert.equal(courseGoldBalance(f.course),25);
  awardProblemGold(f.course,f.content,f.attempt(f.part,outcome),now);assert.equal(courseGoldBalance(f.course),25);
  assert.equal(problemGoldPreview(f.course,f.content,f.hard),undefined);
 }
 const f=fixture();awardProblemGold(f.course,f.content,f.attempt(f.hard,"revealed"),now);assert.equal(courseGoldBalance(f.course),0);
 assert.deepEqual(problemGoldPreview(f.course,f.content,f.hard),{amount:15});
});
test("historical five-gold awards stay five while new hard amounts persist across JSON reload",()=>{
 const f=fixture();f.course.problemGoldAwards=[{key:problemGoldKey(f.ordinary,f.content),skillId:"skill",earnedAt:now}];
 f.course.islandGoldTargets={island:45};const before=structuredClone(f.course),bytes=JSON.stringify(before);
 assert.equal(courseGoldBalance(f.course),5);assert.equal(problemAwardAmount(f.course.problemGoldAwards[0]!),5);
 assert.equal(courseView(f.course,f.content,now).topics[0]!.gold.total,45);assert.equal(JSON.stringify(f.course),bytes);
 awardProblemGold(f.course,f.content,f.attempt(f.hard,"hinted"),now);
 assert.equal(newGoldGain(before,f.course)!.amount,15);
 const reloaded=JSON.parse(JSON.stringify(f.course));assert.equal(courseGoldBalance(reloaded),20);
 assert.equal(newGoldGain(f.course,reloaded),undefined);assert.equal(islandGoldTargets(reloaded,f.content).island,45);
 assert.deepEqual(topicProblemGold(reloaded,f.content,"island"),{earned:20,total:20});
 awardProblemGold(reloaded,f.content,f.attempt(f.ordinary),now);assert.equal(courseGoldBalance(reloaded),20);
});
test("fresh targets use weighted unique originals; legacy snapshots borrow metadata only for identical problems",()=>{
 const f=fixture();assert.equal(islandGoldTargets(f.course,f.content).island,35+10+15);
 const saved=structuredClone(f.hard);delete saved.difficulty;
 assert.equal(problemGoldRate(saved,f.content),15);
 const changed={...saved,text:"Друга задача"};assert.equal(problemGoldRate(changed,f.content),10);
 assert.equal(problemGoldPreview(f.course,f.content,changed)!.amount,10);
 let course=applyCourseAction(f.course,f.content,{type:"selectTopic",topicId:"island"},now);
 assert.deepEqual(courseView(course,f.content,now).task!.goldReward,{amount:15});
 const task=courseView(course,f.content,now).task!;course=applyCourseAction(course,f.content,{type:"answer",taskKey:task.key,answers:["3"]},now);
 assert.equal(courseView(course,f.content,now).task!.goldReward,undefined);
});


test("all competition prices match previews and persisted awards, including resumed unpaid work",()=>{
 for (const [difficulty,standard,exceptional] of [["easy",10,15],["medium",15,20],["hard",20,25]] as const) {
  const f=fixture(), content={...f.content,rewardDifficulty:difficulty};
  for(const [problem,expected] of [[f.ordinary,standard],[f.hard,exceptional]] as const) {
   const attempt=f.attempt(problem,"hinted");
   const resumed=JSON.parse(JSON.stringify(attempt)) as CourseAttempt;
   assert.equal(problemGoldPreview(f.course,content,resumed.problem)?.amount,expected);
   awardProblemGold(f.course,content,resumed,now);
   assert.equal(f.course.problemGoldAwards!.at(-1)!.amount,expected);
   assert.equal(problemGoldPreview(f.course,content,resumed.problem),undefined);
   awardProblemGold(f.course,content,resumed,now);
  }
  assert.equal(f.course.problemGoldAwards!.length,2);
 }
});

 test("all server catalogue reward categories match their authoritative competition registry",()=>{
  const catalogues=[kidsCourseContent,olympiadCourseContent,nvoCourseContent,proletnoCourseContent,regionalOlympiadCourseContent];
  assert.equal(new Set(catalogues.map(content=>content.version)).size,competitions.length);
  for(const competition of competitions){
   const content=catalogues.find(item=>item.version===competition.contentVersion);
   assert.ok(content,competition.id);assert.equal(content.rewardDifficulty,competition.difficulty,competition.id);
  }
 });

test("saved unpaid work uses the current price while paid history stays untouched on reads and answers",()=>{
 const f=fixture(), previous={...f.content,rewardDifficulty:"easy" as const}, current={...f.content,rewardDifficulty:"hard" as const};
 let saved=applyCourseAction(newKidsCourse(previous,now),previous,{type:"selectTopic",topicId:"island"},now);
 saved.problemGoldAwards=[{key:"problem:previous",skillId:"skill",earnedAt:"2025-01-01T00:00:00Z",amount:10},{key:"problem:legacy",skillId:"skill",earnedAt:"2024-01-01T00:00:00Z"}];
 saved=JSON.parse(JSON.stringify(saved));
 const before=JSON.stringify(saved), prior=structuredClone(saved.problemGoldAwards);
 const preview=courseView(saved,current,now).task!;
 assert.equal(preview.goldReward!.amount,25);
 assert.equal(JSON.stringify(saved),before);
 const next=applyCourseAction(saved,current,{type:"answer",taskKey:preview.key,answers:["3"]},now);
 assert.deepEqual(next.problemGoldAwards!.slice(0,2),prior);
 assert.equal(next.problemGoldAwards!.at(-1)!.amount,25);
 assert.equal(next.problemGoldAwards!.at(-1)!.earnedAt,now);
 assert.equal(courseGoldBalance(next),55);
});

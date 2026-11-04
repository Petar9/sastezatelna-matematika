import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {applyCourseAction,courseView,newKidsCourse} from "../src/core/kids-course.ts";
import type {CourseAction} from "../src/core/kids-course.ts";
import {courseGoldAwards,courseGoldBalance,goldKey,newGoldGain,topicProblemGold} from "../src/core/kids-gold.ts";
import {kidsCourseContent as content} from "../src/server/kids-course-content.ts";
import {createKidsCourseStore} from "../src/store/kids-course.ts";
import {kidsCourseResponse,readKidsCourseView} from "../src/server/kids-course.ts";
const now="2026-11-03T12:00:00Z";
function harness(){
 let record=newKidsCourse(content,now);
 const go=(action:CourseAction)=>{const before=record;record=applyCourseAction(record,content,action,now);return newGoldGain(before,record);};
 const attempt=()=>record.topics[record.active!.topicId]!.work[record.active!.mode]!.attempt;
 const answer=(correct=true)=>go({type:"answer",taskKey:attempt().key,answers:attempt().problem.fields.map(f=>correct?f.answer:String(attempt().problem.options?(Number(f.answer)+1)%attempt().problem.options!.length:Number(f.answer)+1))});
 const next=()=>{go({type:"nextQuestion"});while(courseView(record,content,now).stage==="lesson")go({type:"lessonNext"});};
 go({type:"selectTopic",topicId:"matches"});
 return{get record(){return record;},go,attempt,answer,next};
}
test("gold rewards effort, helped correctness and independent confirmation exactly once",()=>{
 const h=harness();
 assert.equal(h.go({type:"hint",taskKey:h.attempt().key}),undefined);assert.equal(courseGoldBalance(h.record),0);
 assert.equal(h.answer(false)?.amount,5);h.next();
 h.go({type:"hint",taskKey:h.attempt().key});assert.equal(h.answer()?.amount,20);
 h.next();assert.equal(h.answer()?.amount,10);h.next();assert.equal(h.answer()?.amount,30);
 assert.equal(courseGoldBalance(h.record),65);assert.equal(h.record.goldAwards!.length,3);
 assert.equal(new Set(h.record.goldAwards!.map(goldKey)).size,3);
 h.next();assert.equal(h.answer(false),undefined);assert.equal(courseGoldBalance(h.record),65);
 h.next();h.answer();h.next();h.answer();assert.equal(courseGoldBalance(h.record),85);
});
test("first correct combines effort and correctness; revealing only earns effort",()=>{
 const h=harness();assert.equal(h.answer()?.amount,25);h.next();assert.equal(h.answer()?.amount,30);
 const r=harness();assert.equal(r.go({type:"reveal",taskKey:r.attempt().key})?.amount,5);
 assert.equal(courseGoldAwards(r.record).some(a=>a.milestone==="correct"),false);
});
test("historical gold is quiet on reads, retained after reload and persisted on the next command",async()=>{
 const h=harness();h.answer();h.next();h.answer();
 const old=structuredClone(h.record);delete old.goldAwards;delete old.problemGoldAwards;
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-gold-"));
 try{
  const file=path.join(directory,"course-v2.json"),original=JSON.stringify(old);
  fs.writeFileSync(file,original);const store=createKidsCourseStore(directory);
  const view=await readKidsCourseView(store,content);assert.equal(view.gold,35);assert.equal(view.goldGain,undefined);
  assert.equal(fs.readFileSync(file,"utf8"),original);
  const response=await kidsCourseResponse(new Request("http://localhost/api/kids/course",{method:"POST",body:JSON.stringify({revision:old.revision,action:{type:"dashboard"}})}),store,content);
  assert.equal(response.status,200);const saved=(await response.json()).course;
  assert.equal(saved.gold,35);assert.equal(saved.goldGain,undefined);
  assert.equal(store.read()!.goldAwards!.length,3);assert.deepEqual(store.read()!.attempts,JSON.parse(original).attempts);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test("local wallet sums competition ledgers once without rewriting other histories",()=>{
 const h=harness();h.answer();const directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-wallet-"));
 try{
  const other=path.join(directory,"competitions","other");fs.mkdirSync(other,{recursive:true});
  fs.writeFileSync(path.join(directory,"course-v2.json"),JSON.stringify(h.record));
  const legacy=structuredClone(h.record);delete legacy.goldAwards;delete legacy.problemGoldAwards;
  const file=path.join(other,"course-v2.json"),original=JSON.stringify(legacy);fs.writeFileSync(file,original);
  assert.equal(createKidsCourseStore(directory).goldBalance!(h.record),40);
  assert.equal(createKidsCourseStore(other,directory).goldBalance!(legacy),40);
  assert.equal(fs.readFileSync(file,"utf8"),original);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test("API accepts learning actions only, returns new gold once and rejects stale retries",async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-gold-api-"));
 try{
  const store=createKidsCourseStore(directory);let view=await readKidsCourseView(store,content);
  const post=(revision:number,action:unknown)=>kidsCourseResponse(new Request("http://localhost/api/kids/course",{method:"POST",body:JSON.stringify({revision,action,gold:99999})}),store,content);
  let response=await post(view.revision,{type:"selectTopic",topicId:"matches"});view=(await response.json()).course;
  const attempt=store.read()!.topics.matches!.work.core!.attempt;
  const action={type:"answer",taskKey:attempt.key,answers:attempt.problem.fields.map(f=>f.answer),gold:99999};
  response=await post(view.revision,action);assert.equal(response.status,200);
  const earned=(await response.json()).course;assert.equal(earned.gold,25);assert.equal(earned.goldGain.amount,25);
  response=await post(view.revision,action);assert.equal(response.status,409);
  response=await kidsCourseResponse(new Request("http://localhost/api/kids/course"),store,content);
  const reloaded=(await response.json()).course;assert.equal(reloaded.gold,25);assert.equal(reloaded.goldGain,undefined);
  assert.equal(store.read()!.attempts.length,1);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

test("topic gold uses retained awards, isolates topics and projects historical evidence without writes",()=>{
 const h=harness();
 const gold=(id:string)=>courseView(h.record,content,now).topics.find(t=>t.id===id)!.gold;
 assert.deepEqual(gold("matches"),{earned:0,total:35+topicProblemGold(h.record,content,"matches").total});
 assert.deepEqual(gold("backwards"),{earned:0,total:175+topicProblemGold(h.record,content,"backwards").total});
 h.answer(false);assert.equal(gold("matches").earned,5);h.next();
 h.go({type:"hint",taskKey:h.attempt().key});h.answer();assert.equal(gold("matches").earned,25);
 h.next();h.answer();h.next();h.answer();assert.equal(gold("matches").earned,65);
 assert.equal(gold("backwards").earned,0);
 const retained=structuredClone(h.record);retained.attempts=[];
 for(const state of Object.values(retained.topics.matches!.skills))delete state.confirmedAt;
 const original=JSON.stringify(retained);
 assert.equal(courseView(retained,content,now).topics.find(t=>t.id==="matches")!.gold.earned,65);
 assert.equal(JSON.stringify(retained),original);
 const historical=structuredClone(h.record);delete historical.goldAwards;delete historical.problemGoldAwards;
 const before=JSON.stringify(historical);
 assert.equal(courseView(historical,content,now).topics.find(t=>t.id==="matches")!.gold.earned,35);
 assert.equal(JSON.stringify(historical),before);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyCourseAction, courseView, newKidsCourse, normalizeCourseNumber, parseCourseCommand } from "../src/core/kids-course.ts";
import type { CourseAction, KidsCourse, KidsCourseContent, CourseProblem } from "../src/core/kids-course.ts";
import { kidsCourseContent as currentContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent as currentOlympiadContent } from "../src/server/olimpiada-course-content.ts";
import { createKidsCourseStore } from "../src/store/kids-course.ts";

// Retain the pre-connected course and migration contract as a historical fixture.
const content: KidsCourseContent = { ...currentContent, connectedProblem: undefined, navigationGroups: undefined };
const olympiadCourseContent: KidsCourseContent = { ...currentOlympiadContent, connectedProblem: undefined, navigationGroups: undefined };
const now = "2026-11-02T12:00:00.000Z";
function harness(material: KidsCourseContent = content) {
 let record = newKidsCourse(material, now);
 const view = (date = now) => courseView(record, material, date);
 const go = (action: CourseAction, date = now) => { record = applyCourseAction(record, material, action, date); return view(date); };
 const work = () => {
  const p=record.topics[record.active!.topicId]!;
  return record.journey==="quest" ? record.quest!.work! : record.active!.skillId ? p.skillWork![record.active!.skillId]! : p.work[record.active!.mode]!;
 };
 const correct = () => go({ type: "answer", taskKey: work().attempt.key, answers: work().attempt.problem.fields.map(f => f.answer) });
 const wrong = () => go({ type: "answer", taskKey: work().attempt.key, answers: work().attempt.problem.fields.map(f => String(work().attempt.problem.options ? (Number(f.answer)+1)%work().attempt.problem.options!.length : Number(f.answer)+1)) });
 const hint = () => go({ type: "dontKnow", taskKey: work().attempt.key });
 const next = () => { go({ type: "nextQuestion" }); while (view().stage === "lesson") go({ type: "lessonNext" }); return view(); };
 return { get record() { return record; }, view, go, work, correct, wrong, hint, next };
}

test("all 78 source objectives have original choices, reviewed numeric answers and usable figures", () => {
 assert.equal(content.topics.length, 17);
 const skills = content.topics.flatMap(t => t.skills);
 assert.equal(skills.length, 78);
 assert.equal(new Set(skills.map(s => s.id)).size, 78);
 const keys = [2,2,0,1,1,0,1,2,2,3,2,2,3,1,0];
 for (let n = 1; n <= 20; n++) {
  const p = content.problem(`M1-${String(n).padStart(2,"0")}`, 0, false)!;
  assert.ok(p.id.endsWith(":original"));
  if (n <= 15) { assert.equal(p.options?.length, 4); assert.equal(p.fields[0]!.answer, String(keys[n-1])); }
  else assert.equal(p.fields[0]!.answer, String([82,139,174,480,28][n-16]));
 }
 assert.deepEqual(content.problem("M2-1b",0,false)!.fields.map(f=>f.answer), ["545"]);
 assert.deepEqual(content.problem("M2-2a",0,false)!.fields.map(f=>f.answer), ["56","66","4"]);
 for (const id of ["M1-09","M1-10","M1-11","M1-14","M2-2a","M2-2b"]) {
  const p = content.problem(id,0,false)!;
  assert.ok(p.figure?.alt); assert.ok(fs.statSync(path.join(process.cwd(),"assets/images",p.figure!.src)).size > 1000);
 }
});

test("initial success needs a fresh confirmation; rewards are tied to the earning attempt", () => {
 const h = harness(); h.go({type:"selectTopic",topicId:"matches"});
 const first = h.work().attempt.problem.id;
 assert.equal(h.correct().reward, undefined); assert.equal(h.view().streak,1);
 h.next(); assert.notEqual(h.work().attempt.problem.id,first);
 assert.equal(h.correct().reward?.rank,"doctor");
 assert.equal(h.record.awards.length,1);
 h.next(); assert.equal(h.view().active?.mode,"challenge"); assert.equal(h.view().reward,undefined);
 h.correct(); assert.equal(h.view().reward,undefined); h.next();
 assert.equal(h.correct().reward?.rank,"professor");
 h.next(); h.correct(); assert.equal(h.view().reward,undefined);
 assert.equal(h.record.awards.length,2);
});

test("hint-only needs one independent answer; a wrong/revealed gap always needs two consecutive answers", () => {
 const h = harness(); h.go({type:"selectTopic",topicId:"matches"}); h.hint();
 assert.equal(h.correct().task?.outcome,"hinted"); assert.equal(h.view().target,1);
 h.next(); assert.equal(h.correct().reward?.rank,"doctor");
 const g = harness(); g.go({type:"selectTopic",topicId:"matches"}); g.wrong();
 assert.equal(g.view().target,2); g.next(); g.correct(); assert.equal(g.view().streak,1);
 g.next(); g.wrong(); assert.equal(g.view().streak,0); g.next(); g.hint(); g.correct();
 assert.equal(g.view().target,2); g.next(); g.correct(); assert.equal(g.view().reward,undefined);
 g.next(); assert.equal(g.correct().reward?.rank,"doctor");
 const r = harness(); r.go({type:"selectTopic",topicId:"matches"}); r.hint(); r.hint();
 assert.equal(r.view().task?.outcome,"revealed"); assert.equal(r.view().task?.answers,undefined); assert.equal(r.view().target,2);
});

test("switching and reload preserve hinted questions, lesson steps and completed milestones", () => {
 const h = harness(); h.go({type:"selectTopic",topicId:"matches"}); h.hint();
 const key = h.view().task!.key;
 h.go({type:"dashboard"}); h.go({type:"selectTopic",topicId:"clocks"});
 h.go({type:"selectTopic",topicId:"matches"}); assert.equal(h.view().task?.key,key); assert.ok(h.view().task?.solutionParts);
 h.hint(); h.work().lessonStep = 0; h.go({type:"lessonNext"});
 const lesson = h.view().lesson;
 h.go({type:"selectTopic",topicId:"clocks"}); h.go({type:"selectTopic",topicId:"matches"});
 assert.deepEqual(h.view().lesson,lesson);
 h.go({type:"pause"}); assert.equal(h.view().task,undefined); assert.equal(h.view().paused,true);
 assert.throws(()=>h.go({type:"lessonNext"})); h.go({type:"resume"});
 assert.deepEqual(h.view().lesson,lesson);
 while(h.view().stage==="lesson") h.go({type:"lessonNext"});
 h.correct(); h.next(); h.correct(); assert.equal(h.view().reward?.rank,"doctor");
 h.go({type:"selectTopic",topicId:"clocks"}); h.go({type:"selectTopic",topicId:"matches"});
 assert.equal(h.view().reward?.rank,"doctor"); h.next(); assert.equal(h.view().active?.mode,"challenge");
 h.wrong(); h.go({type:"nextQuestion"});
 h.go({type:"selectTopic",topicId:"clocks"}); h.go({type:"selectTopic",topicId:"matches"});
 assert.equal(h.view().stage,"question");
 assert.equal(h.view().task?.outcome,undefined); assert.equal(h.view().active?.mode,"core");
 assert.equal(h.view().reward,undefined);
});

test("Professor covers distinct skills and later mistakes preserve badges but require practice", () => {
 const h=harness(); h.go({type:"selectTopic",topicId:"backwards"});
 for(let i=0;i<2*content.topics.find(t=>t.id==="backwards")!.skills.length;i++) { h.correct(); h.next(); }
 assert.equal(h.view().active?.mode,"challenge"); const first=h.work().attempt.problem.skillId;
 h.correct(); h.next(); assert.notEqual(h.work().attempt.problem.skillId,first);
 assert.equal(h.correct().reward?.rank,"professor"); h.next(); h.wrong();
 const topic=h.view().topics.find(t=>t.id==="backwards")!;
 assert.ok(topic.doctor && topic.professor && topic.needsPractice);
});

test("retention is optional, fresh, scheduled after two days and never gates advancement", () => {
 const h=harness(); h.go({type:"selectTopic",topicId:"matches"}); h.correct();h.next();h.correct();
 const later="2026-11-04T12:00:00.000Z";
 assert.equal(h.view().topics.find(t=>t.id==="matches")!.reviewDue,false);
 assert.equal(h.view(later).topics.find(t=>t.id==="matches")!.reviewDue,true);
 h.next(); assert.equal(h.view().active?.mode,"challenge"); h.correct();
 h.go({type:"selectTopic",topicId:"matches",review:true},later);
 assert.equal(h.view().active?.mode,"review"); h.wrong();
 assert.equal(h.record.topics.matches!.challengeStreak,0);
 h.go({type:"selectTopic",topicId:"clocks"}); assert.equal(h.view().active?.topicId,"clocks");
 h.go({type:"selectTopic",topicId:"matches"}); assert.equal(h.view().active?.mode,"core");
 assert.equal(h.view().task?.outcome,undefined);
 h.correct();h.next();h.correct();h.next(); assert.equal(h.view().active?.mode,"challenge");
 h.correct(); assert.equal(h.view().reward,undefined); h.next();assert.equal(h.correct().reward?.rank,"professor");
 h.go({type:"selectTopic",topicId:"matches",review:true});
 h.correct(); assert.equal(h.record.topics.matches!.lastReviewAt,now);
});

test("all topics Doctor plus nine Professor completes the course without waiting for review", () => {
 const h=harness();
 for(const [i,topic] of content.topics.entries()) {
  h.go({type:"selectTopic",topicId:topic.id});
  for(let s=0;s<topic.skills.length*2;s++) { h.correct();h.next(); }
  if(i<9) { h.correct();h.next();h.correct();h.next(); }
  if(i<16) assert.equal(h.view().complete,false);
 }
 assert.equal(h.view().doctors,17);assert.equal(h.view().professors,9);assert.equal(h.view().complete,true);
 assert.equal(h.record.awards.length,26);
});

test("finite exhaustion and malformed/stale task commands cannot manufacture successes", () => {
 const limited: KidsCourseContent={...content,problem:(id,index,hard)=>index<1?content.problem(id,index,hard):null};
 const h=harness(limited); h.go({type:"selectTopic",topicId:"matches"});
 const task=h.view().task!;
 assert.throws(()=>h.go({type:"answer",taskKey:"old",answers:["0"]}));
 assert.throws(()=>h.go({type:"answer",taskKey:task.key,answers:[]}));
 assert.throws(()=>h.go({type:"nextQuestion"})); h.correct();
 assert.throws(()=>h.go({type:"answer",taskKey:task.key,answers:["0"]}));
 h.next();assert.equal(h.view().exhausted,true);assert.equal(h.record.awards.length,0);
 assert.throws(()=>parseCourseCommand({revision:0,action:{type:"answer",taskKey:"a",answers:[1]}}));
 assert.throws(()=>parseCourseCommand({revision:-1,action:{type:"pause"}}));
 assert.equal(normalizeCourseNumber("004,00"),"4"); assert.equal(normalizeCourseNumber("1e3"),null);
});

test("private persistence survives new store instances and rejects stale revisions without touching legacy records", () => {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"maths-course-store-"));
 try {
  const legacy=path.join(dir,"kids_existing.json"); fs.writeFileSync(legacy,'{"version":1}');
  const store=createKidsCourseStore(dir);assert.equal(store.read(),null);
  const c=store.update(0,{type:"selectTopic",topicId:"matches"},content);
  assert.throws(()=>store.update(0,{type:"pause"},content));
  const reread=createKidsCourseStore(dir).read()!;assert.deepEqual(reread,c);
  assert.equal(fs.readFileSync(legacy,"utf8"),'{"version":1}');
  assert.equal(fs.statSync(path.join(dir,"course-v2.json")).mode & 0o777,0o600);
  assert.equal(fs.readdirSync(dir).length,2);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

function pool(id:string,hard=false) { const rows:CourseProblem[]=[];for(let i=0;;i++){const p=content.problem(id,i,hard);if(!p)break;rows.push(p);}return rows; }

test("fresh variants do not repeat source parameters disguised by wording", () => {
 const guards:Record<string,(p:CourseProblem)=>boolean>={
  "M1-01":p=>!p.text.includes("Годината е 2024."),
  "M1-06":p=>!p.text.includes("дължина 44 см е разрязана с 11 разреза"),
  "M1-07":p=>!p.text.includes("Сборът е 98."),
  "M1-09":p=>!p.text.includes("е 9 пъти основата"),
  "M1-15":p=>!p.text.includes("Сборът е 2024."),
  "M1-17":p=>!p.text.includes("след 14-ото"),
  "M1-20":p=>!p.text.includes("разделят 9 еднакви"),
 };
 for(const skill of content.topics.flatMap(t=>t.skills)){
  const all=[...pool(skill.id),...pool(skill.id,true)];
  assert.ok(all.length>=(skill.id.startsWith("M")?70:7),skill.id);assert.equal(new Set(all.map(p=>p.id)).size,all.length);
  assert.equal(new Set(all.map(p=>p.text)).size,all.length);
  for(const p of all){assert.ok(p.hint && p.explanation.length>=2);for(const f of p.fields)assert.notEqual(normalizeCourseNumber(f.answer),null,`${p.id}: ${f.answer}`);}
  for(const p of all.filter(p=>!p.id.endsWith(":original"))) assert.ok(guards[skill.id]?.(p)??true,p.id);
 }
});

test("generated grade equations and grid extrema have unique, feasible mathematical solutions", () => {
 for(const hard of [false,true]){
  for(const p of pool("M1-07",hard).filter(p=>!p.options)){
   const total=Number(p.text.match(/Сборът е (\d+)/)![1]);const solutions:number[][]=[];
   for(let h=0;6*h<=total;h++)for(let f=0;6*h+5*f<=total;f++)if(6*h+5*f===total&&h>f&&(!hard||f<6))solutions.push([h,f]);
   assert.equal(solutions.length,1,p.id);assert.equal(Number(p.fields[0]!.answer),solutions[0]![0]!+solutions[0]![1]!);
  }
  for(const p of pool("M2-2a",hard).filter(p=>!p.id.endsWith(":original"))){
   const [x,xy,area,u,v,w,a,b,c]=p.fields.map(f=>Number(f.answer));const L=Math.sqrt(area!);
   assert.ok([u,v,w,a,b,c].every(v=>Number.isInteger(v)&&v!>0),p.id);
   assert.equal(u!+v!+w!,L);assert.equal(a!+b!+c!,L);
   assert.equal(x,2*(u!+a!));assert.equal(xy,2*(u!+a!+v!+b!));
   const [A,B,C]=[v!+a!,u!+b!,w!+c!];let max=0;
   for(let vv=1;vv<A;vv++) { const aa=A-vv,uu=L-vv-1,bb=B-uu,cc=L-aa-bb;if(uu>0&&bb>0&&cc>0&&1+cc===C)max=Math.max(max,2*(uu+aa)); }
   assert.equal(x,max,p.id);
  }
  for(const p of pool("M2-2b",hard).filter(p=>!p.id.endsWith(":original"))){
   const [s,multiple,P,a,b]=p.fields.map(f=>Number(f.answer));assert.equal(multiple,6);assert.equal(a!*b!,s);assert.equal(P,24*b!);
   const feasible=[];for(let bb=2;bb<s!;bb++) {const aa=s!/bb;if(Number.isInteger(aa)&&aa>1&&6*bb-3*aa>1)feasible.push(bb);}
   assert.equal(b,Math.min(...feasible),p.id);
  }
 }
});


test("every subtopic in both competitions selects only that skill, including following problems",()=>{
 for(const material of [content,olympiadCourseContent]) for(const topic of material.topics) for(const skill of topic.skills){
  const h=harness(material);
  h.go({type:"selectTopic",topicId:topic.id,skillId:skill.id});
  assert.equal(h.view().task!.skillId,skill.id);
  const first=h.view().task!.key;
  h.correct();h.next();
  assert.equal(h.view().task!.skillId,skill.id);
  assert.notEqual(h.view().task!.key,first);
  h.correct();h.next();
  if(!h.view().exhausted) assert.equal(h.view().task!.skillId,skill.id);
 }
});

test("scoped work persists alongside whole-island and quest work, hints, lessons and history",()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"maths-subtopics-"));
 try{
  const h=harness(),topic=content.topics.find(t=>t.id==="backwards")!,a=topic.skills[1]!,b=topic.skills[2]!;
  h.go({type:"selectTopic",topicId:topic.id});h.hint();
  const island=structuredClone(h.work());
  h.go({type:"selectTopic",topicId:topic.id,skillId:a.id});h.hint();
  const scoped=structuredClone(h.work());
  h.go({type:"selectTopic",topicId:topic.id,skillId:b.id});h.correct();
  const history=structuredClone(h.record.attempts),awards=structuredClone(h.record.awards);
  h.go({type:"startQuest"});const quest=structuredClone(h.work());
  h.go({type:"selectTopic",topicId:topic.id,skillId:a.id});assert.deepEqual(h.work(),scoped);
  h.work().lessonStep=0;h.go({type:"lessonNext"});const lesson=structuredClone(h.work());
  h.go({type:"selectTopic",topicId:topic.id});assert.deepEqual(h.work(),island);
  h.go({type:"startQuest"});assert.deepEqual(h.work(),quest);
  h.go({type:"selectTopic",topicId:topic.id,skillId:a.id});assert.deepEqual(h.work(),lesson);
  fs.writeFileSync(path.join(dir,"course-v2.json"),JSON.stringify(h.record));
  const store=createKidsCourseStore(dir),restored=store.read(content)!;
  assert.deepEqual(courseView(restored,content,now),h.view());
  assert.deepEqual(restored.attempts,history);assert.deepEqual(restored.awards,awards);
  const paused=store.update(restored.revision,{type:"pause"},content);
  assert.deepEqual(createKidsCourseStore(dir).read()!.topics,paused.topics);
  assert.throws(()=>store.update(restored.revision,{type:"resume"},content));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test("selected skills never fall back on exhaustion and reject invalid or cross-island selection",()=>{
 const topic=content.topics.find(t=>t.id==="backwards")!,skill=topic.skills[1]!;
 const limited={...content,problem:(id:string,index:number,harder:boolean)=>index===0?content.problem(id,index,harder):null};
 const h=harness(limited);
 h.go({type:"selectTopic",topicId:topic.id,skillId:skill.id});h.correct();h.next();
 assert.equal(h.view().exhausted,true);assert.equal(h.view().active!.skillId,skill.id);
 h.go({type:"selectTopic",topicId:topic.id,skillId:skill.id});assert.equal(h.view().exhausted,true);
 const saved=JSON.stringify(h.record);
 for(const skillId of ["missing",content.topics[0]!.skills[0]!.id,""]){
  assert.throws(()=>h.go({type:"selectTopic",topicId:topic.id,skillId}));
  assert.equal(JSON.stringify(h.record),saved);
 }
 assert.throws(()=>h.go({type:"selectTopic",topicId:topic.id,skillId:skill.id,review:true}));
 for(const skillId of [4,"",[],"x".repeat(101)]) assert.throws(()=>parseCourseCommand({revision:0,action:{type:"selectTopic",topicId:topic.id,skillId}}));
 const parsed=parseCourseCommand({revision:0,action:{type:"selectTopic",topicId:topic.id,skillId:skill.id}});
 assert.equal(parsed.action.type==="selectTopic"&&parsed.action.skillId,skill.id);
});

test("direct skill practice earns Doctor and distinct-skill Professor with retained skill milestones plus fresh problem gold",()=>{
 const h=harness(),topic=content.topics.find(t=>t.id==="backwards")!;
 for(const skill of topic.skills){
  h.go({type:"selectTopic",topicId:topic.id,skillId:skill.id});h.correct();h.next();h.correct();
 }
 assert.equal(h.record.awards.filter(a=>a.rank==="doctor").length,1);
 assert.equal(h.view().gold,295);
 assert.equal(h.record.awards.filter(a=>a.rank==="professor").length,0);
 h.next();assert.equal(h.view().active!.mode,"challenge");h.correct();h.next();h.correct();
 assert.equal(h.record.awards.filter(a=>a.rank==="professor").length,0,"One repeated skill cannot earn Professor");
 h.go({type:"selectTopic",topicId:topic.id,skillId:topic.skills[0]!.id});h.next();h.correct();
 assert.equal(h.record.awards.filter(a=>a.rank==="professor").length,1);
 // The last fresh challenge is now a reviewed hard 2023 original (15 gold).
 assert.equal(h.view().reward!.rank,"professor");assert.equal(h.view().gold,340);
});

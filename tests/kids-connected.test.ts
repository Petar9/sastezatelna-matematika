import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, courseView, migrateKidsCourse, newKidsCourse, type CourseAction, type CourseProblem, type CourseSolution, type KidsCourseContent } from "../src/core/kids-course.ts";
import { courseGoldBalance, problemGoldPreview } from "../src/core/kids-gold.ts";
import { projectProgressCourse } from "../src/core/progress.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";
import { nvoCourseContent } from "../src/server/nvo-course-content.ts";
import { proletnoCourseContent } from "../src/server/proletno-course-content.ts";
import { pendingProblems } from "../src/core/kids-selection.ts";
const now = "2026-11-06T12:00:00.000Z";
const solution: CourseSolution = [0,1,2].map(i => ({ title: `Стъпка ${i+1}`, paragraphs: [`Сметка ${i+1}`] })) as CourseSolution;
function fixture(count = 2, sources = 2): KidsCourseContent {
 const originals: CourseProblem[] = Array.from({length:sources}, (_,i) => ({ id:`s${i}:original`,skillId:"skill",text:`Оригинал ${i}`,source:"Състезание · 2025",fields:[{label:"x",answer:"1"},{label:"y",answer:"2"}],hint:"Помощ",explanation:["Решение"],solution,provenance:{year:2025,page:1,objective:`s${i}`},archive:{sourceId:`s${i}`,kind:"original",covers:Array.from({length:count},(_,j)=>`u${j}`)} }));
 return {version:"connected-test",topics:[{id:"topic",title:"Остров",rewardName:"остров",skills:[{id:"skill",title:"Умение",lesson:["Урок"]}]}],
  problem:(_skill,i,hard)=>hard?null:originals[i]?structuredClone(originals[i]):null,
  connectedProblem:p=> {const original=originals.find(o=>o.id===p.id);return original?{sourceId:original.archive!.sourceId,text:original.text,introduction:"Общо условие",legacyGoldKeys:[`problem:${original.id}`],units:Array.from({length:count},(_,j)=>({id:`u${j}`,skillId:"skill",text:`Подусловие ${j}`,fields:j===0?[{label:"x",answer:"1"},{label:"y",answer:"2"}]:[{label:"z",answer:"3"}],solution,...(j?{dependsOn:[`u${j-1}`]}:{})}))}:undefined;}};
}
function harness(content = fixture()) {
 let c = newKidsCourse(content,now);
 const view=()=>courseView(c,content,now);
 const go=(action:CourseAction)=>{c=applyCourseAction(c,content,action,now);};
 const answer=()=>{const a=c.journey==="quest"?c.quest!.work!.attempt:c.topics.topic!.work[c.active!.mode]!.attempt;go({type:"answer",taskKey:a.key,answers:a.problem.fields.map(f=>f.answer)});};
 return {get c(){return c;},set c(value){c=value;},view,go,answer,content};
}
test("natural subparts group fields, award separately, restore drafts and require distinct sources for confirmation",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});
 assert.equal(h.view().task!.fields.length,2);assert.equal(h.view().task!.connected!.total,2);
 h.answer();assert.equal(h.c.attempts.length,1);assert.equal(courseGoldBalance(h.c),25);
 h.go({type:"nextQuestion"});const task=h.view().task!;
 h.go({type:"saveDraft",taskKey:task.key,partIndex:1,answers:["3"]});h.c=JSON.parse(JSON.stringify(h.c));assert.deepEqual(h.view().task!.draft,["3"]);
 h.answer();assert.equal(courseGoldBalance(h.c),35);assert.equal(h.c.topics.topic!.skills.skill!.streak,1);assert.equal(h.c.topics.topic!.skills.skill!.confirmedAt,undefined);
 const events=projectProgressCourse(h.c,"fixture").events.filter(e=>e.kind==="attempt");assert.equal(events.filter(e=>e.naturalPart).length,2);assert.equal(events.filter(e=>e.wholeOriginal).length,1);assert.ok(events.every(e=>!e.wholeProblem));
 h.go({type:"nextQuestion"});h.answer();assert.ok(h.c.topics.topic!.skills.skill!.confirmedAt);
});
test("local hints reset per unit, dependent help stays assisted, third hint excludes only that unit's gold",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});for(let i=0;i<3;i++)h.go({type:"hint",taskKey:h.view().task!.key});h.answer();assert.equal(courseGoldBalance(h.c),0);
 h.go({type:"nextQuestion"});assert.equal(h.view().task!.hintLevel,0);assert.deepEqual(h.view().task!.solutionParts,[]);h.answer();assert.equal(h.c.attempts[1]!.outcome,"hinted");assert.equal(courseGoldBalance(h.c),25);assert.equal(h.c.attempts[0]!.goldEligible,false);
});
test("historic source and alias awards retain exact balance and suppress all new unit bonuses",()=>{
 for(const key of ["source:s0","problem:s0:original"]){const h=harness();h.c.problemGoldAwards=[{key,skillId:"skill",earnedAt:"2024-01-01T12:00:00Z"}];h.go({type:"selectTopic",topicId:"topic"});const paid=structuredClone(h.c.problemGoldAwards);assert.equal(problemGoldPreview(h.c,h.content,h.c.topics.topic!.work.core!.attempt.problem),undefined);h.answer();h.go({type:"nextQuestion"});h.answer();assert.deepEqual(h.c.problemGoldAwards,paid);assert.equal(courseGoldBalance(h.c),20);}
});
test("five-step adventure preserves a mid-original continuation through serialization and next adventure",()=>{
 const h=harness(fixture(7,1));h.go({type:"startQuest"});for(let i=0;i<5;i++){h.answer();h.go({type:"nextQuestion"});}
 assert.equal(h.view().stage,"questComplete");assert.ok(h.c.questContinuation);assert.equal(h.c.questContinuation!.connected!.index,5);assert.equal(h.c.stamps!.length,1);
 h.c=JSON.parse(JSON.stringify(h.c));h.go({type:"startQuest"});assert.equal(h.view().task!.connected!.index,6);assert.equal(h.view().quest!.completed,0);h.answer();h.go({type:"nextQuestion"});h.answer();h.go({type:"nextQuestion"});assert.equal(h.view().stage,"questComplete");assert.equal(h.c.attempts.length,7);assert.equal(h.c.stamps!.length,2);
});
test("legacy pending all-field work is never upgraded to the new connected contract",()=>{
 const content=fixture(),legacy={...content,connectedProblem:undefined};const h=harness(legacy);h.go({type:"selectTopic",topicId:"topic"});delete h.c.topics.topic!.work.core!.attempt.partIndex;
 const saved=structuredClone(h.c);const projected=migrateKidsCourse(h.c,content,now);assert.deepEqual(projected,saved);assert.equal(courseView(projected,content,now).task!.connected,undefined);
 const done=applyCourseAction(projected,content,{type:"answer",taskKey:courseView(projected,content,now).task!.key,answers:["1","2"]},now);assert.equal(done.attempts.length,1);assert.equal(done.problemGoldAwards![0]!.key,"source:s0");
});

test("new natural gold also prevents a pending legacy source from paying a second source award",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});h.answer();
 const unitAwards=structuredClone(h.c.problemGoldAwards);
 const original=h.content.problem("skill",0,false)!;
 const legacy={key:"legacy-pending",problem:original,mode:"core" as const,hintUsed:false};
 h.c.topics.topic!.work.core={attempt:legacy};
 h.go({type:"answer",taskKey:legacy.key,answers:original.fields.map(f=>f.answer)});
 assert.deepEqual(h.c.problemGoldAwards,unitAwards);
});

test("standard and hard unit rewards require every field and third help excludes only the current attempt",()=>{
 for(const hard of [false,true])for(const hints of [0,1,2,3]){
  const base=fixture();const content={...base,connectedProblem:(p:CourseProblem)=>{const source=base.connectedProblem!(p);if(source)for(const u of source.units)u.difficulty={level:hard?"hard":"standard",rationale:"Test"};return source;}};
  const h=harness(content);h.go({type:"selectTopic",topicId:"topic"});
  for(let i=0;i<hints;i++)h.go({type:"hint",taskKey:h.view().task!.key});
  h.answer();assert.equal(h.c.problemGoldAwards?.[0]?.amount,hints===3?undefined:hard?15:10);
  assert.equal(h.c.attempts[0]!.goldEligible,hints===3?false:undefined);
 }
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});h.go({type:"answer",taskKey:h.view().task!.key,answers:["1","99"]});
 assert.equal(h.c.attempts[0]!.outcome,"incorrect");assert.equal(h.c.problemGoldAwards?.length??0,0);
});

function currentWork(c: ReturnType<typeof newKidsCourse>) {
 const active=c.active!,topic=c.topics[active.topicId]!;
 return c.journey==="quest"?c.quest!.work!:active.skillId?topic.skillWork![active.skillId]!:topic.work[active.mode]!;
}

test("all four competitions project broad islands, select canonical originals, reserve them and resume drafts",()=>{
 for(const content of [kidsCourseContent,olympiadCourseContent,nvoCourseContent,proletnoCourseContent]){
  const initial=newKidsCourse(content,now);const projected=courseView(initial,content,now);
  assert.deepEqual(projected.topics.map(t=>t.id),content.navigationGroups!.map(g=>g.id));
  for(const group of content.navigationGroups!){
   let c=applyCourseAction(initial,content,{type:"selectTopic",topicId:group.id},now);
   const work=currentWork(c);assert.ok(work,`${content.version}/${group.id}`);
   assert.ok(work.connected,`${content.version}/${group.id}`);
   assert.ok(group.sourceIds.includes(work.connected!.problem.sourceId));
   assert.equal(courseView(c,content,now).active!.topicId,group.id);
   const answers=work.attempt.problem.fields.map((_,i)=>i?"":"1");
   c=applyCourseAction(c,content,{type:"saveDraft",taskKey:work.attempt.key,partIndex:0,answers},now);
   const saved=JSON.parse(JSON.stringify(currentWork(c))) as ReturnType<typeof currentWork>;
   c=JSON.parse(JSON.stringify(c));c=applyCourseAction(c,content,{type:"startQuest"},now);
   assert.notEqual(currentWork(c).connected?.problem.sourceId,saved.connected!.problem.sourceId);
   c=applyCourseAction(c,content,{type:"selectTopic",topicId:group.id},now);
   assert.deepEqual(currentWork(c),saved);assert.deepEqual(courseView(c,content,now).task!.draft,answers);
   c=applyCourseAction(c,content,{type:"answer",taskKey:saved.attempt.key,answers:saved.attempt.problem.fields.map(f=>f.answer)},now);
   if(saved.connected!.problem.units.length>1)assert.ok(pendingProblems(c).some(p=>p.archive?.sourceId===saved.connected!.problem.sourceId));
   assert.equal(c.problemGoldAwards![0]!.groupId,group.id);
   assert.equal(courseView(c,content,now).topics.find(t=>t.id===group.id)!.gold.earned>=10,true);
  }
 }
});

test("new islands find historical pending sources across old topic ownership without rewriting their contracts",()=>{
 for(const content of [kidsCourseContent,olympiadCourseContent,nvoCourseContent,proletnoCourseContent]){
  const legacy={...content,connectedProblem:undefined,navigationGroups:undefined};
  for(const topic of content.topics){
   let c=applyCourseAction(newKidsCourse(legacy,now),legacy,{type:"selectTopic",topicId:topic.id},now);
   const work=currentWork(c),source=content.connectedProblem!(work.attempt.problem);
   if(!source)continue;
   const group=content.navigationGroups!.find(g=>g.sourceIds.includes(source.sourceId))!;
   c=applyCourseAction(c,legacy,{type:"hint",taskKey:work.attempt.key},now);
   const before=structuredClone(currentWork(c));
   c=applyCourseAction(c,content,{type:"selectTopic",topicId:group.id},now);
   assert.deepEqual(currentWork(c),before);assert.equal(courseView(c,content,now).active!.topicId,group.id);
   assert.equal(currentWork(c).connected,undefined);
  }
 }
});

test("current adventures never reassign a source while a connected original is active or has fresh evidence",()=>{
 for(const content of [kidsCourseContent,olympiadCourseContent,nvoCourseContent,proletnoCourseContent]){
  let c=applyCourseAction(newKidsCourse(content,now),content,{type:"startQuest"},now);
  const seen=new Set<string>();
  for(let i=0;i<15;i++){
   if(c.quest!.completedAt)c=applyCourseAction(c,content,{type:"startQuest"},now);
   if(c.quest!.completedAt||!c.quest!.work)break;
   const work=currentWork(c),a=work.attempt;
   if(work.connected?.index===0){assert.ok(!seen.has(work.connected.problem.sourceId),`${content.version}: ${work.connected.problem.sourceId}`);seen.add(work.connected.problem.sourceId);}
   c=applyCourseAction(c,content,{type:"answer",taskKey:a.key,answers:a.problem.fields.map(f=>f.answer)},now);
   c=applyCourseAction(c,content,{type:"nextQuestion"},now);
  }
  assert.ok(seen.size>1);
 }
});


test("new scaffolds do not consume original rewards and historical scaffold awards remain payable",()=>{
 const base=fixture(),original=base.problem("skill",0,false)!;
 const scaffold={...original,id:"scaffold",provenance:undefined,archive:{sourceId:"s0",kind:"scaffold" as const,covers:["u0"]}};
 const content={...base,problem:(_skill:string,i:number,hard:boolean)=>hard?null:i===0?scaffold:null};
 const h=harness(content);h.go({type:"selectTopic",topicId:"topic"});
 assert.equal(h.view().task!.goldReward,undefined);h.answer();assert.equal(h.c.problemGoldAwards?.length??0,0);assert.equal(courseGoldBalance(h.c),15);
 assert.equal(problemGoldPreview(h.c,base,{...original,naturalUnit:{sourceId:"s0",unitId:"u0",total:2}})?.amount,10);
 const legacy={...content,connectedProblem:undefined};const saved=harness(legacy);saved.go({type:"selectTopic",topicId:"topic"});
 saved.go({type:"answer",taskKey:saved.view().task!.key,answers:original.fields.map(f=>f.answer)});
 const paid=structuredClone(saved.c.problemGoldAwards);assert.equal(paid!.length,1);
 assert.equal(courseGoldBalance(migrateKidsCourse(saved.c,content,now)),25);assert.deepEqual(saved.c.problemGoldAwards,paid);
});

test("help inherited from a prerequisite does not consume the current unit's first local hint",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});h.go({type:"hint",taskKey:h.view().task!.key});h.answer();h.go({type:"nextQuestion"});
 h.go({type:"dontKnow",taskKey:h.view().task!.key});assert.equal(h.view().task!.hintLevel,1);assert.equal(h.view().task!.outcome,undefined);
});


test("splitting geometry resumes a saved part in its current island without changing its draft or history",()=>{
 const content=kidsCourseContent;
 const geometry=content.navigationGroups!.filter(g=>["perimeters","areas"].includes(g.id));
 const merged={...content,navigationGroups:content.navigationGroups!.filter(g=>g.id!=="areas").map(g=>g.id==="perimeters"?{...g,topicIds:geometry.flatMap(x=>x.topicIds),sourceIds:geometry.flatMap(x=>x.sourceIds)}:g)};
 let c=applyCourseAction(newKidsCourse(merged,now),merged,{type:"selectTopic",topicId:"grids",skillId:"M2-2a"},now);
 assert.equal(currentWork(c).connected!.problem.sourceId,"M2-2");
 c.active!.groupId="perimeters";
 const task=currentWork(c).attempt;
 c=applyCourseAction(c,merged,{type:"saveDraft",taskKey:task.key,answers:["12","",""],partIndex:0},now);
 const saved=structuredClone(currentWork(c)),before=JSON.stringify(c);
 assert.equal(courseView(c,content,now).active!.topicId,"areas");
 assert.equal(JSON.stringify(c),before);
 c=applyCourseAction(JSON.parse(JSON.stringify(c)),content,{type:"selectTopic",topicId:"areas"},now);
 assert.deepEqual(currentWork(c),saved);
 assert.deepEqual(courseView(c,content,now).task!.draft,["12","",""]);
 assert.equal(c.attempts.length,0);
 assert.equal(courseGoldBalance(c),0);
});

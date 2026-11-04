import assert from "node:assert/strict";
import {test} from "node:test";
import {applyCourseAction,courseView,newKidsCourse,parseCourseCommand} from "../src/core/kids-course.ts";
import type {CourseAction,CourseProblem,KidsCourseContent} from "../src/core/kids-course.ts";
import {awardProblemGold,courseGoldBalance,problemGoldKey} from "../src/core/kids-gold.ts";
const now="2026-11-04T10:00:00.000Z";
function fixture(core=3,hard=4):KidsCourseContent {
 return {version:"polish-fixture",topics:[{id:"island",title:"Остров",rewardName:"методи",skills:[{id:"method",title:"Метод",lesson:["Обяснение"]}]}],
  problem:(skillId,index,harder):CourseProblem|null=>index<(harder?hard:core)?{id:`${harder?"hard":"core"}-${index}`,skillId,text:`Намери ${harder?100+index:index}`,source:"Учебно упражнение",fields:[{label:"Отговор",answer:String(harder?100+index:index)}],hint:"Първа стъпка",explanation:["Проверка"]}:null};
}
function harness(content=fixture()){
 let record=newKidsCourse(content,now);
 const view=()=>courseView(record,content,now);
 const go=(action:CourseAction,date=now)=>record=applyCourseAction(record,content,action,date);
 const work=()=>record.journey==="quest"?record.quest!.work!:record.topics.island!.work[record.active!.mode]!;
 const answer=()=>go({type:"answer",taskKey:work().attempt.key,answers:work().attempt.problem.fields.map(f=>f.answer)});
 const next=()=>{go({type:"nextQuestion"});while(view().stage==="lesson")go({type:"lessonNext"});};
 return{get record(){return record;},view,go,work,answer,next};
}
test("remaining hard problems stay available after Professor in adventure and island practice",()=>{
 for(const entry of ["quest","topic"] as const){
  const h=harness(fixture(2,4));h.go({type:"selectTopic",topicId:"island"});
  h.answer();h.next();h.answer();h.next();h.answer();h.next();h.answer();h.next();
  assert.ok(h.record.topics.island!.professorAt);
  // Topic practice has reserved the next hard task; the adventure must skip that reservation.
  if(entry==="quest")h.go({type:"startQuest"});
  assert.ok(h.view().task?.key.includes("hard-"));
  assert.ok(!h.record.attempts.some(a=>a.problem.id===h.work().attempt.problem.id));
  h.answer();assert.equal(h.record.awards.filter(a=>a.rank==="professor").length,1);
 }
});
test("hard fallback keeps prerequisite gates even after a retained Professor award",()=>{
 const content=fixture(0,1);content.concepts=[{id:"method",title:"Метод",prerequisites:["missing"],attention:"",idea:"",workedStep:""}];
 const h=harness(content);Object.assign(h.record.topics.island!,{doctorAt:now,professorAt:now});h.record.topics.island!.skills.method!.confirmedAt=now;
 h.go({type:"startQuest"});assert.equal(h.view().questAvailable,false);assert.equal(h.view().task,undefined);
 h.go({type:"selectTopic",topicId:"island"});assert.equal(h.view().exhausted,true);
});
test("one to four remaining tasks finish once at their actual count, with no chest bonus",()=>{
 for(let count=1;count<=4;count++){
  const h=harness(fixture(count,0));h.go({type:"startQuest"});
  for(let i=0;i<count;i++){h.answer();const gold=courseGoldBalance(h.record);h.next();assert.equal(courseGoldBalance(h.record),gold);}
  assert.equal(h.view().stage,"questComplete");assert.equal(h.view().quest!.total,count);assert.equal(h.record.stamps!.length,1);
  assert.equal(h.view().questAvailable,false);const id=h.record.quest!.id;
  h.go({type:"startQuest"});assert.equal(h.record.quest!.id,id);assert.equal(h.record.stamps!.length,1);assert.equal(h.record.attempts.length,count);
 }
 const empty=harness(fixture(0,0));empty.go({type:"startQuest"});assert.equal(empty.view().questAvailable,false);assert.equal(empty.view().task,undefined);assert.equal(empty.record.stamps!.length,0);
});
test("legacy exhausted partial adventures finish without losing their completed tasks",()=>{
 const h=harness(fixture(1,0));h.go({type:"startQuest"});h.answer();h.next();
 delete h.record.quest!.completedAt;delete h.record.quest!.total;h.record.quest!.exhausted=true;h.record.stamps=[];
 h.go({type:"startQuest"});assert.equal(h.view().quest!.total,1);assert.equal(h.view().quest!.finished,true);assert.equal(h.record.stamps!.length,1);
});
test("future correctness recovers missed problem gold once across original and parts",()=>{
 const base=fixture();const problem=base.problem("method",0,false)!;
 problem.archive={sourceId:"2024-source",kind:"original",covers:["a","b"]};
 const content={...base,problem:(skill:string,index:number,hard:boolean)=>!hard&&index===0?problem:base.problem(skill,index,hard)};const h=harness(content);
 const original={key:"old",problem,mode:"core" as const,hintUsed:false,outcome:"incorrect" as const,completedAt:now};
 h.record.attempts.push(original);const before=courseGoldBalance(h.record);
 awardProblemGold(h.record,content,{...original,key:"later",outcome:"independent"},now);
 assert.equal(courseGoldBalance(h.record)-before,10);
 const part={...problem,id:"source-part",archive:{sourceId:"2024-source",kind:"part" as const,covers:["b"]}};
 assert.equal(problemGoldKey(part,content),problemGoldKey(problem,content));
 awardProblemGold(h.record,content,{...original,problem:part,key:"part",outcome:"hinted"},now);
 assert.equal(courseGoldBalance(h.record)-before,10);
 assert.equal(h.record.problemGoldAwards!.length,1);
});
test("island targets persist as content grows while additional problems still earn wallet gold",()=>{
 const old=fixture(2,0);const h=harness(old);h.go({type:"startQuest"});
 h.answer();h.next();h.answer();h.next();
 const completedGold=courseGoldBalance(h.record),target=h.view().topics[0]!.gold.total;
 assert.equal(completedGold,target);
 const bigger=fixture(3,0);let grown=applyCourseAction(h.record,bigger,{type:"startQuest"},now);
 assert.equal(courseView(grown,bigger,now).topics[0]!.gold.total,target);
 const attempt=grown.quest!.work!.attempt;
 grown=applyCourseAction(grown,bigger,{type:"answer",taskKey:attempt.key,answers:attempt.problem.fields.map(f=>f.answer)},now);
 assert.equal(courseGoldBalance(grown),completedGold+10);assert.equal(courseView(grown,bigger,now).topics[0]!.gold.total,target);
 assert.equal(grown.topics.island!.professorAt,undefined);
 const legacy=structuredClone(grown);delete legacy.islandGoldTargets;
 const bytes=JSON.stringify(legacy);const projected=courseView(legacy,bigger,now);assert.equal(JSON.stringify(legacy),bytes);
 const stored=applyCourseAction(legacy,bigger,{type:"dashboard"},now);assert.equal(stored.islandGoldTargets!.island,projected.topics[0]!.gold.total);
});
test("drafts reject invalid fields, parts and task keys and add no evidence",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"island"});const key=h.view().task!.key;
 h.go({type:"saveDraft",taskKey:key,partIndex:0,answers:["1,"]});assert.deepEqual(h.view().task!.draft,["1,"]);
 assert.equal(h.record.attempts.length,0);assert.equal(courseGoldBalance(h.record),0);
 for(const action of [
  {type:"saveDraft",taskKey:"wrong",partIndex:0,answers:["1"]},
  {type:"saveDraft",taskKey:key,partIndex:1,answers:["1"]},
  {type:"saveDraft",taskKey:key,partIndex:0,answers:["1","2"]},
  {type:"saveDraft",taskKey:key,partIndex:0,answers:["<script>"]},
 ] as CourseAction[])assert.throws(()=>h.go(action));
 assert.throws(()=>parseCourseCommand({revision:0,action:{type:"saveDraft",taskKey:key,partIndex:0,answers:["1".repeat(13)]}}));
 h.answer();assert.equal(h.work().attempt.draft,undefined);assert.throws(()=>h.go({type:"saveDraft",taskKey:key,partIndex:0,answers:[""]}));
});

import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {SupabaseClient} from "@supabase/supabase-js";
import {dailyRecordCandidates, increasedDailyRecords, firstIndependentWholeProblem} from "../src/core/accomplishments.ts";
import {applyCourseAction, newKidsCourse, type CourseAttempt, type CourseAction, type KidsCourseContent, type ConnectedCourseProblem, type KidsCourse} from "../src/core/kids-course.ts";
import {createKidsCourseStore} from "../src/store/kids-course.ts";
import {createSupabaseCourseStore} from "../src/store/supabase-course.ts";
import {kidsCourseResponse, readKidsCourseView, type CourseStore} from "../src/server/kids-course.ts";
import {courseGoldBalance} from "../src/core/kids-gold.ts";
const yesterday="2026-11-13T12:00:00.000Z", today="2026-11-14T12:00:00.000Z";
const content:KidsCourseContent={version:"appreciations",topics:[{id:"topic",title:"Topic",rewardName:"Reward",skills:[{id:"skill",title:"Skill",lesson:[]}]}],problem:(_id,index)=>index<20?{id:`p${index}`,skillId:"skill",text:`Task ${index}`,source:"Fixture",fields:[{label:"Answer",answer:"2"}],hint:"Hint",explanation:[]}:null};
const attempt=(key:string,date:string|undefined,outcome:CourseAttempt["outcome"]="independent"):CourseAttempt=>({key,mode:"core",hintUsed:outcome==="hinted",outcome,completedAt:date,problem:content.problem("skill",0,false)!});
function activity(attempts:CourseAttempt[],gold:{day:string;amount:number}[]=[]){
 const course=newKidsCourse(content,today);course.attempts=attempts.map(a=>({...a,goldEligible:false}));
 course.problemGoldAwards=gold.map((award,i)=>({key:`g${i}`,skillId:"skill",earnedAt:award.day,amount:award.amount}));return course;
}
function started(time=today){return applyCourseAction(newKidsCourse(content,time),content,{type:"selectTopic",topicId:"topic"},time);}
function answer(course:KidsCourse,time=today){const work=course.topics.topic!.work[course.active!.mode]!;return applyCourseAction(course,content,{type:"answer",taskKey:work.attempt.key,answers:["2"]},time);}

test("daily records start on the second active Sofia day, aggregate competitions, and require strict records",()=>{
 const first=activity([attempt("a",today)], [{day:today,amount:30}]);
 assert.deepEqual(dailyRecordCandidates([first],today),[]);
 const old=activity([attempt("old",yesterday)], [{day:yesterday,amount:20}]);
 const current=activity([attempt("a",today),attempt("b",today,"hinted"),attempt("wrong",today,"incorrect"),attempt("shown",today,"revealed")],[{day:today,amount:21}]);
 assert.deepEqual(dailyRecordCandidates([old,current],today),[{kind:"daily-tasks",day:"2026-11-14",amount:2},{kind:"daily-gold",day:"2026-11-14",amount:21}]);
 assert.deepEqual(dailyRecordCandidates([old,activity([attempt("tie",today)],[{day:today,amount:20}])],today),[]);
 assert.deepEqual(dailyRecordCandidates([activity([attempt("missing",undefined),attempt("bad","invalid"),attempt("now",today)])],today),[]);
 assert.deepEqual(dailyRecordCandidates([activity([attempt("earlier-mistake",yesterday,"incorrect"),attempt("now",today)])],today).map(a=>a.kind),["daily-tasks"]);
 const a=activity([attempt("past","2026-11-13T21:59:59Z"),attempt("now","2026-11-13T22:00:00Z"),attempt("now2","2026-11-13T22:01:00Z")]);
 assert.equal(dailyRecordCandidates([a],"2026-11-13T22:01:00Z")[0]!.day,"2026-11-14");
 assert.deepEqual(dailyRecordCandidates([a],"invalid"),[]);
});

test("calendar subparts and saved gold amounts count, with no celebration for unchanged metrics",()=>{
 const part={...attempt("part",today),problem:{...content.problem("skill",0,false)!,naturalUnit:{sourceId:"s",unitId:"a",total:2}}};
 const before=activity([attempt("old",yesterday,"incorrect")]);
 const next=activity([...before.attempts,part],[{day:today,amount:25}]);
 assert.deepEqual(increasedDailyRecords([next],before,next,today).map(a=>[a.kind,a.amount]),[["daily-tasks",1],["daily-gold",25]]);
 assert.deepEqual(increasedDailyRecords([next],next,next,today),[]);
 const noGold=activity(next.attempts);assert.deepEqual(increasedDailyRecords([next],noGold,next,today).map(a=>a.kind),["daily-gold"]);
});

const solution=[{title:"One",paragraphs:["One"]},{title:"Two",paragraphs:["Two"]},{title:"Three",paragraphs:["Three"]}] as ConnectedCourseProblem["units"][number]["solution"];
const source:ConnectedCourseProblem={sourceId:"source",text:"Full problem",units:["a","b"].map(id=>({id,skillId:"skill",text:id,fields:[{label:"Answer",answer:"2"}],solution}))};
function parts(outcomes:CourseAttempt["outcome"][]=["independent","independent"]){return outcomes.map((outcome,i)=>({...attempt(`part-${i}`,today,outcome),sourceComplete:i===1,problem:{...content.problem("skill",0,false)!,naturalUnit:{sourceId:"source",unitId:i?"b":"a",total:2}}}));}

test("whole-original recognition checks every part, ignores last-part-only success, and honors prior independent history",()=>{
 assert.equal(firstIndependentWholeProblem([],source,parts()),true);
 for(const outcome of ["hinted","incorrect","revealed"] as const)assert.equal(firstIndependentWholeProblem([],source,parts([outcome,"independent"])),false);
 assert.equal(firstIndependentWholeProblem([],source,[parts()[1]!]),false);
 assert.equal(firstIndependentWholeProblem([],source,[parts()[0]!,parts()[0]!]),false);
 assert.equal(firstIndependentWholeProblem(parts(),source,parts()),false);
 assert.equal(firstIndependentWholeProblem(parts(["hinted","independent"]),source,parts()),true);
 assert.equal(firstIndependentWholeProblem([{...attempt("legacy",yesterday),problem:{...content.problem("skill",0,false)!,archive:{kind:"original",sourceId:"source",covers:["a","b"]}}}],source,parts()),false);
});

test("connected completion records appreciation only when all parts in this run were independent",()=>{
 const connected:KidsCourseContent={...content,connectedProblem:()=>source};
 for(const hinted of [false,true]){
  let course=applyCourseAction(newKidsCourse(connected,today),connected,{type:"selectTopic",topicId:"topic"},today);
  const work=()=>course.topics.topic!.work[course.active!.mode]!;
  const go=(action:CourseAction)=>{course=applyCourseAction(course,connected,action,today);};
  if(hinted)go({type:"hint",taskKey:work().attempt.key});
  go({type:"answer",taskKey:work().attempt.key,answers:["2"]});assert.equal(course.attempts[0]!.appreciations,undefined);
  go({type:"nextQuestion"});go({type:"answer",taskKey:work().attempt.key,answers:["2"]});
  assert.equal(course.attempts.at(-1)!.appreciations?.some(a=>a.kind==="whole-problem")??false,!hinted);
 }
});

test("whole-original recognition follows saved navigation work even when its slot differs from the skill",()=>{
 const connected:KidsCourseContent={...content,connectedProblem:()=>source};
 let course=applyCourseAction(newKidsCourse(connected,today),connected,{type:"selectTopic",topicId:"topic"},today);
 const slot="navigation:group";
 course.topics.topic!.skillWork={[slot]:course.topics.topic!.work.core!};delete course.topics.topic!.work.core;course.active!.skillId=slot;
 for(let i=0;i<2;i++){
  const work=course.topics.topic!.skillWork![slot]!;
  course=applyCourseAction(course,connected,{type:"answer",taskKey:work.attempt.key,answers:["2"]},today);
  if(!i)course=applyCourseAction(course,connected,{type:"nextQuestion"},today);
 }
 assert.ok(course.attempts.at(-1)!.appreciations?.some(a=>a.kind==="whole-problem"));
});

test("scheduled-review recognition requires an independent due review and leaves rewards unchanged",()=>{
 for(const due of [yesterday,"2026-11-15T12:00:00.000Z"]){
  for(const hinted of [false,true]){
   let course=started();const topic=course.topics.topic!;
   topic.skills.skill!.confirmedAt=yesterday;topic.skills.skill!.reviewDueAt=due;
   topic.work.review=topic.work.core;delete topic.work.core;
   course.active!.mode="review";topic.work.review!.attempt.mode="review";
   if(hinted)course=applyCourseAction(course,content,{type:"hint",taskKey:topic.work.review!.attempt.key},today);
   const next=answer(course);
   assert.equal(next.attempts.at(-1)!.appreciations?.some(a=>a.kind==="scheduled-review")??false,!hinted&&due===yesterday);
   const without=structuredClone(next);delete without.attempts.at(-1)!.appreciations;
   assert.equal(courseGoldBalance(next),courseGoldBalance(without));
  }
 }
 const course=started();course.topics.topic!.skills.skill!.reviewDueAt=yesterday;
 assert.equal(answer(course).attempts[0]!.appreciations?.some(a=>a.kind==="scheduled-review")??false,false);
});

test("local daily claims survive new adapters, competitions, and repeated answers; learners stay isolated",()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-accomplishments-"));
 try{
  const wallet=path.join(directory,"child-a"),other=path.join(wallet,"competitions","other");fs.mkdirSync(other,{recursive:true});
  const old=activity([attempt("old",yesterday)]),before=activity([attempt("now",today)]),next=activity([attempt("now",today),attempt("next",today)],[{day:today,amount:10}]);
  fs.writeFileSync(path.join(wallet,"course-v2.json"),JSON.stringify(old));
  const store=createKidsCourseStore(other,wallet);
  assert.equal(store.claimDailyRecords!(before,next,today).length,2);
  assert.deepEqual(createKidsCourseStore(other,wallet).claimDailyRecords!(before,next,today),[]);
  assert.equal(fs.readdirSync(path.join(wallet,"accomplishments")).length,2);
  const independentWallet=path.join(directory,"child-b");fs.mkdirSync(independentWallet);fs.writeFileSync(path.join(independentWallet,"course-v2.json"),JSON.stringify(old));
  assert.equal(createKidsCourseStore(path.join(independentWallet,"competitions","other"),independentWallet).claimDailyRecords!(before,next,today).length,2);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(wallet,"course-v2.json"),"utf8")),old);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

function hostedClaimFixture(){
 const old=activity([attempt("old",yesterday)]),claims=new Set<string>(),queries:{table:string;filters:Record<string,string>}[]=[];
 const db={from(table:string){const filters:Record<string,string>={};let inserts:Record<string,unknown>[]=[];
  const chain={eq(k:string,v:string){filters[k]=v;return chain;},neq(k:string,v:string){filters[`not:${k}`]=v;return chain;},select(){return chain;},upsert(rows:Record<string,unknown>[],options:unknown){assert.deepEqual(options,{onConflict:"child_id,day,kind",ignoreDuplicates:true});inserts=rows;return chain;},
   then(resolve:(value:unknown)=>unknown){queries.push({table,filters});if(table==="course_progress")return Promise.resolve({data:[{competition_id:"earlier",course:old}],error:null}).then(resolve);
    const data=inserts.filter(row=>{const key=[row.child_id,row.day,row.kind].join(":");if(claims.has(key))return false;claims.add(key);return true;});return Promise.resolve({data,error:null}).then(resolve);
   }};return chain;
 }} as unknown as SupabaseClient;
 return {db,queries,claims};
}
test("hosted claim adapters atomically deduplicate simultaneous records across competitions and scope history by owner and child",async()=>{
 const fixture=hostedClaimFixture(),a=createSupabaseCourseStore(fixture.db,"parent","child","a"),b=createSupabaseCourseStore(fixture.db,"parent","child","b");
 const before=activity([attempt("today",today)]),next=activity([...before.attempts,attempt("next",today)],[{day:today,amount:10}]);
 const results=await Promise.all([a.claimDailyRecords!(before,next,today),b.claimDailyRecords!(before,next,today)]);
 assert.equal(results.flat().length,2);assert.equal(fixture.claims.size,2);
 for(const query of fixture.queries.filter(q=>q.table==="course_progress")){assert.equal(query.filters.parent_id,"parent");assert.equal(query.filters.child_id,"child");assert.ok(query.filters["not:competition_id"]);}
 const childB=createSupabaseCourseStore(fixture.db,"parent","child-b","a");assert.equal((await childB.claimDailyRecords!(before,next,today)).length,2);
});

test("answer responses carry appreciations only after saving; failed recognition never rejects saved work",async()=>{
 let course=started(),claims=0;
 course.attempts.push({...attempt("previous",yesterday,"hinted"),problem:content.problem("skill",5,false)!});
 const key=course.topics.topic!.work.core!.attempt.key;
 const store:CourseStore={read:()=>course,update(revision,action){assert.equal(revision,course.revision);course=applyCourseAction(course,content,action,today);return course;},claimDailyRecords(){claims++;throw new Error("Claim store unavailable");}};
 const request=(action:CourseAction)=>new Request("http://localhost/api/kids/course",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision:course.revision,action})});
 const original=console.error;console.error=()=>{};
 try{
  const response=await kidsCourseResponse(request({type:"answer",taskKey:key,answers:["2"]}),store,content);
  assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.course.appreciations,[{kind:"hint-independent"}]);assert.equal(claims,1);
  assert.equal((await readKidsCourseView(store,content)).appreciations,undefined);
  assert.equal((await kidsCourseResponse(request({type:"answer",taskKey:key,answers:["2"]}),store,content)).status,409);
  assert.equal(claims,1);
 }finally{console.error=original;}
 const failed:CourseStore={read:()=>started(),update(){throw new Error("Save failed");},claimDailyRecords(){throw new Error("Must not claim");}};
 console.error=()=>{};try{assert.equal((await kidsCourseResponse(new Request("http://localhost/api/kids/course",{method:"POST",body:JSON.stringify({revision:1,action:{type:"answer",taskKey:key,answers:["2"]}})}),failed,content)).status,500);}finally{console.error=original;}
});

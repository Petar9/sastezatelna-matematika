import assert from "node:assert/strict";
import {DEFAULT_COMPETITION_ID} from "../src/core/competitions.ts";
import {test} from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createSupabaseCourseStore} from "../src/store/supabase-course.ts";
import {kidsCourseContent as currentContent} from "../src/server/kids-course-content.ts";
import {applyCourseAction,migrateKidsCourse,newKidsCourse} from "../src/core/kids-course.ts";
import type {KidsCourse} from "../src/core/kids-course.ts";
import {newGoldGain} from "../src/core/kids-gold.ts";
import {kidsCourseResponse} from "../src/server/kids-course.ts";
import {approvedGoogleUser,selectedChild} from "../src/server/context.ts";
import {mode,mutationAllowed,isLoopbackHost} from "../src/server/config.ts";

type Row={parent_id:string;child_id:string;competition_id?:string;revision:number;course:unknown;updated_at?:string};
function fakeDatabase(initial:Row[]=[]){
 const rows=structuredClone(initial).map(row=>({competition_id:DEFAULT_COMPETITION_ID,...row}));const filters:Record<string,unknown>[][]=[];
 const requests:{operation:string;conditions:Record<string,unknown>[];exclusions:Record<string,unknown>[];returnedRows:number}[]=[];
 return {rows,filters,requests,client:{from(table:string){assert.equal(table,"course_progress");let operation="read",value:Partial<Row>={};const conditions:Record<string,unknown>[]=[],exclusions:Record<string,unknown>[]=[];
 const matches=(row:Row)=>conditions.every(c=>Object.entries(c).every(([k,v])=>row[k as keyof Row]===v))&&exclusions.every(c=>Object.entries(c).every(([k,v])=>row[k as keyof Row]!==v));
 const record=(returnedRows:number)=>{filters.push(conditions);requests.push({operation,conditions,exclusions,returnedRows});};
 const chain={select(){return chain;},eq(key:string,v:unknown){conditions.push({[key]:v});return chain;},neq(key:string,v:unknown){exclusions.push({[key]:v});return chain;},update(v:Partial<Row>){operation="update";value=v;return chain;},
 async insert(row:Row){await Promise.resolve();requests.push({operation:"insert",conditions:[],exclusions:[],returnedRows:0});if(rows.some(r=>r.child_id===row.child_id&&r.competition_id===row.competition_id))return {error:{code:"23505"}};rows.push({...structuredClone(row),competition_id:row.competition_id??DEFAULT_COMPETITION_ID});return {error:null};},
 then(resolve:(value:unknown)=>unknown){const matched=rows.filter(matches);record(matched.length);return Promise.resolve({data:structuredClone(matched),error:null}).then(resolve);},
 async maybeSingle(){const row=rows.find(matches);record(row?1:0);if(operation==="update"&&row)Object.assign(row,structuredClone(value));return {data:row?structuredClone(row):null,error:null};}};return chain;}} as unknown as SupabaseClient};
}
// Keep the saved, pre-connected contract covered by the legacy regression suite.
const content = { ...currentContent, connectedProblem: undefined, navigationGroups: undefined };
const now="2026-11-03T10:00:00Z";
test("Supabase course CAS rejects concurrent first inserts and updates, and scopes both owner keys",async()=>{
 const db=fakeDatabase();const store=createSupabaseCourseStore(db.client,"parent-a","child-a");
 let results=await Promise.allSettled([store.update(0,{type:"selectTopic",topicId:"matches"},content),store.update(0,{type:"selectTopic",topicId:"clocks"},content)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(db.rows.length,1);
 results=await Promise.allSettled([store.update(1,{type:"pause"},content),store.update(1,{type:"pause"},content)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(db.rows[0]!.revision,2);
 for(const query of db.filters){assert.ok(query.some(c=>c.parent_id==="parent-a"));assert.ok(query.some(c=>c.child_id==="child-a"));}
 const foreign=createSupabaseCourseStore(db.client,"parent-b","child-a");assert.equal(await foreign.read(content),null);
 const other=createSupabaseCourseStore(db.client,"parent-a","child-b");await other.update(0,{type:"selectTopic",topicId:"clocks"},content);assert.equal(db.rows.length,2);assert.equal(db.rows[0]!.revision,2);
});
test("projected migration saves against raw DB revision once, preserving prior evidence",async()=>{
 const old=newKidsCourse(content,now);delete old.questVersion;delete old.journey;delete old.stamps;delete old.diagnostics;delete old.quest;
 const db=fakeDatabase([{parent_id:"p",child_id:"c",revision:old.revision,course:old}]);const store=createSupabaseCourseStore(db.client,"p","c");
 const projected=await store.read(content);assert.ok(projected);assert.ok(projected.revision>old.revision);assert.equal(db.rows[0]!.revision,old.revision);
 const saved=await store.update(projected.revision,{type:"selectTopic",topicId:"matches"},content);
 assert.equal(saved.revision,projected.revision+1);assert.equal(db.rows[0]!.revision,saved.revision);assert.deepEqual(saved.attempts,old.attempts);
 await assert.rejects(async()=>store.update(projected.revision,{type:"pause"},content),{status:409});
});
test("only verified Google parents qualify and selected child is always from owned profiles",()=>{
 assert.equal(approvedGoogleUser(null),false);assert.equal(approvedGoogleUser({id:"p",email:"x@y.z",app_metadata:{provider:"google"}}),false);
 assert.equal(approvedGoogleUser({id:"p",email:"x@y.z",email_confirmed_at:now,app_metadata:{provider:"email"}}),false);
 assert.equal(approvedGoogleUser({id:"p",email:"x@y.z",email_confirmed_at:now,app_metadata:{provider:"google"}}),true);
 const children=[{id:"a",nickname:"A"},{id:"b",nickname:"B"}];assert.equal(selectedChild(children,"foreign"),undefined);assert.equal(selectedChild(children,"a")?.id,"a");assert.equal(selectedChild([children[0]!],undefined)?.id,"a");
});
test("local and hosted mutation origins fail closed, and local mode is disabled on hosted platforms",()=>{
 const prior={...process.env};try{
  process.env.MATHS_MODE="local";delete process.env.VERCEL;delete process.env.NETLIFY;delete process.env.RENDER;delete process.env.FLY_APP_NAME;assert.equal(mode(),"local");
  assert.equal(isLoopbackHost("attacker.example"),false);assert.equal(isLoopbackHost("127.0.0.1:3002"),true);
  const req=(origin?:string)=>new Request("http://127.0.0.1:3002/api/kids/course",{method:"POST",headers:origin?{origin}:{}});
  assert.equal(mutationAllowed(req(),"local"),false);assert.equal(mutationAllowed(req("https://attacker.example"),"local"),false);assert.equal(mutationAllowed(req("http://127.0.0.1:3002"),"local"),true);
  const normalized=new Request("http://localhost:3002/api/kids/course",{method:"POST",headers:{host:"127.0.0.1:3002",origin:"http://127.0.0.1:3002"}});assert.equal(mutationAllowed(normalized,"local"),true);
  process.env.VERCEL="1";assert.throws(()=>mode(),/forbidden/);process.env.MATHS_MODE="hosted";process.env.MATHS_APP_URL="https://maths.example";
  assert.equal(mutationAllowed(req("http://127.0.0.1:3002"),"hosted"),false);assert.equal(mutationAllowed(req("https://maths.example"),"hosted"),true);
  delete process.env.MATHS_MODE;assert.throws(()=>mode(),/explicitly/);
 }finally{process.env=prior;}
});

test("same child has separate competition revisions, work and evidence",async()=>{
 const db=fakeDatabase();
 const first=createSupabaseCourseStore(db.client,"parent-a","child-a");
 const second=createSupabaseCourseStore(db.client,"parent-a","child-a","olimpiada-fixture");
 const original=await first.update(0,{type:"selectTopic",topicId:"matches"},content);
 const alternateContent={...content,version:"test-independent-competition"};
 const alternate=await second.update(0,{type:"selectTopic",topicId:"clocks"},alternateContent);
 assert.equal(db.rows.length,2);
 assert.equal(alternate.active?.topicId,"clocks");
 assert.equal((await first.read(content))?.active?.topicId,"matches");
 assert.equal((await first.read(content))?.revision,original.revision);
 assert.equal((await second.read(alternateContent))?.contentVersion,"test-independent-competition");
 const key=original.topics.matches!.work.core!.attempt.key;
 await first.update(original.revision,{type:"hint",taskKey:key},content);
 assert.equal((await second.read(alternateContent))?.revision,alternate.revision);
 assert.equal((await second.read(alternateContent))?.topics.matches?.work.core,undefined);
 const forged=createSupabaseCourseStore(db.client,"parent-b","child-a","olimpiada-fixture");
 assert.equal(await forged.read(alternateContent),null);
 for(const query of db.filters)assert.ok(query.some(c=>typeof c.competition_id==="string"));
});


test("gold wallet sums competitions once and isolates both parent and child",async()=>{
 const started=applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"matches"},now);
 const work=started.topics.matches!.work.core!.attempt;
 const earned=applyCourseAction(started,content,{type:"answer",taskKey:work.key,answers:work.problem.fields.map(f=>f.answer)},now);
 const row=(parent_id:string,child_id:string,competition_id:string)=>({parent_id,child_id,competition_id,revision:earned.revision,course:earned});
 const db=fakeDatabase([row("p","c",DEFAULT_COMPETITION_ID),row("p","c","other"),row("p","other",DEFAULT_COMPETITION_ID),row("other","c",DEFAULT_COMPETITION_ID)]);
 const store=createSupabaseCourseStore(db.client,"p","c");
 assert.equal(await store.goldBalance!(earned),50);
 assert.equal(db.rows.length,4);
 for(const query of db.filters){assert.ok(query.some(c=>c.parent_id==="p"));assert.ok(query.some(c=>c.child_id==="c"));}
});

test("concurrent gold awards use course CAS and cannot duplicate a milestone",async()=>{
 const db=fakeDatabase();const store=createSupabaseCourseStore(db.client,"p","c");
 const started=await store.update(0,{type:"selectTopic",topicId:"matches"},content);
 const attempt=started.topics.matches!.work.core!.attempt;
 const action={type:"answer",taskKey:attempt.key,answers:attempt.problem.fields.map(f=>f.answer)} as const;
 const results=await Promise.allSettled([store.update(started.revision,action,content),store.update(started.revision,action,content)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);
 const saved=(await store.read(content))!;
 assert.equal(saved.attempts.length,1);assert.equal(saved.goldAwards!.length,2);assert.equal(saved.problemGoldAwards!.length,1);
 assert.equal(await store.goldBalance!(saved),25);
});


test("simultaneous rewards in different competitions both survive without a shared-wallet overwrite",async()=>{
 const db=fakeDatabase();const a=createSupabaseCourseStore(db.client,"p","c");const b=createSupabaseCourseStore(db.client,"p","c","other");
 const [first,second]=await Promise.all([a.update(0,{type:"selectTopic",topicId:"matches"},content),b.update(0,{type:"selectTopic",topicId:"matches"},content)]);
 const answer=(course:typeof first)=>{const attempt=course.topics.matches!.work.core!.attempt;return{type:"answer",taskKey:attempt.key,answers:attempt.problem.fields.map(f=>f.answer)} as const;};
 const [savedA,savedB]=await Promise.all([a.update(first.revision,answer(first),content),b.update(second.revision,answer(second),content)]);
 assert.equal(await a.goldBalance!(savedA),50);assert.equal(await b.goldBalance!(savedB),50);
 assert.equal(db.rows.length,2);assert.ok(db.rows.every(row=>(row.course as typeof first).goldAwards!.length===2));
});


test("saved drafts sync between devices and stay isolated by parent, child, competition and revision",async()=>{
 const db=fakeDatabase();const first=createSupabaseCourseStore(db.client,"p","c");const second=createSupabaseCourseStore(db.client,"p","c");
 const started=await first.update(0,{type:"selectTopic",topicId:"grids"},content);const key=started.topics.grids!.work.core!.attempt.key;
 const action={type:"saveDraft" as const,taskKey:key,partIndex:0,answers:["56"]};
 const saved=await first.update(started.revision,action,content);
 assert.deepEqual((await second.read(content))!.topics.grids!.work.core!.attempt.draft,{partIndex:0,answers:["56"]});
 await assert.rejects(async()=>second.update(started.revision,{...action,answers:["99"]},content),{status:409});
 assert.deepEqual((await first.read(content))!.topics.grids!.work.core!.attempt.draft!.answers,["56"]);
 for(const other of [createSupabaseCourseStore(db.client,"other","c"),createSupabaseCourseStore(db.client,"p","other"),createSupabaseCourseStore(db.client,"p","c","other")])assert.equal(await other.read(content),null);
 assert.equal(saved.attempts.length,0);assert.equal(saved.goldAwards!.length,0);
});

test("one private GET snapshot supplies fresh selected progress and cross-competition wallet",async()=>{
 const started=applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"matches"},now);
 const task=started.topics.matches!.work.core!.attempt;
 const earned=applyCourseAction(started,content,{type:"answer",taskKey:task.key,answers:task.problem.fields.map(field=>field.answer)},now);
 const row=(parent_id:string,child_id:string,competition_id:string)=>({parent_id,child_id,competition_id,revision:earned.revision,course:earned});
 const db=fakeDatabase([row("p","c",DEFAULT_COMPETITION_ID),row("p","c","other"),row("foreign","c",DEFAULT_COMPETITION_ID),row("p","foreign",DEFAULT_COMPETITION_ID)]);
 const store=createSupabaseCourseStore(db.client,"p","c");
 const {readKidsCourseView}=await import("../src/server/kids-course.ts");
 const view=await readKidsCourseView(store,content);
 assert.equal(view.revision,earned.revision);assert.equal(view.gold,50);
 assert.equal(db.filters.length,1);assert.deepEqual(db.filters[0],[{parent_id:"p"},{child_id:"c"}]);
 db.rows[0]!.course=applyCourseAction(earned,content,{type:"pause"},now);db.rows[0]!.revision=earned.revision+1;
 assert.equal((await readKidsCourseView(store,content)).revision,earned.revision+1);
 assert.equal(db.filters.length,2,"each GET must read fresh authoritative state");
});

const coursePost=(revision:number,action:unknown)=>new Request("http://localhost/api/kids/course",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,action})});
test("POST reuses its CAS input for exact gold gain and removes one database read",async()=>{
 const started=applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"matches"},now);
 const task=started.topics.matches!.work.core!.attempt;
 const action={type:"answer",taskKey:task.key,answers:task.problem.fields.map(field=>field.answer)};
 const earned=applyCourseAction(started,content,action as Parameters<typeof applyCourseAction>[2],now);
 const row=(parent_id:string,child_id:string,competition_id:string,course:KidsCourse)=>({parent_id,child_id,competition_id,revision:course.revision,course});
 // A legacy ledger must still project gold from history, even without stored awards.
 const legacy=structuredClone(earned);delete legacy.goldAwards;
 const initial=[row("p","c",DEFAULT_COMPETITION_ID,started),row("p","c","other",legacy),row("foreign","c",DEFAULT_COMPETITION_ID,earned),row("p","foreign",DEFAULT_COMPETITION_ID,earned)];
 for(const optimized of [false,true]){
  const db=fakeDatabase(initial),store=createSupabaseCourseStore(db.client,"p","c");
  if(!optimized)store.updateWithPrevious=undefined;
  const response=await kidsCourseResponse(coursePost(started.revision,action),store,content);
  assert.equal(response.status,200);assert.equal(response.headers.get("Cache-Control"),"no-store");
  const {course:view}=await response.json();
  const saved=db.rows[0]!.course as KidsCourse;
  assert.deepEqual(view.goldGain,newGoldGain(started,saved));assert.equal(view.goldGain.amount,25);assert.equal(view.gold,50);
  assert.equal(db.requests.length,optimized?3:4);
  const reads=db.requests.filter(request=>request.operation==="read");
  assert.equal(reads.length,optimized?2:3);
  const wallet=reads.at(-1)!;
  assert.deepEqual(wallet.exclusions,[{competition_id:DEFAULT_COMPETITION_ID}]);assert.equal(wallet.returnedRows,1);
  for(const request of db.requests){assert.ok(request.conditions.some(filter=>filter.parent_id==="p"));assert.ok(request.conditions.some(filter=>filter.child_id==="c"));}
  db.requests.length=0;
  const paused=await kidsCourseResponse(coursePost(saved.revision,{type:"pause"}),store,content);
  assert.equal(paused.status,200);assert.equal((await paused.json()).course.goldGain,undefined);
 }
});

test("atomic POST migration compares projected revision but saves against raw revision without replaying gold",async()=>{
 const started=applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"matches"},now);
 const task=started.topics.matches!.work.core!.attempt;
 const old=applyCourseAction(started,content,{type:"answer",taskKey:task.key,answers:task.problem.fields.map(field=>field.answer)},now);
 delete old.questVersion;delete old.journey;delete old.stamps;delete old.diagnostics;delete old.quest;delete old.goldAwards;
 const projected=migrateKidsCourse(old,content,new Date().toISOString());
 assert.ok(projected.revision>old.revision);
 const db=fakeDatabase([{parent_id:"p",child_id:"c",revision:old.revision,course:old}]);
 const store=createSupabaseCourseStore(db.client,"p","c");
 const stale=await kidsCourseResponse(coursePost(old.revision,{type:"pause"}),store,content);
 assert.equal(stale.status,409);assert.equal(db.requests.length,1);assert.equal(db.rows[0]!.revision,old.revision);
 db.requests.length=0;
 const response=await kidsCourseResponse(coursePost(projected.revision,{type:"pause"}),store,content);
 assert.equal(response.status,200);
 const {course:view}=await response.json();
 assert.equal(view.revision,projected.revision+1);assert.equal(view.gold,25);assert.equal(view.goldGain,undefined);
 assert.equal(db.requests.length,3);
 const write=db.requests.find(request=>request.operation==="update")!;
 assert.ok(write.conditions.some(filter=>filter.revision===old.revision));
 assert.deepEqual((db.rows[0]!.course as KidsCourse).attempts,old.attempts);
 const replay=await kidsCourseResponse(coursePost(projected.revision,{type:"pause"}),store,content);
 assert.equal(replay.status,409);
});

test("atomic POST keeps first-insert and concurrent reward conflicts at 409",async()=>{
 const db=fakeDatabase(),store=createSupabaseCourseStore(db.client,"p","c");
 const first=await Promise.all([kidsCourseResponse(coursePost(0,{type:"selectTopic",topicId:"matches"}),store,content),kidsCourseResponse(coursePost(0,{type:"selectTopic",topicId:"matches"}),store,content)]);
 assert.deepEqual(first.map(response=>response.status).sort(),[200,409]);assert.equal(db.rows.length,1);
 const started=db.rows[0]!.course as KidsCourse,task=started.topics.matches!.work.core!.attempt;
 const action={type:"answer",taskKey:task.key,answers:task.problem.fields.map(field=>field.answer)};
 db.requests.length=0;
 const answers=await Promise.all([kidsCourseResponse(coursePost(started.revision,action),store,content),kidsCourseResponse(coursePost(started.revision,action),store,content)]);
 assert.deepEqual(answers.map(response=>response.status).sort(),[200,409]);
 const success=answers.find(response=>response.status===200)!;
 const {course:view}=await success.json();assert.equal(view.goldGain.amount,25);assert.equal(view.gold,25);
 assert.equal((db.rows[0]!.course as KidsCourse).attempts.length,1);
 assert.equal(db.requests.filter(request=>request.exclusions.length).length,1,"only the successful writer reads the wallet");
});

test("atomic POST rejects mismatched raw course revisions without writing",async()=>{
 const course=newKidsCourse(content,now),db=fakeDatabase([{parent_id:"p",child_id:"c",revision:course.revision+1,course}]);
 const response=await kidsCourseResponse(coursePost(course.revision,{type:"pause"}),createSupabaseCourseStore(db.client,"p","c"),content);
 assert.equal(response.status,409);assert.equal(db.requests.length,1);assert.equal(db.rows[0]!.revision,course.revision+1);
});

test("connected grouped drafts and unit awards survive hosted CAS and device reload",async()=>{
 const db=fakeDatabase(),first=createSupabaseCourseStore(db.client,"p","c"),second=createSupabaseCourseStore(db.client,"p","c");
 const owner=currentContent.topics.find(t=>t.skills.some(s=>s.id==="M2-2a"))!;
 let course=await first.update(0,{type:"selectTopic",topicId:owner.id,skillId:"M2-2a"},currentContent);
 const work=()=>course.topics[course.active!.topicId]!.skillWork![course.active!.skillId!]!;
 assert.ok(work().connected);assert.ok(work().attempt.problem.fields.length>1);
 const draft=work().attempt.problem.fields.map((_,i)=>i?"":"56");
 course=await first.update(course.revision,{type:"saveDraft",taskKey:work().attempt.key,partIndex:0,answers:draft},currentContent);
 const loaded=(await second.read(currentContent))!;
 assert.deepEqual(loaded.topics[loaded.active!.topicId]!.skillWork![loaded.active!.skillId!]!.attempt.draft!.answers,draft);
 const revision=course.revision,key=work().attempt.key;
 course=await second.update(revision,{type:"answer",taskKey:key,answers:work().attempt.problem.fields.map(f=>f.answer)},currentContent);
 assert.equal(course.attempts.length,1);assert.equal(course.problemGoldAwards!.length,1);assert.match(course.problemGoldAwards![0]!.key,/:unit:/);
 await assert.rejects(async()=>first.update(revision,{type:"answer",taskKey:key,answers:["1"]},currentContent),{status:409});
 const after=await first.read(currentContent);assert.deepEqual(after!.problemGoldAwards,course.problemGoldAwards);
});

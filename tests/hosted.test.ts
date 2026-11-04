import assert from "node:assert/strict";
import {DEFAULT_COMPETITION_ID} from "../src/core/competitions.ts";
import {test} from "node:test";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createSupabaseCourseStore} from "../src/store/supabase-course.ts";
import {kidsCourseContent as content} from "../src/server/kids-course-content.ts";
import {applyCourseAction,newKidsCourse} from "../src/core/kids-course.ts";
import {approvedGoogleUser,selectedChild} from "../src/server/context.ts";
import {mode,mutationAllowed,isLoopbackHost} from "../src/server/config.ts";

type Row={parent_id:string;child_id:string;competition_id?:string;revision:number;course:unknown;updated_at?:string};
function fakeDatabase(initial:Row[]=[]){
 const rows=structuredClone(initial).map(row=>({competition_id:DEFAULT_COMPETITION_ID,...row}));const filters:Record<string,unknown>[][]=[];
 return {rows,filters,client:{from(table:string){assert.equal(table,"course_progress");let operation="read",value:Partial<Row>={};const conditions:Record<string,unknown>[]=[];
 const chain={select(){return chain;},eq(key:string,v:unknown){conditions.push({[key]:v});return chain;},update(v:Partial<Row>){operation="update";value=v;return chain;},
 async insert(row:Row){await Promise.resolve();if(rows.some(r=>r.child_id===row.child_id&&r.competition_id===row.competition_id))return {error:{code:"23505"}};rows.push({...structuredClone(row),competition_id:row.competition_id??DEFAULT_COMPETITION_ID});return {error:null};},
 then(resolve:(value:unknown)=>unknown){filters.push(conditions);return Promise.resolve({data:structuredClone(rows.filter(r=>conditions.every(c=>Object.entries(c).every(([k,v])=>r[k as keyof Row]===v)))),error:null}).then(resolve);},
 async maybeSingle(){filters.push(conditions);const row=rows.find(r=>conditions.every(c=>Object.entries(c).every(([k,v])=>r[k as keyof Row]===v)));if(operation==="update"&&row)Object.assign(row,structuredClone(value));return {data:row?structuredClone(row):null,error:null};}};return chain;}} as unknown as SupabaseClient};
}
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

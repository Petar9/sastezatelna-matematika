import assert from "node:assert/strict";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { KidsCourseView } from "../src/core/kids-course.ts";
const directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-course-http-"));

const {kidsCourseResponse:respond}=await import("../src/server/kids-course.ts");
const {createKidsCourseStore}=await import("../src/store/kids-course.ts");
const kidsCourseResponse=(request:Request)=>respond(request,createKidsCourseStore(path.join(directory,"kids")));
after(()=>fs.rmSync(directory,{recursive:true,force:true}));
const get=()=>kidsCourseResponse(new Request("http://localhost/api/kids/course"));
const post=(body:unknown)=>kidsCourseResponse(new Request("http://localhost/api/kids/course",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}));
const view=async(r:Response)=>(await r.json() as {course:KidsCourseView}).course;

test("course endpoint is read-only on GET and exposes no answer keys or hints before help",async()=>{
 const initial=await get(); assert.equal(initial.status,200); assert.equal(initial.headers.get("Cache-Control"),"no-store");
 assert.equal((await view(initial)).revision,0); assert.deepEqual(fs.readdirSync(directory),[]);
 let c=await view(await post({revision:0,action:{type:"selectTopic",topicId:"matches"}}));
 assert.equal(c.task?.fields.length,1);assert.equal(c.task?.solutionParts,undefined);assert.equal(c.task?.explanation,undefined);
 assert.equal(c.task?.answers,undefined);assert.ok(!JSON.stringify(c).includes('"answer":'));
 const key=c.task!.key;
 c=await view(await post({revision:c.revision,action:{type:"dontKnow",taskKey:key,reasoning:"Опитвам"}}));
 assert.equal(c.task?.solutionParts?.length,1);assert.equal(c.task?.explanation,undefined);
 const revision=c.revision;
 c=await view(await post({revision,action:{type:"dontKnow",taskKey:key}}));
 assert.equal(c.task?.outcome,"revealed");assert.ok(c.task?.explanation);assert.equal(c.task?.answers,undefined);
 assert.equal((await post({revision,action:{type:"dontKnow",taskKey:key}})).status,409);
 assert.equal((await get()).status,200);
 assert.deepEqual(fs.readdirSync(directory),["kids"]);
 assert.deepEqual(fs.readdirSync(path.join(directory,"kids")),["course-v2.json"]);
});

test("course endpoint rejects malformed commands and content versions without overwriting progress",async()=>{
 for(const body of [null,{}, {revision:-1,action:{type:"pause"}},{revision:0,action:{type:"inventTopic"}}, {revision:0,action:{type:"answer",taskKey:"k",answers:[0]}}, {revision:0,action:{type:"answer",taskKey:"k",answers:["1"],reasoning:"x".repeat(501)}}]) assert.equal((await post(body)).status,400);
 const c=await view(await get());
 assert.equal((await post({revision:c.revision,action:{type:"selectTopic",topicId:"unknown"}})).status,400);
 assert.equal((await view(await get())).revision,c.revision);
 const file=path.join(directory,"kids","course-v2.json");const saved=fs.readFileSync(file,"utf8");
 const incompatible=JSON.parse(saved);incompatible.contentVersion="future";fs.writeFileSync(file,JSON.stringify(incompatible));
 assert.equal((await get()).status,409);assert.equal((await post({revision:c.revision,action:{type:"pause"}})).status,409);
 assert.equal(JSON.parse(fs.readFileSync(file,"utf8")).contentVersion,"future");fs.writeFileSync(file,saved);
});

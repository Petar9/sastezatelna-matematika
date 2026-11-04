import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import archive from "../content/olimpiada/municipal-2022-2025.json" with {type:"json"};
import {olympiadCourseContent as content, olympiadDraftReview} from "../src/server/olimpiada-course-content.ts";
import {kidsCourseContent as existing} from "../src/server/kids-course-content.ts";
import {competitionContent} from "../src/server/competitions.ts";
import {applyCourseAction,courseView,newKidsCourse} from "../src/core/kids-course.ts";
import type {CourseAction,CourseProblem} from "../src/core/kids-course.ts";
import {createKidsCourseStore} from "../src/store/kids-course.ts";

const now="2026-11-03T18:00:00.000Z";
function problems(){
 const result:CourseProblem[]=[];
 for(const topic of content.topics) for(const skill of topic.skills) for(const harder of [false,true]){
  let i=0,p;while((p=content.problem(skill.id,i,harder))){result.push(p);i++;assert.ok(i<100);}
  assert.equal(content.problem(skill.id,i,harder),null);
 }
 return result;
}
function harness(){
 let record=newKidsCourse(content,now);
 const go=(action:CourseAction)=>{record=applyCourseAction(record,content,action,now);return courseView(record,content,now);};
 const work=()=>record.journey==="quest"?record.quest!.work!:record.topics[record.active!.topicId]!.work[record.active!.mode]!;
 const correct=()=>go({type:"answer",taskKey:work().attempt.key,answers:work().attempt.problem.fields.map(f=>f.answer)});
 const next=()=>{go({type:"nextQuestion"});while(courseView(record,content,now).stage==="lesson")go({type:"lessonNext"});};
 return{get record(){return record;},go,work,correct,next,view:()=>courseView(record,content,now)};
}

test("Olympiad draft has four approved islands, 12 skills and finite, distinct, fully explained pools",()=>{
 assert.deepEqual(content.topics.map(t=>t.title),["Числови загадки","Геометрични открития","Истории с числа","Логически загадки"]);
 assert.deepEqual(content.topics.map(t=>t.skills.length),[4,3,3,2]);
 assert.equal(archive.originals.originals.length,12);
 assert.equal(archive.originals.originals.reduce((count,o)=>count+o.units.length,0),29);
 const all=problems();assert.equal(all.length,99);assert.equal(new Set(all.map(p=>p.id)).size,99);
 assert.equal(new Set(all.map(p=>JSON.stringify([p.text,p.fields,p.options]))).size,99);
 const authored=all.filter(p=>!p.provenance);assert.equal(authored.length,60);
 for(const family of archive.practice.families){
  assert.equal(family.items.filter(p=>p.difficulty==="core").length,3);
  assert.equal(family.items.filter(p=>p.difficulty==="hard").length,2);
 }
 for(const p of all){
  assert.equal(p.solution?.length,3);assert.ok(p.solution.every(part=>part.paragraphs.length>0&&part.paragraphs.every(t=>t.trim())));
  assert.deepEqual(content.solutionFor!(p),p.solution);assert.equal(content.solutionFor!({...p,text:"changed"}),undefined);
  assert.ok(p.fields.length>0);assert.ok(p.fields.every(f=>Number.isFinite(Number(f.answer))));
  if(p.options){assert.equal(p.fields.length,1);assert.ok(p.options[Number(p.fields[0]!.answer)]);}
  if(p.figure){assert.ok(p.figure.alt);const png=fs.readFileSync(path.join(process.cwd(),"assets/images",p.figure.src));assert.equal(png.subarray(1,4).toString(),"PNG");assert.ok(png.readUInt32BE(16)>100&&png.readUInt32BE(20)>100);}
 }
 const sample=content.problem("oli-order-actions",0,false)!;sample.fields[0]!.answer="changed";
 assert.notEqual(content.problem("oli-order-actions",0,false)!.fields[0]!.answer,"changed");
 for(const index of [-1,0.5,NaN,Infinity])assert.equal(content.problem("oli-order-actions",index,false),null);
 assert.equal(content.problem("unknown",0,false),null);
});

test("source originals retain their wording, figures and provenance while the ambiguous source cannot be graded",()=>{
 const all=problems(),originals=all.filter(p=>p.id.endsWith(":original"));
 assert.equal(originals.length,11);assert.equal(all.filter(p=>p.provenance).length,39);
 for(const p of originals){
  const source=archive.originals.originals.find(o=>p.id===`${o.id}:original`)!;
  assert.ok(p.text.startsWith(source.original_text_bg));assert.equal(p.provenance?.year,source.year);
  assert.equal(p.provenance?.page,1);assert.match(p.provenance!.video!,/youtube\.com\/watch\?v=/);
 }
 assert.equal(all.filter(p=>p.figure).map(p=>p.figure!.src).filter((v,i,a)=>a.indexOf(v)===i).length,4);
 assert.ok(!all.some(p=>p.id.startsWith("oli-g4-municipal-2023-p3")));
 assert.deepEqual(olympiadDraftReview.missingOfficialSolutions,[2024]);
 assert.throws(()=>competitionContent("olimpiada"),{status:404});
 const price=all.find(p=>p.id==="oli-g4-municipal-2024-p3:original")!;
 assert.deepEqual(price.fields.map(f=>f.answer),["4","7","12","2","8","28"]);
 const roman=all.find(p=>p.id==="oli-g4-municipal-2025-p1:original")!;
 assert.equal(roman.options![Number(roman.fields[0]!.answer)],"MMXXV");assert.match(roman.source,/добавени учебни/);
});

test("three solution parts reveal progressively and helped success earns gold before fresh confirmation",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"oli-numbers"});const key=h.work().attempt.key;
 for(let i=1;i<=3;i++){
  h.go({type:"hint",taskKey:key});assert.equal(h.view().task?.solutionParts?.length,i);assert.equal(h.view().gold,0);
 }
 assert.throws(()=>h.go({type:"hint",taskKey:key}),{status:409});
 assert.equal(h.correct().task?.outcome,"hinted");assert.equal(h.view().gold,25);assert.equal(h.view().target,1);
 const id=h.work().attempt.problem.id;h.next();assert.notEqual(h.work().attempt.problem.id,id);
 h.correct();assert.equal(h.view().gold,60);assert.equal(h.view().topics[0]!.confirmed,1);
});

test("Olympiad five-task adventures finish with distinct tasks, bounded diagnosis and a retained treasure",()=>{
 const h=harness();h.go({type:"startQuest"});const ids=new Set<string>();
 for(let i=0;i<5;i++){
  const p=h.work().attempt.problem;assert.ok(!ids.has(p.id));ids.add(p.id);
  assert.equal(h.view().quest?.completed,i);h.correct();h.next();
 }
 assert.equal(h.view().stage,"questComplete");assert.equal(h.view().quest?.completed,5);assert.equal(h.record.stamps?.length,1);
 assert.ok(h.record.quest!.steps.filter(s=>s.kind==="diagnostic").length<=3);
 assert.ok(!h.view().quest?.exhausted);assert.ok(h.view().gold>0);
});

test("each island advances through independent confirmation and challenge without exhausting its draft pool",()=>{
 for(const topic of content.topics){
  const h=harness();h.go({type:"selectTopic",topicId:topic.id});
  for(let i=0;i<topic.skills.length*2;i++){assert.ok(h.view().task);h.correct();h.next();}
  assert.equal(h.view().topics.find(t=>t.id===topic.id)!.doctor,true);assert.equal(h.view().active?.mode,"challenge");
  h.correct();h.next();h.correct();assert.equal(h.view().topics.find(t=>t.id===topic.id)!.professor,true);
 }
});

test("draft progress reloads in its own store and cannot overwrite the existing competition",()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"maths-olympiad-"));
 try{
  const legacy=createKidsCourseStore(dir);legacy.update(0,{type:"selectTopic",topicId:"matches"},existing);
  const file=path.join(dir,"course-v2.json"),before=fs.readFileSync(file);
  const draftDir=path.join(dir,"competitions","olimpiada"),draft=createKidsCourseStore(draftDir,dir);
  const record=draft.update(0,{type:"startQuest"},content);const task=record.quest!.work!.attempt;
  const answered=draft.update(record.revision,{type:"answer",taskKey:task.key,answers:task.problem.fields.map(f=>f.answer)},content);
  assert.deepEqual(createKidsCourseStore(draftDir,dir).read(content),answered);
  assert.throws(()=>draft.read(existing),{status:409});assert.throws(()=>legacy.read(content),{status:409});
  assert.deepEqual(fs.readFileSync(file),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

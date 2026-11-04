import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { applyCourseAction, courseView, migrateKidsCourse, newKidsCourse } from "../src/core/kids-course.ts";
import type { KidsCourse, KidsCourseContent } from "../src/core/kids-course.ts";
import { kidsCourseContent as content } from "../src/server/kids-course-content.ts";
import { expansionRows } from "../src/server/kids-course-expansion.ts";
import { createKidsCourseStore } from "../src/store/kids-course.ts";

const now = "2026-11-02T12:00:00.000Z";
const legacy: KidsCourseContent = { ...content, version: "bg4-2024-v1", topics: content.topics
 .filter(t => t.skills.some(s => s.id.startsWith("M"))).map(t => ({ ...t, skills: t.skills.filter(s => s.id.startsWith("M")) })) };
const act = (r: KidsCourse, type: "nextQuestion" | "lessonNext" | "pause" | "resume") => applyCourseAction(r, content, { type }, now);

test("three-year catalog matches official keys and keeps all source diagrams and methods available", () => {
 const expected: Record<number, number[][]> = {
  2025: [1,2,0,1,3,2,1,3,1,0,2,0,3,2,0,192,1162,13,4030,40,403,207,89,53,22,450,128].map(x => [x]),
  2026: [...[1,3,2,2,2,1,1,0,1,2,1,3,2,2,0,865,3976,403,42,7].map(x => [x]),[2001,1901],[431],[61,651,678],[2,6],[93],[12,22]],
 };
 for (const year of [2025,2026]) {
  const rows = expansionRows.filter(r => r.year === year);
  assert.deepEqual(rows.map(r => content.problem(r.id,0,false)!.fields.map(f => Number(f.answer))), expected[year]);
  for (const row of rows) {
   const p = content.problem(row.id,0,false)!;
   assert.equal(p.provenance?.year,year); assert.equal(p.provenance?.objective,row.id);
   assert.ok(p.provenance!.page >= 1 && p.provenance!.page <= 3);
   assert.ok(p.text.startsWith(row.text));
   const skill = content.topics.flatMap(t => t.skills).find(s => s.id === row.id)!;
   assert.equal(skill.lesson.length,3);
   assert.ok(fs.statSync(path.join("public",skill.illustration!.src)).size > 300);
   if (row.figure) {
    const bytes = fs.readFileSync(path.join("assets/images",p.figure!.src));
    assert.equal(bytes.toString("hex",0,8),"89504e470d0a1a0a");
    assert.ok(bytes.readUInt32BE(16) >= 170 && bytes.readUInt32BE(20) >= 100,p.id);
   }
   assert.equal(content.problem(row.id,100,false),null); assert.equal(content.problem(row.id,100,true),null);
  }
 }
 assert.ok(content.problem("2026-M1-18",0,false)!.text.includes("Учебно уточнение:"));
 assert.ok(content.problem("2025-M1-11",0,false)!.text.includes("две различни числа"));
 assert.equal(content.problem("M2-2a",0,false)!.fields.length,3);
});

test("fresh practice excludes original tasks even when their wording changes", () => {
 const originals: Record<string, [RegExp,number]> = {
  cuts: [/^С (\d+) прави/,4], sets: [/^От (\d+) ученици/,26],
  transfer: [/^Подарък от (\d+) лв/,40], polygons: [/граница е (\d+) см/,140],
  tiling: [/общото лице е (\d+) кв/,1536],
 };
 for(const row of expansionRows) {
  const original=originals[row.family]; if(!original)continue;
  const [pattern,parameter]=original,seen=new Set<number>();
  for(const hard of [false,true]) for(let i=hard?0:1;;i++) {
   const p=content.problem(row.id,i,hard); if(!p)break;
   const value=Number(p.text.match(pattern)![1]);
   assert.notEqual(value,parameter,p.id); assert.ok(!seen.has(value),p.id); seen.add(value);
  }
  assert.ok(seen.size>=14,row.id);
 }
});

test("migration preserves pending task snapshots, assistance, lesson steps, awards and pause", () => {
 let old = applyCourseAction(newKidsCourse(legacy,now),legacy,{type:"selectTopic",topicId:"grids"},now);
 const p = old.topics.grids!;
 p.doctorAt = now; p.professorAt = now;
 p.skills["M2-2a"]!.confirmedAt = now;
 p.skills["M2-2a"]!.nextHard = 7;
 old.awards.push({topicId:"grids",rank:"doctor",earnedAt:now,taskKey:"previous"});
 p.work.core!.attempt.reasoning = "Мисля за обиколка";
 old = applyCourseAction(old,legacy,{type:"dontKnow",taskKey:p.work.core!.attempt.key},now);
 old = applyCourseAction(old,legacy,{type:"pause"},now);
 old.completedAt = now;
 const snapshot = structuredClone(old);
 let migrated = migrateKidsCourse(old,content,now);
 assert.deepEqual(old,snapshot);
 assert.deepEqual(migrated.topics.grids,snapshot.topics.grids);
 assert.deepEqual(migrated.awards,snapshot.awards);
 assert.equal(migrated.paused,true); assert.equal(migrated.revision,old.revision+1);
 assert.equal(migrated.completedAt,undefined);
 assert.deepEqual(migrated.previousCompletions,[{contentVersion:legacy.version,completedAt:now}]);
 for (const row of expansionRows) {
  const state = migrated.topics[row.topic]!.skills[row.id]!;
  assert.equal(state.confirmedAt,undefined); assert.equal(state.nextCore,0); assert.equal(state.nextHard,0);
 }
 migrated = act(migrated,"resume");
 assert.equal(courseView(migrated,content,now).task?.reasoning,"Мисля за обиколка");
 assert.ok(courseView(migrated,content,now).task?.solutionParts);
 migrated = applyCourseAction(migrated,content,{type:"dontKnow",taskKey:courseView(migrated,content,now).task!.key},now);
 migrated.topics.grids!.work.core!.lessonStep = 0; migrated = act(migrated,"lessonNext");
 const lesson = courseView(migrated,content,now).lesson;
 migrated = act(migrated,"pause"); migrated = act(migrated,"resume");
 assert.deepEqual(courseView(migrated,content,now).lesson,lesson);
 assert.equal(migrateKidsCourse(migrated,content,now),migrated);
});

test("revised solutions refresh saved matching questions without rewriting history or trusting changed keys", () => {
 const record = applyCourseAction(newKidsCourse(content,now),content,{type:"selectTopic",topicId:"digits"},now);
 const attempt = record.topics.digits!.work.core!.attempt;
 const current = content.problem("2026-M1-16",0,false)!;
 attempt.problem = structuredClone(current);
 attempt.problem.solution![0].paragraphs = ["Предишно обяснение"];
 attempt.hintUsed = true; attempt.hintLevel = 1;
 attempt.reasoning = "Започвам с най-малките цифри";
 const snapshot = structuredClone(record);
 const view = courseView(record,content,now);
 assert.deepEqual(view.task?.solutionParts,current.solution!.slice(0,1));
 assert.equal(view.task?.hintLevel,1);
 assert.equal(view.task?.reasoning,attempt.reasoning);
 assert.deepEqual(record,snapshot);

 for (const change of ["question","answer"] as const) {
  const changed = structuredClone(record);
  const saved = changed.topics.digits!.work.core!.attempt.problem;
  if(change === "question") saved.text += " Друго условие.";
  else saved.fields[0]!.answer = "999";
  const before = structuredClone(changed);
  assert.deepEqual(courseView(changed,content,now).task?.solutionParts,saved.solution!.slice(0,1));
  assert.deepEqual(changed,before);
 }

 attempt.outcome = "hinted"; attempt.answers = ["865"];
 const answered = structuredClone(record);
 assert.deepEqual(courseView(record,content,now).task?.explanation,current.solution!.flatMap(part=>part.paragraphs));
 assert.deepEqual(record,answered);
});

test("added skills reopen exhausted topics and old badges cannot complete the expanded course", () => {
 let old = newKidsCourse(legacy,now);
 for (const topic of legacy.topics) {
  const p = old.topics[topic.id]!;
  p.doctorAt = p.professorAt = now; p.learningMode = "practice";
  for (const state of Object.values(p.skills)) state.confirmedAt = now;
 }
 old.completedAt = now; old.active = {topicId:"backwards",mode:"practice"}; old.paused = true;
 let r = migrateKidsCourse(old,content,now);
 assert.equal(r.active?.mode,"core"); assert.ok(r.topics.backwards!.work.core);
 assert.equal(courseView(r,content,now).previouslyCompleted,true);
 assert.equal(courseView(r,content,now).doctors,13);
 assert.equal(courseView(r,content,now).complete,false);
 assert.ok(courseView(r,content,now).topics.find(t=>t.id==="backwards")!.needsPractice);
 r = act(r,"resume");
 const a = r.topics.backwards!.work.core!.attempt;
 r = applyCourseAction(r,content,{type:"answer",taskKey:a.key,answers:a.problem.fields.map(f=>f.answer)},now);
 assert.equal(r.completedAt,undefined); assert.equal(r.awards.length,0);
 assert.equal(courseView(r,content,now).task?.explanation?.length! > 0,true);
});

test("projected migration is read-only and stale clients cannot overwrite the upgraded record", () => {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(),"maths-migrate-"));
 try {
  const file = path.join(directory,"course-v2.json");
  const old = newKidsCourse(legacy,now); old.revision = 12;
  const raw = JSON.stringify(old); fs.writeFileSync(file,raw);
  const store = createKidsCourseStore(directory);
  assert.equal(store.read(content)!.revision,13); assert.equal(fs.readFileSync(file,"utf8"),raw);
  assert.throws(()=>store.update(12,{type:"pause"},content)); assert.equal(fs.readFileSync(file,"utf8"),raw);
  const upgraded = store.update(13,{type:"selectTopic",topicId:"fractions"},content);
  assert.equal(upgraded.revision,14); assert.equal(upgraded.contentVersion,content.version);
  assert.deepEqual(createKidsCourseStore(directory).read(content),upgraded);
  assert.equal(fs.statSync(file).mode & 0o777,0o600);
 } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});

test("independent enumeration verifies the difficult source counts and extrema", () => {
 let five = 0;
 for(let x=10000;x<100000;x++) { const d=String(x).split("").map(Number); if(d[0]!+d[1]!+d[2]! ===4 && d[2]!+d[3]!+d[4]! ===4)five++; }
 assert.equal(five,40);
 const occurrences = (end:number) => Array.from({length:end-25},(_,i)=>String(i+26)).join("").split("2").length-1;
 assert.equal(occurrences(399),171); assert.equal(occurrences(431),184); assert.equal(occurrences(432),185);
 let best="";
 for(let code=1;code<3**10;code++) {
  let x=code,sum=0,digits="";
  for(let d=0;d<10;d++) {const count=x%3;x=Math.floor(x/3);sum+=d*count;digits=String(d).repeat(count)+digits;}
  if(sum===44 && (digits.length>best.length || (digits.length===best.length && digits>best)))best=digits;
 }
 assert.equal(best,"86554433221100");
 const players:number[]=[];
 for(let start=1;start<=2025;start++){let sum=0;for(let end=start;sum<2025;end++){sum+=end;if(sum===2025)players.push(end-start+1);}}
 assert.equal(Math.max(...players)-1,53);
 let minimum=Infinity;
 for(let a=0;a<=102;a++)for(let b=0;b<=93;b++)if(20*a+22*b===2026)minimum=Math.min(minimum,a+b);
 assert.equal(minimum,93);
});

test("new counting, inverse and optimization variants agree with independent searches", () => {
 for(const row of expansionRows) for(const hard of [false,true]) for(let i=hard?0:1;;i++) {
  const p=content.problem(row.id,i,hard); if(!p)break;
  const answer=Number(p.fields[0]!.answer), numbers=(p.text.match(/\d+/g)??[]).map(Number);
  if(row.family==="banknotes") {
   const [a,large,b,small,total]=numbers; let ways=0;
   for(let x=0;x<=a!;x++)for(let y=0;y<=b!;y++)if(x*large!+y*small! ===total)ways++;
   assert.equal(answer,ways,p.id);
  } else if(row.family==="fiveDigits") {
   const target=numbers[0]; let count=0;
   for(let x=10000;x<100000;x++){const d=String(x).split("").map(Number);if(d[0]!+d[1]!+d[2]! ===target && d[2]!+d[3]!+d[4]! ===target)count++;}
   assert.equal(answer,count,p.id);
  } else if(row.family==="erase") {
   const result=numbers[2],solutions=[];
   for(let x=1;x<1000;x++)if(Math.floor(Math.floor(x*23/10)*8/10)===result)solutions.push(x);
   assert.deepEqual(solutions,[answer],p.id);
  } else if(row.family==="notch") {
   const [w,h,budget]=numbers; let maximum=0;
   for(let x=1;x<w!;x++)for(let y=1;y<h!;y++)if(x+2*y===budget)maximum=Math.max(maximum,x*y);
   assert.equal(answer,w!*h!-maximum,p.id);
  } else if(row.family==="oddSums") {
   const last=numbers[1]!,sums=new Set<number>();
   for(let a=1;a<=last;a+=2)for(let b=a+2;b<=last;b+=2)sums.add(a+b);
   assert.equal(answer,sums.size,p.id);
  }
 }
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, courseView, newKidsCourse, type CourseAction, type CourseProblem, type KidsCourseContent } from "../src/core/kids-course.ts";
import { catalogueProblems, choosePracticeProblem, chooseSkillProblem, createSelectionContext } from "../src/core/kids-selection.ts";
import { courseGoldBalance } from "../src/core/kids-gold.ts";
import { kidsCourseContent } from "../src/server/kids-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";
import { regionalOlympiadCourseContent } from "../src/server/olimpiada-oblasten-course-content.ts";
import { nvoCourseContent } from "../src/server/nvo-course-content.ts";
import { proletnoCourseContent } from "../src/server/proletno-course-content.ts";
const now = "2026-11-15T12:00:00.000Z";
function fixture(count = 2): KidsCourseContent {
 const problems: CourseProblem[] = Array.from({length: count}, (_, i) => ({id:`p${i}:original`, skillId:"skill", text:`Задача ${i}`, source:"Тест", fields:[{label:"Отговор",answer:String(i+1)}], hint:"Помощ", explanation:["Решение"]}));
 return {version:"continuation-test",topics:[{id:"topic",title:"Остров",rewardName:"награда",skills:[{id:"skill",title:"Умение",lesson:["Идея"]}]}],problem:(_skill,i,hard)=>hard?null:problems[i]?structuredClone(problems[i]):null};
}
function harness(content = fixture()) {
 let c = newKidsCourse(content,now);
 const view = () => courseView(c,content,now);
 const go = (a:CourseAction) => {c=applyCourseAction(c,content,a,now);return view();};
 const work = () => c.journey === "quest" ? c.quest!.work! : c.active!.skillId ? c.topics[c.active!.topicId]!.skillWork![c.active!.skillId]! : c.topics[c.active!.topicId]!.work[c.active!.mode]!;
 const answer = (correct = true) => go({type:"answer",taskKey:work().attempt.key,answers:work().attempt.problem.fields.map(f=>correct?f.answer:"999")});
 const next = () => {go({type:"nextQuestion"});while(view().stage==="lesson")go({type:"lessonNext"});};
 return {get c(){return c;},set c(v){c=v;},view,go,work,answer,next,content};
}

test("a revisit skill with an exhausted core recovers through unseen harder authored tasks before voluntary practice",()=>{
 const base=fixture(1),harder:CourseProblem={id:"harder-practice",skillId:"skill",text:"По-трудна задача",source:"Тест",fields:[{label:"Отговор",answer:"7"}],hint:"Помощ",explanation:["Решение"]};
 const h=harness({...base,problem:(skill,i,hard)=>hard?i===0?structuredClone(harder):null:base.problem(skill,i,false)});
 h.go({type:"startQuest"});h.answer(false);
 assert.equal(h.c.topics.topic!.skills.skill!.revisit,true);
 h.next();
 assert.equal(h.work().attempt.problem.id,"harder-practice");assert.equal(h.work().attempt.mode,"core");
 h.answer();
 assert.equal(h.c.attempts.at(-1)!.freshEvidence,true);assert.equal(h.c.topics.topic!.skills.skill!.streak,1);
 h.next();
 assert.equal(h.view().stage,"questComplete");assert.equal(h.view().questPractice,"recovery");
});

test("exhausted adventures retry mistakes immediately, rotate successes and never end voluntary practice",()=>{
 const h=harness();h.go({type:"startQuest"});h.answer(false);h.next();h.answer();h.next();
 assert.equal(h.view().stage,"questComplete");assert.equal(h.view().questPractice,"recovery");
 const oldGold=courseGoldBalance(h.c),oldAttempts=structuredClone(h.c.attempts),oldStreak=h.c.topics.topic!.skills.skill!.streak;
 h.c=JSON.parse(JSON.stringify(h.c));h.go({type:"startQuest"});
 assert.equal(h.work().attempt.problem.id,oldAttempts[0]!.problem.id);assert.equal(h.work().attempt.mode,"practice");
 h.answer();assert.equal(h.c.attempts.at(-1)!.freshEvidence,false);assert.equal(h.c.topics.topic!.skills.skill!.streak,oldStreak);
 assert.deepEqual(h.c.attempts.slice(0,2),oldAttempts);const earned=courseGoldBalance(h.c);assert.ok(earned>=oldGold);
 h.next();assert.equal(h.work().attempt.problem.id,oldAttempts[1]!.problem.id);
 for(let i=0;i<14;i++){
  if(h.view().quest!.finished)h.go({type:"startQuest"});
  h.answer();h.next();
 }
 assert.equal(courseGoldBalance(h.c),earned);assert.equal(h.view().questAvailable,true);
 assert.equal(h.view().questPractice,"repeat");assert.equal(h.c.topics.topic!.skills.skill!.confirmedAt,undefined);
});

test("manual core, exact skill, challenge, review and Professor practice retain accepted feedback and can continue",()=>{
 for(const mode of ["core","challenge","review","practice"] as const)for(const exact of [false,true]){
  const h=harness(fixture(1));const p=h.content.problem("skill",0,false)!;
  h.c.attempts=[{key:"historic",problem:p,mode:"core",hintUsed:false,outcome:"independent",completedAt:now}];
  const topic=h.c.topics.topic!,skill=topic.skills.skill!;
  topic.learningMode=mode === "review" ? "core" : mode;skill.confirmedAt=now;skill.reviewDueAt="2026-11-17T12:00:00.000Z";topic.professorAt=now;
  h.go({type:"selectTopic",topicId:"topic",...(exact?{skillId:"skill"}:mode==="review"?{review:true}:{})});
  const due=skill.reviewDueAt;assert.equal(h.work().attempt.mode,"practice");h.answer();
  assert.equal(h.view().task!.outcome,"independent",`${mode}/${exact}`);assert.equal(h.c.topics.topic!.skills.skill!.reviewDueAt,due);
  assert.equal(h.c.topics.topic!.skills.skill!.lastReviewAt,undefined);assert.equal(h.c.attempts.at(-1)!.freshEvidence,false);
  h.next();assert.ok(h.view().task);assert.equal(h.work().attempt.mode,"practice");
 }
});

test("fresh tasks and scheduled reviews retain priority; saved work stays reserved and view is read-only",()=>{
 const h=harness();const p=h.content.problem("skill",0,false)!;
 h.c.attempts=[{key:"historic",problem:p,mode:"core",hintUsed:true,outcome:"hinted",completedAt:now}];
 const snapshot=JSON.stringify(h.c);assert.equal(h.view().questPractice,undefined);assert.equal(JSON.stringify(h.c),snapshot);
 h.go({type:"startQuest"});assert.equal(h.work().attempt.problem.id,"p1:original");assert.notEqual(h.work().attempt.mode,"practice");
 h.c.topics.topic!.work.core={attempt:{key:"reserved",problem:p,mode:"core",hintUsed:false}};
 assert.equal(choosePracticeProblem(h.c,h.content,"skill",now),undefined);
 const due=harness(fixture(1));const state=due.c.topics.topic!.skills.skill!;state.confirmedAt="2026-11-01T12:00:00Z";state.reviewDueAt="2026-11-03T12:00:00Z";
 due.c.attempts=[{key:"old",problem:p,mode:"core",hintUsed:false,outcome:"independent",completedAt:"2026-11-01T12:00:00Z"}];
 due.go({type:"startQuest"});assert.equal(due.work().attempt.mode,"review");due.answer();assert.equal(due.c.topics.topic!.skills.skill!.lastReviewAt,now);
});

test("source recovery uses the latest result of every natural unit without weakening identity guards",()=>{
 const content=fixture(1),p=content.problem("skill",0,false)!;
 p.archive={sourceId:"source",kind:"original",covers:["a","b"]};
 const c=newKidsCourse(content,now);
 const unit=(id:string):CourseProblem=>({...p,id:`unit:${id}`,naturalUnit:{sourceId:"source",unitId:id,total:2},archive:{sourceId:"source",kind:"part",covers:[id]}});
 c.attempts=[{key:"whole",problem:p,mode:"core",hintUsed:false,outcome:"incorrect",completedAt:now},
 {key:"a",problem:unit("a"),mode:"practice",hintUsed:false,outcome:"independent",completedAt:now}];
 assert.equal(createSelectionContext(c,content,now).exposure(p).recovery,true);
 c.attempts.push({key:"b",problem:unit("b"),mode:"practice",hintUsed:false,outcome:"independent",completedAt:now});
 assert.equal(createSelectionContext(c,content,now).exposure(p).recovery,false);
 const alias={...p,id:"different-id",archive:{sourceId:"different-source",kind:"original" as const,covers:["a"]}};
 assert.equal(createSelectionContext(c,content,now).exposure(alias).seen,true);
});

test("all five fully attempted competition catalogues offer same-day recovery without resetting history",()=>{
 for(const content of [kidsCourseContent,olympiadCourseContent,regionalOlympiadCourseContent,nvoCourseContent,proletnoCourseContent]){
  const h=harness(content),catalogue=catalogueProblems(content);
  h.c.attempts=catalogue.map((p,i)=>({key:`history-${i}`,problem:structuredClone(p),mode:"core",hintUsed:false,outcome:i%3?"independent":"incorrect",completedAt:now}));
  for(const topic of Object.values(h.c.topics))for(const skill of Object.values(topic.skills)){skill.confirmedAt=now;skill.reviewDueAt="2026-11-17T12:00:00Z";}
  const saved=structuredClone(h.c.attempts),bytes=JSON.stringify(h.c);
  assert.equal(h.view().questAvailable,true,content.version);assert.equal(h.view().questPractice,"recovery",content.version);assert.equal(JSON.stringify(h.c),bytes);
  for(const topic of content.topics)for(const skill of topic.skills)assert.equal(chooseSkillProblem(h.c,content,skill.id,false,now),undefined);
  h.go({type:"startQuest"});assert.equal(h.work().attempt.mode,"practice",content.version);assert.ok(h.view().task);
  h.answer();assert.equal(h.view().task!.outcome,"independent");h.next();assert.ok(h.view().task);
  assert.deepEqual(h.c.attempts.slice(0,saved.length),saved);
 }
});

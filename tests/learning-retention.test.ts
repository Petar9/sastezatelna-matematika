import assert from "node:assert/strict";
import {test} from "node:test";
import {applyCourseAction,courseView,newKidsCourse,type CourseAction,type CourseProblem,type KidsCourseContent} from "../src/core/kids-course.ts";
import {chooseSkillProblem,isCompetitionProblem,skillReviewDue} from "../src/core/kids-selection.ts";
const initial="2026-11-08T12:00:00.000Z";
const day=(n:number)=>new Date(Date.parse(initial)+n*86400000).toISOString();
function fixture():KidsCourseContent {
 const make=(id:string,original=false):CourseProblem=>({id,skillId:"skill",text:`Task ${id}`,source:"Fixture",hint:"Hint",fields:[{label:"Answer",answer:String(id.length)}],explanation:[],...(original?{archive:{kind:"original",sourceId:id,covers:["question"]}}:{})});
 const core=[...Array.from({length:4},(_,i)=>make(`source-${i}:original`,true)),...Array.from({length:6},(_,i)=>make(`practice-${i}`))];
 const hard=[make("hard-1"),make("hard-2")];
 return {version:"retention",topics:[{id:"topic",title:"Topic",rewardName:"Reward",skills:[{id:"skill",title:"Skill",lesson:[]}]}],problem:(_skill,i,harder)=>(harder?hard:core)[i]??null};
}
function harness(){
 const content=fixture();let course=newKidsCourse(content,initial),time=initial;
 const view=()=>courseView(course,content,time);
 const go=(action:CourseAction)=>{course=applyCourseAction(course,content,action,time);return view();};
 const work=()=>course.journey==="quest"?course.quest!.work!:course.active!.skillId?course.topics.topic!.skillWork!.skill!:course.topics.topic!.work[course.active!.mode]!;
 const answer=()=>go({type:"answer",taskKey:work().attempt.key,answers:work().attempt.problem.fields.map(f=>f.answer)});
 const next=()=>{go({type:"nextQuestion"});while(view().stage==="lesson")go({type:"lessonNext"});};
 return {content,get course(){return course;},set course(value){course=value;},at:(n:number)=>{time=day(n);},view,go,work,answer,next};
}
function professor(h:ReturnType<typeof harness>){
 h.go({type:"selectTopic",topicId:"topic"});
 h.answer();h.next();h.answer();h.next();h.answer();h.next();h.answer();
 assert.ok(h.course.topics.topic!.professorAt);
}
test("Professor retains manual practice and receives repeated review at 2 days then every 30 days",()=>{
 const h=harness();professor(h);
 const badges=structuredClone(h.course.awards);
 assert.equal(skillReviewDue(h.course,"topic","skill"),day(2));
 h.at(2);h.go({type:"selectTopic",topicId:"topic",review:true});
 assert.equal(h.view().active?.mode,"review");assert.ok(isCompetitionProblem(h.work().attempt.problem));
 h.answer();assert.equal(skillReviewDue(h.course,"topic","skill"),day(32));
 h.at(3);h.go({type:"selectTopic",topicId:"topic",skillId:"skill"});
 assert.equal(h.view().active?.mode,"practice");h.answer();
 assert.equal(skillReviewDue(h.course,"topic","skill"),day(32),"extra practice must not shorten the monthly interval");
 h.at(32);h.go({type:"startQuest"});assert.equal(h.work().attempt.mode,"review");
 assert.equal(isCompetitionProblem(h.work().attempt.problem),false,"mix authored practice after the original review");
 const first=h.work().attempt.problem.id;h.answer();assert.equal(skillReviewDue(h.course,"topic","skill"),day(62));
 assert.deepEqual(h.course.awards,badges);
 h.at(62);h.course.quest!.completedAt=day(32);delete h.course.quest!.work;
 h.go({type:"startQuest"});assert.equal(h.work().attempt.mode,"review");
 assert.notEqual(h.work().attempt.problem.id,first,"prefer a new task over repeating the previous review");
 h.answer();assert.equal(skillReviewDue(h.course,"topic","skill"),day(92));
});
test("explicit review dates survive legacy reads; fallback follows the last successful review",()=>{
 const h=harness(),skill=h.course.topics.topic!.skills.skill!;
 skill.confirmedAt=initial;assert.equal(skillReviewDue(h.course,"topic","skill"),day(2));
 skill.lastReviewAt=day(2);assert.equal(skillReviewDue(h.course,"topic","skill"),day(32));
 skill.reviewDueAt=day(7);assert.equal(skillReviewDue(h.course,"topic","skill"),day(7));
 h.at(3);assert.equal(h.view().topics[0]!.reviewDue,false);
 h.at(7);assert.equal(h.view().topics[0]!.reviewDue,true);
});
test("hinted or incorrect review retains badges and follows recovery instead of postponing by 30 days",()=>{
 for(const hinted of [true,false]){
  const h=harness();professor(h);const badges=structuredClone(h.course.awards);
  h.at(2);h.go({type:"selectTopic",topicId:"topic",review:true});
  if(hinted)h.go({type:"hint",taskKey:h.work().attempt.key});
  h.go({type:"answer",taskKey:h.work().attempt.key,answers:[hinted?h.work().attempt.problem.fields[0]!.answer:"999"]});
  assert.equal(skillReviewDue(h.course,"topic","skill"),day(2));
  assert.equal(h.course.topics.topic!.skills.skill!.revisit,true);
  assert.equal(h.course.topics.topic!.skills.skill!.lastReviewAt,undefined);
  assert.deepEqual(h.course.awards,badges);
  h.next();assert.equal(h.work().attempt.mode,"core");
 }
});
test("review prefers unseen tasks, admits old eligible tasks when finite pools are exhausted, and does not leak hard authored tasks into core",()=>{
 const h=harness();
 for(const hard of [false,true])for(let i=0;;i++){
  const p=h.content.problem("skill",i,hard);if(!p)break;
  h.course.attempts.push({key:p.id,problem:p,mode:"core",hintUsed:false,outcome:"independent",completedAt:initial});
 }
 assert.equal(chooseSkillProblem(h.course,h.content,"skill",false,day(1),true),undefined);
 assert.ok(chooseSkillProblem(h.course,h.content,"skill",false,day(30),true));
 assert.equal(chooseSkillProblem(h.course,h.content,"skill",false,day(30)),undefined);
 h.course.attempts=h.course.attempts.filter(a=>a.problem.id!=="hard-1");
 assert.equal(chooseSkillProblem(h.course,h.content,"skill",false,day(30),true)!.problem.id,"hard-1");
 assert.equal(chooseSkillProblem(h.course,h.content,"skill",false,day(30)),undefined);
});
test("personal progress celebrates the latest hinted success followed by a fresh independent task only",()=>{
 const h=harness();h.go({type:"selectTopic",topicId:"topic"});
 h.go({type:"hint",taskKey:h.work().attempt.key});h.answer();h.next();h.answer();
 assert.equal(h.view().task!.personalProgress,true);
 assert.equal(h.course.attempts.at(-1)!.personalProgress,true);
 assert.throws(()=>h.answer());
 h.next();h.answer();assert.equal(h.view().task!.personalProgress,undefined);
 h.next();h.go({type:"hint",taskKey:h.work().attempt.key});h.answer();h.next();h.answer();
 assert.equal(h.view().task!.personalProgress,true,"a later new improvement may celebrate again");
 for(const previous of ["incorrect","revealed","independent"] as const){
  const other=harness();other.go({type:"selectTopic",topicId:"topic"});
  other.course.attempts.push({key:"prior",problem:other.content.problem("skill",1,false)!,mode:"core",hintUsed:previous!=="independent",outcome:previous,completedAt:initial});
  other.answer();assert.equal(other.view().task!.personalProgress,undefined);
 }
});

test("review alternates original and authored tasks when both have unseen options",()=>{
 const h=harness();
 const original=h.content.problem("skill",0,false)!;
 const practice=h.content.problem("skill",4,false)!;
 h.course.attempts.push({key:"review-original",problem:original,mode:"review",hintUsed:false,outcome:"independent",completedAt:initial});
 assert.equal(isCompetitionProblem(chooseSkillProblem(h.course,h.content,"skill",false,day(30),true)!.problem),false);
 h.course.attempts.push({key:"review-practice",problem:practice,mode:"review",hintUsed:false,outcome:"independent",completedAt:day(30)});
 assert.equal(isCompetitionProblem(chooseSkillProblem(h.course,h.content,"skill",false,day(60),true)!.problem),true);
});

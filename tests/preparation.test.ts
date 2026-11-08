import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCourseAction, newKidsCourse, type CourseAttempt, type CourseProblem, type CourseSolution, type KidsCourse, type KidsCourseContent } from "../src/core/kids-course.ts";
import { currentPreparationScope, preparationProgress } from "../src/core/preparation.ts";
import { availableCompetitions, competitionContent } from "../src/server/competitions.ts";
import { catalogueProblems } from "../src/core/kids-selection.ts";
const now = "2026-11-08T12:00:00.000Z", later = "2026-11-10T12:00:00.000Z";
const solution = [0,1,2].map(() => ({ title: "Step", paragraphs: ["Calculation"] })) as CourseSolution;
function fixture(extra = false): KidsCourseContent {
 const problems: CourseProblem[] = ["multipart", "single", ...(extra ? ["new"] : [])].map(id => ({ id: `${id}:original`, skillId: "skill", text: id, source: "Fixture", fields: id === "multipart" ? [{label:"a", answer:"1"},{label:"b",answer:"2"},{label:"c",answer:"3"}] : [{label:"x",answer:"4"}], hint:"Hint", explanation:[], archive:{sourceId:id,kind:"original",covers:[id]} }));
 return { version: extra ? "next" : "fixture", topics:[{id:"topic",title:"Topic",rewardName:"Reward",skills:[{id:"skill",title:"Skill",lesson:[]}]}], problem:(_skill,index,hard) => hard ? null : problems[index] ?? null,
  connectedProblem:p=> { const original=problems.find(item=>item.id===p.id); return original ? {sourceId:original.archive!.sourceId,text:original.text,units: original.fields.map((field,index)=>({id: original.id.startsWith("multipart") ? ["a","b","c"][index]! : "question",skillId:"skill",text:field.label,fields:[field],solution}))} : undefined; } };
}
function attempt(content: KidsCourseContent, source: string, unit?: string, outcome: CourseAttempt["outcome"] = "independent"): CourseAttempt {
 const original = catalogueProblems(content).find(p=>p.id===`${source}:original`)!;
 const selected = content.connectedProblem!(original)!.units.find(u=>u.id===unit);
 const problem = selected ? {...original,id:`${source}:${unit}`,fields:selected.fields,naturalUnit:{sourceId:source,unitId:unit!,total:content.connectedProblem!(original)!.units.length}} : original;
 return {key:`${source}:${unit}:${outcome}`,problem,mode:"core",hintUsed:outcome==="hinted",outcome,completedAt:now};
}
test("equal source weights, all natural units, assistance and third-hint coverage remain separate from gold",()=>{
 const content=fixture(),c=newKidsCourse(content,now);
 c.attempts=[{...attempt(content,"multipart","a","hinted"),hintLevel:3,goldEligible:false},attempt(content,"multipart","b","revealed"),{...attempt(content,"multipart","c"),sourceComplete:true}];
 const partial=preparationProgress(c,content);
 assert.deepEqual(partial.tasks,{completed:2,total:4});
 assert.equal(partial.coverage.solved,0);assert.equal(partial.coverage.total,2);assert.equal(partial.coverage.fraction,1/3);assert.equal(partial.percent,26);
 c.attempts.push(attempt(content,"multipart","b","hinted"),attempt(content,"single","question"));
 const complete=preparationProgress(c,content);assert.deepEqual(complete.tasks,{completed:4,total:4});assert.equal(complete.coverage.solved,2);assert.equal(complete.percent,80);
 c.attempts.push(...structuredClone(c.attempts));assert.deepEqual(preparationProgress(c,content),complete);
});
test("legacy all-field aliases count only known grading fields, while scaffolds, ambiguous snapshots and gold count nothing",()=>{
 const content=fixture(),c=newKidsCourse(content,now);
 c.attempts=[attempt(content,"multipart")];assert.equal(preparationProgress(c,content).coverage.solved,1);
 c.attempts[0]!.problem={...c.attempts[0]!.problem,fields:[{label:"unknown",answer:"8"}]};
 assert.equal(preparationProgress(c,content).coverage.solved,0);
 c.attempts=[attempt(content,"single")];c.attempts[0]!.problem.archive!.kind="scaffold";
 c.problemGoldAwards=[{key:"source:multipart",skillId:"skill",earnedAt:now,amount:100}];
 assert.equal(preparationProgress(c,content).percent,0);
});
test("scope is persisted on accepted commands, remains answer-free and does not grow with additions",()=>{
 const content=fixture(),old=newKidsCourse(content,now);delete old.preparationScope;
 const snapshot=structuredClone(old);preparationProgress(old,content);assert.deepEqual(old,snapshot);
 const saved=applyCourseAction(old,content,{type:"dashboard"},now);assert.deepEqual(saved.preparationScope,currentPreparationScope(content));
 assert.equal(preparationProgress(saved,fixture(true)).coverage.total,2);assert.equal(preparationProgress(newKidsCourse(fixture(true),now),fixture(true)).coverage.total,3);
 assert.doesNotMatch(JSON.stringify(saved.preparationScope),/answer|fields|solution|text/);
});
test("confirmation plus independently delayed review reaches 100 and remains earned after later errors",()=>{
 const content=fixture(),c=newKidsCourse(content,now);c.attempts=[attempt(content,"multipart"),attempt(content,"single")];
 c.topics.topic!.skills.skill!.confirmedAt=now;
 assert.equal(preparationProgress(c,content).percent,90);
 const review:CourseAttempt={...attempt(content,"single"),mode:"review",completedAt:now};c.attempts.push(review);
 assert.equal(preparationProgress(c,content).percent,90);
 review.completedAt=later;assert.equal(preparationProgress(c,content).percent,100);
 c.attempts.push({...attempt(content,"single",undefined,"incorrect"),completedAt:"2026-11-11T12:00:00Z"});c.topics.topic!.skills.skill!.revisit=true;
 assert.equal(preparationProgress(c,content).percent,100);
 delete review.completedAt;assert.equal(preparationProgress(c,content).review.completed,0);
});
test("review rejects missing confirmation dates, hinted work and too-recent overlapping exposure",()=>{
 const content=fixture(),c=newKidsCourse(content,now);c.topics.topic!.skills.skill!.confirmedAt=now;
 c.attempts=[{...attempt(content,"single"),completedAt:"2026-11-09T12:00:00Z"},{...attempt(content,"single"),mode:"review",completedAt:later}];
 assert.equal(preparationProgress(c,content).review.completed,0);
 c.attempts.shift();c.attempts[0]!.outcome="hinted";assert.equal(preparationProgress(c,content).review.completed,0);
 c.attempts[0]!.outcome="independent";c.topics.topic!.skills.skill!.confirmedAt="invalid";assert.equal(preparationProgress(c,content).review.completed,0);
});
test("empty scope is unavailable rather than claiming completion",()=>{
 const content={...fixture(),problem:()=>null};const c=newKidsCourse(content,now);
 assert.equal(preparationProgress(c,content).status,"unavailable");assert.equal(preparationProgress(c,content).percent,0);
});
test("unlettered multi-field originals remain one unit and incomplete answers have no coverage",()=>{
 const base=fixture(),original={...base.problem("skill",0,false)!,id:"unlettered:original",archive:{sourceId:"unlettered",kind:"original" as const,covers:["question"]}};
 const content:KidsCourseContent={...base,problem:(_s,i,hard)=>!hard&&i===0?original:null,connectedProblem:p=>p.id===original.id?{sourceId:"unlettered",text:p.text,units:[{id:"question",skillId:"skill",text:p.text,fields:p.fields,solution}]}:undefined};
 const c=newKidsCourse(content,now);
 c.attempts=[{key:"unfinished",problem:original,mode:"core",hintUsed:false,partOutcome:"independent",partIndex:0}];
 assert.equal(preparationProgress(c,content).percent,0);assert.deepEqual(c.preparationScope!.sources[0]!.unitIds,["question"]);
 c.attempts[0]!.outcome="hinted";assert.equal(preparationProgress(c,content).coverage.solved,1);assert.equal(preparationProgress(c,content).percent,80);
});

function currentWork(course:KidsCourse) {
 const active=course.active!,topic=course.topics[active.topicId]!;
 return active.skillId?topic.skillWork?.[active.skillId]:topic.work[active.mode];
}
test("all five manifests deduplicate sources and normal selection confirms/reviews every skill except the two documented content/route gaps",()=>{
 const counts:Record<string,number>={"matematika-za-vseki":86,olimpiada:11,nvo:100,proletno:19,"olimpiada-oblasten":12};
 const units:Record<string,number>={"matematika-za-vseki":102,olimpiada:21,nvo:108,proletno:38,"olimpiada-oblasten":23};
 const gaps:string[]=[];
 for(const comp of availableCompetitions()) {
  const content=competitionContent(comp.id),scope=currentPreparationScope(content);
  assert.equal(scope.sources.length,counts[comp.id]);
  assert.equal(preparationProgress(newKidsCourse(content,now),content).tasks.total,units[comp.id]);
  for(const topic of content.topics)for(const skill of topic.skills) {
   let c=newKidsCourse(content,now);
   const reviewed=()=>preparationProgress({...c,preparationScope:{...c.preparationScope!,skills:[{topicId:topic.id,skillId:skill.id}]}},content).review.completed;
   c=applyCourseAction(c,content,{type:"selectTopic",topicId:topic.id,skillId:skill.id},now);
   for(let step=0;step<50&&!c.topics[topic.id]!.skills[skill.id]!.confirmedAt;step++) {
    const work=currentWork(c);if(!work)break;
    const a=work.attempt;
    if(!a.outcome)c=applyCourseAction(c,content,{type:"answer",taskKey:a.key,answers:a.problem.fields.map(f=>f.answer)},now);
    if(!c.topics[topic.id]!.skills[skill.id]!.confirmedAt)c=applyCourseAction(c,content,{type:"nextQuestion"},now);
   }
   if(!c.topics[topic.id]!.skills[skill.id]!.confirmedAt){gaps.push(`${comp.id}/${skill.id}`);continue;}
   for(let step=0;step<50&&!reviewed();step++) {
    const work=currentWork(c);if(!work)break;
    const a=work.attempt;
    if(!a.outcome)c=applyCourseAction(c,content,{type:"answer",taskKey:a.key,answers:a.problem.fields.map(f=>f.answer)},later);
    if(!reviewed())c=applyCourseAction(c,content,{type:"nextQuestion"},later);
   }
   assert.ok(reviewed(),`${comp.id}/${skill.id} delayed review unreachable`);
  }
 }
 assert.deepEqual(gaps,["nvo/nvo-area-units","olimpiada-oblasten/oli-ob-growth"]);
});


test("legacy read-only profiles keep the release baseline across additions; new profiles use the enlarged scope",()=>{
 const initial=fixture(), expanded={...fixture(true),preparationBaseline:currentPreparationScope(initial)};
 const legacy=newKidsCourse(initial,now);delete legacy.preparationScope;
 legacy.attempts=[attempt(initial,"single")];
 const snapshot=structuredClone(legacy);
 assert.equal(preparationProgress(legacy,expanded).coverage.total,2);
 assert.equal(preparationProgress(legacy,expanded).percent,40);
 assert.deepEqual(legacy,snapshot);
 const saved=applyCourseAction({...legacy,contentVersion:expanded.version},expanded,{type:"dashboard"},now);
 assert.deepEqual(saved.preparationScope,currentPreparationScope(initial));
 assert.equal(newKidsCourse(expanded,now).preparationScope!.sources.length,3);
});

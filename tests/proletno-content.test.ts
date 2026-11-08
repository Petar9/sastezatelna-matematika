import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import archive from '../content/proletno/2023-2026.json' with {type:'json'};
import {proletnoCourseContent as content, proletnoDraftReview} from '../src/server/proletno-course-content.ts';
import {kidsCourseContent as existing} from '../src/server/kids-course-content.ts';
import {applyCourseAction,courseView,newKidsCourse} from '../src/core/kids-course.ts';
import type {CourseAction,CourseAttempt,KidsCourseContent} from '../src/core/kids-course.ts';
import {catalogueProblems,chooseSkillProblem,isCompetitionProblem,overlaps} from '../src/core/kids-selection.ts';
import {awardProblemGold,courseGoldBalance,problemGoldKey} from '../src/core/kids-gold.ts';
import {originalStatement} from '../src/server/original-statement.ts';
import {createKidsCourseStore} from '../src/store/kids-course.ts';
const now='2026-11-06T10:00:00.000Z';
const all=catalogueProblems(content);
function harness(pack=content){
 let record=newKidsCourse(pack,now);
 const view=()=>courseView(record,pack,now);
 const go=(action:CourseAction)=>{record=applyCourseAction(record,pack,action,now);return view();};
 const work=()=>record.journey==='quest'?record.quest!.work!:record.topics[record.active!.topicId]!.skillWork?.[record.active!.skillId!]??record.topics[record.active!.topicId]!.work[record.active!.mode]!;
 const correct=()=>{const task=view().task!;const a=work().attempt;return go({type:'answer',taskKey:a.key,answers:task.part&&!task.connected?[a.problem.fields[a.partIndex ?? 0]!.answer]:a.problem.fields.map(f=>f.answer)});};
 const finish=()=>{for(let i=0;i<20;i++){correct();if(work().attempt.outcome)return;go({type:'nextQuestion'});}throw Error('Multi-answer task never finished');};
 const next=()=>{go({type:'nextQuestion'});while(view().stage==='lesson')go({type:'lessonNext'});};
 return{get record(){return record;},go,work,correct,finish,next,view,reload:()=>{record=JSON.parse(JSON.stringify(record));}};
}
test('Spring retains six historical topics, four visible islands, 19 eligible originals and 40 archived teaching units and 60 finite exercises',()=>{
 assert.deepEqual(content.topics.map(t=>t.title),['Числа и пресмятане','Части и разпределяне','Тегло и цени','Фигури и мерки','Движение и работа','Броене и логика']);
 assert.deepEqual(content.topics.map(t=>t.skills.length),[2,2,2,2,2,2]);
 assert.equal(content.navigationGroups!.length,4);
 assert.equal(archive.originals.length,20);assert.deepEqual(proletnoDraftReview.excludedFromGrading,['pms-g4-2024-p6']);
 assert.equal(proletnoDraftReview.availableOriginals,19);assert.equal(proletnoDraftReview.learningUnits,40);assert.equal(all.length,119);
 assert.equal(new Set(all.map(p=>p.id)).size,119);assert.equal(new Set(all.map(p=>JSON.stringify([p.text,p.fields]))).size,119);
 for(const family of archive.families){
  assert.equal(family.items.filter(p=>p.pool==='core').length,3);assert.equal(family.items.filter(p=>p.pool==='hard').length,2);
  const skill=`pms-${family.id}`;
  for(const hard of [false,true]){let i=0;while(content.problem(skill,i,hard)){assert.ok(++i<100);}assert.equal(content.problem(skill,i,hard),null);}
  assert.ok(content.introductions![skill]!.rationale);assert.ok(all.some(p=>p.id===content.introductions![skill]!.problemId&&isCompetitionProblem(p)));
 }
 for(const p of all){
  assert.equal(p.solution?.length,3);assert.ok(p.solution.every(part=>part.paragraphs.length&&part.paragraphs.every(t=>t.trim())));
  assert.deepEqual(content.solutionFor!(p),p.solution);assert.equal(content.solutionFor!({...p,text:'modified'}),undefined);
  assert.ok(p.fields.length&&p.fields.every(f=>Number.isFinite(Number(f.answer))));assert.ok(p.difficulty?.rationale);
  if(p.figure){const png=fs.readFileSync(path.join(process.cwd(),'assets/images',p.figure.src));assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.readUInt32BE(16)>100);}
 }
 const p=content.problem('pms-expressions',0,false)!;p.fields[0]!.answer='changed';assert.notEqual(content.problem('pms-expressions',0,false)!.fields[0]!.answer,'changed');
 for(const i of [-1,0.5,NaN,Infinity])assert.equal(content.problem('pms-expressions',i,false),null);
 assert.equal(content.problem('missing',0,false),null);
});
test('source wording, figures and ordered answers survive; incomplete source never enters grading',()=>{
 const originals=all.filter(p=>p.archive?.kind==='original');assert.equal(originals.length,19);
 for(const p of all.filter(p=>p.provenance)){
  const source=archive.originals.find(o=>o.id===p.archive!.sourceId)!;
  assert.ok(p.text.startsWith(source.text));assert.equal(p.provenance!.year,source.year);assert.equal(p.provenance!.page,source.page);
  assert.match(p.provenance!.video!,/youtube\.com\/watch\?v=/);
  const units=p.archive!.covers.map(id=>source.units.find(u=>u.id===id)!);
  assert.deepEqual(p.fields.map(f=>Number(f.answer)),units.flatMap(u=>u.fields.map(f=>f.answer)));
  const statement=originalStatement(content,p.id)!;assert.ok(statement);assert.equal('fields' in statement,false);assert.equal('solution' in statement,false);
 }
 assert.equal(new Set(all.flatMap(p=>p.figure?[p.figure.src]:[])).size,7);
 assert.ok(!all.some(p=>p.id.startsWith('pms-g4-2024-p6')));assert.equal(originalStatement(content,'pms-g4-2024-p6:original'),undefined);
 assert.deepEqual(proletnoDraftReview.missingOfficialSolutions,[2026]);
 for(const p of all.filter(p=>!p.provenance)){assert.ok(p.practiceSource);assert.ok(originals.some(o=>o.id===p.practiceSource!.problemId));}
});
test('independent enumeration verifies the combination, digits and colour-count originals',()=>{
 const answers=(id:string)=>all.find(p=>p.id===`${id}:original`)!.fields.map(f=>Number(f.answer));
 let winning=0;
 for(let a=1;a<=13;a++)for(let b=a+1;b<=14;b++)for(let c=b+1;c<=15;c++)for(let d=c+1;d<=16;d++){
  const n=[a,b,c,d],pairs=n.flatMap((x,i)=>n.slice(i+1).map(y=>[x,y] as [number,number]));
  if(pairs.some(([x,y])=>x+y===12)&&pairs.some(([x,y])=>x*y===12))winning++;
 }
 assert.deepEqual(answers('pms-g4-2023-p6'),[winning]);assert.equal(winning,62);
 const repeatedTwo=Array.from({length:9000},(_,i)=>String(1000+i)).filter(s=>[...s].filter(c=>c==='2').length===2);
 assert.equal(repeatedTwo.length,459);assert.deepEqual(answers('pms-g4-2025-p4'),[6*2230+3*2290,304,306]);
 const numbers=Array.from({length:9000},(_,i)=>1000+i),distinct=(n:number)=>new Set(String(n)).size===4;
 const orange=numbers.filter(n=>String(n).startsWith('12')&&distinct(n));
 const coloured=numbers.filter(n=>distinct(n)&&(String(n)[0]==='1'||String(n)[1]==='2'));
 assert.deepEqual(answers('pms-g4-2026-p4'),[orange.length,9000-coloured.length,orange.reduce((a,b)=>a+b,0),coloured.find((_,i)=>i===4*(coloured.length-1-i))]);
 const colours=[0,0,0];let lamp=0;for(let block=1;lamp<15376;block++)for(let colour=0;colour<3;colour++)for(let k=0;k<block&&lamp<15376;k++,lamp++)colours[colour]=colours[colour]!+1;
 assert.deepEqual(answers('pms-g4-2023-p5'),[124,124**2,...colours,15376-Math.min(...colours)+3]);
});
test('all 60 authored answers satisfy an independent arithmetic or exhaustive check',()=>{
 for(const family of archive.families)for(const item of family.items){
  const v=Number(item.id.split('-').at(-1)),hard=v>3;let expected=0;
  switch(family.id){
   case 'expressions':{const x=12+v;expected=hard?Array.from({length:21+v-x},(_,i)=>x+i).reduce((a,b)=>a+b,0):x;break;}
   case 'patterns':{const n=6+v;expected=hard?Array.from({length:n*n},(_,i)=>i).filter(i=>i%3===0).length:n*n;break;}
   case 'backwards':expected=hard?24+6*v:18+3*v;break;
   case 'relationships':expected=hard?(16+4*v)/2+(16+8*v)/4:12+v;break;
   case 'balance':expected=hard?3*(2*(60+10*v)-10):40+10*v;break;
   case 'purchases':expected=hard?3*v+2*(v+2):3*(4+v);break;
   case 'composite':expected=(8+v)*(5+v)-(hard?9:0);break;
   case 'tiling':expected=hard?20*((8+v)*(6+v)-(6+v)*(4+v)):2*(10+2*v);break;
   case 'relative':expected=(120+60*v)/5*(hard?6:1);break;
   case 'work':expected=hard?5+5*v:5*(2+v);break;
   case 'cases':{const max=3+v;expected=Array.from({length:900},(_,i)=>i+100).filter(n=>{const digits=[...String(n)].map(Number);return new Set(digits).size===3&&digits.every(d=>d<=max)&&(!hard||n%2===0);}).length;break;}
   case 'groups':expected=(8+v)+(10+v)+(hard?2:1);break;
   default:throw Error(`Unverified family ${family.id}`);
  }
  assert.deepEqual(item.fields.map(f=>f.answer),[expected],item.id);
 }
});
test('each exact skill starts with an eligible original and can reach every non-overlapping source',()=>{
 for(const topic of content.topics)for(const skill of topic.skills){
  const h=harness();h.go({type:'selectTopic',topicId:topic.id,skillId:skill.id});assert.ok(isCompetitionProblem(h.work().attempt.problem));
  for(const p of all.filter(p=>p.skillId===skill.id&&isCompetitionProblem(p))){
   const record=newKidsCourse(content,now);record.attempts=all.filter(q=>q.skillId===skill.id&&isCompetitionProblem(q)&&!overlaps(p,q,content)).map(q=>({key:q.id,problem:q,mode:'core',hintUsed:false,outcome:'independent',completedAt:now}));
   assert.ok(chooseSkillProblem(record,content,skill.id,false,now));
  }
 }
});
test('five-task adventures finish distinct natural questions with at most three diagnostic tasks',()=>{
 const h=harness();h.go({type:'startQuest'});const ids=new Set<string>();
 for(let i=0;i<5;i++){const p=h.work().attempt.problem;assert.ok(!ids.has(p.id));ids.add(p.id);assert.ok(p.provenance);h.finish();h.next();}
 assert.equal(h.view().stage,'questComplete');assert.equal(h.record.quest!.completed,5);assert.equal(h.record.stamps!.length,1);assert.ok(h.record.quest!.steps.filter(s=>s.kind==='diagnostic').length<=3);
});
test('natural-part drafts and local hint exclusion survive reload while old source awards remain unique',()=>{
 const p=all.find(p=>p.id==='pms-g4-2026-p1:original')!;
 const single:KidsCourseContent={...content,problem:(skill,i,hard)=>skill===p.skillId&&i===0&&!hard?p:null};
 const h=harness(single);h.go({type:'selectTopic',topicId:'pms-numbers',skillId:p.skillId});const key=h.work().attempt.key;
 assert.equal(h.view().task!.connected!.total,2);assert.equal(h.view().task!.fields.length,4);
 h.go({type:'saveDraft',taskKey:key,partIndex:0,answers:['1078','','','']});h.reload();assert.deepEqual(h.view().task!.draft,['1078','','','']);
 for(let i=1;i<=3;i++){h.go({type:'hint',taskKey:key});assert.equal(h.view().task!.solutionParts!.length,i);}
 h.reload();assert.equal(h.view().task!.goldReward,undefined);h.finish();assert.equal(h.work().attempt.outcome,'hinted');assert.equal(h.view().gold,0);
 h.next();assert.equal(h.view().task!.connected!.index,2);assert.equal(h.view().task!.hintLevel,0);
 assert.equal(h.view().task!.goldReward!.amount,25);h.finish();assert.deepEqual(h.record.problemGoldAwards!.map(award=>award.amount),[25]);
 const related=all.filter(q=>q.archive?.sourceId==='pms-g4-2026-p1');const paid=newKidsCourse(content,now);
 assert.equal(new Set(related.map(q=>problemGoldKey(q,content))).size,1);
 for(const q of [...related,...related])awardProblemGold(paid,content,{key:q.id,problem:q,mode:'core',hintUsed:true,hintLevel:2,outcome:'hinted',completedAt:now} as CourseAttempt,now);
 assert.equal(paid.problemGoldAwards!.length,1);assert.equal(courseGoldBalance(paid),25);
});

test('Spring ordinary/hard gold uses 20/25, survives two hints and excludes the third after reload',()=>{
 for(const [id,amount] of [['pms-g4-2023-p1:original',20],['pms-g4-2026-p1:original',25]] as const){
  const p=all.find(p=>p.id===id)!;
  const single:KidsCourseContent={...content,problem:(skill,i,hard)=>skill===p.skillId&&i===0&&!hard?p:null};
  for(let hints=0;hints<=3;hints++){
   const h=harness(single);h.go({type:'selectTopic',topicId:'pms-numbers',skillId:p.skillId});
   assert.equal(h.view().task!.goldReward!.amount,amount);
   for(let i=0;i<hints;i++)h.go({type:'hint',taskKey:h.work().attempt.key});
   h.reload();assert.equal(h.view().task!.goldReward?.amount,hints===3?undefined:amount);
   h.finish();assert.equal(h.work().attempt.outcome,hints?'hinted':'independent');
   assert.deepEqual(h.record.problemGoldAwards?.map(a=>a.amount)??[],hints===3?[]:[amount]);
   if(hints===3)assert.equal(courseGoldBalance(h.record),0);
   h.reload();assert.deepEqual(h.record.problemGoldAwards?.map(a=>a.amount)??[],hints===3?[]:[amount]);
  }
 }
});
test('Spring progress reloads separately without touching existing saved history, targets or rewards',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maths-spring-'));
 try{
  const legacy=createKidsCourseStore(dir);legacy.update(0,{type:'selectTopic',topicId:'matches'},existing);
  const before=fs.readFileSync(path.join(dir,'course-v2.json'));
  const draftDir=path.join(dir,'competitions','proletno'),draft=createKidsCourseStore(draftDir,dir);
  const record=draft.update(0,{type:'startQuest'},content),task=record.quest!.work!.attempt;
  const saved=draft.update(record.revision,{type:'saveDraft',taskKey:task.key,partIndex:0,answers:['123']},content);
  assert.deepEqual(createKidsCourseStore(draftDir,dir).read(content),saved);assert.throws(()=>draft.read(existing),{status:409});
  assert.deepEqual(fs.readFileSync(path.join(dir,'course-v2.json')),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

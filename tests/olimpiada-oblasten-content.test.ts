import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import archive from '../content/olimpiada-oblasten/2023-2026.json' with {type:'json'};
import {regionalOlympiadCourseContent as content, regionalOlympiadDraftReview} from '../src/server/olimpiada-oblasten-course-content.ts';
import {kidsCourseContent as existing} from '../src/server/kids-course-content.ts';
import {applyCourseAction,courseView,newKidsCourse} from '../src/core/kids-course.ts';
import type {CourseAction,CourseAttempt,KidsCourseContent} from '../src/core/kids-course.ts';
import {catalogueProblems,isCompetitionProblem} from '../src/core/kids-selection.ts';
import {awardProblemGold,courseGoldBalance} from '../src/core/kids-gold.ts';
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
test('regional Olympiad has 12 whole originals, 23 natural units, 21 finite exercises and four canonical islands',()=>{
 assert.deepEqual(content.topics.map(t=>t.title),['Числови загадки','Истории с числа','Геометрични открития','Срещи и обиколки']);
 assert.deepEqual(content.topics.map(t=>t.skills.length),[1,3,2,1]);
 assert.equal(regionalOlympiadDraftReview.availableOriginals,12);assert.equal(regionalOlympiadDraftReview.learningUnits,23);
 assert.equal(regionalOlympiadDraftReview.authoredExercises,21);assert.deepEqual(regionalOlympiadDraftReview.missingOfficialSolutions,[]);
 assert.equal(all.length,56);assert.equal(new Set(all.map(p=>p.id)).size,56);
 const sources=all.filter(p=>p.archive?.kind==='original');
 assert.deepEqual(content.navigationGroups!.map(g=>g.sourceIds.length),[4,4,3,1]);
 for(const family of archive.families){
  assert.equal(family.items.length,3);
  assert.ok(sources.some(p=>p.id===content.introductions![`oli-ob-${family.id}`]!.problemId));
  for(const hard of [false,true]){let i=0;while(content.problem(`oli-ob-${family.id}`,i,hard))assert.ok(++i<50);assert.equal(content.problem(`oli-ob-${family.id}`,i,hard),null);}
 }
 for(const p of all){
  assert.equal(p.solution?.length,3);assert.ok(p.solution.every(s=>s.paragraphs.length&&s.paragraphs.every(t=>t.trim())));
  assert.deepEqual(content.solutionFor!(p),p.solution);assert.equal(content.solutionFor!({...p,text:'changed'}),undefined);
  assert.ok(p.difficulty?.rationale);assert.ok(p.fields.every(f=>Number.isFinite(Number(f.answer))));
 }
 const copy=content.problem('oli-ob-expressions',0,false)!;copy.fields[0]!.answer='changed';assert.notEqual(content.problem('oli-ob-expressions',0,false)!.fields[0]!.answer,'changed');
 for(const i of [-1,0.5,NaN,Infinity])assert.equal(content.problem('oli-ob-expressions',i,false),null);
});
test('regional original statements, natural boundaries, source years and all five crops remain accessible without answers',()=>{
 for(const original of archive.originals){
  const p=all.find(p=>p.id===`${original.id}:original`)!;
  assert.ok(p.text.startsWith(original.text));assert.equal(p.provenance!.year,original.year);assert.match(p.source,/Олимпиада \(областен кръг\)/);
  const descriptor=content.connectedProblem!(p)!;assert.equal(descriptor.units.length,original.units.length);
  for(const [i,unit] of descriptor.units.entries()){
   assert.deepEqual(unit.fields.map(f=>Number(f.answer)),original.units[i]!.fields.map(f=>f.answer));
   if(original.units.length>1)assert.ok(!unit.text.includes('Учебна стъпка:'));
  }
  const statement=originalStatement(content,p.id)!;
  assert.equal('fields' in statement,false);assert.equal('solution' in statement,false);
  if(original.year===2023&&original.problem===3)assert.equal(statement.figures!.length,2);
  const partStatement=originalStatement(content,`${original.id}:unit:${descriptor.units[0]!.id}`)!;assert.ok(partStatement);
 }
 const figures=new Set(all.flatMap(p=>p.figure?[p.figure.src]:[]));assert.equal(figures.size,5);
 for(const src of figures){const png=fs.readFileSync(path.join(process.cwd(),'assets/images',src));assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.readUInt32BE(16)>100);}
 for(const p of all.filter(p=>!p.provenance)){assert.ok(p.practiceSource);assert.ok(originalStatement(content,p.practiceSource!.problemId));}
});
test('independent calculations and enumeration verify all twelve original answer sets',()=>{
 const answers=(year:number,n:number)=>all.find(p=>p.id===`oli-ob-g4-${year}-p${n}:original`)!.fields.map(f=>Number(f.answer));
 const a=202*3-2023/(2+0+2+3),b=(7*987-987*6)/(2013/3-2004/3);
 const odd=Array.from({length:8},(_,i)=>2*i+1),d=odd.reduce((s,n)=>s+n,0)/(15-13+11-9+7-5+3-1),c=6789-789*d;
 const rooms=[a,b,c].flatMap(ivan=>[a,b,c].filter(p=>p!==ivan).flatMap(petar=>[a,b,c].filter(s=>s!==ivan&&s!==petar).map(stoyan=>[ivan,petar,stoyan]))).filter(([i,p,s])=>Math.floor(i!/100)===Math.floor(p!/100)&&i!%10!==s!%10);
 assert.equal(rooms.length,1);assert.deepEqual(answers(2023,1),[a,b,c,...rooms[0]!]);
 const whiteCats=Array.from({length:34},(_,i)=>i).find(c=>4*c+2*(33-c)===102)!;
 const hens=(33-whiteCats)*3,cats=100-hens;const blackCats=(cats-whiteCats+7)/2,blackHens=blackCats/2;
 const varHens=hens-(33-whiteCats)-blackHens;
 assert.deepEqual(answers(2023,2),[cats,100-33-blackCats-blackHens,Number(varHens<=2*hens/5),varHens,2*hens/5]);
 const sizes=[];for(let x=1;x<74;x++)for(let y=1;y<x;y++)if(3*x+2*y===74&&2*x-y===74-48)sizes.push([x,y]);
 assert.equal(sizes.length,1);const [large,small]=sizes[0]!;let width=0;for(let i=0;i<2023;i++)width+=i%2?small!:large!;
 assert.deepEqual(answers(2023,3),[large,small,2*(width+26)]);
 const x=(1234-(1353-1023/3))*5,y=789+(987-879)*7/6;assert.deepEqual(answers(2024,1),[x,y,x+y-1]);
 const tile=208/8;assert.deepEqual(answers(2024,2),[tile*30,2*(6*tile+2*tile+8*tile)]);
 const animals=(483+447)/3,unicorns=447-animals,dragons=animals-unicorns,both=(animals-22)/4;
 assert.deepEqual(answers(2024,3),[unicorns,dragons,both+(both+22)]);
 const A=100+11*10+11,B=123*(4+5)+6*78+9*10*(10-9+8-7+6-5+4-3+2-1),C=(2025/5-234)/9;assert.deepEqual(answers(2025,1),[(B+C-2*A)/3-(B+5*C)/4]);
 const books=(102-2)/4;const initial=[93,72,36];let [m,e,n]=initial;const first=m!/3;m!-=first;e!+=first;const second=n!;e!-=second;n!+=second;n!-=5;m!+=5;
 assert.deepEqual([m,e,n],[67,67,67]);assert.deepEqual(answers(2025,2),[books,books+2,2*books,...initial]);
 let edges=4;const dayEdges=[edges];for(let day=2;day<=152;day++){edges+=day%2===0?4:8;dayEdges.push(edges);}
 const leaves=1+4*(152-1);const five=(2*leaves-1000)/2,three=leaves-five;
 const date=new Date(Date.UTC(2025,0,1+dayEdges.findIndex(v=>v*5===2000)));
 assert.deepEqual(answers(2025,3),[dayEdges[30]!*5,date.getUTCDate(),date.getUTCMonth()+1,five+2*three]);
 const x26=(5*5599+4*5599-9*5544)*(869-7*123),y26=(7517-2*(3*535+5*353))/3;assert.deepEqual(answers(2026,1),[x26/4+y26*4]);
 const meetingDistance=(meeting:number)=>{const position=meeting*720/5%720,alongSide=position%120;return Math.min(alongSide,120-alongSide);};assert.deepEqual(answers(2026,2),[meetingDistance(1),meetingDistance(123)]);
 const cases=[];for(let g=0;g<=9;g++)for(let s=0;s<=17;s++)if(9*g+5*s===88)cases.push(g);
 assert.deepEqual(answers(2026,3),[250-33*7,111*2/3,...cases]);
});
test('all 21 authored exercises have independently checked answers',()=>{
 for(const family of archive.families)for(const item of family.items){
  const k=Number(item.id.split('-').at(-1));let expected:number[];
  switch(family.id){
   case 'expressions':{const rhs=120-9*k,x=Array.from({length:61},(_,i)=>i).find(v=>180-3*v===rhs)!;expected=[x+10+2*k];break;}
   case 'animals':{const heads=18+2*k,legs=48+6*k;const cats=Array.from({length:heads+1},(_,i)=>i).find(v=>4*v+2*(heads-v)===legs)!;expected=[cats,heads-cats];break;}
   case 'backwards':expected=[(20+k-(k%2?3:4))*3/2];break;
   case 'boxes':{if(k<3){const count=12+3*k,total=7*count+4+k;expected=[Array.from({length:count+1},(_,i)=>i).find(g=>8*g+7*(count-g)===total)!];}else{const possibilities=[];for(let g=0;g<5;g++)for(let s=0;s<9;s++)if(9*g+5*s===43)possibilities.push([g,s]);assert.equal(possibilities.length,1);expected=possibilities[0]!;}break;}
   case 'tiling':{const side=6+2*k,count=3+k;expected=[side,count*side*side];break;}
   case 'growth':{let edges=4;for(let day=2;day<=2*k+1;day++)edges+=day%2?8:4;expected=[3*edges];break;}
   case 'relative':{if(k<3)expected=[6*(30+10*k)/5];else{const location=11*360/5%360;expected=[Math.min(location%60,60-location%60)];}break;}
   default:throw Error(`Unverified family: ${family.id}`);
  }
  assert.deepEqual(item.fields.map(f=>f.answer),expected,item.id);
 }
});
test('regional skills start with originals and adventures carry natural parts across five-step boundaries',()=>{
 for(const topic of content.topics)for(const skill of topic.skills){const h=harness();h.go({type:'selectTopic',topicId:topic.id,skillId:skill.id});assert.ok(isCompetitionProblem(h.work().attempt.problem));}
 const h=harness();h.go({type:'startQuest'});const keys=new Set<string>();
 for(let i=0;i<5;i++){const task=h.view().task!;const identity=`${task.connected?.sourceId}:${task.connected?.index}`;assert.ok(!keys.has(identity));keys.add(identity);h.finish();h.next();}
 assert.equal(h.view().stage,'questComplete');assert.equal(h.record.quest!.completed,5);assert.ok(h.record.quest!.steps.filter(s=>s.kind==='diagnostic').length<=3);
});
test('regional drafts, dependent help and third-hint exclusions persist and reset only local hints per part',()=>{
 const p=all.find(p=>p.id==='oli-ob-g4-2023-p2:original')!;
 const single:KidsCourseContent={...content,problem:(skill,i,hard)=>skill===p.skillId&&i===0&&!hard?p:null};
 const h=harness(single);h.go({type:'selectTopic',topicId:'oli-ob-stories',skillId:p.skillId});const key=h.work().attempt.key;
 assert.equal(h.view().task!.connected!.total,3);
 h.go({type:'saveDraft',taskKey:key,partIndex:0,answers:['5']});h.reload();assert.deepEqual(h.view().task!.draft,['5']);
 for(let i=1;i<=3;i++)h.go({type:'hint',taskKey:key});h.reload();assert.equal(h.view().task!.goldReward,undefined);h.finish();assert.equal(h.record.problemGoldAwards?.length??0,0);
 h.next();assert.equal(h.view().task!.connected!.index,2);assert.equal(h.view().task!.hintLevel,0);assert.equal(h.view().task!.goldReward!.amount,25);h.finish();assert.equal(h.work().attempt.outcome,'hinted');
 h.next();assert.equal(h.view().task!.fields.length,3);h.finish();assert.equal(h.record.problemGoldAwards!.length,2);
});
test('regional standard/hard rewards honor two hints, exclude the third, and legacy aliases never double-pay',()=>{
 for(const [id,amount] of [['oli-ob-g4-2025-p1:original',20],['oli-ob-g4-2023-p2:original',25]] as const){
  const p=all.find(p=>p.id===id)!;const topic=content.topics.find(t=>t.skills.some(s=>s.id===p.skillId))!;
  for(let hints=0;hints<=3;hints++){
   const single:KidsCourseContent={...content,problem:(skill,i,hard)=>skill===p.skillId&&i===0&&!hard?p:null};const h=harness(single);h.go({type:'selectTopic',topicId:topic.id,skillId:p.skillId});
   for(let i=0;i<hints;i++)h.go({type:'hint',taskKey:h.work().attempt.key});h.reload();assert.equal(h.view().task!.goldReward?.amount,hints===3?undefined:amount);h.finish();assert.deepEqual(h.record.problemGoldAwards?.map(a=>a.amount)??[],hints===3?[]:[amount]);
  }
  const related=all.filter(q=>q.archive?.sourceId===p.archive!.sourceId);
  for(const order of [related,[...related].reverse()]){const paid=newKidsCourse(content,now);for(const q of [...order,...order])awardProblemGold(paid,content,{key:q.id,problem:q,mode:'core',hintUsed:true,hintLevel:2,outcome:'hinted',completedAt:now} as CourseAttempt,now);assert.equal(paid.problemGoldAwards!.length,1);assert.equal(courseGoldBalance(paid),amount);}
 }
});
test('regional progress is isolated and does not rewrite existing maths history',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maths-regional-'));
 try{
  const legacy=createKidsCourseStore(dir);legacy.update(0,{type:'selectTopic',topicId:'matches'},existing);const before=fs.readFileSync(path.join(dir,'course-v2.json'));
  const isolated=path.join(dir,'competitions','olimpiada-oblasten'),store=createKidsCourseStore(isolated,dir);const record=store.update(0,{type:'startQuest'},content),task=record.quest!.work!.attempt;
  const saved=store.update(record.revision,{type:'saveDraft',taskKey:task.key,partIndex:0,answers:courseView(record,content,now).task!.fields.map((_,i)=>i?'':'123')},content);assert.deepEqual(createKidsCourseStore(isolated,dir).read(content),saved);assert.throws(()=>store.read(existing),{status:409});assert.deepEqual(fs.readFileSync(path.join(dir,'course-v2.json')),before);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

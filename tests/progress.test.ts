import assert from "node:assert/strict";
import { test } from "node:test";
import type { KidsCourse, CourseAttempt } from "../src/core/kids-course.ts";
import { projectProgressCourse, dayProgress, sofiaDay } from "../src/core/progress.ts";
import { courseGoldBalance } from "../src/core/kids-gold.ts";
import { progressChild } from "../src/server/progress-access.ts";
import { nvoCourseContent } from "../src/server/nvo-course-content.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";
const at = "2026-11-05T12:00:00Z";
const attempt = (key: string, outcome: CourseAttempt["outcome"], extra: Partial<CourseAttempt> = {}): CourseAttempt => ({ key, outcome, completedAt: at, mode: "practice", hintUsed: outcome === "hinted", problem: { id: "same-problem", skillId: "skill", text: "PRIVATE-STATEMENT", source: "Примерна задача", hint: "PRIVATE-HINT", explanation: ["PRIVATE-SOLUTION"], fields: [{ label: "А", answer: "PRIVATE-GRADING" }, { label: "Б", answer: "PRIVATE-GRADING" }] }, answers: ["PRIVATE-ANSWER"], reasoning: "PRIVATE-REASONING", ...extra });
const course = (attempts: CourseAttempt[]): KidsCourse => ({ version: 2, contentVersion: "test", revision: 1, createdAt: at, updatedAt: at, paused: false, awards: [], attempts, topics: { topic: { skills: { skill: { streak: 0, target: 2, gap: false, revisit: true, nextCore: 0, nextHard: 0 } }, work: {}, challengeStreak: 0, reviewStreak: 0, challengeNext: 0, reviewNext: 0 } } });

test("progress counts repeated successes once per final attempt and retains help distinctions", () => {
 const c = course([attempt("a","independent"), attempt("b","independent",{freshEvidence:false}), attempt("c","hinted"), attempt("d","revealed"), attempt("e","incorrect")]);
 c.attempts.push(c.attempts[0]!);
 c.quest = { id: "q", startedAt: at, completed: 0, diagnostic: false, steps: [], work: { attempt: attempt("in-progress",undefined,{partOutcome:"independent", partIndex:0}) } };
 const before = JSON.stringify(c), projected = projectProgressCourse(c,"one");
 assert.deepEqual(dayProgress(projected.events), { gold:15, independent:2, hinted:1, incorrect:1, incorrectAttempts:1, legacyIncorrect:0, revealed:1 });
 assert.equal(projected.summary.attempts,5); assert.equal(projected.summary.revisit,1);
 assert.equal(JSON.stringify(c),before); assert.ok(!JSON.stringify(projected).includes("PRIVATE"));
});

test("standalone parts remain visible without counting as whole problems, multipart finals count once", () => {
 const part = attempt("part","hinted"); part.problem.archive = {sourceId:"source",kind:"part",covers:["a"]};
 const c = course([part, attempt("whole","independent",{partIndex:1})]);
 const result = projectProgressCourse(c,"one");
 assert.equal(result.events.filter(event => event.kind === "attempt").length,2);
 assert.deepEqual(dayProgress(result.events), {gold:15, independent:1,hinted:0, incorrect:0, incorrectAttempts:0, legacyIncorrect:0, revealed:0});
});

test("gold reconciles across duplicates, recorded prices and uncertain milestone dates without repricing", () => {
 const c = course([attempt("a","independent")]);
 c.problemGoldAwards = [{key:"legacy",skillId:"skill",earnedAt:at},{key:"hard",skillId:"skill",earnedAt:at,amount:15},{key:"hard",skillId:"skill",earnedAt:at,amount:15},{key:"unknown",skillId:"skill",earnedAt:"invalid",amount:10}];
 c.goldAwards = [{skillId:"skill",milestone:"started",earnedAt:at},{skillId:"skill",milestone:"correct",earnedAt:at},{skillId:"missing",milestone:"started",earnedAt:at}];
 const result=projectProgressCourse(c,"one");
 assert.equal(dayProgress(result.events).gold,35); assert.equal(result.undatedGold,15);
 assert.equal(dayProgress(result.events).gold + result.undatedGold,courseGoldBalance(c));
});

test("missing dates and reconstructed confirmation do not become apparent daily activity", () => {
 const c=course([attempt("old","independent",{completedAt:undefined})]);
 c.topics.topic!.skills.skill!.confirmedAt=at;
 const result=projectProgressCourse(c,"one");
 assert.equal(result.events.length,0); assert.equal(result.undatedAttempts,1); assert.equal(result.undatedGold,35);
 const confirmed=course([attempt("a","independent")]); confirmed.topics.topic!.skills.skill!.confirmedAt=at;
 assert.equal(dayProgress(projectProgressCourse(confirmed,"one").events).gold,35);
});

test("Sofia dates cross midnight and DST boundaries independently of server timezone", () => {
 for(const [instant,day] of [["2026-11-05T21:59:59Z","2026-11-05"],["2026-11-05T22:00:00Z","2026-11-06"],["2026-03-28T21:59:59Z","2026-03-28"],["2026-03-28T22:00:00Z","2026-03-29"],["2026-03-29T00:59:59Z","2026-03-29"],["2026-03-29T01:00:00Z","2026-03-29"],["2026-10-25T00:59:59Z","2026-10-25"],["2026-10-25T01:00:00Z","2026-10-25"]]) assert.equal(sofiaDay(instant),day);
 for(const invalid of [undefined,"invalid","2026-11-05","2026-11-05T12:00:00"]) assert.equal(sofiaDay(invalid),undefined);
});

test("explicit unauthorized child never falls back to selected or sole authorized child", () => {
 const children=[{id:"own",nickname:"Пример"}];
 assert.equal(progressChild(children,undefined,"stale").id,"own");
 assert.throws(()=>progressChild(children,"sibling","own"),{status:404});
 assert.throws(()=>progressChild(children,"foreign"),{status:404});
 assert.throws(()=>progressChild([],undefined),{status:428});
 assert.throws(()=>progressChild([...children,{id:"other",nickname:"Друг"}],undefined),{status:428});
});


test("progress projects current catalogue skill names without exposing teaching content or rewriting history",()=>{
 const c=course([attempt("known","independent"),attempt("unknown","incorrect",{problem:{...attempt("x","incorrect").problem,skillId:"retired"}})]);
 const before=JSON.stringify(c);
 const projected=projectProgressCourse(c,"one",{topics:[{id:"topic",title:"Остров",rewardName:"PRIVATE-REWARD",skills:[{id:"skill",title:"Точки и мачове",lesson:["PRIVATE-LESSON"]}]}]});
 const attempts=projected.events.filter(event=>event.kind==="attempt");
 assert.deepEqual(attempts.map(event=>[event.skillId,event.skillTitle]),[["skill","Точки и мачове"],["retired","Други упражнения"]]);
 assert.ok(!JSON.stringify(projected).includes("PRIVATE")); assert.equal(JSON.stringify(c),before);
});


test("third-hint successes count as assisted while recovered gold belongs to the later eligible day", () => {
 const c = course([attempt("excluded", "hinted", { hintLevel: 3, goldEligible: false, completedAt: "2026-11-04T12:00:00Z" }), attempt("recovered", "independent")]);
 c.problemGoldAwards = [{ key: "recovered", skillId: "skill", earnedAt: at, amount: 10 }];
 const projected = projectProgressCourse(c, "one");
 assert.deepEqual(dayProgress(projected.events.filter(event => event.day === "2026-11-04")), { gold: 0, independent: 0, hinted: 1, incorrect:0, incorrectAttempts:0, legacyIncorrect:0, revealed:0 });
 assert.deepEqual(dayProgress(projected.events.filter(event => event.day === "2026-11-05")), { gold: 25, independent: 1, hinted: 0, incorrect:0, incorrectAttempts:0, legacyIncorrect:0, revealed:0 });
 assert.equal(projected.undatedGold, 0);
 assert.equal(dayProgress(projected.events).gold, courseGoldBalance(c));
});


test("safe task identities distinguish competitions and natural parts without grading content", () => {
 const wrong = attempt("a", "incorrect");
 wrong.problem.naturalUnit = { sourceId: "2026-problem-1", unitId: "a", total: 2 };
 const otherPart = structuredClone(wrong); otherPart.key = "b"; otherPart.problem.naturalUnit!.unitId = "b";
 const oldPart = structuredClone(wrong); oldPart.key = "old"; delete oldPart.problem.naturalUnit;
 oldPart.problem.archive = { sourceId: "2026-problem-1", kind: "part", covers: ["a"] };
 const uncertain = structuredClone(oldPart); uncertain.key = "uncertain"; uncertain.problem.archive!.covers = ["a", "b"];
 const c = course([wrong, otherPart, oldPart, uncertain]);
 const before = JSON.stringify(c), projected = projectProgressCourse(c, "one"), other = projectProgressCourse(c, "two");
 const events = projected.events.filter(event => event.kind === "attempt");
 assert.equal(events[0]!.taskId, events[2]!.taskId);
 assert.notEqual(events[0]!.taskId, events[1]!.taskId);
 assert.notEqual(events[0]!.taskId, other.events[0]!.taskId);
 assert.equal(events[3]!.taskId, undefined);
 assert.equal(dayProgress(projected.events).incorrect, 2);
 assert.equal(dayProgress(projected.events).legacyIncorrect, 1);
 assert.ok(!JSON.stringify(projected).includes("PRIVATE")); assert.equal(JSON.stringify(c), before);
});

test("weekly achievements project only persisted independent learning evidence", () => {
 const c = course([
  attempt("no-evidence", "independent"),
  attempt("hint", "hinted", { appreciations: [{kind:"hint-independent"}] }),
  attempt("saved", "independent", { appreciations: [{kind:"scheduled-review"}] }),
  attempt("legacy", "independent", { personalProgress: true }),
 ]);
 const projected = projectProgressCourse(c, "one").events.filter(event => event.kind === "attempt");
 assert.deepEqual(projected.map(event => event.appreciation), [undefined,undefined,"scheduled-review","hint-independent"]);
 assert.equal(projected[2]!.completedAt, at);
});

test("historical NVO single originals share error identity with their current natural unit", () => {
 const original = nvoCourseContent.problem("nvo-place", 0, false);
 assert.ok(original);
 const connected = nvoCourseContent.connectedProblem!(original);
 assert.equal(connected?.units.length,1);
 const old = attempt("old", "incorrect", {problem:original});
 const current = attempt("new", "incorrect", {problem:{...original,naturalUnit:{sourceId:connected!.sourceId,unitId:connected!.units[0]!.id,total:1}}});
 const projected = projectProgressCourse(course([old,current]), "nvo", nvoCourseContent);
 assert.equal(dayProgress(projected.events).incorrect,1);
 assert.equal(dayProgress(projected.events).incorrectAttempts,2);
});

test("Olympiad unlettered originals and final parts share identity while teaching scaffolds stay separate", () => {
 const problems = olympiadCourseContent.topics.flatMap(topic => topic.skills.flatMap(skill => [false,true].flatMap(harder => {
  const found = [];
  for (let index=0;;index++) { const problem=olympiadCourseContent.problem(skill.id,index,harder); if(!problem) break; found.push(problem); }
  return found;
 })));
 const source = problems.filter(problem => problem.archive?.sourceId === "oli-g4-municipal-2022-p1");
 const original = source.find(problem => problem.archive?.kind === "original")!;
 const final = source.find(problem => problem.archive?.kind === "part")!;
 const scaffold = source.find(problem => problem.archive?.kind === "scaffold")!;
 assert.ok(original && final && scaffold);
 const connected = olympiadCourseContent.connectedProblem!(original)!;
 assert.equal(connected.units.length,1);
 const current = {...original,naturalUnit:{sourceId:connected.sourceId,unitId:connected.units[0]!.id,total:1}};
 const ambiguous = {...final,archive:{...final.archive!,covers:["a","b"]}};
 const c = course([original,final,scaffold,current,ambiguous].map((problem,index) => attempt(String(index),"incorrect",{problem})));
 const before = JSON.stringify(c);
 const projected = projectProgressCourse(c,"olimpiada",olympiadCourseContent);
 const ids = projected.events.map(event => event.taskId);
 assert.equal(ids[0],ids[1]); assert.equal(ids[0],ids[3]);
 assert.notEqual(ids[0],ids[2]); assert.ok(ids[2]); assert.equal(ids[4],undefined);
 assert.equal(dayProgress(projected.events).incorrect,2);
 assert.equal(dayProgress(projected.events).incorrectAttempts,5);
 assert.equal(dayProgress(projected.events).legacyIncorrect,1);
 assert.equal(JSON.stringify(c),before);
});

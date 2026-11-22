import assert from "node:assert/strict";
import {test} from "node:test";
import {dayProgress} from "../src/core/progress-calendar.ts";
import type {ProgressEvent} from "../src/core/progress.ts";
const event=(key:string,outcome:ProgressEvent["outcome"],extra:Partial<ProgressEvent>={}):ProgressEvent=>({key,kind:"attempt",day:"2026-11-05",label:"Task",wholeProblem:true,outcome,...extra});

test("period errors count distinct tasks, preserve repeated wrong attempts and survive later success",()=>{
 const events=[event("a","incorrect",{taskId:"one:task"}),event("b","incorrect",{taskId:"one:task"}),event("c","incorrect",{taskId:"one:task",day:"2026-11-06"}),event("d","independent",{taskId:"one:task"}),event("e","hinted",{taskId:"one:task"}),event("f","incorrect",{taskId:"two:task"})];
 const before=JSON.stringify(events);
 assert.deepEqual(dayProgress(events),{gold:0,independent:1,hinted:1,incorrect:2,incorrectAttempts:4,legacyIncorrect:0,revealed:0});
 assert.equal(dayProgress(events.filter(item=>item.day==="2026-11-05")).incorrect,2);
 assert.equal(dayProgress(events.filter(item=>item.day==="2026-11-06")).incorrect,1);
 assert.equal(JSON.stringify(events),before);
});

test("natural parts have distinct error identities and legacy errors remain separate",()=>{
 const events=[event("a","incorrect",{taskId:"one:source:a",wholeProblem:false,naturalPart:true}),event("b","incorrect",{taskId:"one:source:a",wholeProblem:false,naturalPart:true}),event("c","incorrect",{taskId:"one:source:b",wholeProblem:false,naturalPart:true}),event("old-a","incorrect"),event("old-b","incorrect"),event("part-success","hinted",{wholeProblem:false,naturalPart:true}),event("old-part-success","independent",{wholeProblem:false}),event("shown","revealed",{wholeProblem:false}),{key:"g",kind:"gold" as const,day:"2026-11-05",label:"Gold",amount:10}];
 assert.deepEqual(dayProgress(events),{gold:10,independent:0,hinted:1,incorrect:2,incorrectAttempts:5,legacyIncorrect:2,revealed:1});
 assert.deepEqual(dayProgress([]),{gold:0,independent:0,hinted:0,incorrect:0,incorrectAttempts:0,legacyIncorrect:0,revealed:0});
});

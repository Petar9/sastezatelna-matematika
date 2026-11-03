import {test} from "node:test";
import assert from "node:assert/strict";
import {invitationEmail} from "../src/server/invitations.ts";
import {summarizeCourse,hasCourseProblem} from "../src/server/pilot-summary.ts";

test("invitation normalizes and validates parent email",()=>{
 assert.equal(invitationEmail(" Parent@Example.com "),"parent@example.com");
 assert.equal(invitationEmail("invalid"),null);
 assert.equal(invitationEmail("x".repeat(250)+"@example.com"),null);
});
test("summary counts retained confirmation and current revisit separately",()=>{
 const course={attempts:[{problem:{id:"problem-1"},reasoning:"private"}],topics:{one:{skills:{a:{confirmedAt:"2026-01-01",revisit:true},b:{revisit:false}}}}};
 assert.deepEqual(summarizeCourse(course),{attempts:1,confirmed:1,revisit:1,problemId:"problem-1"});
 assert.equal(hasCourseProblem(course,"problem-1"),true);
 assert.equal(hasCourseProblem(course,"other"),false);
 assert.equal(summarizeCourse(null),null);
});

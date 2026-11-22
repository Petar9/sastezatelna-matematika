import assert from "node:assert/strict";
import { test } from "node:test";
import { weeklyProgress } from "../src/core/weekly-progress.ts";
import { sofiaWeek } from "../src/core/progress-week.ts";
import type { ProgressEvent } from "../src/core/progress.ts";

const event = (key: string, day: string, extra: Partial<ProgressEvent> = {}): ProgressEvent => ({ key, day, kind: "attempt", label: "Задача", outcome: "independent", wholeProblem: true, taskId: key, ...extra });

test("Sofia calendar weeks run Monday–Sunday across month, year and DST boundaries", () => {
 for (const [day, start, end] of [["2026-11-20","2026-11-16","2026-11-22"],["2026-11-23","2026-11-23","2026-11-29"],["2027-01-01","2026-12-28","2027-01-03"],["2026-03-29","2026-03-23","2026-03-29"],["2026-10-25","2026-10-19","2026-10-25"]]) assert.deepEqual(sofiaWeek(day!), {start,end});
 for (const day of ["", "2026-02-30", "2026-11-20T12:00:00Z"]) assert.throws(() => sofiaWeek(day), RangeError);
});

test("weekly counts follow supplied competitions and retain errors after success", () => {
 const first = { events: [event("retry", "2026-11-16", {outcome:"incorrect"}), event("retry2", "2026-11-17", {taskId:"retry",outcome:"incorrect"}), event("right", "2026-11-17", {taskId:"retry"}), event("part", "2026-11-18", {wholeProblem:false,naturalPart:true,outcome:"hinted"}), event("before", "2026-11-15"), event("future", "2026-11-21")] };
 const second = { events: [event("other", "2026-11-19", {outcome:"incorrect"}), event("gold", "2026-11-20", {kind:"gold",amount:20})] };
 const before = JSON.stringify([first, second]);
 const all = weeklyProgress([first,second], "2026-11-20");
 assert.equal(all.independent,1); assert.equal(all.hinted,1); assert.equal(all.incorrect,2); assert.equal(all.incorrectAttempts,3); assert.equal(all.activeDays,4); assert.equal(all.gold,20);
 assert.equal(weeklyProgress([first],"2026-11-20").incorrect,1);
 assert.equal(JSON.stringify([first,second]),before);
});

test("weekly achievement needs saved evidence and selects at most one latest independent event", () => {
 const events = [event("hint", "2026-11-16", {appreciation:"hint-independent"}), event("whole", "2026-11-18", {appreciation:"whole-problem",completedAt:"2026-11-18T10:00:00Z"}), event("later", "2026-11-18", {appreciation:"scheduled-review",completedAt:"2026-11-18T12:00:00Z"}), event("bad", "2026-11-19", {appreciation:"whole-problem",outcome:"hinted"})];
 assert.equal(weeklyProgress([{events}],"2026-11-20").achievement,"scheduled-review");
 assert.equal(weeklyProgress([{events:[event("plain","2026-11-20")]}],"2026-11-20").achievement,undefined);
 assert.equal(weeklyProgress([{events}],"2026-11-23").achievement,undefined);
 assert.equal(weeklyProgress([],"2026-11-20").attempts,0);
 const offsetEvents = [event("earlier","2026-11-20",{appreciation:"whole-problem",completedAt:"2026-11-20T12:30:00+02:00"}),event("latest","2026-11-20",{appreciation:"scheduled-review",completedAt:"2026-11-20T11:00:00Z"})];
 assert.equal(weeklyProgress([{events:offsetEvents}],"2026-11-20").achievement,"scheduled-review");
});

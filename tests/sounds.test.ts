import assert from "node:assert/strict";
import { test } from "node:test";
import type { KidsCourseView } from "../src/core/kids-course.ts";
import { achievementSound } from "../src/core/sounds.ts";

const task = (outcome?: "independent") => ({ key: "t1", skillId: "s", text: "", source: "", ...(outcome ? { outcome } : {}) }) as KidsCourseView["task"];
const answered = (extra: Partial<KidsCourseView> = {}, taskExtra: object = {}) => ({ task: { ...task("independent")!, ...taskExtra }, ...extra }) as KidsCourseView;

test("a new daily record plays the record sound and outranks a learning milestone", () => {
 assert.equal(achievementSound(task(), answered({ appreciations: [{ kind: "daily-tasks", day: "2026-11-27", amount: 9 }] }), "t1"), "record");
 assert.equal(achievementSound(task(), answered({ appreciations: [{ kind: "whole-problem" }, { kind: "daily-gold", day: "2026-11-27", amount: 90 }] }), "t1"), "record");
});

test("learning milestones and new Doctor or Professor awards play the milestone sound", () => {
 for (const kind of ["whole-problem", "hint-independent", "scheduled-review"] as const)
  assert.equal(achievementSound(task(), answered({ appreciations: [{ kind }] }), "t1"), "milestone", kind);
 assert.equal(achievementSound(task(), answered({}, { personalProgress: true }), "t1"), "milestone");
 assert.equal(achievementSound(task(), answered({ reward: { rank: "professor", topic: "Числа" } }), "t1"), "milestone");
});

test("ordinary answers, restored views and other tasks stay silent", () => {
 assert.equal(achievementSound(task(), answered(), "t1"), undefined);
 assert.equal(achievementSound(task("independent"), answered({ appreciations: [{ kind: "whole-problem" }] }), "t1"), undefined);
 assert.equal(achievementSound(undefined, answered({ appreciations: [{ kind: "whole-problem" }] }), "t1"), undefined);
 assert.equal(achievementSound(task(), answered({ appreciations: [{ kind: "whole-problem" }] }), "other"), undefined);
});

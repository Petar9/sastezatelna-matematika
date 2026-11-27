// Creates a synthetic local learner in a named state for localhost review.
// Writes only to a new, empty directory passed explicitly; never to data/ or a hosted store.
import fs from "node:fs";
import path from "node:path";
import { applyCourseAction, courseView, newKidsCourse, type CourseAction, type KidsCourse, type KidsCourseContent } from "../src/core/kids-course.ts";
import { olympiadCourseContent } from "../src/server/olimpiada-course-content.ts";

const competitionId = "olimpiada";
const states = {
 // Every fresh problem solved correctly: the adventure offers repeat practice.
 exhausted: { wrongEvery: 0, done: (c: KidsCourse, v: View) => v.questPractice === "repeat" && !c.quest?.work },
 // Fresh problems used up while some mistakes still await recovery.
 recovery: { wrongEvery: 4, done: (c: KidsCourse, v: View) => v.questPractice === "recovery" && !c.quest?.work },
 // At least one island has reached Professor.
 professor: { wrongEvery: 0, done: (c: KidsCourse) => Object.values(c.topics).some(t => t.professorAt) && !c.quest?.work },
} as const;
type View = ReturnType<typeof courseView>;
type StateName = keyof typeof states;

const [name, target] = process.argv.slice(2);
if (!name || !(name in states) || !target) {
 console.error(`Usage: npm run review:state -- <${Object.keys(states).join("|")}> <new empty directory>`);
 process.exit(2);
}
const directory = path.resolve(target);
if (directory === path.resolve("data") || directory.startsWith(path.resolve("data") + path.sep)) throw new Error("Refusing to write into data/; use a disposable directory");
if (fs.existsSync(directory) && fs.readdirSync(directory).length) throw new Error(`${directory} is not empty`);

function build(content: KidsCourseContent, state: StateName): KidsCourse {
 const { wrongEvery, done } = states[state];
 // Recent past timestamps: earlier than the server's clock, but too recent for scheduled reviews to fall due.
 let time = Date.now() - 2 * 3600000;
 const now = () => new Date(time).toISOString();
 let course = newKidsCourse(content, now());
 const go = (action: CourseAction) => { time += 1000; course = applyCourseAction(course, content, action, now()); };
 let answered = 0;
 for (let step = 0; step < 5000; step++) {
  const view = courseView(course, content, now());
  if (done(course, view)) return course;
  if (view.stage === "lesson") { go({ type: "lessonNext" }); continue; }
  const work = course.quest?.work;
  if (!work) {
   if (view.questAvailable === false) break;
   go({ type: "startQuest" });
   continue;
  }
  if (work.attempt.outcome) { go({ type: "nextQuestion" }); continue; }
  const { problem } = work.attempt;
  const wrong = wrongEvery > 0 && work.attempt.mode === "core" && ++answered % wrongEvery === 0;
  const answers = problem.options
   ? [wrong ? String((Number(problem.fields[0]!.answer) + 1) % problem.options.length) : problem.fields[0]!.answer]
   : problem.fields.map(field => wrong ? "999" : field.answer);
  go({ type: "answer", taskKey: work.attempt.key, answers });
 }
 throw new Error(`Could not reach the "${state}" state`);
}

const course = build(olympiadCourseContent, name as StateName);
const file = path.join(directory, "kids", "competitions", competitionId, "course-v2.json");
fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
fs.writeFileSync(file, JSON.stringify(course), { mode: 0o600 });
const professor = Object.entries(course.topics).filter(([, t]) => t.professorAt).map(([id]) => id);
console.log(`${name}: ${course.attempts.length} attempts${professor.length ? `, Professor on ${professor.join(", ")}` : ""}`);
console.log(`Start: PORT=3417 MATHS_DATA_DIR=${directory} node scripts/start-local.mjs --production`);
console.log(`Open:  http://127.0.0.1:3417/?competition=${competitionId}`);

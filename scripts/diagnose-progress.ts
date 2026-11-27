// Read-only diagnosis of a learner's saved progress: daily gold by type, why
// successful attempts paid nothing, and skills stuck without fresh work.
// Input: a Supabase SQL Editor CSV export (columns competition_id, course) or one
// course JSON file with --competition. Nothing is written anywhere.
import fs from "node:fs";
import type { KidsCourse } from "../src/core/kids-course.ts";
import { goldAmounts, problemAwardAmount, problemGoldKey } from "../src/core/kids-gold.ts";
import { dayProgress, projectProgressCourse, sofiaDay } from "../src/core/progress.ts";
import { chooseSkillProblem } from "../src/core/kids-selection.ts";
import { competitionContent } from "../src/server/competitions.ts";

const args = process.argv.slice(2);
const option = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const file = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const from = option("--from"), to = option("--to");
if (!file) {
 console.error("Usage: npm run diagnose:progress -- <export.csv | course.json --competition <id>> [--from YYYY-MM-DD] [--to YYYY-MM-DD]");
 process.exit(2);
}

function parseCsv(text: string): Record<string, string>[] {
 const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
 for (let i = 0; i < text.length; i++) {
  const ch = text[i]!;
  if (quoted) {
   if (ch === "\"" && text[i + 1] === "\"") { field += "\""; i++; }
   else if (ch === "\"") quoted = false;
   else field += ch;
  } else if (ch === "\"") quoted = true;
  else if (ch === ",") { row.push(field); field = ""; }
  else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
  else field += ch;
 }
 if (field || row.length) { row.push(field); rows.push(row); }
 const [header, ...body] = rows;
 return body.filter(r => r.length === header!.length).map(r => Object.fromEntries(header!.map((h, i) => [h, r[i]!])));
}

const text = fs.readFileSync(file, "utf8");
const courses: { competitionId: string; course: KidsCourse }[] = file.endsWith(".json")
 ? [{ competitionId: option("--competition") ?? (() => { throw new Error("--competition is required for a JSON file"); })(), course: JSON.parse(text) }]
 : parseCsv(text).map(r => ({ competitionId: r.competition_id!, course: JSON.parse(r.course!) as KidsCourse }));

const inRange = (day?: string) => !!day && (!from || day >= from) && (!to || day <= to);
console.log("Facts come from the saved records. Items marked [computed] use the current content. Reasons the records do not establish are marked unexplained.\n");

const days = new Map<string, { problem: number; milestones: number; lines: string[] }>();
const dayOf = (day: string) => { let d = days.get(day); if (!d) days.set(day, d = { problem: 0, milestones: 0, lines: [] }); return d; };
const events = [];
for (const { competitionId, course } of courses) {
 const content = competitionContent(competitionId);
 if (course.contentVersion && course.contentVersion !== content.version) console.log(`Note: ${competitionId} was saved with content ${course.contentVersion}; current is ${content.version}.`);
 events.push(...projectProgressCourse(course, competitionId, content).events);
 for (const award of course.goldAwards ?? []) { const day = sofiaDay(award.earnedAt); if (inRange(day)) dayOf(day!).milestones += goldAmounts[award.milestone]; }
 const firstPaid = new Map<string, { day: string; at: string; amount: number }>();
 for (const award of [...new Map((course.problemGoldAwards ?? []).map(a => [a.key, a])).values()]) {
  const day = sofiaDay(award.earnedAt)!;
  firstPaid.set(award.key, { day, at: award.earnedAt, amount: problemAwardAmount(award) });
  if (inRange(day)) dayOf(day).problem += problemAwardAmount(award);
 }
 for (const attempt of course.attempts) {
  const day = sofiaDay(attempt.completedAt);
  if (!attempt.outcome || !inRange(day)) continue;
  const paid = firstPaid.get(problemGoldKey(attempt.problem, content));
  const reason = paid && paid.at === attempt.completedAt ? `paid ${paid.amount}`
   : attempt.outcome === "incorrect" || attempt.outcome === "revealed" ? "no problem gold for this outcome"
   : attempt.goldEligible === false ? "no gold after the third hint"
   : paid && paid.at < attempt.completedAt! ? `0: already paid on ${paid.day}`
   : "0: unexplained (no matching award recorded)";
  dayOf(day!).lines.push(`  ${attempt.completedAt!.slice(11, 16)}Z ${competitionId} ${attempt.mode} ${attempt.outcome} hint ${attempt.hintLevel ?? 0} fresh ${attempt.freshEvidence ?? "?"} ${attempt.problem.id} -> ${reason}`);
 }
}

for (const day of [...days.keys()].sort()) {
 const d = days.get(day)!, calendar = dayProgress(events.filter(e => e.day === day));
 const check = calendar.gold === d.problem + d.milestones ? "matches calendar" : `calendar shows ${calendar.gold}`;
 console.log(`${day}: gold ${d.problem + d.milestones} = problems ${d.problem} + skill milestones ${d.milestones} (${check}); tasks ${calendar.independent + calendar.hinted} (independent ${calendar.independent}, hinted ${calendar.hinted}); mistakes ${calendar.incorrect}; revealed ${calendar.revealed}`);
 for (const line of d.lines.sort()) console.log(line);
}

console.log("\nSkills needing revisit [computed: fresh work available now]");
const now = new Date().toISOString();
for (const { competitionId, course } of courses) {
 const content = competitionContent(competitionId);
 for (const topic of content.topics) for (const skill of topic.skills) {
  if (!course.topics[topic.id]?.skills[skill.id]?.revisit) continue;
  const fresh = chooseSkillProblem(course, content, skill.id, false, now);
  console.log(`  ${competitionId} ${skill.id}: ${fresh ? `fresh ${fresh.problem.id}` : "no fresh problem (only repeat practice)"}`);
 }
}

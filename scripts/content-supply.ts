// Reports how much fresh work each skill can offer, so thin pools are visible
// before learners run out. A report, not a gate: whether a skill can be
// confirmed and reviewed at all is enforced by tests/preparation.test.ts.
import { publishedCompetitions } from "../src/core/competitions.ts";
import { isCompetitionProblem } from "../src/core/kids-selection.ts";
import { competitionContent } from "../src/server/competitions.ts";

const limit = Number(process.argv[process.argv.indexOf("--thinnest") + 1]) || 10;
for (const competition of publishedCompetitions()) {
 const content = competitionContent(competition.id);
 const rows = content.topics.flatMap(topic => topic.skills.map(skill => {
  // Same pools as selection: core is the standard pool plus harder-pool originals;
  // harder authored tasks serve challenge, review and revisit recovery.
  const seen = new Set<string>();
  let core = 0, originals = 0, harderAuthored = 0;
  for (const hard of [false, true]) for (let cursor = 0; cursor < 1000; cursor++) {
   const problem = content.problem(skill.id, cursor, hard);
   if (!problem) break;
   if (seen.has(problem.id)) continue;
   seen.add(problem.id);
   const original = isCompetitionProblem(problem);
   if (original) originals++;
   if (!hard || original) core++; else harderAuthored++;
  }
  return { skill: skill.id, core, originals, harderAuthored };
 }));
 const total = rows.reduce((sum, r) => sum + r.core + r.harderAuthored, 0);
 console.log(`\n${competition.title} (${competition.id}): ${rows.length} skills, ${total} problems`);
 console.log("  thinnest skills: core / of which originals / harder authored");
 for (const r of [...rows].sort((a, b) => a.core + a.harderAuthored - (b.core + b.harderAuthored)).slice(0, limit))
  console.log(`  ${r.skill.padEnd(32)} ${String(r.core).padStart(4)} / ${String(r.originals).padStart(3)} / ${String(r.harderAuthored).padStart(3)}`);
 const noHarder = rows.filter(r => r.harderAuthored === 0).length;
 if (noHarder) console.log(`  ${noHarder} of ${rows.length} skills have no harder authored tasks (no recovery once core is exhausted)`);
}

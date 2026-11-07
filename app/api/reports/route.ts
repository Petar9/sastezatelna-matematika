import { NextResponse } from "next/server";
import { KidsError } from "@/src/core";
import { mode, accountContext, failure } from "@/src/server";
import { mutationAllowed } from "@/src/server/config";
import { publishedCompetitions } from "@/src/server/competitions";
import { courseProblemForTask } from "@/src/server/pilot-summary";

export async function POST(request: Request) {
 try {
  if (mode() !== "hosted") throw new KidsError("Недостъпно.", 404);
  if (!mutationAllowed(request, "hosted")) throw new KidsError("Заявката не е разрешена.", 403);
  const account = await accountContext();
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new KidsError("Напиши съобщение от 1 до 1000 знака.");
  const { description, childId, competitionId, taskKey } = body as Record<string, unknown>;
  if (typeof description !== "string" || !description.trim() || description.trim().length > 1000) throw new KidsError("Напиши съобщение от 1 до 1000 знака.");
  if ([childId, competitionId, taskKey].some(value => value !== undefined && (typeof value !== "string" || !value || value.length > 200))) throw new KidsError("Невалидна задача.");
  const child = typeof childId === "string" ? account.children.find(child => child.id === childId)
   : account.role === "child" ? account.children[0] : undefined;
  if ((childId !== undefined || account.role === "child") && !child) throw new KidsError("Този профил не е достъпен.", 403);
  if (competitionId !== undefined && !publishedCompetitions().some(competition => competition.id === competitionId)) throw new KidsError("Това състезание не е достъпно.", 404);
  let problem: string | undefined;
  if (taskKey !== undefined) {
   if (!child || typeof competitionId !== "string") throw new KidsError("Невалидна задача.");
   const { data, error } = await account.db.from("course_progress").select("course")
    .eq("parent_id", child.parentId).eq("child_id", child.id).eq("competition_id", competitionId).maybeSingle();
   if (error) throw error;
   problem = courseProblemForTask(data?.course, taskKey as string);
   if (!problem) throw new KidsError("Задачата не е намерена. Затвори и отвори формата отново.", 404);
  }
  const { error } = await account.db.from("problem_reports").insert({ parent_id: child?.parentId ?? account.actorId,
   child_id: child?.id ?? null, competition_id: competitionId ?? null, problem_id: problem ?? null,
   submitted_by: account.role, description: description.trim() });
  if (error) throw error;
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  return failure(error);
 }
}

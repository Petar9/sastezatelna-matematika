import { NextResponse } from "next/server";
import { mode, accountContext, appOrigin, childCookie } from "@/src/server";
import { invitationEmail } from "@/src/server/invitations";
import { KidsError } from "@/src/core";
export async function POST(request: Request) {
  if (mode() !== "hosted") return new Response(null, { status: 404 });
  const retry = (query: string) => NextResponse.redirect(`${appOrigin()}/profiles?${query}`, 303);
  let setup: string | undefined;
  let failedAction = "unavailable";
  const linkRetry = (query: string) => retry(`${query}${setup ? `&setup=${encodeURIComponent(setup)}` : ""}`);
  try {
    const body = await request.formData();
    const parent = await accountContext({ learningOnly: body.get("action") === "select" });
    if (body.get("action") === "rename") {
      const json = request.headers.get("accept")?.includes("application/json");
      const fail = (issue: string, message: string, status: number) => json ? Response.json({ message }, { status }) : retry(`error=${issue}`);
      const child = parent.children.find(child => child.id === body.get("childId"));
      if (!child) return fail("missing", "Този профил вече не е достъпен.", 403);
      const nickname = String(body.get("nickname") ?? "").trim();
      if (!nickname || nickname.length > 40) return fail("nickname", "Напиши прякор от 1 до 40 знака.", 400);
      failedAction = "rename-unavailable";
      const { data, error } = await parent.db.from("child_profiles").update({ nickname })
        .eq("parent_id", child.parentId).eq("id", child.id).eq("active", true).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return fail("missing", "Този профил вече не е достъпен.", 403);
      return json ? Response.json({ nickname }) : retry("status=renamed");
    }
    if (parent.role !== "parent") throw new KidsError("Тази промяна е достъпна за родителя.", 403);
    failedAction = ({ "link-email": "save-email-unavailable", "unlink-email": "remove-email-unavailable", create: "create-unavailable", select: "select-unavailable" } as Record<string, string>)[String(body.get("action"))] ?? "unavailable";
    let childId: string;
    if (body.get("action") === "link-email" || body.get("action") === "unlink-email") {
      const child = parent.children.find(child => child.id === body.get("childId"));
      if (!child?.isOwner) return retry("error=missing");
      if (body.get("setup") === "1") setup = child.id;
      if (body.get("action") === "unlink-email") {
        const { error } = await parent.db.from("child_profile_logins").delete().eq("parent_id", parent.actorId).eq("child_id", child.id);
        if (error) throw error;
        return retry("status=removed");
      }
      const email = invitationEmail(body.get("email"));
      if (!email) return linkRetry("error=email");
      const { error } = await parent.db.rpc("set_child_login", { p_parent_id: parent.actorId, p_child_id: child.id, p_email: email });
      if (error?.code === "23505") return linkRetry("error=email-used");
      if (error?.code === "22023") return linkRetry("error=email");
      if (error) throw error;
      if (!setup) return retry("status=saved");
      childId = child.id;
    } else
    if (body.get("action") === "create") {
      if (!parent.canCreateChildren) throw new KidsError("Тази промяна е достъпна за родителя.", 403);
      const nickname = String(body.get("nickname") ?? "").trim();
      if (!nickname || nickname.length > 40) return retry("error=nickname");
      const { data, error } = await parent.db.from("child_profiles").insert({ parent_id: parent.actorId, nickname }).select("id").single();
      if (error?.code === "P0001" && error.message.includes("active_child_limit")) return retry("full=1");
      if (error) throw error;
      childId = data.id;
    } else if (body.get("action") === "select") {
      const child = parent.children.find(child => child.id === body.get("childId"));
      if (!child) return retry("error=missing");
      childId = child.id;
    } else return retry("error=unavailable");
    const target = body.get("action") === "create" ? `/profiles?setup=${encodeURIComponent(childId)}` : "/";
    const response = NextResponse.redirect(`${appOrigin()}${target}`, 303);
    response.cookies.set(childCookie, childId, { httpOnly: true, secure: appOrigin().startsWith("https:"), sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    if (request.headers.get("accept")?.includes("application/json")) {
      const status = error instanceof KidsError ? error.status : 503;
      return Response.json({ message: status === 401 ? "Влез отново с Google профила си." : status === 403 ? "Този профил вече не е достъпен." : "Не успяхме да запазим името. Опитай отново." }, { status });
    }
    if (error instanceof KidsError && (error.status === 401 || error.status === 403)) {
      return NextResponse.redirect(`${appOrigin()}/login${error.status === 403 ? "?denied=1" : ""}`, 303);
    }
    return linkRetry(`error=${failedAction}`);
  }
}

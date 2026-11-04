import { NextResponse } from "next/server";
import { mode, parentContext, appOrigin, childCookie } from "@/src/server";
import { KidsError } from "@/src/core";
export async function POST(request: Request) {
  if (mode() !== "hosted") return new Response(null, { status: 404 });
  const retry = (query: string) => NextResponse.redirect(`${appOrigin()}/profiles?${query}`, 303);
  try {
    const parent = await parentContext();
    const body = await request.formData();
    let childId: string;
    if (body.get("action") === "create") {
      const nickname = String(body.get("nickname") ?? "").trim();
      if (!nickname || nickname.length > 40) return retry("error=nickname");
      const { data, error } = await parent.db.from("child_profiles").insert({ parent_id: parent.parentId, nickname }).select("id").single();
      if (error?.code === "P0001" && error.message.includes("active_child_limit")) return retry("full=1");
      if (error) throw error;
      childId = data.id;
    } else if (body.get("action") === "select") {
      const child = parent.children.find(child => child.id === body.get("childId"));
      if (!child) return retry("error=missing");
      childId = child.id;
    } else return retry("error=unavailable");
    const response = NextResponse.redirect(`${appOrigin()}/`, 303);
    response.cookies.set(childCookie, childId, { httpOnly: true, secure: appOrigin().startsWith("https:"), sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch (error) {
    if (error instanceof KidsError && (error.status === 401 || error.status === 403)) {
      return NextResponse.redirect(`${appOrigin()}/login${error.status === 403 ? "?denied=1" : ""}`, 303);
    }
    return retry("error=unavailable");
  }
}

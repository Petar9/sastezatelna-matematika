import React from "react";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { parseHTML } from "linkedom";
import { state, reset } from "./helpers/onboarding-server.ts";
import { KidsError } from "../src/core/kids.ts";
const fixture = new URL("./helpers/onboarding-server.ts", import.meta.url).href;
const server = new URL("../src/server/index.ts", import.meta.url).href;
const supabase = new URL("../src/server/supabase.ts", import.meta.url).href;
registerHooks({ resolve(specifier,context,nextResolve){if(specifier==="next/headers")return {url:fixture,shortCircuit:true};return nextResolve(specifier,context);}, load(url, context, nextLoad) {
  if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
  if (url === server) return { format: "module", source: `export { mode,appOrigin,parentContext,accountContext,childCookie } from ${JSON.stringify(fixture)};`, shortCircuit: true };
  if (url === supabase) return { format: "module", source: `export { authClient } from ${JSON.stringify(fixture)};`, shortCircuit: true };
  return nextLoad(url, context);
} });
Object.assign(globalThis, { React });
const { LoginWelcome, ChildProfiles } = await import("../components/onboarding.tsx");
const { POST: login } = await import("../app/auth/login/route.ts");
const { GET: callback } = await import("../app/auth/callback/route.ts");
const { POST: profile } = await import("../app/api/profiles/route.ts");
const { default: LoginPage } = await import("../app/login/page.tsx");
const { default: ProfilesPage } = await import("../app/profiles/page.tsx");
const documentFor = (node: React.ReactNode) => parseHTML(`<html><body>${renderToStaticMarkup(<AppRouterContext.Provider value={{ refresh() {} } as never}>{node}</AppRouterContext.Provider>)}</body></html>`).document;
const location = (response: Response) => { assert.equal(response.status, 303); return response.headers.get("location"); };
const request = (body: Record<string, string>) => new Request("https://maths.example/api/profiles", { method: "POST", body: new URLSearchParams(body) });

test("first visit has one nickname field and a direct adventure action; existing profiles keep setup secondary", async () => {
  reset();
  let doc = documentFor(await ProfilesPage({ searchParams: Promise.resolve({}) }));
  assert.equal(doc.querySelector("h1")?.textContent, "Име на детето:");
  assert.equal(doc.querySelector('label[for="nickname"]')?.textContent, "Име на детето");
  assert.equal(doc.querySelectorAll('input:not([type="hidden"])').length, 1);
  assert.equal(doc.querySelector('input[name="nickname"]')?.getAttribute("maxLength"), "40");
  assert.equal(doc.querySelector('form[action="/api/profiles"] button')?.textContent, "Към приключението →");
  assert.equal(doc.querySelector("details"), null);
  state.children = [{ id: "child-a", nickname: "Лисиче" }, { id: "child-b", nickname: "Моряк" }];
  doc = documentFor(await ProfilesPage({ searchParams: Promise.resolve({}) }));
  assert.equal(doc.querySelectorAll('input[name="action"][value="select"]').length, 2);
  assert.equal(doc.querySelector("details")?.hasAttribute("open"), false);
  assert.equal(doc.querySelector('input[name="childId"]')?.getAttribute("value"), "child-a");
});

test("login shows specific recoverable states without displaying provider error text", async () => {
  reset();
  for (const [params, text, role] of [
    [{ denied: "1" }, "още няма достъп", "alert"],
    [{ error: "cancelled" }, "Входът е прекъснат", "status"],
    [{ error: "secret-provider-detail" }, "Опитай отново след малко", "alert"],
  ] as const) {
    const doc = documentFor(await LoginPage({ searchParams: Promise.resolve(params) }));
    assert.ok(doc.querySelector(`[role="${role}"]`)?.textContent?.includes(text));
    assert.ok(!doc.body.textContent.includes("secret-provider-detail"));
    assert.equal(doc.querySelectorAll('form[action="/auth/login"] button').length, 1);
  }
});

test("OAuth start retains Google callback and redirects failures to retry", async () => {
  reset();
  assert.equal(location(await login()), "https://accounts.google.com/test");
  assert.deepEqual(state.oauthOptions, { provider: "google", options: { redirectTo: "https://maths.example/auth/callback" } });
  state.authError = true;
  assert.equal(location(await login()), "https://maths.example/login?error=unavailable");
  state.throws = true;
  assert.equal(location(await login()), "https://maths.example/login?error=unavailable");
});

test("OAuth callback separates cancellation, session failure, authorization denial and success", async () => {
  reset();
  const call = (query: string) => callback(new Request(`https://maths.example/auth/callback?${query}`));
  assert.equal(location(await call("error=access_denied")), "https://maths.example/login?error=cancelled");
  assert.equal(location(await call("")), "https://maths.example/login?error=unavailable");
  state.exchangeError = true;
  assert.equal(location(await call("code=test")), "https://maths.example/login?error=unavailable");
  state.exchangeError = false;
  state.parentError = new KidsError("Not approved", 403);
  assert.equal(location(await call("code=test")), "https://maths.example/login?denied=1");
  assert.equal(state.signedOut, true);
  state.parentError = new Error("Database offline");
  assert.equal(location(await call("code=test")), "https://maths.example/login?error=unavailable");
  state.parentError = undefined;
  assert.equal(location(await call("code=test")), "https://maths.example/");
});

test("profile creation saves trimmed nickname and selection cookie; invalid input and capacity stay recoverable", async () => {
  reset();
  const response = await profile(request({ action: "create", nickname: "  Лисиче  " }));
  assert.equal(location(response), "https://maths.example/profiles?setup=created-child");
  assert.deepEqual(state.contextOptions, [{ learningOnly: false }]);
  assert.deepEqual(state.inserted, { parent_id: "parent-a", nickname: "Лисиче" });
  const cookie = response.headers.get("set-cookie")!;
  for (const value of ["maths_child=created-child", "HttpOnly", "Secure", "SameSite=lax"]) assert.ok(cookie.includes(value));
  state.inserted = undefined;
  assert.equal(location(await profile(request({ action: "create", nickname: "   " }))), "https://maths.example/profiles?error=nickname");
  assert.equal(state.inserted, undefined);
  state.databaseError = { code: "P0001", message: "active_child_limit" };
  assert.equal(location(await profile(request({ action: "create", nickname: "Лисиче" }))), "https://maths.example/profiles?full=1");
  const doc = documentFor(<ChildProfiles children={[]} issue="full" />);
  assert.equal(doc.querySelector('form[action="/api/profiles"] button')?.hasAttribute("disabled"), true);
});

test("profile switching accepts owned IDs only and expired parent login cannot select a child", async () => {
  reset();
  state.children = [{ id: "child-a", nickname: "Лисиче" }];
  assert.equal(location(await profile(request({ action: "select", childId: "foreign-child" }))), "https://maths.example/profiles?error=missing");
  let response = await profile(request({ action: "select", childId: "child-a" }));
  assert.equal(location(response), "https://maths.example/");
  assert.ok(response.headers.get("set-cookie")?.includes("maths_child=child-a"));
  state.parentError = new KidsError("Expired", 401);
  response = await profile(request({ action: "select", childId: "child-a" }));
  assert.equal(location(response), "https://maths.example/login");
  assert.deepEqual(state.contextOptions, [{ learningOnly: true }, { learningOnly: true }, { learningOnly: true }]);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("email link normalizes input, respects ownership and finishes setup", async () => {
  reset(); state.children = [{ id: "child-a", nickname: "Лисиче" }];
  assert.equal(location(await profile(request({ action: "link-email", childId: "foreign", email: "child@example.com" }))), "https://maths.example/profiles?error=missing");
  assert.equal(state.rpcCall, undefined);
  let response = await profile(request({ action: "link-email", childId: "child-a", email: "  CHILD@Example.COM  " }));
  assert.equal(location(response), "https://maths.example/profiles?status=saved");
  assert.deepEqual(state.rpcCall, { name: "set_child_login", args: { p_parent_id: "parent-a", p_child_id: "child-a", p_email: "child@example.com" } });
  response = await profile(request({ action: "link-email", childId: "child-a", email: "child@example.com", setup: "1" }));
  assert.equal(location(response), "https://maths.example/");
  assert.ok(response.headers.get("set-cookie")?.includes("maths_child=child-a"));
  const doc = documentFor(await ProfilesPage({ searchParams: Promise.resolve({ setup: "child-a" }) }));
  assert.equal(doc.querySelector("h1")?.textContent, "Google имейл на детето");
  assert.equal(doc.querySelector('input[name="setup"]')?.getAttribute("value"), "1");
  assert.ok([...doc.querySelectorAll("button")].some(button => button.textContent === "Не сега"));
});

test("email errors retain setup and unlink is scoped to parent and owned child", async () => {
  reset(); state.children = [{ id: "child-a", nickname: "Лисиче" }];
  assert.equal(location(await profile(request({ action: "link-email", childId: "child-a", email: "bad", setup: "1" }))), "https://maths.example/profiles?error=email&setup=child-a");
  assert.equal(state.rpcCall, undefined);
  state.databaseError = { code: "23505", message: "conflict" };
  assert.equal(location(await profile(request({ action: "link-email", childId: "child-a", email: "child@example.com", setup: "1" }))), "https://maths.example/profiles?error=email-used&setup=child-a");
  state.databaseError = null;
  assert.equal(location(await profile(request({ action: "unlink-email", childId: "foreign" }))), "https://maths.example/profiles?error=missing");
  assert.deepEqual(state.deleteFilters, []);
  assert.equal(location(await profile(request({ action: "unlink-email", childId: "child-a" }))), "https://maths.example/profiles?status=removed");
  assert.deepEqual(state.deleteFilters, [["parent_id", "parent-a"], ["child_id", "child-a"]]);
});

test("child account cannot create, select, link or unlink profiles", async () => {
  reset(); state.role = "child"; state.children = [{ id: "child-a", nickname: "Лисиче" }];
  const actions: Record<string, string>[] = [
    { action: "create", nickname: "Дете" },
    { action: "select", childId: "child-a" },
    { action: "link-email", childId: "child-a", email: "child@example.com" },
    { action: "unlink-email", childId: "child-a" },
  ];
  for (const body of actions) {
    const response = await profile(request(body));
    assert.equal(location(response), "https://maths.example/login?denied=1");
    assert.equal(response.headers.get("set-cookie"), null);
  }
  assert.equal(state.inserted, undefined);
  assert.equal(state.rpcCall, undefined);
  assert.deepEqual(state.deleteFilters, []);
});

test("local mode keeps authentication routes disabled", async () => {
  reset(); state.deployment = "local";
  assert.equal((await login()).status, 404);
  assert.equal((await callback(new Request("https://maths.example/auth/callback?code=x"))).status, 404);
  assert.equal((await profile(request({ action: "create", nickname: "Test" }))).status, 404);
});

// Optional static rendering for browser layout checks; never adds a route or an auth bypass to the app.
if (process.env.MATHS_UI_PROOF_DIR) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = process.env.MATHS_UI_PROOF_DIR;
  await fs.mkdir(dir, { recursive: true });
  const css = await fs.readFile(new URL("../components/onboarding.module.css", import.meta.url), "utf8");
  const shared = await fs.readFile(new URL("../components/ui/ui.module.css", import.meta.url), "utf8");
  const theme = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  for (const [name, node] of Object.entries({ login: <LoginWelcome />, nickname: <ChildProfiles children={[]} />,
    profiles: <ChildProfiles children={[{ id: "test-one", nickname: "Звездоброец" }, { id: "test-two", nickname: "Мореплавател" }]} />,
    denied: <LoginWelcome issue="denied" />, full: <ChildProfiles children={[]} issue="full" /> })) {
    const html = `<!doctype html><html lang="bg"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Onboarding layout check</title><style>*{box-sizing:border-box}body{--font-sans3:Arial,sans-serif;margin:0;font-family:Arial,sans-serif}a{color:inherit}${theme}${shared}${css}</style>${renderToStaticMarkup(<AppRouterContext.Provider value={{ refresh() {} } as never}>{node}</AppRouterContext.Provider>)}</html>`;
    await fs.writeFile(path.join(dir, `${name}.html`), html);
  }
}


test("profile failures name the action that failed and leave the relevant form available", async () => {
 const actions = [
  [{ action: "create", nickname: "Дете" }, "create-unavailable", "създадем профила"],
  [{ action: "link-email", childId: "child-a", email: "child@example.com" }, "save-email-unavailable", "запазим имейла"],
  [{ action: "unlink-email", childId: "child-a" }, "remove-email-unavailable", "премахнем имейла"],
 ] as const;
 for (const [body, issue, text] of actions) {
  reset(); state.children = [{ id: "child-a", nickname: "Лисиче" }]; state.databaseError = { code: "503", message: "Database offline" };
  assert.equal(location(await profile(request(body))), `https://maths.example/profiles?error=${issue}`);
  const doc = documentFor(await ProfilesPage({ searchParams: Promise.resolve({ error: issue }) }));
  assert.ok(doc.querySelector('[role="alert"]')?.textContent?.includes(text));
  assert.ok(doc.querySelector("details[open]"));
 }
});


test("parents and children rename only their authorized nickname, without changing selection or login", async () => {
  for (const role of ["parent", "child"] as const) {
    reset(); state.role = role; state.children = [{ id: "child-a", nickname: "Лисиче" }];
    const response = await profile(new Request("https://maths.example/api/profiles", { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams({ action: "rename", childId: "child-a", nickname: "  Мореплавател  " }) }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { nickname: "Мореплавател" });
    assert.deepEqual(state.updated, { nickname: "Мореплавател" });
    assert.deepEqual(state.updateFilters, [["parent_id", "parent-a"], ["id", "child-a"], ["active", true]]);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(state.rpcCall, undefined);
    assert.equal(state.inserted, undefined);
  }
});

test("rename rejects foreign profiles, empty/long nicknames, stale ownership and database failures", async () => {
  const rename = (childId: string, nickname: string) => profile(new Request("https://maths.example/api/profiles", { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams({ action: "rename", childId, nickname }) }));
  reset(); state.role = "child"; state.children = [{ id: "child-a", nickname: "Лисиче" }];
  assert.equal((await rename("sibling", "Друг" )).status, 403);
  assert.equal(state.updated, undefined);
  for (const nickname of ["   ", "я".repeat(41)]) assert.equal((await rename("child-a", nickname)).status, 400);
  assert.equal(state.updated, undefined);
  state.updateMissing = true;
  assert.equal((await rename("child-a", "Друг")).status, 403);
  state.updateMissing = false; state.databaseError = { code: "503", message: "secret database detail" };
  let response = await rename("child-a", "Друг");
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("secret"));
  state.parentError = new KidsError("secret auth", 401);
  response = await rename("child-a", "Друг");
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("child settings expose only nickname and progress; native rename has a recoverable redirect", async () => {
  reset(); state.role = "child"; state.children = [{ id: "child-a", nickname: "Лисиче" }];
  const doc = documentFor(await ProfilesPage({ searchParams: Promise.resolve({}) }));
  assert.ok(doc.querySelector('input[name="action"][value="rename"]'));
  assert.equal(doc.querySelector('input[name="nickname"]')?.getAttribute("value"), "Лисиче");
  for (const action of ["create", "select", "link-email", "unlink-email"]) assert.equal(doc.querySelector(`input[name="action"][value="${action}"]`), null);
  assert.ok(doc.querySelector('a[href="/progress"]'));
  assert.equal(location(await profile(request({ action: "rename", childId: "child-a", nickname: "Ема" }))), "https://maths.example/profiles?status=renamed");
  state.databaseError = { code: "503", message: "Offline" };
  assert.equal(location(await profile(request({ action: "rename", childId: "child-a", nickname: "Ема" }))), "https://maths.example/profiles?error=rename-unavailable");
});


test("shared adult can select and rename but cannot manage logins or create children",async()=>{
 reset();state.canCreateChildren=false;state.children=[{id:"shared",nickname:"Ема",parentId:"owner-b",isOwner:false}];
 let doc=documentFor(await ProfilesPage({searchParams:Promise.resolve({})}));
 assert.ok(doc.querySelector('input[value="select"]'));
 assert.ok(doc.querySelector('input[value="rename"]'));
 for(const action of ["create","link-email","unlink-email"])assert.equal(doc.querySelector(`input[name="action"][value="${action}"]`),null);
 assert.ok(!doc.body.textContent.includes("Сподели достъп"));
 assert.equal(location(await profile(request({action:"select",childId:"shared"}))),"https://maths.example/");
 assert.equal(location(await profile(request({action:"rename",childId:"shared",nickname:"Ива"}))),"https://maths.example/profiles?status=renamed");
 assert.deepEqual(state.updateFilters,[["parent_id","owner-b"],["id","shared"],["active",true]]);
 for(const action of ["link-email","unlink-email"])await profile(request({action,childId:"shared",email:"adult@example.com"}));
 await profile(request({action:"create",nickname:"Ива"}));
 assert.equal(state.rpcCall,undefined);assert.equal(state.inserted,undefined);assert.deepEqual(state.deleteFilters,[]);
});

test("invitation OAuth retains the pending link and bypasses ordinary allowlist resolution until explicit acceptance",async()=>{
 reset();state.pendingToken="a".repeat(43);
 const req=new Request("https://maths.example/auth/login",{method:"POST",body:new URLSearchParams({invitation:"1"})});
 assert.equal(location(await login(req)),"https://accounts.google.com/test");
 assert.deepEqual(state.oauthOptions,{provider:"google",options:{redirectTo:"https://maths.example/auth/callback",queryParams:{prompt:"select_account"}}});
 state.parentError=new KidsError("Not approved",403);
 assert.equal(location(await callback(new Request("https://maths.example/auth/callback?code=x"))),"https://maths.example/invite");
 assert.deepEqual(state.contextOptions,[]);assert.equal(state.rpcCall,undefined);
});

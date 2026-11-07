import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, test } from "node:test";
import { state, reset, verifiedChild, db } from "./helpers/child-login-context.ts";
import { DEFAULT_COMPETITION_ID } from "../src/core/competitions.ts";

const fixture = new URL("./helpers/child-login-context.ts", import.meta.url).href;
const supabase = new URL("../src/server/supabase.ts", import.meta.url).href;
const config = new URL("../src/server/config.ts", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/headers") return { url: fixture, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === supabase) return { format: "module", source: `export { authClient,database } from ${JSON.stringify(fixture)};`, shortCircuit: true };
    if (url === config) return { format: "module", source: `export { mode,isLoopbackHost } from ${JSON.stringify(fixture)};`, shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { accountContext, parentContext, learnerContext } = await import("../src/server/context.ts");
beforeEach(reset);

test("account context requires a verified Google user before accessing private data", async () => {
  state.user = null;
  await assert.rejects(accountContext(), { status: 401 });
  state.user = { ...verifiedChild };
  state.authError = new Error("Session expired");
  await assert.rejects(accountContext(), { status: 401 });
  state.authError = null;
  for (const user of [
    { ...verifiedChild, email: undefined },
    { ...verifiedChild, email_confirmed_at: undefined },
    { ...verifiedChild, app_metadata: { provider: "email" } },
    { ...verifiedChild, app_metadata: {} },
  ]) {
    state.user = user;
    await assert.rejects(accountContext(), { status: 403 });
  }
  assert.equal(state.databaseCalls, 0);
  assert.deepEqual(state.rpcCalls, []);
});

test("child account binds verified email and auth ID and exposes only its mapped child", async () => {
  const account = await accountContext();
  assert.equal(state.getUserCalls, 1);
  assert.equal(account.role, "child");
  assert.equal(account.actorId, "verified-google-user");
  assert.deepEqual(account.children, [{ id: "mapped-child", nickname: "Моряк", parentId:"owning-parent", isOwner:false }]);
  assert.equal(account.db, db);
  assert.deepEqual(state.rpcCalls, [{name:"shared_children",args:{p_auth_user_id:"verified-google-user"}}, { name: "resolve_child_login", args: {
    p_email: "child@example.com", p_auth_user_id: "verified-google-user",
  } }]);
  assert.deepEqual(state.upserts, []);
  assert.deepEqual(state.queries, [{ table: "allowed_parent_emails", filters: [["email", "child@example.com"]] }]);
});

test("parent context rejects a valid child account", async () => {
  await assert.rejects(parentContext(), { status: 403 });
  assert.deepEqual(state.upserts, []);
});

test("child learning rejects sibling and foreign request IDs and scopes its own store", async () => {
  state.selectedCookie = "mapped-child";
  for (const childId of ["sibling-child", "foreign-family-child", undefined]) {
    await assert.rejects(learnerContext({ api: true, childId }), { status: 428 });
  }
  assert.ok(state.queries.every(query => query.table !== "course_progress"));
  const context = await learnerContext({ api: true, childId: "mapped-child" });
  assert.equal(context.childId, "mapped-child");
  assert.equal(context.childNickname, "Моряк");
  assert.equal(await context.courseStore.read(), null);
  assert.deepEqual(state.queries.at(-1), { table: "course_progress", filters: [
    ["parent_id", "owning-parent"], ["child_id", "mapped-child"], ["competition_id", DEFAULT_COMPETITION_ID],
  ] });
});

test("missing or stale selection cookies resolve only to the child's mapped profile", async () => {
  for (const selected of [undefined, "sibling-child", "foreign-family-child", "mapped-child"]) {
    state.selectedCookie = selected;
    const context = await learnerContext({ api: false });
    assert.equal(context.childId, "mapped-child");
    assert.equal(context.childNickname, "Моряк");
  }
});

test("allowlisted parent retains active owned children and private login metadata", async () => {
  state.user = { ...verifiedChild, id: "verified-parent", email: "PARENT@Example.COM" };
  state.tables.allowed_parent_emails = [{ email: "parent@example.com" }];
  state.tables.child_profiles = [
    { id: "first", nickname: "Лисиче", parent_id: "verified-parent", active: true },
    { id: "second", nickname: "Моряк", parent_id: "verified-parent", active: true },
    { id: "inactive", nickname: "Скрит", parent_id: "verified-parent", active: false },
    { id: "foreign", nickname: "Чужд", parent_id: "other-parent", active: true },
  ];
  state.tables.child_profile_logins = [
    { child_id: "first", parent_id: "verified-parent", email: "first@example.com", auth_user_id: "first-google" },
    { child_id: "second", parent_id: "verified-parent", email: "second@example.com", auth_user_id: null },
    { child_id: "foreign", parent_id: "other-parent", email: "private@example.com", auth_user_id: "foreign-google" },
  ];
  const account = await parentContext();
  assert.equal(account.role, "parent");
  assert.equal(account.actorId, "verified-parent");
  assert.deepEqual(account.children, [
    { id: "first", nickname: "Лисиче", parentId:"verified-parent", isOwner:true, loginEmail: "first@example.com", loginConnected: true },
    { id: "second", nickname: "Моряк", parentId:"verified-parent", isOwner:true, loginEmail: "second@example.com", loginConnected: false },
  ]);
  assert.deepEqual(state.upserts, [{ table: "parents", value: { id: "verified-parent", email: "parent@example.com" }, options: { onConflict: "id" } }]);
  assert.deepEqual(state.rpcCalls, [{name:"shared_children",args:{p_auth_user_id:"verified-parent"}}]);
  assert.deepEqual(state.queries.filter(query => query.table !== "allowed_parent_emails"), [
    { table: "child_profiles", filters: [["parent_id", "verified-parent"], ["active", true]] },
    { table: "child_profile_logins", filters: [["parent_id", "verified-parent"]] },
  ]);
});

test("unmapped, unlinked or revoked child resolution fails closed on every request", async () => {
  assert.equal((await learnerContext({ api: true, childId: "mapped-child" })).childId, "mapped-child");
  state.links = [];
  await assert.rejects(accountContext(), { status: 403 });
  await assert.rejects(learnerContext({ api: true, childId: "mapped-child" }), { status: 403 });
  assert.equal(state.getUserCalls, 3);
  assert.equal(state.rpcCalls.length, 6);
});

test("allowlist and resolver backend errors propagate without granting access", async () => {
  const allowlistError = new Error("Allowlist database unavailable");
  state.errors.allowed_parent_emails = allowlistError;
  await assert.rejects(accountContext(), error => error === allowlistError);
  assert.equal(state.rpcCalls[0]?.name,"shared_children");
  state.errors = {};
  const resolverError = new Error("Resolver database unavailable");
  state.resolverError = resolverError;
  await assert.rejects(accountContext(), error => error === resolverError);
  assert.deepEqual(state.upserts, []);
});

test("learner requests recheck ownership without parent writes or login-management reads",async()=>{
 state.user={...verifiedChild,id:"parent",email:"parent@example.com"};
 state.tables.allowed_parent_emails=[{email:"parent@example.com"}];
 state.tables.child_profiles=[{id:"own",nickname:"Моряк",parent_id:"parent",active:true}];
 const context=await learnerContext({api:true,childId:"own"});
 assert.equal(context.childId,"own");
 assert.deepEqual(state.upserts,[]);
 assert.deepEqual(state.queries.map(query=>query.table),["allowed_parent_emails","child_profiles"]);
 state.tables.child_profiles=[];
 await assert.rejects(learnerContext({api:true,childId:"own"}),{status:428});
});


test("shared adults see only granted children across owners and use the original progress store",async()=>{
 state.shared=[{parent_id:"owner-a",child_id:"shared-a",nickname:"Ема"},{parent_id:"owner-b",child_id:"shared-b",nickname:"Ива"}];
 const account=await parentContext();
 assert.equal(account.canCreateChildren,false);
 assert.deepEqual(account.children.map(c=>[c.id,c.parentId,c.isOwner]),[["shared-a","owner-a",false],["shared-b","owner-b",false]]);
 assert.deepEqual(state.upserts,[]);
 const learner=await learnerContext({api:true,childId:"shared-b"});
 await learner.courseStore.read();
 assert.deepEqual(state.queries.at(-1)?.filters,[["parent_id","owner-b"],["child_id","shared-b"],["competition_id",DEFAULT_COMPETITION_ID]]);
 await assert.rejects(learnerContext({api:true,childId:"sibling"}),{status:428});
 state.shared=[];state.links=[];
 await assert.rejects(learnerContext({api:true,childId:"shared-b"}),{status:403});
});

test("shared lookup failure denies access even to otherwise valid users",async()=>{
 state.sharedError=new Error("Unavailable");
 await assert.rejects(accountContext(),error=>error===state.sharedError);
});

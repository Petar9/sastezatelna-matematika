import React from "react";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { parseHTML } from "linkedom";
registerHooks({ load(url, context, nextLoad) {
  if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
  return nextLoad(url, context);
} });
Object.assign(globalThis, { React });
const { ChildProfiles, LoginWelcome } = await import("../components/onboarding.tsx");
const documentFor = (node: React.ReactNode) => parseHTML(`<html><body>${renderToStaticMarkup(<AppRouterContext.Provider value={{ refresh() {} } as never}>{node}</AppRouterContext.Provider>)}</body></html>`).document;
const children = [{ id: "one", nickname: "Лисиче", loginEmail: "child@example.com", loginConnected: true }];

test("old setup URLs show normal profiles and one neutral email control", () => {
  const doc = documentFor(<ChildProfiles children={children} setup="one" />);
  assert.equal(doc.querySelector("h1")?.textContent, "Кой ще открива днес?");
  assert.equal(doc.querySelectorAll('input[name="email"]').length, 1);
  assert.equal(doc.querySelector('label[for="access-email-one"]')?.textContent, "Google имейл");
  assert.ok(doc.querySelector('input[name="action"][value="select"]'));
  assert.equal(doc.querySelector('input[name="action"][value="link-email"]'), null);
  assert.equal(doc.body.textContent.includes("Google имейл на детето"), false);
});

test("owner can select and rename; shared users see no access or creation controls", () => {
  const doc = documentFor(<ChildProfiles children={children} status="renamed" />);
  assert.equal(doc.querySelector('[role="status"]')?.textContent, "Името е запазено.");
  assert.equal(doc.querySelectorAll('input[name="email"]').length, 1);
  const shared = documentFor(<ChildProfiles children={[{id:"one",nickname:"Лисиче",isOwner:false}]} canCreateChildren={false} />);
  assert.equal(shared.querySelector('input[name="email"]'), null);
  assert.equal(shared.querySelector('input[name="action"][value="create"]'), null);
  assert.ok(shared.querySelector('input[name="action"][value="select"]'));
  assert.ok(shared.querySelector('input[name="action"][value="rename"]'));
  const login = documentFor(<LoginWelcome />);
  assert.equal(login.querySelectorAll('form[action="/auth/login"]').length, 1);
  assert.ok(login.body.textContent.includes("Влез с Google профила си."));
});

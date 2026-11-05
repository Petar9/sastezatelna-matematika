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

test("setup offers an independent skip form and only renders an owned child", () => {
  const doc = documentFor(<ChildProfiles children={children} setup="one" issue="email-used" />);
  assert.equal(doc.querySelector("h1")?.textContent, "Google имейл на детето");
  const email = doc.querySelector('input[name="email"]')!;
  assert.equal(email.getAttribute("aria-invalid"), "true");
  assert.equal(email.closest("form")?.querySelector('input[name="setup"]')?.getAttribute("value"), "1");
  const skip = [...doc.querySelectorAll("form")].find(form => form.querySelector('input[name="action"][value="select"]'))!;
  assert.equal(skip.querySelector('input[name="email"]'), null);
  assert.equal(skip.querySelector("button")?.textContent, "Не сега");
  assert.equal(documentFor(<ChildProfiles children={children} setup="foreign" />).querySelector("h1")?.textContent, "Кой ще открива днес?");
});

test("parent can select, edit and unlink a child login; success is announced", () => {
  const doc = documentFor(<ChildProfiles children={children} status="saved" />);
  assert.equal(doc.querySelector('[role="status"]')?.textContent, "Имейлът е запазен.");
  assert.equal(doc.querySelector('input[name="email"]')?.getAttribute("value"), "child@example.com");
  for (const action of ["select", "link-email", "unlink-email"]) assert.ok(doc.querySelector(`input[name="action"][value="${action}"]`));
  const login = documentFor(<LoginWelcome />);
  assert.equal(login.querySelectorAll('form[action="/auth/login"]').length, 1);
  assert.match(login.body.textContent, /родител.*профил на дете/s);
});

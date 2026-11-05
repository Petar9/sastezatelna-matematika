import React, { act } from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { parseHTML } from "linkedom";
registerHooks({ load(url, context, nextLoad) {
  if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
  return nextLoad(url, context);
} });
const dom = parseHTML("<html><body></body></html>");
Object.assign(globalThis, { React, window: dom.window, self: dom.window, document: dom.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const { SkipChildEmailForm } = await import("../components/skip-child-email-form.tsx");

test("skip keeps native POST, announces pending, prevents duplicates and recovers after back navigation", async () => {
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<SkipChildEmailForm childId="preview-child" />));
    const form = host.querySelector("form")!, button = host.querySelector("button")!;
    const submit = () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    assert.equal(form.getAttribute("action"), "/api/profiles");
    assert.equal(form.getAttribute("method"), "post");
    assert.equal(host.querySelector('input[name="action"]')?.getAttribute("value"), "select");
    assert.equal(host.querySelector('input[name="childId"]')?.getAttribute("value"), "preview-child");
    await act(async () => { assert.equal(submit(), true); assert.equal(submit(), false); });
    assert.equal(button.disabled, true);
    assert.equal(button.getAttribute("aria-busy"), "true");
    assert.equal(button.textContent, "Зареждане…");
    await act(async () => window.dispatchEvent(new dom.window.Event("pageshow")));
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Не сега");
    const prevented = new dom.window.Event("submit", { bubbles: true, cancelable: true });
    prevented.preventDefault();
    await act(async () => form.dispatchEvent(prevented));
    assert.equal(button.disabled, false);
  } finally { await act(async () => root.unmount()); host.remove(); }
});

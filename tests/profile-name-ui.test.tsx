import React, { act } from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { parseHTML } from "linkedom";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
registerHooks({ load(url, context, nextLoad) {
  if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
  return nextLoad(url, context);
} });
const dom = parseHTML("<html><body></body></html>");
Object.assign(globalThis, { React, window: dom.window, self: dom.window, document: dom.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
document.oninput = null;
const { createRoot } = await import("react-dom/client");
const { ProfileNameForm } = await import("../components/profile-name-form.tsx");

test("nickname save keeps failed input, disables during request and refreshes only after success", async () => {
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host), originalFetch = globalThis.fetch, NativeFormData = globalThis.FormData;
  let refreshes = 0, calls = 0;
  let resolve!: (response: Response) => void;
  globalThis.FormData = class extends NativeFormData {
    constructor(form?: HTMLFormElement) { super(); if (form) for (const field of form.querySelectorAll<HTMLInputElement>("input[name]")) this.append(field.name, field.value); }
  };
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(new Headers(init?.headers).get("accept"), "application/json");
    assert.equal((init?.body as FormData).get("childId"), "child-a");
    assert.equal((init?.body as FormData).get("nickname"), "  Нов прякор  ");
    return new Promise<Response>(done => { resolve = done; });
  };
  try {
    await act(async () => root.render(<AppRouterContext.Provider value={{ refresh() { refreshes++; } } as never}><ProfileNameForm child={{ id: "child-a", nickname: "Лисиче" }}/></AppRouterContext.Provider>));
    const input = host.querySelector<HTMLInputElement>("input[name=nickname]")!;
    await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, "  Нов прякор  "); input.dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    const submit = () => host.querySelector("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    await act(async () => { submit(); submit(); });
    assert.equal(calls, 1);
    assert.equal(host.querySelector("button")!.disabled, true);
    assert.equal(host.querySelector("button")!.getAttribute("aria-busy"), "true");
    await act(async () => { resolve(Response.json({ message: "Не успяхме да запазим името. Опитай отново." }, { status: 503 })); });
    assert.equal(input.value, "  Нов прякор  ");
    assert.ok(host.querySelector('[role="alert"]'));
    assert.equal(refreshes, 0);
    assert.equal(host.querySelector("button")!.disabled, false);
    await act(async () => { submit(); });
    await act(async () => { resolve(Response.json({ nickname: "Нов прякор" })); });
    assert.equal(input.value, "Нов прякор");
    assert.equal(host.querySelector('[role="status"]')?.textContent, "Името е запазено.");
    assert.equal(refreshes, 1); assert.equal(calls, 2);
  } finally { await act(async () => root.unmount()); host.remove(); globalThis.fetch = originalFetch; globalThis.FormData = NativeFormData; }
});

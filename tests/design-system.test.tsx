import React from "react";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
registerHooks({ load(url, context, nextLoad) {
 if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, {get:(_,key)=>String(key)});", shortCircuit: true };
 return nextLoad(url, context);
} });
Object.assign(globalThis, { React });
const { Button, ButtonLink } = await import("../components/ui/button.tsx");
const { Input, Textarea } = await import("../components/ui/field.tsx");
const { Message } = await import("../components/ui/message.tsx");
const { Dialog } = await import("../components/ui/dialog.tsx");
const doc = (node: React.ReactNode) => parseHTML(`<html><body>${renderToStaticMarkup(node)}</body></html>`).document;

test("generic actions cannot accidentally submit forms and busy actions cannot be sent again", () => {
 const d = doc(<form><Button>Подсказка</Button><Button type="submit">Запази</Button><Button type="submit" loading>Изпращаме…</Button></form>);
 const [action, submit, busy] = d.querySelectorAll("button");
 assert.equal(action?.getAttribute("type"), "button");
 assert.equal(submit?.getAttribute("type"), "submit");
 assert.ok(busy?.hasAttribute("disabled"));
 assert.equal(busy?.getAttribute("aria-busy"), "true");
 assert.equal(busy?.textContent, "Изпращаме…");
 const link = doc(<ButtonLink href="/about">За сайта</ButtonLink>).querySelector("a");
 assert.equal(link?.getAttribute("href"), "/about");
});

test("shared fields preserve native validation and error associations", () => {
 const d = doc(<><label htmlFor="email">Имейл</label><Input id="email" type="email" name="email" required aria-invalid="true" aria-describedby="error" defaultValue="draft" /><Message id="error" tone="error" inline>Въведи валиден имейл.</Message><Textarea name="message" required maxLength={1000} defaultValue="Запазен текст" /></>);
 const input = d.querySelector("input")!, area = d.querySelector("textarea")!;
 assert.equal(input.getAttribute("type"), "email");
 assert.equal(input.getAttribute("name"), "email");
 assert.ok(input.hasAttribute("required"));
 assert.equal(input.getAttribute("aria-invalid"), "true");
 assert.equal(d.getElementById(input.getAttribute("aria-describedby")!)?.getAttribute("role"), "alert");
 assert.equal(input.getAttribute("value"), "draft");
 assert.equal(area.textContent, "Запазен текст");
 assert.equal(area.getAttribute("maxLength"), "1000");
});

test("messages announce outcomes without making ordinary supporting text a live alert", () => {
 const d = doc(<><Message>Информация</Message><Message tone="success">Запазено</Message><Message tone="warning" role="status">Опитай отново</Message></>);
 assert.equal(d.querySelectorAll('[role="alert"]').length, 0);
 assert.equal(d.querySelectorAll('[role="status"]').length, 2);
});

test("shared modal keeps native dialog semantics and an accessible labelled close action", () => {
 const d = doc(<Dialog title="Обратна връзка" titleId="title"><p>Съдържание</p></Dialog>);
 const dialog = d.querySelector("dialog")!;
 assert.equal(dialog.getAttribute("aria-labelledby"), "title");
 assert.equal(d.getElementById("title")?.textContent, "Обратна връзка");
 assert.equal(dialog.querySelector('button[aria-label="Затвори"]')?.getAttribute("type"), "button");
 assert.equal(dialog.hasAttribute("open"), false);
});

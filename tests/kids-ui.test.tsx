import React, { act } from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { createRoot } from "react-dom/client";
import { parseHTML } from "linkedom";
import { applyKidsAction, kidsView, newKidsSession } from "../src/core/kids.ts";
import { bgGrade4Profile as profile } from "../src/server/kids-content.ts";
import type { KidsAction, KidsSession } from "../src/core/kids.ts";

registerHooks({ load(url, context, nextLoad) {
	if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, { get: (_, key) => String(key) });", shortCircuit: true };
	return nextLoad(url, context);
} });

const dom = parseHTML("<html><body></body></html>");
Object.assign(globalThis, { React, window: dom.window, self: dom.window, document: dom.document,
	HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const { KidsPlayer } = await import("../components/kids-player.tsx");
const now = "2026-11-01T12:00:00.000Z";
const fresh = () => newKidsSession(profile, "kids_12345678-1234-1234-1234-123456789abc", now);

function button(host: HTMLElement, label: string) {
	const item = [...host.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === label);
	assert.ok(item, `Button missing: ${label}`);
	return item;
}

test("child can request a hint and solution through persistent buttons without answer auto-selection", async () => {
	let record = fresh();
	const actions: KidsAction[] = [];
	const oldFetch = globalThis.fetch;
	globalThis.fetch = async (_input, init) => {
		const body = JSON.parse(String(init!.body)) as { revision: number; action: KidsAction };
		assert.equal(body.revision, record.revision);
		actions.push(body.action);
		record = applyKidsAction(record, profile, body.action, now);
		return Response.json({ session: kidsView(record, profile) });
	};
	const host = document.createElement("div"); document.body.append(host);
	const root = createRoot(host);
	try {
		await act(async () => root.render(<KidsPlayer initialView={kidsView(record, profile)} />));
		assert.equal(host.querySelectorAll('[aria-label="Отговори"] button').length, 4);
		assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0);
		assert.equal(button(host, "Провери отговора").disabled, true);
		assert.ok(!host.textContent!.includes(profile.problems["M1-03"]!.explanation[0]!));
		await act(async () => button(host, "Не знам").click());
		assert.ok(host.textContent!.includes(profile.problems["M1-03"]!.hint));
		assert.equal(actions.length, 1);
		assert.equal(record.rounds[0]!.tasks[0]!.outcome, undefined);
		assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0);
		assert.equal(button(host, "Не знам").disabled, false);
		assert.ok(!host.textContent!.includes(profile.problems["M1-03"]!.explanation[0]!));
		await act(async () => button(host, "Не знам").click());
		assert.ok(host.textContent!.includes(profile.problems["M1-03"]!.explanation[0]!));
		assert.equal(record.rounds[0]!.tasks[0]!.outcome, "revealed");
		assert.equal(record.rounds[0]!.tasks[0]!.choice, undefined);
		assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0);
		await act(async () => button(host, "Към втората задача").click());
		assert.ok(host.textContent!.includes("Задача 2 от 2"));
		assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0);
		assert.equal(host.querySelector("textarea")!.getAttribute("required"), null);
	} finally {
		await act(async () => root.unmount()); host.remove(); globalThis.fetch = oldFetch;
	}
});

test("a hinted answer is visibly assisted and recap cannot silently start another round", async () => {
	let record: KidsSession = applyKidsAction(fresh(), profile, { type: "dontKnow", taskKey: "1:1" }, now);
	const oldFetch = globalThis.fetch;
	globalThis.fetch = async (_input, init) => {
		const { action } = JSON.parse(String(init!.body)) as { action: KidsAction };
		record = applyKidsAction(record, profile, action, now);
		return Response.json({ session: kidsView(record, profile) });
	};
	const host = document.createElement("div"); document.body.append(host);
	const root = createRoot(host);
	try {
		await act(async () => root.render(<KidsPlayer initialView={kidsView(record, profile)} />));
		await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Отговори"] button')!.click());
		await act(async () => button(host, "Провери отговора").click());
		assert.ok(host.textContent!.includes("Верен отговор с подсказка"));
		await act(async () => button(host, "Завърши засега").click());
		assert.ok(host.textContent!.includes("За този кръг стига!"));
		assert.ok(button(host, "Още един кръг"));
		assert.equal(record.rounds.length, 1);
		assert.equal(host.querySelector('[aria-label="Отговори"]'), null);
		await act(async () => button(host, "Почивка").click());
		assert.ok(host.textContent!.includes("Време за почивка"));
		assert.equal(record.rounds.length, 1);
		await act(async () => button(host, "Продължи").click());
		assert.equal(record.rounds.length, 1);
		await act(async () => button(host, "Още един кръг").click());
		assert.equal(record.rounds.length, 2);
		assert.ok(host.textContent!.includes("Задача 1 от 2"));
	} finally {
		await act(async () => root.unmount()); host.remove(); globalThis.fetch = oldFetch;
	}
});

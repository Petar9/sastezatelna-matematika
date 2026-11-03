import assert from "node:assert/strict";
import { after, test } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { KidsView } from "../src/core/kids.ts";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "maths-http-"));

const { kidsCollectionResponse:collection, kidsSessionResponse:session } = await import("../src/server/kids.ts");
const {createKidsStore}=await import("../src/store/kids.ts");
const store=createKidsStore(path.join(directory,"kids"));
const kidsCollectionResponse=(request:Request)=>collection(request,store);
const kidsSessionResponse=(request:Request,id:string)=>session(request,id,store);
after(() => fs.rmSync(directory, { recursive: true, force: true }));
const request = (body: unknown) => new Request("http://localhost/api/kids", {
	method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

test("HTTP child profile works without model setup and releases no answer keys", async () => {
	const response = await kidsCollectionResponse(request({ learningProfile: "bg-grade4-maths" }));
	assert.equal(response.status, 201);
	assert.equal(response.headers.get("Cache-Control"), "no-store");
	const { session } = await response.json() as { session: KidsView };
	assert.equal(session.learningProfile, "bg-grade4-maths");
	assert.equal(session.task?.options.length, 4);
	assert.equal(session.task?.explanation, undefined);
	assert.equal(session.task?.hint, undefined);
	assert.equal(session.task?.outcome, undefined);
	assert.ok(!JSON.stringify(session).includes("correctIndex"));
	const first = await kidsSessionResponse(request({ revision: 0, action: { type: "dontKnow", taskKey: "1:1" } }), session.id);
	const hinted = (await first.json() as { session: KidsView }).session;
	assert.ok(hinted.task?.hint);
	assert.equal(hinted.task?.explanation, undefined);
	const duplicate = await kidsSessionResponse(request({ revision: 0, action: { type: "dontKnow", taskKey: "1:1" } }), session.id);
	assert.equal(duplicate.status, 409);
	const resumed = await kidsSessionResponse(new Request("http://localhost/api/kids"), session.id);
	assert.equal((await resumed.json() as { session: KidsView }).session.task?.outcome, undefined);
	const second = await kidsSessionResponse(request({ revision: 1, action: { type: "dontKnow", taskKey: "1:1" } }), session.id);
	const revealed = (await second.json() as { session: KidsView }).session;
	assert.equal(revealed.task?.outcome, "revealed");
	assert.equal(revealed.task?.choice, undefined);
	assert.equal(revealed.task?.explanation?.length, 3);
	assert.ok(fs.readdirSync(directory).every(name => name === "kids"), "no chat, graph, settings or credentials are written");
});

test("HTTP refuses unknown profiles, malformed commands and invalid session IDs", async () => {
	assert.equal((await kidsCollectionResponse(request({ learningProfile: "unknown" }))).status, 400);
	assert.equal((await kidsCollectionResponse(request(null))).status, 400);
	assert.equal((await kidsSessionResponse(new Request("http://localhost/api/kids"), "../../auth")).status, 404);
	assert.equal((await kidsSessionResponse(request({ revision: 0, action: { type: "makeMoreQuestions" } }), "bad")).status, 400);
});

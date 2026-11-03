import { KidsError, kidsView, parseKidsCommand } from "../core/kids.ts";
import type { KidsStore } from "../core/kids.ts";
import { bgGrade4Profile } from "./kids-content.ts";

export const kidsLearningProfile = bgGrade4Profile;

export function readKidsView(id: string, kidsStore: KidsStore) {
	let record;
	try { record = kidsStore.read(id); }
	catch (error) { if (error instanceof KidsError && error.status === 404) return null; throw error; }
	if (!record) return null;
	if (record.learningProfile !== bgGrade4Profile.id) throw new KidsError("Непознат учебен профил.", 409);
	return kidsView(record, bgGrade4Profile);
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function failure(error: unknown) {
	if (error instanceof KidsError) return json({ error: error.message }, error.status);
	console.error("Kids session request failed", error);
	return json({ error: "Не успяхме да запазим заниманието. Опитай отново." }, 500);
}

export async function kidsCollectionResponse(request: Request, kidsStore: KidsStore) {
	try {
		if (request.method === "GET") return json({ sessions: kidsStore.list() });
		const body: unknown = await request.json().catch(() => null);
		if (!body || typeof body !== "object" || (body as { learningProfile?: unknown }).learningProfile !== bgGrade4Profile.id) {
			throw new KidsError("Избери подготвения профил за 4. клас.");
		}
		return json({ session: kidsView(kidsStore.create(bgGrade4Profile), bgGrade4Profile) }, 201);
	} catch (error) { return failure(error); }
}

export async function kidsSessionResponse(request: Request, id: string, kidsStore: KidsStore) {
	try {
		if (request.method === "GET") {
			const view = readKidsView(id, kidsStore);
			if (!view) throw new KidsError("Заниманието не е намерено.", 404);
			return json({ session: view });
		}
		const { revision, action } = parseKidsCommand(await request.json().catch(() => null));
		return json({ session: kidsView(kidsStore.update(id, revision, action, bgGrade4Profile), bgGrade4Profile) });
	} catch (error) { return failure(error); }
}

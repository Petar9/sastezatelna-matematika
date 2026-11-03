import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { applyKidsAction, KidsError, kidsSummary, newKidsSession } from "../core/kids.ts";
import type { KidsAction, KidsProfile, KidsSession, KidsStore } from "../core/kids.ts";

export function createKidsStore(directory: string): KidsStore {
	function filename(id: string) {
		if (!/^kids_[a-f0-9-]{36}$/.test(id)) throw new KidsError("Заниманието не е намерено.", 404);
		return path.join(directory, `${id}.json`);
	}
	function read(id: string): KidsSession | null {
		const file = filename(id);
		let text: string;
		try { text = fs.readFileSync(file, "utf8"); }
		catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
		const record = JSON.parse(text) as KidsSession;
		if (record.version !== 1 || record.id !== id || !Array.isArray(record.rounds) || !Number.isSafeInteger(record.revision)) {
			throw new KidsError("Записът не може да бъде прочетен от тази версия.", 409);
		}
		return record;
	}
	function write(record: KidsSession) {
		fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
		const file = filename(record.id), temporary = `${file}.${randomUUID()}.tmp`;
		try {
			fs.writeFileSync(temporary, JSON.stringify(record, null, "\t"), { mode: 0o600 });
			fs.renameSync(temporary, file);
		} finally { fs.rmSync(temporary, { force: true }); }
	}
	return {
		read,
		create(profile: KidsProfile): KidsSession {
			const record = newKidsSession(profile, `kids_${randomUUID()}`, new Date().toISOString());
			write(record);
			return record;
		},
		list() {
			if (!fs.existsSync(directory)) return [];
			return fs.readdirSync(directory).filter(f => /^kids_[a-f0-9-]{36}\.json$/.test(f)).flatMap(f => {
				try { const record = read(f.slice(0, -5)); return record ? [kidsSummary(record)] : []; }
				catch { return []; }
			}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		},
		update(id: string, revision: number, action: KidsAction, profile: KidsProfile): KidsSession {
			const record = read(id);
			if (!record) throw new KidsError("Заниманието не е намерено.", 404);
			// Synchronous read/validate/write keeps overlapping requests atomic in the local server.
			if (record.revision !== revision) throw new KidsError("Заниманието е променено в друг прозорец. Показваме последния запис.", 409);
			const next = applyKidsAction(record, profile, action, new Date().toISOString());
			write(next);
			return next;
		},
	};
}

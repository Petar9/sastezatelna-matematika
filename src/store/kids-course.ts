import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { courseGoldBalance } from "../core/kids-gold.ts";
import { KidsError } from "../core/kids.ts";
import { applyCourseAction, migrateKidsCourse, newKidsCourse } from "../core/kids-course.ts";
import type { KidsCourse, KidsCourseStore } from "../core/kids-course.ts";

export function createKidsCourseStore(directory: string, walletDirectory = directory): KidsCourseStore {
	const file = path.join(directory, "course-v2.json");
	function read(content?: Parameters<KidsCourseStore["update"]>[2]): KidsCourse | null {
		let text: string;
		try { text = fs.readFileSync(file, "utf8"); }
		catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
		const course = JSON.parse(text) as KidsCourse;
		if (course.version !== 2 || (course.questVersion !== undefined && course.questVersion !== 1) || !course.topics || !Number.isSafeInteger(course.revision) || !Array.isArray(course.attempts)) throw new KidsError("Записът на курса е от несъвместима версия.", 409);
		// Reads project migration without writing; the next revision-guarded command persists it.
		return content ? migrateKidsCourse(course, content, new Date().toISOString()) : course;
	}
	return {
		read,
  goldBalance(current) {
   const directories = [walletDirectory];
   const competitions = path.join(walletDirectory, "competitions");
   if (fs.existsSync(competitions)) for (const item of fs.readdirSync(competitions, { withFileTypes: true })) {
    if (item.isDirectory() && !item.isSymbolicLink()) directories.push(path.join(competitions, item.name));
   }
   return courseGoldBalance(current) + directories.filter(dir => path.resolve(dir) !== path.resolve(directory)).reduce((sum, dir) => {
    const course = createKidsCourseStore(dir).read();
    return sum + (course ? courseGoldBalance(course) : 0);
   }, 0);
  },
		update(revision, action, content) {
			const record = read(content) ?? newKidsCourse(content, new Date().toISOString());
			if (record.revision !== revision) throw new KidsError("Напредъкът е променен в друг прозорец. Показваме последния запис.", 409);
			const next = applyCourseAction(record, content, action, new Date().toISOString());
			fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
			const temporary = `${file}.${randomUUID()}.tmp`;
			try { fs.writeFileSync(temporary, JSON.stringify(next), { mode: 0o600 }); fs.renameSync(temporary, file); }
			finally { fs.rmSync(temporary, { force: true }); }
			return next;
		},
	};
}

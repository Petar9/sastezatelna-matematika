// Regenerate the verbatim M1 conditions/choices from the reviewed transcription.
import fs from "node:fs";
const markdown = fs.readFileSync(new URL("../content/kids/competition-bg.md", import.meta.url), "utf8");
const originals = {};
for (const match of markdown.matchAll(/### М1-(\d+) [^\n]*\n\n([\s\S]*?)(?=\n### |\n## |$)/g)) {
	const [, number, body] = match;
	const paragraphs = body.trim().split("\n\n");
	const choices = paragraphs.find(p => p.startsWith("А)"));
	originals[`M1-${number}`] = { text: paragraphs[0], ...(choices ? { options: choices.replace(/\.$/, "").split(/; [БВГ]\) /).map(s => s.replace(/^А\) /, "")) } : {}) };
}
if (Object.keys(originals).length !== 20) throw new Error("Expected all 20 M1 conditions");
fs.writeFileSync(new URL("../src/server/kids-course-originals.json", import.meta.url), JSON.stringify(originals, null, "\t") + "\n");

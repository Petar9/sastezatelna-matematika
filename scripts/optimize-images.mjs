import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export async function optimizeImages(root) {
 const sourceRoot = path.join(root, "assets/images");
 const outputRoot = path.join(root, "public/assets/images");
 const manifest = {};
 const expected = new Set();
 let originalBytes = 0, optimizedBytes = 0;
 function files(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry => {
   const filename = path.join(directory, entry.name);
   if (entry.isSymbolicLink()) throw new Error(`Image sources must not be symlinks: ${filename}`);
   return entry.isDirectory() ? files(filename) : [filename];
  });
 }
 function writeChanged(filename, bytes) {
  if (fs.existsSync(filename) && fs.readFileSync(filename).equals(bytes)) return;
  fs.mkdirSync(path.dirname(filename), {recursive:true});
  fs.writeFileSync(filename, bytes);
 }
 for (const filename of files(sourceRoot).filter(file => file.endsWith(".png"))) {
  const source = fs.readFileSync(filename);
  const webp = await sharp(source).webp({lossless:true, effort:6}).toBuffer();
  const before = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const after = await sharp(webp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if (before.info.width !== after.info.width || before.info.height !== after.info.height || !before.data.equals(after.data)) {
   throw new Error(`Lossless verification failed: ${filename}`);
  }
  const useWebp = webp.length < source.length;
  const bytes = useWebp ? webp : source;
  const relative = path.relative(sourceRoot, filename).split(path.sep).join("/");
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0,16);
  const output = `${relative.slice(0,-4)}.${hash}.${useWebp ? "webp" : "png"}`;
  const destination = path.join(outputRoot, output);
  writeChanged(destination, bytes);
  expected.add(destination);
  manifest[`/${relative}`] = `/assets/images/${output}`;
  originalBytes += source.length;
  optimizedBytes += bytes.length;
 }
 if (!Object.keys(manifest).length) throw new Error("No source images found");
 // This directory belongs exclusively to the generator; remove obsolete hashed versions.
 if (fs.existsSync(outputRoot)) for (const filename of files(outputRoot)) if (!expected.has(filename)) fs.unlinkSync(filename);
 writeChanged(path.join(root,"src/generated/public-images.json"), Buffer.from(JSON.stringify(manifest,null,2)+"\n"));
 return {count:Object.keys(manifest).length, originalBytes, optimizedBytes};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const result = await optimizeImages(process.cwd());
 console.log(`Images: ${result.count}; ${result.originalBytes} -> ${result.optimizedBytes} bytes; all decoded pixels unchanged.`);
}

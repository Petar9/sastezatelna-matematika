import fs from "node:fs";
import path from "node:path";

function privatePath(root, filename) {
 const relative=path.relative(root, filename);
 if(relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative)) return false;
 const parts=relative.split(path.sep);
 return ["data","backups","materials","assets"].includes(parts[0]) || parts.some(part=>part.startsWith(".env"));
}
function walk(directory, visit) {
 if(!fs.existsSync(directory)) return;
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
  const filename=path.join(directory,entry.name);
  if(entry.isSymbolicLink()) throw new Error(`Refusing symlink in build output: ${filename}`);
  if(entry.isDirectory()) walk(filename,visit); else visit(filename);
 }
}
export function verifyDeployment(root) {
 const next=path.join(root,".next"), bundle=path.join(next,"standalone");
 if(!fs.existsSync(bundle)) throw new Error("Standalone output missing");
 walk(bundle,filename=>{if(privatePath(bundle,filename))throw new Error(`Private file in standalone output: ${filename}`);});
 let traces=0;
 walk(next,filename=>{
  if(!filename.endsWith(".nft.json")) return;
  traces++;
  const trace=JSON.parse(fs.readFileSync(filename,"utf8"));
  if(!Array.isArray(trace.files)) throw new Error(`Invalid trace: ${filename}`);
  for(const file of trace.files) {
   const resolved=path.resolve(path.dirname(filename),file);
   if(privatePath(root,resolved))throw new Error(`Private file in deployment trace: ${resolved}`);
  }
 });
 if(!traces)throw new Error("No deployment traces found");
}

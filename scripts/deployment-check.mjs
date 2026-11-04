import fs from "node:fs";
import path from "node:path";

function privatePath(root, filename) {
 const relative=path.relative(root, filename);
 if(relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative)) return false;
 const parts=relative.split(path.sep);
 return ["data","backups","materials","assets"].includes(parts[0]) || parts.some(part=>part.startsWith(".env"));
}
function walk(directory, visit, allowInternalSymlinks=false) {
 if(!fs.existsSync(directory)) return;
 const boundary=fs.realpathSync(directory), visited=new Set();
 function scan(current) {
  const realDirectory=fs.realpathSync(current);
  if(visited.has(realDirectory)) return;
  visited.add(realDirectory);
  for(const entry of fs.readdirSync(realDirectory,{withFileTypes:true})) {
   const filename=path.join(realDirectory,entry.name);
   let resolved=filename, directoryEntry=entry.isDirectory();
   if(entry.isSymbolicLink()) {
    resolved=fs.realpathSync(filename);
    const relative=path.relative(boundary,resolved);
    if(!allowInternalSymlinks || relative===".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
     throw new Error(`Refusing symlink in build output: ${filename}`);
    }
    directoryEntry=fs.statSync(resolved).isDirectory();
   }
   if(directoryEntry) scan(resolved); else visit(filename,resolved);
  }
 }
 scan(directory);
}
export function verifyDeployment(root) {
 root=fs.realpathSync(root);
 const next=path.join(root,".next"), bundle=path.join(next,"standalone");
 if(!fs.existsSync(bundle)) throw new Error("Standalone output missing");
 walk(bundle,filename=>{if(privatePath(bundle,filename))throw new Error(`Private file in standalone output: ${filename}`);});
 let traces=0;
 walk(next,(filename,resolvedFilename)=>{
  if(!filename.endsWith(".nft.json") && !resolvedFilename.endsWith(".nft.json")) return;
  traces++;
  const trace=JSON.parse(fs.readFileSync(resolvedFilename,"utf8"));
  if(!Array.isArray(trace.files)) throw new Error(`Invalid trace: ${filename}`);
  for(const file of trace.files) {
   const resolved=path.resolve(path.dirname(resolvedFilename),file);
   if(privatePath(root,resolved))throw new Error(`Private file in deployment trace: ${resolved}`);
  }
 },true);
 if(!traces)throw new Error("No deployment traces found");
}

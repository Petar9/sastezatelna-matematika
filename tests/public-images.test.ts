import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {test} from "node:test";
import sharp from "sharp";
import images from "../src/generated/public-images.json";
import {publicImage} from "../src/core/public-images.ts";
import {optimizeImages} from "../scripts/optimize-images.mjs";
import config from "../next.config.ts";
import {config as proxyConfig} from "../proxy.ts";

test("every generated image preserves all pixels and uses a content hash",async()=>{
 let originalBytes=0, optimizedBytes=0;
 for(const [source,destination] of Object.entries(images)) {
  const original=fs.readFileSync(path.join("assets/images",source));
  const optimized=fs.readFileSync(path.join("public",destination));
  const hash=createHash("sha256").update(optimized).digest("hex").slice(0,16);
  assert.ok(destination.includes(`.${hash}.`));
  assert.equal(publicImage(source),destination);
  const a=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(optimized).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(b.info,a.info);
  assert.ok(b.data.equals(a.data),source);
  originalBytes+=original.length; optimizedBytes+=optimized.length;
 }
 assert.ok(Object.keys(images).length>=63);
 assert.ok(optimizedBytes<originalBytes*0.6);
 assert.equal(publicImage("/kids/lessons/example.svg"),"/kids/lessons/example.svg");
});

test("image generation is repeatable and changed pixels get a new URL",async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"maths-images-"));
 try {
  const folder=path.join(root,"assets/images/kids/figures");fs.mkdirSync(folder,{recursive:true});
  const filename=path.join(folder,"sample.png");
  await sharp({create:{width:20,height:20,channels:4,background:"white"}}).png().toFile(filename);
  await optimizeImages(root);
  const manifest=path.join(root,"src/generated/public-images.json");
  const before=fs.readFileSync(manifest,"utf8");
  const old=JSON.parse(before)["/kids/figures/sample.png"];
  await optimizeImages(root);assert.equal(fs.readFileSync(manifest,"utf8"),before);
  await sharp({create:{width:20,height:20,channels:4,background:"blue"}}).png().toFile(filename);
  await optimizeImages(root);
  assert.notEqual(JSON.parse(fs.readFileSync(manifest,"utf8"))["/kids/figures/sample.png"],old);
  assert.equal(fs.existsSync(path.join(root,"public",old)),false);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test("only explicit public pages, images and lessons can override no-store; legacy image URLs redirect",async()=>{
 const matcher=new RegExp(`^${proxyConfig.matcher[0]}$`);
 assert.equal(matcher.test("/assets/images/test.hash.webp"),false);
 for(const url of ["/", "/profiles", "/auth/login", "/api/kids/course"]) assert.equal(matcher.test(url),true);
 const headers=(await config.headers!()) ?? [];
 assert.ok(headers[0]);
 assert.equal(headers[0].source,"/(.*)");
 assert.ok(headers[0].headers.some(h=>h.key==="Cache-Control"&&h.value==="no-store"));
 assert.deepEqual(headers.slice(1).map(h=>h.source),["/about","/materiali","/materiali/priem-sled-4-klas-smg","/materiali/priem-sled-4-klas-npmg","/materiali/priem-sled-4-klas-smg-npmg","/robots.txt","/sitemap.xml","/assets/images/:path*","/kids/lessons/:path*"]);
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.VERCEL_ENV="production";
  const productionHeaders=(await config.headers!())??[];
  for(const entry of productionHeaders.slice(1,8))assert.ok(entry.headers.some(h=>h.key==="Cache-Control"&&h.value.includes("s-maxage=3600")));
  for(const env of ["preview","development"]){process.env.VERCEL_ENV=env;for(const entry of ((await config.headers!())??[]).slice(1,8))assert.ok(entry.headers.some(h=>h.key==="Cache-Control"&&h.value==="no-store"));}
 }finally{process.env=original;}
 const redirects=(await config.redirects!()) ?? [];
 for(const [source,destination] of Object.entries(images)) assert.ok(redirects.some(r=>r.source===source&&r.destination===destination&&r.permanent===false));
 assert.ok(config.outputFileTracingExcludes!["/*"]!.includes("./assets/**/*"));
});

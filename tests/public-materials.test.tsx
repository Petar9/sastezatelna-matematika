import React from "react";
import assert from "node:assert/strict";
import {registerHooks} from "node:module";
import {test} from "node:test";
import {renderToStaticMarkup} from "react-dom/server";
import {parseHTML} from "linkedom";
registerHooks({load(url,context,nextLoad){
 if(url.endsWith(".module.css"))return {format:"module",source:"export default new Proxy({}, {get:(_,key)=>String(key)});",shortCircuit:true};
 return nextLoad(url,context);
}});
Object.assign(globalThis,{React});
const {default:Smg}=await import("../app/materiali/priem-sled-4-klas-smg/page.tsx");
const {default:Npmg}=await import("../app/materiali/priem-sled-4-klas-npmg/page.tsx");
const {default:Legacy}=await import("../app/materiali/priem-sled-4-klas-smg-npmg/page.tsx");
const {default:Materials}=await import("../app/materiali/page.tsx");
const {default:robots}=await import("../app/robots.ts");
const {default:sitemap}=await import("../app/sitemap.ts");
const doc=(node:React.ReactNode)=>parseHTML(`<html><body>${renderToStaticMarkup(node)}</body></html>`).document;

test("school guides expose distinct sourced answers, review dates and matching structured data without client interaction",()=>{
 const smg=doc(<Smg/>),npmg=doc(<Npmg/>);
 for(const d of [smg,npmg]){
  assert.equal(d.querySelectorAll("h1").length,1);
  assert.equal(d.querySelector("time")?.getAttribute("dateTime"),"2026-11-06");
  for(const link of d.querySelectorAll('a[href^="#"]'))assert.ok(d.getElementById(link.getAttribute("href")!.slice(1)));
  const schema=JSON.parse(d.querySelector('script[type="application/ld+json"]')!.textContent!);
  assert.equal(schema["@graph"][0].headline,d.querySelector("h1")!.textContent);
  assert.equal(d.querySelectorAll("input,button,form").length,0);
  assert.ok(d.querySelector('a[href="/login"]')?.className.includes("primary"));
 }
 assert.ok(smg.body.textContent!.includes("миналия прием за 2026/2027"));
 assert.ok(smg.body.textContent!.includes("се взима с тежест от 6 пъти"));
 assert.ok(smg.body.textContent!.includes("Бал = 6 × M + P + L + N + D"));
 assert.ok(smg.body.textContent!.includes("раздел А на учебния план"));
 assert.ok(smg.body.textContent!.includes("P = 0"));assert.ok(smg.body.textContent!.includes("L = 0"));
 assert.ok(smg.body.textContent!.includes("най-високият постигнат резултат"));
 assert.ok(!smg.body.textContent!.includes("Пример с условни числа"));
 assert.ok(npmg.body.textContent!.includes("правото на участие в приема за 2027/2028"));
 assert.ok(npmg.body.textContent!.includes("ще бъдат публикувани допълнително"));
 assert.equal(npmg.querySelectorAll(".formula").length,0);
 assert.ok(smg.querySelector('a[href="/materiali/priem-sled-4-klas-npmg"]'));
 assert.ok(npmg.querySelector('a[href="/materiali/priem-sled-4-klas-smg"]'));
 for(const [d,host] of [[smg,"smg.bg"],[npmg,"npmg.org"]] as const){
  const external=[...d.querySelectorAll('a[href^="https:"]')].map(a=>new URL(a.getAttribute("href")!).hostname);
  assert.deepEqual(new Set(external),new Set([host]));
 }
 const hub=doc(<Materials/>);
 assert.equal(hub.querySelectorAll("article").length,2);
 for(const school of ["smg","npmg"])assert.ok(hub.querySelector(`a[href="/materiali/priem-sled-4-klas-${school}"]`));
});
test("retired combined guide permanently redirects to the materials hub",()=>{
 assert.throws(()=>Legacy(),error=>error instanceof Error&&"digest" in error&&error.digest==="NEXT_REDIRECT;replace;/materiali;308;");
});
test("sitemap contains public canonical pages only and preview/local builds cannot advertise indexing",()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.VERCEL_ENV="production";process.env.MATHS_APP_URL="https://maths.example";
  assert.deepEqual(sitemap().map(page=>page.url),["https://maths.example/","https://maths.example/about","https://maths.example/materiali","https://maths.example/materiali/priem-sled-4-klas-smg","https://maths.example/materiali/priem-sled-4-klas-npmg"]);
  assert.equal(robots().sitemap,"https://maths.example/sitemap.xml");
  for(const env of ["preview","development"]){process.env.VERCEL_ENV=env;assert.deepEqual(sitemap(),[]);assert.deepEqual(robots(),{rules:{userAgent:"*",allow:"/",disallow:["/api/","/auth/"]}});}
  process.env.MATHS_MODE="local";delete process.env.VERCEL_ENV;assert.deepEqual(sitemap(),[]);
 }finally{process.env=original;}
});

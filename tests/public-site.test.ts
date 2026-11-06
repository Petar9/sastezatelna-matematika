import assert from "node:assert/strict";
import {test} from "node:test";
import {materialGuides,legacyAdmissionPath,articleStructuredData,hasAuthCookie,indexableDeployment,publicMetadata,publicOrigin,publicPagePaths,publicReadPath,searchVerification} from "../src/public-site.ts";

test("only explicitly public read paths bypass authentication; learner and API routes never do",()=>{
 for(const path of ["/about","/materiali",...materialGuides.map(guide=>guide.path),legacyAdmissionPath,"/robots.txt","/sitemap.xml"])assert.equal(publicReadPath(path),true,path);
 for(const path of ["/","/progress","/profiles","/parent","/login","/api/kids/course","/auth/callback","/materiali/private","/about/private"])assert.equal(publicReadPath(path),false,path);
 assert.equal(publicPagePaths.length,9);
});
test("public metadata uses configured canonical origin and only production is indexable",()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.VERCEL_ENV="production";process.env.MATHS_APP_URL="https://maths.example/";
  assert.equal(publicOrigin(),"https://maths.example");assert.equal(indexableDeployment(),true);
  assert.deepEqual(publicMetadata("Title","Description","/materiali").alternates,{canonical:"https://maths.example/materiali"});
  assert.deepEqual(publicMetadata("Title","Description","/",{index:false}).robots,{index:false,follow:true});
  for(const env of ["preview","development"]){process.env.VERCEL_ENV=env;assert.equal(indexableDeployment(),false);assert.deepEqual(publicMetadata("T","D","/about").robots,{index:false,follow:true});}
  process.env.MATHS_MODE="local";delete process.env.VERCEL_ENV;assert.equal(indexableDeployment(),false);
 }finally{process.env=original;}
});
test("Supabase auth cookies including chunks suppress indexing on the mixed home route",()=>{
 for(const name of ["sb-project-auth-token","sb-project-auth-token.0","sb-project-auth-token.12"])assert.equal(hasAuthCookie([name]),true);
 assert.equal(hasAuthCookie(["theme","sb-project-code-verifier"]),false);
});
test("article schema matches the published guide and includes no unsupported reviews or offers",()=>{
 for(const guide of materialGuides){
 const schema=articleStructuredData(guide),article=schema["@graph"][0]!;
 assert.equal(article.headline,guide.title);assert.equal(article.dateModified,guide.modifiedAt);
 assert.equal(article.mainEntityOfPage,publicOrigin()+guide.path);
 assert.ok(!("datePublished" in article),"Do not invent a first-publication date from a review date");
 assert.equal(schema["@graph"][1]?.itemListElement?.length,3);
 assert.ok(!JSON.stringify(schema).includes("aggregateRating"));assert.ok(!JSON.stringify(schema).includes("Offer"));
 }
});

test("Search Console verification is optional and limited to indexable production builds",()=>{
 const original={...process.env};try{
  process.env.MATHS_MODE="hosted";process.env.VERCEL_ENV="production";delete process.env.MATHS_GOOGLE_SITE_VERIFICATION;
  assert.equal(searchVerification(),undefined);
  process.env.MATHS_GOOGLE_SITE_VERIFICATION="  test-owner-token  ";
  assert.deepEqual(searchVerification(),{google:"test-owner-token"});
  process.env.VERCEL_ENV="preview";assert.equal(searchVerification(),undefined);
  process.env.MATHS_MODE="local";delete process.env.VERCEL_ENV;assert.equal(searchVerification(),undefined);
 }finally{process.env=original;}
});

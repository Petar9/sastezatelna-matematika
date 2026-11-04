import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import {verifyDeployment} from "../scripts/deployment-check.mjs";
import {assertHostedDataAccess} from "../src/server/config.ts";
import {authClient,database} from "../src/server/supabase.ts";

test("deployment verification rejects private standalone and traced files",()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"maths-deploy-"));
 try {
  const next=path.join(root,".next");fs.mkdirSync(path.join(next,"standalone"),{recursive:true});
  const trace=path.join(next,"server.nft.json");fs.writeFileSync(trace,JSON.stringify({files:["../src/safe.ts"]}));
  verifyDeployment(root);
  fs.writeFileSync(trace,JSON.stringify({files:["../data/kids/course.json"]}));
  assert.throws(()=>verifyDeployment(root),/Private file in deployment trace/);
  fs.writeFileSync(trace,JSON.stringify({files:["../.env.local"]}));
  assert.throws(()=>verifyDeployment(root),/Private file in deployment trace/);
  fs.writeFileSync(trace,JSON.stringify({files:["../assets/images/original.png"]}));
  assert.throws(()=>verifyDeployment(root),/Private file in deployment trace/);
  fs.writeFileSync(trace,JSON.stringify({files:["../public/assets/images/versioned.webp"]}));
  verifyDeployment(root);
  fs.writeFileSync(trace,JSON.stringify({files:[]}));
  fs.mkdirSync(path.join(next,"standalone","backups"));fs.writeFileSync(path.join(next,"standalone","backups","course.json"),"{}");
  assert.throws(()=>verifyDeployment(root),/Private file in standalone/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test("Vercel Preview denies hosted data access even if credentials are present",async()=>{
 const previous=process.env.VERCEL_ENV;
 try {process.env.VERCEL_ENV="preview";assert.throws(assertHostedDataAccess,/disabled/);assert.throws(database,/disabled/);await assert.rejects(authClient(),/disabled/);process.env.VERCEL_ENV="production";assert.doesNotThrow(assertHostedDataAccess);}
 finally {if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});

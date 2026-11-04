import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {DEFAULT_COMPETITION_ID,publishedCompetitions,availableCompetitions,competitionContent,requirePublishedCompetition,requireAvailableCompetition} from "../src/server/competitions.ts";
import {localStores} from "../src/server/stores.ts";
import {createKidsCourseStore} from "../src/store/kids-course.ts";
import {kidsCourseContent as content} from "../src/server/kids-course-content.ts";

test("catalogue exposes reviewed content only and rejects unpublished or path-like identifiers",()=>{
 assert.deepEqual(publishedCompetitions().map(c=>c.id),[DEFAULT_COMPETITION_ID]);
 assert.equal(competitionContent().topics.length,17);
 assert.equal(requirePublishedCompetition().contentVersion,competitionContent().version);
 for(const id of ["olimpiada","nvo","../kids","", "toString"]){
  assert.throws(()=>requirePublishedCompetition(id),{status:404});
  assert.throws(()=>competitionContent(id),{status:404});
 }
});
test("local legacy file remains the default and unfinished paths never create storage",()=>{
 const prior={...process.env},directory=fs.mkdtempSync(path.join(os.tmpdir(),"maths-competitions-"));
 try{
  process.env.MATHS_MODE="local";process.env.MATHS_DATA_DIR=directory;
  for(const key of ["VERCEL","NETLIFY","RENDER","FLY_APP_NAME"])delete process.env[key];
  const stores=localStores();
  assert.equal(stores.kidsCourseStore.read(content),null);
  assert.deepEqual(fs.readdirSync(directory),[]);
  stores.kidsCourseStore.update(0,{type:"selectTopic",topicId:"matches"},content);
  const file=path.join(directory,"kids","course-v2.json"),before=fs.readFileSync(file,"utf8");
  assert.throws(()=>localStores("unfinished"),{status:404});
  assert.equal(fs.readFileSync(file,"utf8"),before);
  assert.deepEqual(fs.readdirSync(path.join(directory,"kids")),["course-v2.json"]);
  const olympiad=competitionContent("olimpiada"),otherStores=localStores("olimpiada");
  assert.equal(otherStores.kidsCourseStore.read(olympiad),null);
  otherStores.kidsCourseStore.update(0,{type:"selectTopic",topicId:"oli-numbers"},olympiad);
  assert.equal(localStores("olimpiada").kidsCourseStore.read(olympiad)?.active?.topicId,"oli-numbers");
  assert.equal(fs.readFileSync(file,"utf8"),before);
  const other=createKidsCourseStore(path.join(directory,"kids","competitions","fixture"));
  other.update(0,{type:"selectTopic",topicId:"clocks"},{...content,version:"fixture"});
  assert.equal(fs.readFileSync(file,"utf8"),before);
  assert.equal(localStores().kidsCourseStore.read(content)?.active?.topicId,"matches");
 }finally{process.env=prior;fs.rmSync(directory,{recursive:true,force:true});}
});

test("local review offers Olympiad and NVO while hosted publication stays gated",()=>{
 const prior={...process.env};
 try{
  for(const key of ["VERCEL","NETLIFY","RENDER","FLY_APP_NAME"])delete process.env[key];
  process.env.MATHS_MODE="hosted";
  assert.deepEqual(availableCompetitions().map(c=>c.id),[DEFAULT_COMPETITION_ID]);
  assert.throws(()=>requireAvailableCompetition("olimpiada"),{status:404});
  assert.throws(()=>competitionContent("olimpiada"),{status:404});
  process.env.MATHS_MODE="local";
  assert.deepEqual(availableCompetitions().map(c=>c.id),[DEFAULT_COMPETITION_ID,"olimpiada","nvo"]);
  assert.equal(competitionContent("olimpiada").topics.length,4);
  assert.equal(requireAvailableCompetition("olimpiada").published,false);
  assert.deepEqual(publishedCompetitions().map(c=>c.id),[DEFAULT_COMPETITION_ID]);
  assert.throws(()=>requirePublishedCompetition("olimpiada"),{status:404});
  assert.equal(competitionContent("nvo").topics.length,10);
  assert.equal(requireAvailableCompetition("nvo").difficulty,"easy");
  assert.throws(()=>requirePublishedCompetition("nvo"),{status:404});
  for(const id of ["unfinished","../kids","","toString"])assert.throws(()=>requireAvailableCompetition(id),{status:404});
  process.env.VERCEL="1";
  assert.throws(()=>availableCompetitions(),/Local mode is forbidden/);
 }finally{process.env=prior;}
});

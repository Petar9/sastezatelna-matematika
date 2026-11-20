import assert from "node:assert/strict";
import {test} from "node:test";
import {guideStorageKey,initialGuide,loadGuide,saveGuide} from "../src/core/course-guide.ts";

test("guide starts automatically only without existing learning evidence",()=>{
 assert.deepEqual(initialGuide(false),{phase:"overview",step:0});
 assert.deepEqual(initialGuide(true),{phase:"done"});
});
test("versioned guide storage isolates child and anonymous progress",()=>{
 const values=new Map<string,string>();const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 const child=guideStorageKey("test-child-a"),other=guideStorageKey("test-child-b"),anonymous=guideStorageKey();
 assert.notEqual(child,other);assert.notEqual(child,anonymous);assert.match(child,/:v1:child:/);
 saveGuide(child,{phase:"dismissed"},storage);assert.deepEqual(loadGuide(child,storage),{phase:"dismissed"});
 assert.equal(loadGuide(other,storage),undefined);assert.equal(loadGuide(anonymous,storage),undefined);
 values.set(other,JSON.stringify({phase:"overview",step:2}));assert.deepEqual(loadGuide(other,storage),{phase:"overview",step:2});
});
test("invalid persisted steps recover safely and blocked storage retains dismissal in this session",()=>{
 for(const [index,raw] of ['null','broken','{"phase":"overview","step":9}','{"phase":"overview","step":"1"}','{"phase":"other"}'].entries()){
  assert.equal(loadGuide(`invalid-${index}`,{getItem:()=>raw,setItem(){}}),undefined);
 }
 const storage={getItem:()=>'{"phase":"overview","step":0}',setItem(){throw new Error("QuotaExceededError");}};
 saveGuide("blocked-write",{phase:"dismissed"},storage);assert.deepEqual(loadGuide("blocked-write",storage),{phase:"dismissed"});
 const blocked={getItem(){throw new Error("SecurityError");},setItem(){throw new Error("SecurityError");}};
 saveGuide("blocked-all",{phase:"hint"},blocked);assert.deepEqual(loadGuide("blocked-all",blocked),{phase:"hint"});
 assert.equal(loadGuide("blocked-new",blocked),undefined);
});

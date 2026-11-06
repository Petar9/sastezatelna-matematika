"use client";

import {useEffect,useRef,useState} from "react";
import {CompetitionPicker,KidsCoursePlayer} from "./kids-course";
import type {KidsCoursePlayerProps} from "./kids-course";
import type {KidsCourseView} from "@/src/core";
import {DEFAULT_COMPETITION_ID} from "@/src/core/competitions";
import {Button} from "./ui/button";
import {Message} from "./ui/message";
import s from "./kids.module.css";

function snapshot(view:KidsCourseView):KidsCourseView {
 const saved={...view};delete saved.goldGain;return saved;
}

const SNAPSHOT_FRESH_MS=30_000;
type CachedView={view:KidsCourseView;validatedAt:number};

// Private snapshots live only in this mounted learner's tab, never in a shared cache.
export function KidsCompetitionPlayer(props:KidsCoursePlayerProps) {
 const {competitionId:initialId=DEFAULT_COMPETITION_ID,competitionChoices:choices=[],learnerId}=props;
 const key=(id:string)=>`${learnerId??"local"}:${id}:${choices.find(choice=>choice.id===id)?.contentVersion??""}`;
 const cache=useRef(new Map<string,CachedView>([[key(initialId),{view:snapshot(props.initialView),validatedAt:Date.now()}]]));
 const [competitionId,setCompetitionId]=useState(initialId);
 const [view,setView]=useState<KidsCourseView|undefined>(props.initialView);
 const [refreshing,setRefreshing]=useState(false),[error,setError]=useState("");
 const [retry,setRetry]=useState(0);
 const forceRefresh=useRef(false);
 const first=useRef(true),generation=useRef(0),current=useRef(initialId);
 function denied(status:number){generation.current++;cache.current.clear();setView(undefined);setRefreshing(true);window.location.assign(status===428?"/profiles":status===403?"/login?denied=1":"/login");}
 const navigationGuard=useRef<(()=>Promise<boolean>)|null>(null);
 const switching=useRef(false),saving=useRef(false),mounted=useRef(true);
 const destination=useRef<{id:string;push:boolean}|undefined>(undefined);

 async function select(id:string,push=true) {
  if(!choices.some(choice=>choice.id===id)||(id===current.current&&!switching.current))return;
  destination.current={id,push};
  if(switching.current)return;
  switching.current=true;
  try {
   const saved=!navigationGuard.current||await navigationGuard.current();
   const next=destination.current;destination.current=undefined;
   if(!saved){
    if(next&&!next.push)window.history.replaceState(null,"",`/?competition=${encodeURIComponent(current.current)}`);
    return;
   }
   if(!next||next.id===current.current)return;
   current.current=next.id;generation.current++;
   const cached=cache.current.get(key(next.id));
   setError("");setRefreshing(!cached||Date.now()-cached.validatedAt>=SNAPSHOT_FRESH_MS);setView(cached?.view);setCompetitionId(next.id);
   if(next.push)window.history.pushState(null,"",`/?competition=${encodeURIComponent(next.id)}`);
  } finally {switching.current=false;}
 }
 useEffect(()=>{
  mounted.current=true;
  const back=()=>{void select(new URLSearchParams(window.location.search).get("competition")??DEFAULT_COMPETITION_ID,false);};
  const focus=()=>{
   if(saving.current||switching.current)return;
   const id=current.current;
   void (async()=>{
    const saved=!navigationGuard.current||await navigationGuard.current();
    if(saved&&!switching.current&&current.current===id){forceRefresh.current=true;setRefreshing(true);setRetry(value=>value+1);}
   })();
  };
  window.addEventListener("popstate",back);window.addEventListener("focus",focus);
  return()=>{mounted.current=false;window.removeEventListener("popstate",back);window.removeEventListener("focus",focus);};
 // The wrapper is keyed by learner; its cache and navigation guard share that lifetime.
 },[]);
 useEffect(()=>{
  if(first.current){first.current=false;return;}
  const cached=cache.current.get(key(competitionId)),forced=forceRefresh.current;forceRefresh.current=false;
  if(!forced&&cached&&Date.now()-cached.validatedAt<SNAPSHOT_FRESH_MS){setRefreshing(false);return;}
  const controller=new AbortController(),request=++generation.current;
  setRefreshing(true);setError("");
  void (async()=>{
   try {
    const response=await fetch("/api/kids/course",{cache:"no-store",signal:controller.signal,headers:{"X-Maths-Competition":competitionId,...(learnerId?{"X-Maths-Child":learnerId}:{})}});
    if(!mounted.current)return;
    if([401,403,428].includes(response.status)){
     denied(response.status);return;
    }
    if(request!==generation.current||controller.signal.aborted)return;
    const body=await response.json() as {course?:KidsCourseView};
    if(request!==generation.current||controller.signal.aborted)return;
    if(!response.ok||!body.course||!Number.isSafeInteger(body.course.revision)||!Array.isArray(body.course.topics))throw new Error("refresh");
    const cached=cache.current.get(key(competitionId));
    if(cached&&body.course.revision<cached.view.revision)throw new Error("stale");
    const fresh=remember(body.course);setView(fresh);setRefreshing(false);
   }catch{
    if(request!==generation.current||controller.signal.aborted)return;
    setError("Не успяхме да обновим. Опитай отново.");
   }
  })();
  return()=>{controller.abort();};
 // key depends only on the server-provided learner and competition catalogue.
 },[competitionId,learnerId,retry]);
 function remember(next:KidsCourseView){
  const saved=snapshot(next),cached=cache.current.get(key(competitionId));
  if(!cached||saved.revision>=cached.view.revision){
   // The wallet spans competitions; learning snapshots retain their own validation time.
   for(const entry of cache.current.values())entry.view={...entry.view,gold:saved.gold};
   cache.current.set(key(competitionId),{view:saved,validatedAt:Date.now()});
  }
  return saved;
 }
 const status=(refreshing||error)&&<div className={s.content}>{error?<Message tone="error"><p>{error}</p><Button variant="secondary" onClick={()=>{forceRefresh.current=true;setRetry(value=>value+1);}}>Опитай отново</Button></Message>:<p role="status">Обновяване…</p>}</div>;
 return <>{status}{view?<KidsCoursePlayer {...props} key={`${learnerId??"local"}:${competitionId}`} competitionId={competitionId} initialView={view} refreshedView={view} refreshing={refreshing} onViewChange={remember} onCompetitionChange={id=>void select(id)} navigationGuard={navigationGuard} onBusyChange={busy=>{saving.current=busy;}} onAccessDenied={denied}/>:<main lang="bg" className={s.shell} aria-busy={refreshing}><div className={s.content}><CompetitionPicker choices={choices} competitionId={competitionId} onSelect={id=>void select(id)}/></div></main>}</>;
}

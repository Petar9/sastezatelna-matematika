"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Button} from "./ui/button";
import {Message} from "./ui/message";
import o from "./onboarding.module.css";
type State="loading"|"login"|"wrong_account"|"invalid"|"unavailable";
export function ChildInvitation(){
 const [state,setState]=useState<State>("loading");
 const token=useRef<string|null>(null),started=useRef(false);
 async function accept(){
  setState("loading");
  try{
   const response=await fetch("/api/sharing/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(token.current?{token:token.current}:{})});
   const data=await response.json();
   if(response.ok&&data.code==="accepted"){window.location.replace("/");return;}
   setState(["login","wrong_account","invalid"].includes(data.code)?data.code:"unavailable");
  }catch{setState("unavailable");}
 }
 useEffect(()=>{
  if(started.current)return;started.current=true;
  const hash=new URLSearchParams(window.location.hash.slice(1));
  token.current=hash.get("token");
  if(window.location.hash)window.history.replaceState(null,"",window.location.pathname);
  void accept();
 },[]);
 return <>
  <h1>Споделен достъп</h1>
  {state==="loading"&&<p role="status" className={o.intro}>Отваряме профила…</p>}
  {state==="login"&&<p className={o.intro}>Влез с Google имейла, за който е поканата.</p>}
  {state==="wrong_account"&&<Message role="alert" tone="warning" className={o.notice}>Тази покана е за друг Google профил.</Message>}
  {(state==="login"||state==="wrong_account")&&<form action="/auth/login" method="post" className={o.form}>
   <input type="hidden" name="invitation" value="1"/>
   <Button type="submit">{state==="wrong_account"?"Опитай с друг профил":"Продължи с Google"}</Button>
  </form>}
  {state==="invalid"&&<p className={o.intro}>Поканата вече не е валидна. Поискай нов линк от родителя.</p>}
  {state==="unavailable"&&<><Message role="alert" tone="warning" className={o.notice}>Не успяхме да отворим профила. Опитай отново.</Message><Button onClick={()=>void accept()}>Опитай отново</Button></>}
  {state!=="loading"&&<Link href="/" className={o.home}>← Начало</Link>}
 </>;
}

"use client";
import {useRef,useState} from "react";
import {Button} from "./ui/button";
import {Input} from "./ui/field";
import {Message} from "./ui/message";
import o from "./onboarding.module.css";
type Access={invitations:{id:string;email:string;expires_at:string}[];adults:{auth_user_id:string;email:string}[]};
export function ChildSharing({childId}:{childId:string}){
 const [access,setAccess]=useState<Access|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[link,setLink]=useState(""),[copied,setCopied]=useState(false);
 const loaded=useRef(false),pending=useRef(false),linkInput=useRef<HTMLInputElement>(null);
 async function load(){
  const response=await fetch(`/api/sharing?childId=${encodeURIComponent(childId)}`,{cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message);
  setAccess(data);loaded.current=true;
 }
 async function refresh(){
  if(pending.current)return;pending.current=true;setBusy(true);setMessage("");
  try{await load();}catch{setMessage("Не успяхме да заредим достъпа. Опитай отново.");}finally{pending.current=false;setBusy(false);}
 }
 async function change(body:Record<string,string>){
  if(pending.current)return;pending.current=true;setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/sharing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,childId})});
   const data=await response.json();
   if(!response.ok){setMessage(data.message);return;}
   if(data.link){setLink(data.link);setCopied(false);}
   else {setLink("");setCopied(false);}
   await load();
  }catch{setMessage("Не успяхме да обновим достъпа. Опитай отново.");}finally{pending.current=false;setBusy(false);}
 }
 async function copy(){
  try{await navigator.clipboard.writeText(link);setCopied(true);}catch{linkInput.current?.focus();linkInput.current?.select();setMessage("Копирай избрания линк.");}
 }
 return <details className={o.loginSettings} onToggle={event=>{if(event.currentTarget.open&&!loaded.current)void refresh();}}>
  <summary>Сподели достъп</summary>
  <div className={o.sharing} aria-busy={busy}>
   {message&&<Message role="alert" tone="warning">{message}</Message>}
   {!access&&!busy&&<Button variant="quiet" onClick={()=>void refresh()}>Опитай отново</Button>}
   {busy&&!access&&<p role="status" className={o.note}>Зареждаме достъпа…</p>}
   <form className={o.form} onSubmit={event=>{event.preventDefault();void change({action:"create",email:String(new FormData(event.currentTarget).get("email")??"")});}}>
    <label className={o.label} htmlFor={`adult-email-${childId}`}>Google имейл на възрастния</label>
    <Input id={`adult-email-${childId}`} type="email" name="email" required maxLength={254} autoComplete="off" disabled={busy}/>
    <Button type="submit" loading={busy}>Създай линк</Button>
   </form>
   {link&&<div className={o.form}>
    <label className={o.label} htmlFor={`invite-link-${childId}`}>Линк за споделяне</label>
    <Input ref={linkInput} id={`invite-link-${childId}`} readOnly value={link}/>
    <Button variant="secondary" onClick={()=>void copy()}>{copied?"Копиран":"Копирай линка"}</Button>
    <p className={o.note} role={copied?"status":undefined}>Изпрати линка на този възрастен. Валиден е 7 дни.</p>
   </div>}
   {!!access?.invitations.length&&<div><h2 className={o.accessHeading}>Чакащи покани</h2><ul className={o.accessList}>
    {access.invitations.map(invite=><li key={invite.id}><span>{invite.email}</span><Button variant="quiet" disabled={busy} onClick={()=>void change({action:"cancel",invitationId:invite.id})} aria-label={`Отмени поканата за ${invite.email}`}>Отмени</Button></li>)}
   </ul></div>}
   {!!access?.adults.length&&<div><h2 className={o.accessHeading}>Възрастни с достъп</h2><ul className={o.accessList}>
    {access.adults.map(adult=><li key={adult.auth_user_id}><span>{adult.email}</span><Button variant="quiet" disabled={busy} onClick={()=>void change({action:"revoke",authUserId:adult.auth_user_id})} aria-label={`Премахни достъпа на ${adult.email}`}>Премахни достъпа</Button></li>)}
   </ul></div>}
  </div>
 </details>;
}

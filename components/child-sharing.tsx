"use client";
import {useEffect,useRef,useState} from "react";
import {Button} from "./ui/button";
import {Input} from "./ui/field";
import {Message} from "./ui/message";
import o from "./onboarding.module.css";
type Access={invitations:{id:string;email:string;expires_at:string}[];emails:string[]};
export function ChildSharing({childId}:{childId:string}){
 const [access,setAccess]=useState<Access|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[shareMessage,setShareMessage]=useState(""),[copied,setCopied]=useState(false),[manualCopy,setManualCopy]=useState(false);
 const loaded=useRef(false),pending=useRef(false),copyText=useRef<HTMLTextAreaElement>(null),copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
 useEffect(()=>{if(manualCopy){copyText.current?.focus();copyText.current?.select();}},[manualCopy]);
 async function load(){
  const response=await fetch(`/api/sharing?childId=${encodeURIComponent(childId)}`,{cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message);
  setAccess(data);loaded.current=true;
 }
 async function refresh(){
  if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{await load();}catch{setError("Не успяхме да заредим достъпа. Опитай отново.");}finally{pending.current=false;setBusy(false);}
 }
 async function change(body:Record<string,string>,form?:HTMLFormElement){
  if(pending.current)return;pending.current=true;setBusy(true);setError("");
  try{
   const response=await fetch("/api/sharing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,childId})});
   const data=await response.json();
   if(!response.ok){setError(data.message);return;}
   setShareMessage(data.message??"");setCopied(false);setManualCopy(false);
   if(copyTimer.current)clearTimeout(copyTimer.current);
   // Update only after the server accepts the change; a failed refresh must not
   // make a successfully removed email look active or invite a duplicate add.
   setAccess(previous=>({invitations:(previous?.invitations??[]).filter(invite=>body.action==="cancel"?invite.id!==body.invitationId:invite.email!==body.email),emails:body.action==="add"?[...new Set([...(previous?.emails??[]),(body.email??"").trim().toLowerCase()])]:body.action==="remove"?(previous?.emails??[]).filter(email=>email!==body.email):previous?.emails??[]}));
   form?.reset();
   await load();
  }catch{setError("Не успяхме да обновим достъпа. Опитай отново.");}finally{pending.current=false;setBusy(false);}
 }
 async function copy(){
  try{
   await navigator.clipboard.writeText(shareMessage);setCopied(true);setManualCopy(false);
   if(copyTimer.current)clearTimeout(copyTimer.current);
   copyTimer.current=setTimeout(()=>setCopied(false),2500);
  }catch{setManualCopy(true);setError("Копирай избраното съобщение.");}
 }
 return <details className={o.loginSettings} onToggle={event=>{if(event.currentTarget.open&&!loaded.current)void refresh();}}>
  <summary>Сподели достъп</summary>
  <div className={o.sharing} aria-busy={busy}>
   {error&&<Message role="alert" tone="warning">{error}</Message>}
   {!access&&!busy&&<Button variant="quiet" onClick={()=>void refresh()}>Опитай отново</Button>}
   {busy&&!access&&<p role="status" className={o.note}>Зареждаме достъпа…</p>}
   <form className={o.form} onSubmit={event=>{event.preventDefault();const form=event.currentTarget;void change({action:"add",email:String(new FormData(form).get("email")??"").trim().toLowerCase()},form);}}>
    <label className={o.label} htmlFor={`access-email-${childId}`}>Google имейл</label>
    <Input id={`access-email-${childId}`} type="email" name="email" required maxLength={254} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={busy}/>
    <Button type="submit" loading={busy}>Добави достъп</Button>
   </form>
   {shareMessage&&<div className={o.shareMessage}>
    <p>{shareMessage}</p>
    <Button className={o.iconButton} variant="quiet" onClick={()=>void copy()} aria-label="Копирай съобщението" title="Копирай съобщението"><span aria-hidden="true">{copied?"✓":"📋"}</span></Button>
    <span className={o.srOnly} role="status">{copied?"Съобщението е копирано.":""}</span>
    {manualCopy&&<textarea ref={copyText} className={o.copyFallback} aria-label="Съобщение за споделяне" value={shareMessage} readOnly/>}
   </div>}
   {!!access?.emails.length&&<div><h2 className={o.accessHeading}>Имейли с достъп</h2><ul className={o.accessList}>
    {access.emails.map(email=><li key={email}><span>{email}</span><Button className={o.iconButton} variant="quiet" disabled={busy} onClick={()=>void change({action:"remove",email})} aria-label={`Премахни достъпа на ${email}`} title="Премахни достъпа"><span aria-hidden="true">×</span></Button></li>)}
   </ul></div>}
   {!!access?.invitations.length&&<div><h2 className={o.accessHeading}>Чакащи покани</h2><ul className={o.accessList}>
    {access.invitations.map(invite=><li key={invite.id}><span>{invite.email}</span><Button className={o.iconButton} variant="quiet" disabled={busy} onClick={()=>void change({action:"cancel",invitationId:invite.id})} aria-label={`Отмени поканата за ${invite.email}`} title="Отмени поканата"><span aria-hidden="true">×</span></Button></li>)}
   </ul></div>}
  </div>
 </details>;
}

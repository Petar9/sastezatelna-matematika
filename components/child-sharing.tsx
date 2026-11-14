"use client";
import {useEffect,useRef,useState} from "react";
import {Dialog} from "./ui/dialog";
import {ActionIcon} from "./ui/action-icon";
import {Button} from "./ui/button";
import {Input} from "./ui/field";
import {Message} from "./ui/message";
import o from "./onboarding.module.css";
type Access={invitations:{id:string;email:string;expires_at:string}[];emails:string[]};
export function ChildSharing({childId,embedded=false,active=false}:{childId:string;embedded?:boolean;active?:boolean}){
 const [access,setAccess]=useState<Access|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[shareMessage,setShareMessage]=useState(""),[copied,setCopied]=useState(false),[manualCopy,setManualCopy]=useState(false),[removal,setRemoval]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),removeTrigger=useRef<HTMLButtonElement|null>(null),accessHeading=useRef<HTMLHeadingElement>(null),removed=useRef(false);
 const loaded=useRef(false),pending=useRef(false),copyText=useRef<HTMLTextAreaElement>(null),copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(copyTimer.current)clearTimeout(copyTimer.current);},[]);
 useEffect(()=>{if(manualCopy){copyText.current?.focus();copyText.current?.select();}},[manualCopy]);
 useEffect(()=>{if(embedded&&active&&!loaded.current)void refresh();},[embedded,active]);
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
  if(pending.current)return false;pending.current=true;setBusy(true);setError("");
  let accepted=false;
  try{
   const response=await fetch("/api/sharing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,childId})});
   const data=await response.json();
   if(!response.ok){setError(data.message);return false;}
   accepted=true;
   setShareMessage(data.message??"");setCopied(false);setManualCopy(false);
   if(copyTimer.current)clearTimeout(copyTimer.current);
   // Update only after the server accepts the change; a failed refresh must not
   // make a successfully removed email look active or invite a duplicate add.
   setAccess(previous=>({invitations:(previous?.invitations??[]).filter(invite=>body.action==="cancel"?invite.id!==body.invitationId:invite.email!==body.email),emails:body.action==="add"?[...new Set([...(previous?.emails??[]),(body.email??"").trim().toLowerCase()])]:body.action==="remove"?(previous?.emails??[]).filter(email=>email!==body.email):previous?.emails??[]}));
   form?.reset();
   await load();
  }catch{setError("Не успяхме да обновим достъпа. Опитай отново.");}finally{pending.current=false;setBusy(false);}
  return accepted;
 }
 function requestRemoval(email:string,trigger:HTMLButtonElement){
  removed.current=false;removeTrigger.current=trigger;setError("");setRemoval(email);
 }
 useEffect(()=>{if(removal){dialog.current?.showModal();dialog.current?.querySelector<HTMLButtonElement>('button[aria-label="Затвори"]')?.focus();}},[removal]);
 async function confirmRemoval(){
  if(!removal)return;
  if(await change({action:"remove",email:removal})){removed.current=true;dialog.current?.close();}
 }
 async function copy(){
  try{
   await navigator.clipboard.writeText(shareMessage);setCopied(true);setManualCopy(false);
   if(copyTimer.current)clearTimeout(copyTimer.current);
   copyTimer.current=setTimeout(()=>setCopied(false),2500);
  }catch{setManualCopy(true);setError("Копирай избраното съобщение.");}
 }
 const content = <>
  <div className={o.sharing} aria-busy={busy}>
   {error&&!removal&&<Message role="alert" tone="warning">{error}</Message>}
   {!access&&!busy&&<Button variant="quiet" onClick={()=>void refresh()}>Опитай отново</Button>}
   {busy&&!access&&<p role="status" className={o.note}>Зареждаме достъпа…</p>}
   <form className={o.form} onSubmit={event=>{event.preventDefault();const form=event.currentTarget;void change({action:"add",email:String(new FormData(form).get("email")??"").trim().toLowerCase()},form);}}>
    <label className={o.label} htmlFor={`access-email-${childId}`}>Google имейл</label>
    <div className={o.formRow}><Input id={`access-email-${childId}`} type="email" name="email" required maxLength={254} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={busy}/>
    <Button type="submit" loading={busy}>Добави достъп</Button></div>
   </form>
   {shareMessage&&<div className={o.shareMessage}>
    <p>{shareMessage}</p>
    <Button className={o.iconButton} variant="quiet" onClick={()=>void copy()} aria-label="Копирай съобщението" title="Копирай съобщението"><ActionIcon name={copied?"check":"copy"}/></Button>
    <span className={o.srOnly} role="status">{copied?"Съобщението е копирано.":""}</span>
    {manualCopy&&<textarea ref={copyText} className={o.copyFallback} aria-label="Съобщение за споделяне" value={shareMessage} readOnly/>}
   </div>}
   {access&&<div><h2 ref={accessHeading} tabIndex={-1} className={o.accessHeading}>Имейли с достъп</h2><ul className={o.accessList}>
    {access.emails.map(email=><li key={email}><span>{email}</span><Button className={`${o.iconButton} ${o.removeButton}`} variant="quiet" disabled={busy} onClick={event=>requestRemoval(email,event.currentTarget)} aria-label={`Премахни достъпа на ${email}`} title="Премахни достъпа"><ActionIcon name="close"/></Button></li>)}
   </ul></div>}
   {!!access?.invitations.length&&<div><h2 className={o.accessHeading}>Чакащи покани</h2><ul className={o.accessList}>
    {access.invitations.map(invite=><li key={invite.id}><span>{invite.email}</span><Button className={o.iconButton} variant="quiet" disabled={busy} onClick={()=>void change({action:"cancel",invitationId:invite.id})} aria-label={`Отмени поканата за ${invite.email}`} title="Отмени поканата"><span aria-hidden="true">×</span></Button></li>)}
   </ul></div>}
  </div>
  <Dialog ref={dialog} className={o.removalDialog} title={`Сигурен ли си, че искаш да спреш достъпа на ${removal??""}?`} titleId={`remove-access-${childId}`} closeDisabled={busy} onCancel={event=>{if(pending.current)event.preventDefault();}} onClose={()=>{setRemoval(null);if(removed.current)accessHeading.current?.focus();else{setError("");removeTrigger.current?.focus();}}}>
   {error&&removal&&<Message tone="error">{error}</Message>}
   <Button className={o.primary} loading={busy} onClick={()=>void confirmRemoval()}>Да</Button>
  </Dialog>
 </>;
 return embedded ? content : <details className={o.loginSettings} onToggle={event=>{if(event.currentTarget.open&&!loaded.current)void refresh();}}><summary>Сподели достъп</summary>{content}</details>;
}

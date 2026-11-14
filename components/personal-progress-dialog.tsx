"use client";

import type {Appreciation} from "../src/core/accomplishments";
import {useEffect,useId,useRef} from "react";
import {Dialog} from "./ui/dialog";
import {Button} from "./ui/button";
import {KidsOtter} from "./kids-otter";
import s from "./kids.module.css";

function appreciationMessage(appreciation:Appreciation) {
 switch(appreciation.kind) {
  case "hint-independent": return "Миналият път реши този тип задача с подсказка, а сега самостоятелно. Браво!";
  case "whole-problem": return "Реши всички части на тази задача самостоятелно. Браво!";
  case "scheduled-review": return "При преговора реши задачата самостоятелно. Браво!";
  case "daily-tasks": return `Нов личен рекорд! Днес реши ${appreciation.amount} ${appreciation.amount===1?"задача":"задачи"} - най-много досега за един ден.`;
  case "daily-gold": return `Нов личен рекорд! Днес събра ${appreciation.amount} злато - най-много досега за един ден.`;
 }
}
export function PersonalProgressDialog({appreciations,onDismiss}:{appreciations:Appreciation[];onDismiss:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),continueButton=useRef<HTMLButtonElement>(null);
 const titleId=useId(),descriptionId=useId();
 useEffect(()=>{dialog.current?.showModal();continueButton.current?.focus();},[]);
 return <Dialog ref={dialog} title="Личен напредък!" titleId={titleId} aria-describedby={descriptionId} onClose={onDismiss}>
  <div className={s.personalProgress}><KidsOtter mood="celebrate"/><div id={descriptionId} className={s.appreciationMessages}>{appreciations.map(appreciation=><p key={appreciation.kind}>{appreciationMessage(appreciation)}</p>)}</div></div>
  <Button ref={continueButton} onClick={()=>dialog.current?.close()}>Продължи</Button>
 </Dialog>;
}

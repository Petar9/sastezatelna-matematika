"use client";

import {useEffect,useId,useRef} from "react";
import {Dialog} from "./ui/dialog";
import {Button} from "./ui/button";
import {KidsOtter} from "./kids-otter";
import s from "./kids.module.css";

export function PersonalProgressDialog({onDismiss}:{onDismiss:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),continueButton=useRef<HTMLButtonElement>(null);
 const titleId=useId(),descriptionId=useId();
 useEffect(()=>{dialog.current?.showModal();continueButton.current?.focus();},[]);
 return <Dialog ref={dialog} title="Личен напредък!" titleId={titleId} aria-describedby={descriptionId} onClose={onDismiss}>
  <div className={s.personalProgress}><KidsOtter mood="celebrate"/><p id={descriptionId}>Миналият път реши този тип задача с подсказка, а сега самостоятелно. Браво!</p></div>
  <Button ref={continueButton} onClick={()=>dialog.current?.close()}>Продължи</Button>
 </Dialog>;
}

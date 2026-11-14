"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/field";
import { Message } from "./ui/message";
import { Dialog } from "./ui/dialog";
import s from "./feedback.module.css";

export type FeedbackContext = { childId?: string; competitionId?: string; taskKey?: string };
export function FeedbackButton(props: FeedbackContext) {
 const [open, setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null);
 return <><Button ref={trigger} variant="quiet" className={s.link} onClick={() => setOpen(true)}>Подай обратна връзка</Button><FeedbackDialog {...props} open={open} onClose={() => { setOpen(false); trigger.current?.focus(); }}/></>;
}

export function FeedbackDialog({ open, onClose, childId, competitionId, taskKey }: FeedbackContext & { open: boolean; onClose: () => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const sending = useRef(false);
 const confirmation = useRef<HTMLButtonElement>(null);
 const messageInput = useRef<HTMLTextAreaElement>(null);
 const context = useRef<FeedbackContext>({});
 const [message, setMessage] = useState("");
 const [error, setError] = useState("");
 const [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
 const id = useId();
 useEffect(() => { if (sent && dialog.current?.open) confirmation.current?.focus(); }, [sent]);
 useEffect(() => {
  if (open && !dialog.current?.open) {
   context.current = { childId, competitionId, taskKey };
   dialog.current?.showModal();
   messageInput.current?.focus();
  } else if (!open && dialog.current?.open) dialog.current.close();
 }, [open, childId, competitionId, taskKey]);
 function close() { dialog.current?.close(); }
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (sending.current || !message.trim()) return;
  sending.current = true; setBusy(true); setError("");
  try {
   const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...context.current, description: message.trim() }) });
   if (!response.ok) throw new Error("Не успяхме да изпратим. Опитай отново.");
   setSent(true); setMessage("");
  } catch {
   setError("Не успяхме да изпратим. Опитай отново.");
  } finally { sending.current = false; setBusy(false); }
 }
 return <Dialog ref={dialog} title="Подай обратна връзка" titleId={`${id}-title`} onClose={() => { if (sent) setSent(false); onClose(); }}>
   {sent ? <div className={s.confirmation}><Message tone="success">Благодарим! Получихме съобщението.</Message><Button ref={confirmation} onClick={close}>Затвори</Button></div>
    : <form onSubmit={event => void submit(event)} aria-busy={busy}>
     <label htmlFor={`${id}-message`}>Какво искаш да ни кажеш?</label>
     <p id={`${id}-help`} className={s.help}>Например: грешка в текста, неясна подсказка или нещо, което не работи.</p>
     <Textarea className={s.message} ref={messageInput} id={`${id}-message`} aria-describedby={`${id}-help`} autoFocus required maxLength={1000} rows={5}
      value={message} onChange={event => setMessage(event.target.value)} disabled={busy}/>
     {error && <Message className={s.error} tone="error" inline>{error}</Message>}
     <Button type="submit" loading={busy} disabled={!message.trim()}>Изпрати</Button>
    </form>}
  </Dialog>;
}

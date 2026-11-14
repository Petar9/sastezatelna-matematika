"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Button } from "./ui/button";
import { ActionIcon, type ActionIconName } from "./ui/action-icon";
import { FeedbackDialog, type FeedbackContext } from "./feedback";
import s from "./app-navigation.module.css";

type Props = FeedbackContext & {
 current?: "progress" | "profiles";
 allowLogout?: boolean;
 allowFeedback?: boolean;
 onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
 beforeLogout?: () => Promise<boolean>;
};
export function AppMenu({ current, allowLogout = true, allowFeedback = true, onNavigate, beforeLogout, ...context }: Props) {
 const [open, setOpen] = useState(false), [feedback, setFeedback] = useState(false), [busy, setBusy] = useState(false);
 const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), pending = useRef(false);
 const id = useId();
 useEffect(() => {
  if (!open) return;
  const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } };
  document.addEventListener("pointerdown", outside);
  document.addEventListener("keydown", escape);
  return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
 }, [open]);
 const links: { href: string; label: string; icon: ActionIconName; page?: Props["current"] }[] = [
  {href: context.childId ? `/progress?child=${encodeURIComponent(context.childId)}` : "/progress", label: "Напредък", icon: "progress", page: "progress"},
  {href: "/profiles", label: "Профили", icon: "profiles", page: "profiles"},
  {href: "/materiali", label: "Ценни материали", icon: "book"},
  {href: "/about", label: "За сайта", icon: "info"},
 ];
 return <>
  <div ref={root} className={s.menu} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
   <Button ref={trigger} className={s.trigger} variant="secondary" aria-label="Меню" title="Меню" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><ActionIcon name={open ? "close" : "menu"}/></Button>
   <nav id={id} className={s.panel} aria-label="Основна навигация" hidden={!open}>
    {links.map(link => <Link key={link.href} href={link.href} className={s.item} aria-current={current && current === link.page ? "page" : undefined} onClick={event => { onNavigate?.(event, link.href); setOpen(false); }}><ActionIcon name={link.icon}/><span>{link.label}</span></Link>)}
    {allowFeedback && <Button variant="quiet" className={s.item} onClick={() => { setOpen(false); setFeedback(true); }}><ActionIcon name="feedback"/><span>Обратна връзка</span></Button>}
    {allowLogout && <form action="/auth/logout" method="post" className={s.logout} onSubmit={event => {
     if (!beforeLogout) return;
     event.preventDefault();
     if (pending.current) return;
     pending.current = true; setBusy(true);
     const form = event.currentTarget;
     void beforeLogout().then(saved => { if (saved) form.submit(); }).catch(() => { /* Keep the learner on the page if saving fails unexpectedly. */ }).finally(() => { pending.current = false; setBusy(false); });
    }}><Button type="submit" variant="quiet" className={s.item} loading={busy}><ActionIcon name="logout"/><span>Изход</span></Button></form>}
   </nav>
  </div>
  {allowFeedback && <FeedbackDialog {...context} open={feedback} onClose={() => { setFeedback(false); trigger.current?.focus(); }}/>}
 </>;
}

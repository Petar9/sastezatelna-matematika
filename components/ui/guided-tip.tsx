"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Button } from "./button";
import { ActionIcon } from "./action-icon";
import { placeGuide, type GuidePlacement } from "../../src/core/guide-placement";
import s from "./guided-tip.module.css";

type Props = {
 target: RefObject<HTMLElement | null>; title: string; children: ReactNode;
 onClose: () => void; onNext: () => void; onPrevious?: () => void;
 position?: number; total?: number; illustration?: ReactNode;
};
export function GuidedTip({ target, title, children, onClose, onNext, onPrevious, position = 1, total = 1, illustration }: Props) {
 const id = useId(), card = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
 const [placement, setPlacement] = useState<GuidePlacement>();
 const close = useRef(onClose); close.current = onClose;
 useLayoutEffect(() => {
  const element = target.current, panel = card.current;
  if (!element || !panel) return;
  const previous = document.activeElement as HTMLElement | null;
  const description = element.getAttribute("aria-describedby");
  element.setAttribute("aria-describedby", [description, `${id}-body`].filter(Boolean).join(" "));
  element.classList.add(s.target!);
  const viewport = window.visualViewport;
  const bounds = () => ({ left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, height: viewport?.height ?? window.innerHeight, width: viewport?.width ?? window.innerWidth });
  const place = () => {
   const screen = bounds();
   panel.style.maxHeight = `${Math.max(0, screen.height - 24)}px`;
   panel.style.maxWidth = `${Math.max(0, screen.width - 24)}px`;
   const safeBottom = parseFloat(window.getComputedStyle?.(panel).getPropertyValue("--guide-safe-bottom") ?? "0") || 0;
   const next = placeGuide(element.getBoundingClientRect(), panel.getBoundingClientRect(), screen, safeBottom);
   setPlacement(previous => previous?.left === next.left && previous.top === next.top && previous.pointer?.left === next.pointer?.left && previous.pointer?.top === next.pointer?.top && previous.pointer?.side === next.pointer?.side ? previous : next);
  };
  const screen = bounds(), rect = element.getBoundingClientRect();
  const reserved = panel.getBoundingClientRect().height + 32;
  if (rect.bottom < screen.top + 12 || rect.top > screen.top + screen.height - reserved || (rect.top < screen.top && rect.height < screen.height - reserved)) {
   element.scrollIntoView?.({ block: rect.height > screen.height - reserved ? "start" : "center", behavior: "instant" });
  }
  place();
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(place);
  observer?.observe(element); observer?.observe(panel);
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); close.current(); } };
  window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
  viewport?.addEventListener("resize", place); viewport?.addEventListener("scroll", place);
  document.addEventListener("keydown", escape);
  return () => {
   element.classList.remove(s.target!);
   if (description === null) element.removeAttribute("aria-describedby"); else element.setAttribute("aria-describedby", description);
   observer?.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
   viewport?.removeEventListener("resize", place); viewport?.removeEventListener("scroll", place);
   document.removeEventListener("keydown", escape);
   if (panel.contains(document.activeElement) || document.activeElement === document.body) {
    const focus = previous?.isConnected && previous !== document.body && !panel.contains(previous) && !previous.closest("[hidden], [inert]") ? previous : element;
    if (focus.isConnected) focus.focus({preventScroll:true});
   }
  };
 }, [target, title, id]);
 const positioned = placement !== undefined;
 useLayoutEffect(() => {
  if (positioned) heading.current?.focus({preventScroll:true});
 }, [positioned, target, title]);
 return <>
 <section ref={card} className={s.card} role="region" aria-labelledby={`${id}-title`} style={{left:placement?.left ?? 12,top:placement?.top ?? 12,visibility:placement ? "visible" : "hidden"}}>
  <div className={s.header}>{illustration && <span className={s.otter} aria-hidden="true">{illustration}</span>}<h2 ref={heading} tabIndex={-1} id={`${id}-title`} aria-describedby={`${id}-body`}>{title}</h2><Button variant="quiet" className={s.close} aria-label="Затвори напътствията" onClick={onClose}><ActionIcon name="close"/></Button></div>
  <p id={`${id}-body`} className={s.body}>{children}</p>
  <div className={s.footer}>{total > 1 && <span className={s.count} aria-label={`${position} от ${total}`}>{position}/{total}</span>}{onPrevious && <Button variant="quiet" onClick={onPrevious}>Назад</Button>}<Button onClick={onNext}>{position === total ? "Готово" : "Напред"}</Button></div>
 </section>
 {placement?.pointer && <span aria-hidden="true" className={s.pointer} data-side={placement.pointer.side} style={{left:placement.pointer.left,top:placement.pointer.top}}/>}
 </>;
}

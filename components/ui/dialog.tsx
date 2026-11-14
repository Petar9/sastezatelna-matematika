"use client";

import type { ComponentPropsWithRef, Ref } from "react";
import { Button } from "./button";
import s from "./ui.module.css";

type Props = Omit<ComponentPropsWithRef<"dialog">, "title" | "open" | "aria-label" | "aria-labelledby"> & { title: string; titleId: string; closeDisabled?: boolean; variant?: "default" | "responsive"; titleRef?: Ref<HTMLHeadingElement> };
// The caller owns showModal(), initial focus and focus restoration; native dialog owns the focus trap and Escape.
export function Dialog({ title, titleId, children, className, closeDisabled, variant = "default", titleRef, ...props }: Props) {
  return <dialog {...props} aria-labelledby={titleId} className={`${s.dialog} ${variant === "responsive" ? s.responsive : ""} ${className ?? ""}`}>
    <div className={s.dialogHeading}><h2 id={titleId} ref={titleRef} tabIndex={variant === "responsive" ? -1 : undefined}>{title}</h2><Button variant="quiet" className={s.close} disabled={closeDisabled} aria-label="Затвори" onClick={event => event.currentTarget.closest("dialog")?.close()}>×</Button></div>
    {variant === "responsive" ? <div className={s.dialogBody}>{children}</div> : children}
  </dialog>;
}

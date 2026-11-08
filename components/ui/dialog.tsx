"use client";

import type { ComponentPropsWithRef } from "react";
import { Button } from "./button";
import s from "./ui.module.css";

type Props = Omit<ComponentPropsWithRef<"dialog">, "title" | "open" | "aria-label" | "aria-labelledby"> & { title: string; titleId: string; closeDisabled?: boolean };
// The caller owns showModal(), initial focus and focus restoration; native dialog owns the focus trap and Escape.
export function Dialog({ title, titleId, children, className, closeDisabled, ...props }: Props) {
  return <dialog {...props} aria-labelledby={titleId} className={`${s.dialog} ${className ?? ""}`}>
    <div className={s.dialogHeading}><h2 id={titleId}>{title}</h2><Button variant="quiet" className={s.close} disabled={closeDisabled} aria-label="Затвори" onClick={event => event.currentTarget.closest("dialog")?.close()}>×</Button></div>
    {children}
  </dialog>;
}

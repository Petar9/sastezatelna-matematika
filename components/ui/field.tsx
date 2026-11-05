import type { ComponentPropsWithRef } from "react";
import s from "./ui.module.css";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input {...props} className={`${s.field} ${className ?? ""}`} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea {...props} className={`${s.field} ${s.textarea} ${className ?? ""}`} />;
}

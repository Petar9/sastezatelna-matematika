import type { ComponentProps } from "react";
import s from "./ui.module.css";

type Tone = "info" | "success" | "warning" | "error";
export function Message({ tone = "info", inline = false, className, role, ...props }: ComponentProps<"div"> & { tone?: Tone; inline?: boolean }) {
  return <div {...props} role={role ?? (tone === "error" ? "alert" : tone === "success" ? "status" : undefined)} className={`${s.message} ${s[tone]} ${inline ? s.inline : ""} ${className ?? ""}`} />;
}

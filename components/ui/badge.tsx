import type { ComponentProps } from "react";
import s from "./ui.module.css";

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: "neutral" | "success" | "warning" }) {
  return <span {...props} className={`${s.badge} ${s[tone]} ${className ?? ""}`} />;
}

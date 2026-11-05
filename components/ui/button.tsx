import Link from "next/link";
import type { ComponentProps, ComponentPropsWithRef } from "react";
import s from "./ui.module.css";

type Variant = "primary" | "secondary" | "quiet";
type Appearance = { variant?: Variant; className?: string };
const classes = (variant: Variant, className?: string) => `${s.control} ${s[variant]} ${className ?? ""}`;

export function Button({ variant = "primary", className, type = "button", loading = false, disabled, ...props }: ComponentPropsWithRef<"button"> & Appearance & { loading?: boolean }) {
  return <button {...props} type={type} className={classes(variant, className)} disabled={disabled || loading} aria-busy={loading || props["aria-busy"] || undefined} />;
}

export function ButtonLink({ variant = "secondary", className, ...props }: ComponentProps<typeof Link> & Appearance) {
  return <Link {...props} className={classes(variant, className)} />;
}

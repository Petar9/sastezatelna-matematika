"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import o from "./onboarding.module.css";

export function SkipChildEmailForm({ childId }: { childId: string }) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const reset = () => { submitting.current = false; setPending(false); };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return <form action="/api/profiles" method="post" onSubmit={event => {
    if (event.defaultPrevented) return;
    if (submitting.current) { event.preventDefault(); return; }
    submitting.current = true;
    setPending(true);
  }}>
    <input type="hidden" name="action" value="select" />
    <input type="hidden" name="childId" value={childId} />
    <Button type="submit" variant="quiet" className={o.textButton} loading={pending} aria-live="polite">{pending ? "Зареждане…" : "Не сега"}</Button>
  </form>;
}

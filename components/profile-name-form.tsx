"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { Message } from "./ui/message";
import o from "./onboarding.module.css";

export function ProfileNameForm({ child }: { child: { id: string; nickname: string } }) {
  const inputId = useId();
  const router = useRouter();
  const [nickname, setNickname] = useState(child.nickname);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string }>();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    const body = new FormData(event.currentTarget);
    setSaving(true);
    setNotice(undefined);
    try {
      const response = await fetch("/api/profiles", { method: "POST", body, headers: { Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) {
        setNotice({ error: true, text: typeof result.message === "string" ? result.message : "Не успяхме да запазим името. Опитай отново." });
        return;
      }
      if (typeof result.nickname !== "string") throw new Error("Unexpected profile response");
      setNickname(result.nickname);
      setNotice({ error: false, text: "Името е запазено." });
      router.refresh();
    } catch {
      setNotice({ error: true, text: "Не успяхме да запазим името. Опитай отново." });
    } finally { pending.current = false; setSaving(false); }
  }
  return <form action="/api/profiles" method="post" className={o.form} onSubmit={save}>
    <input type="hidden" name="action" value="rename" />
    <input type="hidden" name="childId" value={child.id} />
    <label className={o.label} htmlFor={inputId}>Твоят прякор</label>
    <Input id={inputId} type="text" name="nickname" required minLength={1} maxLength={40} autoComplete="off" spellCheck={false}
      value={nickname} onChange={event => { setNickname(event.target.value); setNotice(undefined); }} disabled={saving}
      aria-invalid={notice?.error || undefined} aria-describedby={notice ? `${inputId}-notice` : undefined} />
    {notice && <Message id={`${inputId}-notice`} tone={notice.error ? "error" : "success"} inline>{notice.text}</Message>}
    <Button type="submit" loading={saving}>Запази името</Button>
  </form>;
}

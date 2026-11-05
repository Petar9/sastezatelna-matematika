"use client";
import { Button, ButtonLink } from "@/components/ui/button";
import { Message } from "@/components/ui/message";
import s from "@/components/kids.module.css";
export default function Error({ reset }: { reset: () => void }) {
 return <main className={s.shell}><div className={s.content}><ButtonLink href="/">← Начало</ButtonLink><h1>Напредък</h1><Message tone="error">Не успяхме да заредим напредъка. Опитай отново.</Message><Button onClick={reset}>Опитай отново</Button></div></main>;
}

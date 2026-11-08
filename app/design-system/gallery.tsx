"use client";

import { useId, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { MaterialCard } from "@/components/material-card";
import { admissionGuides } from "@/src/public-site";
import { Landing } from "@/components/landing";
import { ChildProfiles, LoginWelcome } from "@/components/onboarding";
import { AdventureRoute, GoldWallet } from "@/components/kids-adventure";
import { IslandGoldTotal, KidsLearningProgress } from "@/components/kids-learning-progress";
import { Award } from "@/components/kids-map-decorations";
import { ProgressCalendar } from "@/components/progress-calendar";
import { CompetitionPreparation, PreparationPanel } from "@/components/competition-preparation";
import type { PreparationProgress } from "@/src/core/preparation";
import { KidsActionBar } from "@/components/kids-action-bar";
import type { LearningSkillView } from "@/src/core";
import k from "@/components/kids.module.css";
import s from "./gallery.module.css";

const preparationExample = (percent: number): PreparationProgress => ({ status: "available", percent, tasks: { completed: percent === 100 ? 15 : Math.floor(percent / 8), total: 15 }, coverage: { solved: percent === 100 ? 10 : Math.floor(percent / 8), total: 10, fraction: Math.min(1, percent / 80) }, confirmation: { completed: percent === 100 ? 10 : 0, total: 10 }, review: { completed: percent === 100 ? 10 : 0, total: 10 }, scope: { version: 1, contentVersion: "preview" } });
const leaf: LearningSkillView = { id: "preview", title: "Обратни действия", prerequisites: [], status: "practising", milestones: { started: true, firstCorrect: "hinted" }, evidence: { independent: 0, hinted: 1, incorrect: 0, revealed: 0 }, confirmation: { earned: false, streak: 0, target: 2, revisit: false } };
const views = { components: "Компоненти", landing: "Начална страница", login: "Вход", profiles: "Профили", firstProfile: "Нов профил", learning: "Учебен екран", progress: "Напредък" };
export function DesignSystemGallery() {
 const [view, setView] = useState<keyof typeof views>("components");
 const [notice, setNotice] = useState("");
 const [answer, setAnswer] = useState("");
 const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), field = useRef<HTMLTextAreaElement>(null);
 const id = useId();
 return <div lang="bg" className={s.gallery}>
  <header className={s.header}><h1>Дизайн система</h1><p>Само development. Примерни данни; формите не изпращат заявки.</p>
   <nav className={s.row} aria-label="Прегледи">{Object.entries(views).map(([key, title]) => <Button key={key} variant={view === key ? "primary" : "secondary"} aria-pressed={view === key} onClick={() => { setView(key as keyof typeof views); setNotice(""); }}>{title}</Button>)}</nav>
  </header>
  {notice && <Message className={s.notice} tone="success">{notice}</Message>}
  <div onSubmitCapture={event => { event.preventDefault(); setNotice("Това е преглед. Няма изпратена заявка."); }}>
   {view === "landing" && <Landing />}
   {view === "login" && <LoginWelcome issue="cancelled" />}
   {view === "profiles" && <ChildProfiles children={[{ id: "preview-one", nickname: "Мореплавател" }]} issue="email" />}
   {view === "firstProfile" && <ChildProfiles children={[]} />}
   {view === "components" && <main className={s.catalog}>
    <section className={s.section}><h2>Действия</h2><div className={s.row}><Button onClick={() => setNotice("Действието работи.")}>Продължи</Button><Button variant="secondary">Подсказка</Button><Button variant="quiet">← Начало</Button><Button disabled>Провери отговора</Button><Button loading>Изпращаме…</Button><ButtonLink href="#fields">Към полетата</ButtonLink></div><p>Дълъг надпис:</p><Button>Продължи към следващата задача от приключението</Button></section>
    <section className={s.section} id="fields"><h2>Полета</h2><form className={s.form}><label htmlFor="preview-email">Имейл на родител</label><Input id="preview-email" type="email" required aria-describedby="preview-email-help" /><p id="preview-email-help">Ще използваме имейла само за поканата.</p><label htmlFor="preview-invalid">Твоят прякор</label><Input id="preview-invalid" aria-invalid="true" aria-describedby="preview-error" /><Message id="preview-error" tone="error" inline>Напиши прякор от 1 до 40 знака.</Message><label htmlFor="preview-disabled">Неактивно поле</label><Input id="preview-disabled" disabled value="Мореплавател" /><label htmlFor="preview-select">Състезание</label><Select id="preview-select" defaultValue="all"><option value="all">Всички състезания</option><option value="long">Примерно състезание с дълго българско име</option></Select><label htmlFor="preview-select-disabled">Неактивен избор</label><Select id="preview-select-disabled" disabled><option>Всички състезания</option></Select><label htmlFor="preview-select-invalid">Избор с грешка</label><Select id="preview-select-invalid" aria-invalid="true" aria-describedby="preview-select-error" defaultValue=""><option value="">Избери състезание</option><option value="one">Примерно състезание</option></Select><Message id="preview-select-error" tone="error" inline>Избери състезание.</Message><label htmlFor="preview-message">Съобщение</label><Textarea id="preview-message" rows={3} /><Button type="submit">Заяви покана</Button></form></section>
    <section className={s.section}><h2>Състояния</h2><div className={s.stack}><Message>Запазваме напредъка ти.</Message><Message tone="success">Верен отговор</Message><Message tone="warning">Входът е прекъснат. Когато си готов, опитай отново.</Message><Message tone="error">Не успяхме да изпратим. Опитай отново.</Message><div className={s.row}><Badge>4. клас</Badge><Badge tone="warning">Трудно</Badge><Badge tone="success">Запазено</Badge></div></div></section>
    <section className={s.section}><h2>Ценни материали</h2><MaterialCard guide={admissionGuides.smg}/><MaterialCard guide={admissionGuides.npmg}/></section>
    <section className={s.section}><h2>Напредък и награди</h2><div className={s.row}>{(["doctor", "professor"] as const).flatMap(rank => [false, true].map(earned => <span key={`${rank}-${earned}`}><Award rank={rank} earned={earned} topicId="preview" seen={new Set([`preview:${rank}`])}/>{rank === "doctor" ? "Доктор" : "Професор"}{earned ? " ✓" : ""}</span>))}</div><p>Приключение: 3 от 5 задачи.</p><AdventureRoute completed={3} /><h3>Обратни действия</h3><KidsLearningProgress leaf={leaf} /><GoldWallet balance={40} /><IslandGoldTotal title="Рачешки задачи" earned={70} /></section>
    <section className={s.section}><h2>Напредък в подготовката</h2><CompetitionPreparation progress={preparationExample(0)} href="/progress"/><PreparationPanel collections={[{competitionId:"maths",title:"Математика за всеки",preparation:preparationExample(5)},{competitionId:"regional",title:"Олимпиада по математика - областен кръг",preparation:preparationExample(42)},{competitionId:"complete",title:"НВО",preparation:preparationExample(100)}]}/><CompetitionPreparation progress={preparationExample(100)}/><CompetitionPreparation progress={{...preparationExample(0), status:"unavailable"}}/></section>
    <section className={s.section}><h2>Модален прозорец</h2><Button ref={trigger} onClick={() => { dialog.current?.showModal(); field.current?.focus(); }}>Отвори пример</Button><Dialog ref={dialog} title="Подай обратна връзка" titleId={id} onClose={() => trigger.current?.focus()}><form className={s.form} onSubmit={event => { event.preventDefault(); dialog.current?.close(); }}><label htmlFor="preview-dialog-message">Какво искаш да ни кажеш?</label><Textarea ref={field} id="preview-dialog-message" required /><Button type="submit">Готово</Button></form></Dialog></section>
   </main>}
   {view === "progress" && <main className={k.shell}><div className={k.content}><h1>Напредък</h1><ProgressCalendar initialDay="2026-11-05" collections={[{ competitionId: "preview", title: "Примерно състезание с дълго име", summary: { attempts: 3, confirmed: 1, revisit: 1, hasTask: false }, undatedGold: 5, undatedAttempts: 1, events: [
    { key: "one", day: "2026-11-05", kind: "attempt", label: "Примерна задача", outcome: "independent", wholeProblem: true },
    { key: "two", day: "2026-11-05", kind: "attempt", label: "Примерно подусловие", outcome: "hinted", wholeProblem: false },
    { key: "three", day: "2026-11-04", kind: "attempt", label: "Примерна задача", outcome: "revealed", wholeProblem: true },
    { key: "gold", day: "2026-11-05", kind: "gold", label: "Злато за задача", amount: 15 },
   ] }, { competitionId: "empty", title: "Без активност", summary: { attempts: 0, confirmed: 0, revisit: 0, hasTask: false }, undatedGold: 0, undatedAttempts: 0, events: [] }]}/></div></main>}
   {view === "learning" && <main className={k.shell}><div className={k.content}><h1 className={k.title}>Рачешки задачи</h1><AdventureRoute completed={1} compact /><section className={k.card}><h2>Кое число липсва?</h2><p className={k.question}>Намислих число. Прибавих 12 и получих 30. Кое число намислих?</p><label htmlFor="preview-answer">Числов отговор</label><Input className={k.numericInput} id="preview-answer" inputMode="decimal" value={answer} onChange={event => setAnswer(event.target.value)} /><div className={k.actions}><Button variant="secondary" onClick={() => setNotice("Върни се назад: от 30 извади 12.")}>Подсказка</Button></div></section><p>Преглед на истинския фиксиран бутон; не записва учебни данни.</p></div><KidsActionBar label="Провери отговора" disabled={!answer.trim()} onClick={() => setNotice("Примерът е проверен само в прегледа.")} /></main>}
  </div>
 </div>;
}

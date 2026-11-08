import { Button } from "./ui/button";
import { useEffect, useRef, type RefObject } from "react";
import type { GoldGain, KidsCourseView } from "@/src/core";
import { goldAmounts, problemAwardAmount } from "@/src/core/kids-gold";
import { KidsOtter } from "./kids-otter";
import s from "./kids.module.css";

export function Treasure({ open = false }: { open?: boolean }) {
 return <svg className={s.treasure} viewBox="0 0 160 130" width="150" height="122" role="img" aria-label={open ? "Отворено съкровище" : "Съкровището в края на приключението"}>
  {open && <g fill="#f5cf72"><path d="m80 0 5 15 16 1-13 10 4 16-12-10-13 10 5-16-13-10 16-1Z"/><circle cx="35" cy="32" r="5"/><circle cx="128" cy="21" r="4"/></g>}
  <path d={open ? "M22 57 34 18 136 38 138 64Z" : "M22 66Q22 32 55 32H105Q138 32 138 66Z"} fill="#bd8554" stroke="#f0c77a" strokeWidth="5"/>
  <path d="M22 64H138V113Q80 129 22 113Z" fill="#79523b" stroke="#f0c77a" strokeWidth="5"/>
  <path d="M43 66v51m74-51v51" stroke="#e2af65" strokeWidth="9"/><rect x="68" y="65" width="24" height="27" rx="5" fill="#f5cf72"/><circle cx="80" cy="78" r="4" fill="#79523b"/>
 </svg>;
}

export function GoldCoin() {
 return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#f3c75f" stroke="#a47724" strokeWidth="2"/><circle cx="20" cy="20" r="12" fill="none" stroke="#ffedaf" strokeWidth="2"/><path d="m20 10 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#a47724"/></svg>;
}
export function ProblemGoldPreview({ reward }: { reward: { amount: number } }) {
 const label = `Награда за задачата: ${reward.amount} злато`;
 return <div className={s.problemGoldRow}><span className={s.problemGoldPreview} aria-label={label} title={label}><GoldCoin/><strong>{reward.amount}</strong></span></div>;
}
export function GoldWallet({ balance }: { balance: number }) {
 return <span className={s.goldWallet} data-gold-wallet aria-label={`${balance} злато`}><GoldCoin/><strong>{balance}</strong><span>злато</span></span>;
}
export function GoldReward({ gain, concise = false }: { gain: GoldGain; concise?: boolean }) {
 const reward = useRef<HTMLDivElement>(null), flight = useRef<HTMLDivElement>(null);
 useEffect(() => {
  if (typeof requestAnimationFrame === "undefined") return;
  const frame = requestAnimationFrame(() => {
   const source = reward.current?.getBoundingClientRect();
   const target = document.querySelector('[data-gold-wallet]')?.getBoundingClientRect();
   const node = flight.current;
   if (!source || !target || !node) return;
   const x = source.left + source.width / 2, y = Math.min(source.top + 20, window.innerHeight - 100);
   node.style.setProperty('--coin-x', `${x}px`); node.style.setProperty('--coin-y', `${y}px`);
   node.style.setProperty('--coin-dx', `${target.left + target.width / 2 - x}px`);
   node.style.setProperty('--coin-dy', `${target.top + target.height / 2 - y}px`);
   node.dataset.ready = 'true';
  });
  return () => cancelAnimationFrame(frame);
 }, [gain]);
 const milestone = gain.awards.some(a => a.milestone === "confirmed") ? "Вече го умееш!" : gain.awards.some(a => a.milestone === "correct") ? "Първо откритие!" : gain.problems?.length ? "Нова завършена стъпка!" : "Нова стъпка в приключението!";
 const labels = { started: "Първа стъпка", correct: "Първи верен отговор", confirmed: "Затвърдено умение" };
 return <div ref={reward} className={s.goldReward} role="status" data-gold-gain={gain.amount}>
  <div ref={flight} className={s.coinFlight} aria-hidden="true"><GoldCoin/><GoldCoin/><GoldCoin/></div>
  <strong>{!concise && `${milestone} `}<span>+{gain.amount} злато</span></strong>
  {gain.awards.length + (gain.problems?.length ?? 0) > 1 && <details><summary>Откъде е златото?</summary><ul>{gain.awards.map(award => <li key={`${award.skillId}:${award.milestone}`}>{labels[award.milestone]} +{goldAmounts[award.milestone]}</li>)}{gain.problems?.map(award => <li key={award.key}>{award.key.includes(":unit:") ? "Завършена стъпка" : "Решена задача"} +{problemAwardAmount(award)}</li>)}</ul></details>}
 </div>;
}
export const souvenirs = ["Морска звезда", "Перлена мида", "Компас на откривателя", "Кораб в бутилка"];
export function AdventureSouvenir({ index, hidden = false }: { index: number; hidden?: boolean }) {
 const kind = index % souvenirs.length;
 return <svg className={s.adventureSouvenir} viewBox="0 0 100 100" role={hidden ? undefined : "img"} aria-label={hidden ? undefined : souvenirs[kind]} aria-hidden={hidden || undefined}>
  <circle cx="50" cy="50" r="46" fill="#fff2cc"/>
  {kind === 0 ? <><path d="m50 12 11 25 27 4-20 19 5 28-23-14-24 14 5-28L11 41l28-4Z" fill="#edab80" stroke="#b9744c" strokeWidth="2"/><circle cx="43" cy="48" r="3" fill="#3c5659"/><circle cx="57" cy="48" r="3" fill="#3c5659"/><path d="M43 58q7 7 14 0" fill="none" stroke="#3c5659" strokeWidth="2"/></>
  : kind === 1 ? <><path d="M19 56C0 17 33 6 50 21 71 0 105 29 80 57L58 80H42Z" fill="#f0b7a3" stroke="#b97969" strokeWidth="3"/><path d="M27 26 44 66m30-40L56 66M50 22v44" stroke="#fff4de" strokeWidth="4"/><ellipse cx="50" cy="75" rx="27" ry="10" fill="#c48878"/><circle cx="50" cy="68" r="12" fill="#fffdf8" stroke="#c9cece" strokeWidth="2"/></>
  : kind === 2 ? <><circle cx="50" cy="52" r="32" fill="#f7d477" stroke="#ae8233" strokeWidth="5"/><circle cx="50" cy="52" r="25" fill="#fffdf2"/><path d="m50 26 10 26-10 26-10-26Z" fill="#2587a0"/><path d="m50 26 10 26H40Z" fill="#df9a7a"/><circle cx="50" cy="52" r="4" fill="#fffdf2"/><path d="M44 18V9h12v9" fill="none" stroke="#ae8233" strokeWidth="4"/></>
  : <><path d="M61 12h19v14L87 40v38q0 10-10 10H24q-12 0-12-12V48q0-12 12-12h23l14-12Z" fill="#c2e3e6" stroke="#548c94" strokeWidth="3"/><path d="m21 67 54-1-10 13H33Z" fill="#bc815b"/><path d="M46 64V36l23 25H49Z" fill="#fff9e9"/><path d="m43 44-15 18h15Z" fill="#5fa6b1"/><path d="M61 12h19v10H61Z" fill="#c8975b"/></>}
 </svg>;
}
export function AdventureRoute({ completed, total = 5, compact = false }: { completed: number; total?: number; compact?: boolean }) {
 const position = Math.min(total, completed);
 return <div className={`${s.voyage} ${compact ? s.voyageCompact : ""}`}>
  <div className={s.voyageLine} role="progressbar" aria-label="Изминати стъпки в приключението" aria-valuemin={0} aria-valuemax={total} aria-valuenow={position} aria-valuetext={`${position} от ${total} стъпки, включително с помощ`}><span style={{ width: `${position / total * 100}%` }}/></div>
  {!compact && <ol className={s.voyageStops} aria-label={`${total} спирки до съкровището`} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>{Array.from({ length: total }, (_, i) => i + 1).map(stop => <li key={stop} data-complete={stop <= position} aria-current={stop === position + 1 ? "step" : undefined}><span>{stop <= position ? "✓" : stop}</span></li>)}</ol>}
  <span className={s.voyageBoat} style={{ left: `calc(${position / total * 100}% - ${position / total * 34}px)` }} aria-hidden="true"><svg viewBox="0 0 60 60"><path d="M4 40h52L45 52H16Z" fill="#b87d52"/><path d="M27 38V4l25 31H30Z" fill="#fffaf0" stroke="#b9cfd0"/><path d="M23 12 7 34h16Z" fill="#4da3b9"/></svg></span>
 </div>;
}
export function AdventureHome({ view, nickname, busy, start, resumeTopic, headingRef }: { view: KidsCourseView; nickname?: string; busy: boolean; start: () => void; resumeTopic: () => void; headingRef: RefObject<HTMLHeadingElement | null> }) {
 const pending = view.quest && !view.quest.finished && !view.quest.exhausted;
 const completed = pending ? view.quest!.completed : 0;
 const available = pending || view.questAvailable !== false;
 const total = pending ? view.quest!.total : 5;
 return <section className={s.adventureHome} aria-label="Твоето приключение">
  <div className={s.hero}><KidsOtter/><div><h1 ref={headingRef} tabIndex={-1} className={s.title}>{nickname ? `Здравей, ${nickname}!` : "На път за съкровища!"}</h1><p>{pending ? `Премина ${completed} от ${total} стъпки. Хайде нататък!` : available ? "Пет стъпки. Нови открития. Твое съкровище." : "Разгледа всички задачи за момента! Можеш да се върнеш към островите."}</p></div></div>
  {available && <AdventureRoute completed={completed} total={total}/>}
  {available && <div className={s.treasurePreview}><AdventureSouvenir index={view.stamps?.length ?? 0}/><div><small>В следващото съкровище</small><strong>{souvenirs[(view.stamps?.length ?? 0) % souvenirs.length]}</strong></div><span aria-hidden="true">✦</span></div>}
  <Button variant="primary" className={`${s.button} ${s.questButton}`} disabled={busy || !available} onClick={start}>{pending ? "Продължи приключението" : available ? "Започни приключение" : "Всички спирки са разгледани"}</Button>
  <div className={s.homeSecondary}><a className={s.quiet} href="#learning-map">Избери тема →</a>{view.active && !view.inQuest && <details><summary>Започната тема</summary><Button variant="quiet" className={s.quiet} disabled={busy} onClick={resumeTopic}>Продължи: {view.topics.find(t => t.id === view.active?.topicId)?.title}</Button></details>}</div>
  {!available && view.nextReviewAt && <p className={s.small}>Нова проверка на запомненото: {new Date(view.nextReviewAt).toLocaleDateString("bg-BG")}.</p>}
 </section>;
}

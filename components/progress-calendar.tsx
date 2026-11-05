"use client";

import { useId, useState } from "react";
import { Button, ButtonLink } from "./ui/button";
import { Select } from "./ui/field";
import { Message } from "./ui/message";
import type { ProgressCourse } from "../src/core/progress";
import { dayProgress } from "../src/core/progress-calendar";
import s from "./progress-calendar.module.css";

export type ProgressCollection = ProgressCourse & { title: string; lastTaskHref?: string };
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const outcomes = { independent: "Самостоятелно", hinted: "С подсказка", incorrect: "Грешен отговор", revealed: "Разгледано решение" };
const monthLabel = (month: string) => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("bg-BG", { month: "long", year: "numeric", timeZone: "Europe/Sofia" });
const dateLabel = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Sofia" });
export function monthDays(month: string) {
 const [year, number] = month.split("-").map(Number);
 return { offset: (new Date(Date.UTC(year!, number! - 1, 1)).getUTCDay() + 6) % 7, count: new Date(Date.UTC(year!, number!, 0)).getUTCDate() };
}
export function shiftMonth(month: string, amount: number) {
 const [year, number] = month.split("-").map(Number);
 return new Date(Date.UTC(year!, number! - 1 + amount, 1)).toISOString().slice(0, 7);
}

export function ProgressCalendar({ collections, initialDay }: { collections: ProgressCollection[]; initialDay: string }) {
 const [month, setMonth] = useState(initialDay.slice(0, 7));
 const [competition, setCompetition] = useState("all");
 const [selected, setSelected] = useState(initialDay);
 const id = useId();
 const visible = collections.filter(item => competition === "all" || item.competitionId === competition);
 const events = visible.flatMap(item => item.events.map(event => ({ ...event, competitionId: item.competitionId, competition: item.title })));
 const monthly = events.filter(event => event.day.startsWith(month));
 const totals = dayProgress(monthly), details = events.filter(event => event.day === selected);
 const selectedTotals = dayProgress(details);
 const selectedOutcomes = Object.entries(outcomes).map(([outcome, label]) => ({
  outcome, label, count: details.filter(event => event.kind === "attempt" && event.outcome === outcome).length,
 }));
 const skillGroups = visible.map(item => {
  const skills = new Map<string, { title: string; independent: number; hinted: number }>();
  for (const event of details) {
   if (event.competitionId !== item.competitionId || event.kind !== "attempt") continue;
   const key = event.skillId ?? "unknown";
   const skill = skills.get(key) ?? { title: event.skillTitle ?? "Други упражнения", independent: 0, hinted: 0 };
   if (event.wholeProblem && event.outcome === "independent") skill.independent++;
   if (event.wholeProblem && event.outcome === "hinted") skill.hinted++;
   skills.set(key, skill);
  }
  return { competitionId: item.competitionId, title: item.title, skills: [...skills.entries()] };
 }).filter(group => group.skills.length > 0);
 const undatedGold = visible.reduce((sum, item) => sum + item.undatedGold, 0);
 const undatedAttempts = visible.reduce((sum, item) => sum + item.undatedAttempts, 0);
 const { offset, count } = monthDays(month);
 function navigate(amount: number) { const next = shiftMonth(month, amount); setMonth(next); setSelected(`${next}-01`); }
 return <div className={s.stack}>
  <div className={s.filter}><label htmlFor={`${id}-competition`}>Състезание</label><Select id={`${id}-competition`} value={competition} onChange={event => setCompetition(event.target.value)}>
   <option value="all">Всички състезания</option>{collections.map(item => <option key={item.competitionId} value={item.competitionId}>{item.title}</option>)}
  </Select></div>
  <section className={s.calendar} aria-labelledby={`${id}-month`}>
   <div className={s.monthNavigation}><Button variant="quiet" aria-label="Предишен месец" onClick={() => navigate(-1)}>←</Button><h2 id={`${id}-month`} aria-live="polite">{monthLabel(month)}</h2><Button variant="quiet" aria-label="Следващ месец" disabled={month >= initialDay.slice(0,7)} onClick={() => navigate(1)}>→</Button></div>
   <dl className={s.totals} aria-label="За месеца">
    <div><dt>Злато</dt><dd>{totals.gold}</dd></div>
    <div><dt>Самостоятелно</dt><dd>{totals.independent}</dd></div>
    <div><dt>С подсказка</dt><dd>{totals.hinted}</dd></div>
   </dl>
   <div className={s.grid} role="group" aria-label={`Дни през ${monthLabel(month)}`}>
    {weekdays.map(day => <span className={s.weekday} key={day} aria-hidden="true">{day}</span>)}
    {Array.from({length: offset}, (_, index) => <span key={`empty-${index}`} aria-hidden="true"/>)}
    {Array.from({length: count}, (_, index) => {
     const day = `${month}-${String(index + 1).padStart(2,"0")}`;
     const activity = events.filter(event => event.day === day), value = dayProgress(activity);
     return <button type="button" key={day} className={`${s.day} ${activity.length ? s.active : ""}`} aria-pressed={selected === day} aria-current={day === initialDay ? "date" : undefined} aria-controls={`${id}-details`} aria-label={`${dateLabel(day)}: ${value.gold} злато, ${value.independent} самостоятелни, ${value.hinted} с подсказка, ${activity.filter(event => event.kind === "attempt" && event.outcome === "incorrect").length} грешни отговора, ${activity.filter(event => event.kind === "attempt" && event.outcome === "revealed").length} разгледани решения${activity.length ? "" : ", няма записана активност"}`} onClick={() => setSelected(day)}>
      <span className={s.dayNumber}>{index + 1}</span>{activity.length > 0 && <>
       <span className={s.dayGold} aria-hidden="true">{value.gold}</span>
       <span className={s.dayCounts} aria-hidden="true">{value.independent + value.hinted} реш.</span>
      </>}
     </button>;
    })}
   </div>
  </section>
  <section className={s.details} id={`${id}-details`} aria-labelledby={`${id}-date`}>
   <h2 id={`${id}-date`} aria-live="polite">{dateLabel(selected)}</h2>
   {details.length > 0 && <dl className={s.daySummary} aria-label="За деня">
    <div><dt>Злато</dt><dd>{selectedTotals.gold}</dd></div>
    {selectedOutcomes.map(item => <div key={item.outcome}><dt>{item.label}</dt><dd>{item.count}</dd></div>)}
   </dl>}
   {skillGroups.map(group => <div className={s.skillGroup} key={group.competitionId}>
    <h3>{group.title}</h3>
    <ul className={s.entries}>{group.skills.map(([key, skill]) => <li key={key}>
     <span className={s.skillTitle}>{skill.title}</span>
     <span className={s.skillResults}>{skill.independent + skill.hinted > 0
      ? [skill.independent > 0 && `Самостоятелно: ${skill.independent}`, skill.hinted > 0 && `С подсказка: ${skill.hinted}`].filter(Boolean).join(" · ")
      : "Упражнявано"}</span>
    </li>)}</ul>
   </div>)}
   {details.length === 0 && <p>Няма записана активност за този ден.</p>}
   {details.some(event => event.kind === "attempt" && !event.wholeProblem) && <p className={s.legend}>Подусловията не се броят като завършени цели задачи.</p>}
  </section>
  {(undatedGold > 0 || undatedAttempts > 0) && <Message>{undatedGold > 0 && <p>Злато без точна дата: {undatedGold}.</p>}{undatedAttempts > 0 && <p>Опити без точна дата: {undatedAttempts}.</p>}<p>Тези по-стари записи са запазени, но не са отнесени към конкретен ден.</p></Message>}
  <section className={s.details} aria-labelledby={`${id}-summary`}><h2 id={`${id}-summary`}>Общо досега</h2>
   {visible.map(item => <div key={item.competitionId} className={s.summary}><h3>{item.title}</h3><p>Опити за решаване: {item.summary.attempts}. Затвърдени умения: {item.summary.confirmed}. Умения за припомняне: {item.summary.revisit}.</p>{item.lastTaskHref && <ButtonLink href={item.lastTaskHref}>Виж последната задача</ButtonLink>}</div>)}
  </section>
 </div>;
}

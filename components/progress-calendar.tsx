"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { competitionCalendar, competitionHref } from "../src/competition-dates";
import { CompetitionCalendar } from "./competition-calendar";
import { Button, ButtonLink } from "./ui/button";
import { Select } from "./ui/field";
import { Message } from "./ui/message";
import { PreparationPanel } from "./competition-preparation";
import type { PreparationProgress } from "../src/core/preparation";
import type { ProgressCourse } from "../src/core/progress";
import { dayProgress } from "../src/core/progress-calendar";
import s from "./progress-calendar.module.css";

export type ProgressCollection = ProgressCourse & { title: string; lastTaskHref?: string; preparation?: PreparationProgress };
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

export function ProgressCalendar({ collections, initialDay, initialCompetition }: { collections: ProgressCollection[]; initialDay: string; initialCompetition?: string }) {
 const [month, setMonth] = useState(initialDay.slice(0, 7));
 const [competition, setCompetition] = useState(collections.some(item => item.competitionId === initialCompetition) ? initialCompetition! : "all");
 const [selected, setSelected] = useState(initialDay);
 const id = useId();
 const scheduled = competitionCalendar.filter(item => competition === "all" || item.competitionId === competition);
 const upcoming = scheduled.filter(item => item.date >= initialDay);
 const selectedCompetitions = scheduled.filter(item => item.date === selected);
 const lastMonth = competitionCalendar.reduce((last, item) => item.date.slice(0, 7) > last ? item.date.slice(0, 7) : last, initialDay.slice(0, 7));
 const visible = collections.filter(item => competition === "all" || item.competitionId === competition);
 const events = visible.flatMap(item => item.events.map(event => ({ ...event, competitionId: item.competitionId, competition: item.title })));
 const monthly = events.filter(event => event.day.startsWith(month));
 const totals = dayProgress(monthly), details = events.filter(event => event.day === selected);
 const selectedTotals = dayProgress(details);
 const connectedCounts = (items: typeof events) => ({ parts: items.filter(event => event.naturalPart).length, originals: items.filter(event => event.wholeOriginal).length });
 const monthConnected = connectedCounts(monthly), dayConnected = connectedCounts(details);
 const selectedOutcomes = Object.entries(outcomes).map(([outcome, label]) => ({
  outcome, label, count: details.filter(event => event.kind === "attempt" && event.outcome === outcome).length,
 }));
 const skillGroups = visible.map(item => {
  const skills = new Map<string, { title: string; independent: number; hinted: number }>();
  for (const event of details) {
   if (event.competitionId !== item.competitionId || event.kind !== "attempt") continue;
   const key = event.skillId ?? "unknown";
   const skill = skills.get(key) ?? { title: event.skillTitle ?? "Други упражнения", independent: 0, hinted: 0 };
   if ((event.wholeProblem || event.naturalPart) && event.outcome === "independent") skill.independent++;
   if ((event.wholeProblem || event.naturalPart) && event.outcome === "hinted") skill.hinted++;
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
   <div className={s.monthNavigation}><Button variant="quiet" aria-label="Предишен месец" onClick={() => navigate(-1)}>←</Button><h2 id={`${id}-month`} aria-live="polite">{monthLabel(month)}</h2><Button variant="quiet" aria-label="Следващ месец" disabled={month >= lastMonth} onClick={() => navigate(1)}>→</Button></div>
   <dl className={s.totals} aria-label="За месеца">
    <div><dt>Злато</dt><dd>{totals.gold}</dd></div>
    <div><dt>Самостоятелно</dt><dd>{totals.independent}</dd></div>
    <div><dt>С подсказка</dt><dd>{totals.hinted}</dd></div>
    {monthConnected.parts > 0 && <><div><dt>Подусловия</dt><dd>{monthConnected.parts}</dd></div><div><dt>Цели задачи</dt><dd>{monthConnected.originals}</dd></div></>}
   </dl>
   <div className={s.grid} role="group" aria-label={`Дни през ${monthLabel(month)}`}>
    {weekdays.map(day => <span className={s.weekday} key={day} aria-hidden="true">{day}</span>)}
    {Array.from({length: offset}, (_, index) => <span key={`empty-${index}`} aria-hidden="true"/>)}
    {Array.from({length: count}, (_, index) => {
     const day = `${month}-${String(index + 1).padStart(2,"0")}`;
     const competitions = scheduled.filter(event => event.date === day);
     const activity = events.filter(event => event.day === day), value = dayProgress(activity);
     return <button type="button" key={day} className={`${s.day} ${activity.length ? s.active : ""} ${competitions.length ? s.eventDay : ""}`} aria-pressed={selected === day} aria-current={day === initialDay ? "date" : undefined} aria-controls={`${id}-details`} aria-label={`${dateLabel(day)}: ${value.gold} злато, ${value.independent} самостоятелни, ${value.hinted} с подсказка, ${activity.filter(event => event.kind === "attempt" && event.outcome === "incorrect").length} грешни отговора, ${activity.filter(event => event.kind === "attempt" && event.outcome === "revealed").length} разгледани решения${activity.length ? "" : ", няма записана активност"}${competitions.map(event => `, ${event.kind === "deadline" ? "краен срок за провеждане" : "дата"}: ${event.label}`).join("")}`} onClick={() => setSelected(day)}>
      <span className={s.dayNumber}>{index + 1}</span>{activity.length > 0 && <>
       <span className={s.dayGold} aria-hidden="true">{value.gold}</span>
       <span className={s.dayCounts} aria-hidden="true">{value.independent + value.hinted} {value.independent + value.hinted === 1 ? "задача" : "задачи"}</span>
      </>}{competitions.length > 0 && <span className={s.eventMarker} aria-hidden="true">◆</span>}
     </button>;
    })}
   </div>
  </section>
  <section className={s.details} id={`${id}-details`} aria-labelledby={`${id}-date`}>
   <h2 id={`${id}-date`} aria-live="polite">{dateLabel(selected)}</h2>
   {selectedCompetitions.map(event => <p className={s.scheduledEvent} key={event.date}><span className={s.eventMarker} aria-hidden="true">◆</span> <Link href={competitionHref(event)}>{event.label}</Link>{event.kind === "deadline" && <span className={s.deadlineCaption}>Краен срок за провеждане</span>}</p>)}
   {details.length > 0 && <dl className={s.daySummary} aria-label="За деня">
    <div><dt>Злато</dt><dd>{selectedTotals.gold}</dd></div>
    {selectedOutcomes.map(item => <div key={item.outcome}><dt>{item.label}</dt><dd>{item.count}</dd></div>)}
    {dayConnected.parts > 0 && <><div><dt>Подусловия</dt><dd>{dayConnected.parts}</dd></div><div><dt>Цели задачи</dt><dd>{dayConnected.originals}</dd></div></>}
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
   {details.some(event => event.kind === "attempt" && !event.wholeProblem && !event.naturalPart) && <p className={s.legend}>Подусловията не се броят като завършени цели задачи.</p>}
  </section>
  <PreparationPanel collections={collections}/>
  {upcoming.length > 0 && <section className={s.upcoming} aria-labelledby={`${id}-upcoming`}>
   <h2 id={`${id}-upcoming`}>Предстоящи дати</h2>
   <CompetitionCalendar events={upcoming}/>
  </section>}
  {(undatedGold > 0 || undatedAttempts > 0) && <Message>{undatedGold > 0 && <p>Злато без точна дата: {undatedGold}.</p>}{undatedAttempts > 0 && <p>Опити без точна дата: {undatedAttempts}.</p>}<p>Тези по-стари записи са запазени, но не са отнесени към конкретен ден.</p></Message>}
  <section className={s.details} aria-labelledby={`${id}-summary`}><h2 id={`${id}-summary`}>Общо досега</h2>
   {visible.map(item => <div key={item.competitionId} className={s.summary}><h3>{item.title}</h3><p>Опити за решаване: {item.summary.attempts}. Затвърдени умения: {item.summary.confirmed}. Умения за припомняне: {item.summary.revisit}.</p>{item.lastTaskHref && <ButtonLink href={item.lastTaskHref}>Виж последната задача</ButtonLink>}</div>)}
  </section>
 </div>;
}

"use client";

import { useId } from "react";
import { weeklyProgress } from "../src/core/weekly-progress";
import type { ProgressCourse } from "../src/core/progress";
import { ActionIcon } from "./ui/action-icon";
import s from "./weekly-progress.module.css";

const achievementMessages = {
 "hint-independent": "Миналият път реши този тип задача с подсказка, а сега самостоятелно. Браво!",
 "whole-problem": "Реши всички части на тази задача самостоятелно. Браво!",
 "scheduled-review": "При преговора реши задачата самостоятелно. Браво!",
};
const dateLabel = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long", timeZone: "Europe/Sofia" });

export function WeeklyProgress({ collections, initialDay }: { collections: Pick<ProgressCourse, "events">[]; initialDay: string }) {
 const id = useId(), week = weeklyProgress(collections, initialDay);
 return <section className={s.card} aria-labelledby={`${id}-heading`}>
  <div className={s.heading}><h2 id={`${id}-heading`}>Тази седмица</h2><p>{dateLabel(week.start)} - {dateLabel(week.end)}</p></div>
  <dl className={s.activity}>
   <div className={s.primaryMetric}>
    <dt>Задачи</dt><dd className={s.count}>{week.independent + week.hinted}</dd>
    <dd className={s.breakdown}>Самостоятелно: {week.independent} · С помощ: {week.hinted}</dd>
   </div>
   <div className={s.metric}><dt>Дни с упражнения</dt><dd className={s.metricCount}>{week.activeDays}</dd></div>
   <div className={s.metric}><dt>Сгрешени задачи</dt><dd className={s.metricCount}>{week.incorrect}</dd>{week.legacyIncorrect > 0 && <dd className={s.breakdown}>По-стари грешни опити: {week.legacyIncorrect}</dd>}</div>
  </dl>
  {week.attempts === 0 && <p className={s.empty}>Още няма записани опити тази седмица.</p>}
  {week.achievement && <p className={s.achievement}><ActionIcon name="check"/><span>{achievementMessages[week.achievement]}</span></p>}
 </section>;
}

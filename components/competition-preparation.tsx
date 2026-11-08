"use client";

import { useId, useState, type MouseEvent } from "react";
import type { PreparationProgress } from "../src/core/preparation";
import { KidsOtter } from "./kids-otter";
import { ButtonLink } from "./ui/button";
import s from "./competition-preparation.module.css";

type PreparationCollection = { competitionId: string; title: string; preparation?: PreparationProgress };

export function PreparationPanel({ collections }: { collections: PreparationCollection[] }) {
 const id = useId();
 const started = collections.filter(item => item.preparation?.status === "available" && item.preparation.percent > 0);
 if (!started.length) return null;
 return <section className={s.panel} aria-labelledby={`${id}-heading`}>
  <h2 id={`${id}-heading`} className={s.panelTitle}>Напредък в подготовката</h2>
  {started.map(item => <PreparationRow key={item.competitionId} title={item.title} progress={item.preparation!}/>)}
 </section>;
}

function PreparationRow({ title, progress }: { title: string; progress: PreparationProgress }) {
 const id = useId();
 const [expanded, setExpanded] = useState(false);
 return <div className={s.row}>
  <h3 className={s.rowHeading}><button type="button" className={s.toggle} id={`${id}-toggle`} aria-expanded={expanded} aria-controls={`${id}-details`} onClick={() => setExpanded(!expanded)}>
   <span className={s.rowTitle}>{title}</span><span className={s.rowPercent}>{progress.percent}%</span>
   <svg className={s.chevron} viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
   <span className={s.rowTrack} aria-hidden="true"><span style={{ width: `${progress.percent}%` }}/></span>
  </button></h3>
  <div id={`${id}-details`} hidden={!expanded} aria-labelledby={`${id}-toggle`}>
   <dl className={s.breakdown}>
    <div><dt>Задачи от състезания</dt><dd>{progress.tasks.completed}/{progress.tasks.total}</dd></div>
    <div><dt>Затвърдени умения</dt><dd>{progress.confirmation.completed}/{progress.confirmation.total}</dd></div>
    <div><dt>Преговор</dt><dd>{progress.review.completed}/{progress.review.total}</dd></div>
   </dl>
  </div>
 </div>;
}

export function CompetitionPreparation({ progress, href, onNavigate }: { progress?: PreparationProgress; href?: string; onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
 const id = useId();
 const available = progress?.status === "available";
 const percent = progress?.percent ?? 0;
 return <section className={s.card} aria-labelledby={`${id}-heading`}>
  <div className={s.heading}><h2 id={`${id}-heading`}>Напредък в подготовката за това състезание.</h2><span className={s.percent}>{available ? `${percent}%` : "—"}</span></div>
  {available ? <>
   <div className={s.route}>
    <div className={s.track} role="progressbar" aria-labelledby={`${id}-heading`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }}/></div>
    <span className={s.otter} style={{ left: `clamp(26px, ${percent}%, calc(100% - 26px))` }} aria-hidden="true"><KidsOtter small/></span>
   </div>
   {href && <div className={s.footer}><ButtonLink variant="quiet" href={href} onClick={onNavigate}>Напредък →</ButtonLink></div>}
  </> : <p className={s.unavailable}>Няма достатъчно данни.</p>}
 </section>;
}

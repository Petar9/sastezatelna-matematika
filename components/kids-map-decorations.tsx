"use client";

import { useEffect, useState } from "react";
import type { CourseTopicView, LearningSkillView } from "@/src/core";
import s from "./kids-map-decorations.module.css";

export const leafKey = (topicId: string, conceptId: string) => `${topicId}:leaf:${conceptId}`;
const awardKey = (topicId: string, rank: string) => `${topicId}:${rank}`;

export function knowledgeGrowthKeys(topics: CourseTopicView[]) {
 return topics.flatMap(t => [
  ...(t.doctor ? [awardKey(t.id, "doctor")] : []), ...(t.professor ? [awardKey(t.id, "professor")] : []),
  ...(t.leaves ?? []).flatMap(c => [
   ...(c.milestones.started ? [`${leafKey(t.id, c.id)}:started`] : []),
   ...(c.milestones.firstCorrect ? [`${leafKey(t.id, c.id)}:correct`] : []),
   ...(c.status === "confirmed" || c.status === "review" || c.confirmation.earned ? [`${leafKey(t.id, c.id)}:confirmed`] : []),
  ]),
 ]);
}

function useFreshGrowth(earned: boolean, growthKey: string, seen: Set<string>) {
 const [fresh] = useState(() => earned && !seen.has(growthKey));
 useEffect(() => { if (earned) seen.add(growthKey); }, [earned, growthKey, seen]);
 return fresh;
}

export function leafPhase(concept: Pick<LearningSkillView, "status" | "milestones"> & { confirmation?: LearningSkillView["confirmation"] }) {
 return concept.confirmation?.earned || concept.status === "confirmed" || concept.status === "review" ? "confirmed" : concept.milestones?.firstCorrect ? "correct" : concept.milestones?.started ? "started" : undefined;
}
export function DiscoveryMarkerArt({ phase }: { phase?: "started" | "correct" | "confirmed" }) {
 return phase === "confirmed" ? <><circle cx="32" cy="32" r="25" fill="#f2cc72" stroke="#a57b30" strokeWidth="3"/><circle cx="32" cy="32" r="18" fill="none" stroke="#fff1b9" strokeWidth="2"/><path d="m20 32 8 8 17-19" fill="none" stroke="#76551c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></>
 : phase === "correct" ? <><circle cx="32" cy="32" r="25" fill="#d0efeb" stroke="#3a918c" strokeWidth="2"/><path d="m32 10 6 15 16 7-16 6-6 16-6-16-16-6 16-7Z" fill="#318d89"/><circle cx="32" cy="32" r="5" fill="#f2d58b"/></>
 : phase === "started" ? <><circle cx="32" cy="32" r="25" fill="#e0f0f8" stroke="#6ca7c5" strokeWidth="2"/><path d="M20 51V14h29l-7 10 7 10H21" fill="#3184ac" stroke="#246581" strokeWidth="3" strokeLinejoin="round"/></>
 : <circle cx="32" cy="32" r="23" fill="#fffaf0" fillOpacity=".7" stroke="#809f9f" strokeWidth="2" strokeDasharray="4 4"/>;
}
export function DiscoveryMarker({ status, milestones, confirmed, growthKey, seen, animate = true }: { status: LearningSkillView["status"]; milestones?: LearningSkillView["milestones"]; confirmed?: boolean; growthKey: string; seen: Set<string>; animate?: boolean }) {
 const phase = confirmed ? "confirmed" : leafPhase({ status, milestones: milestones ?? { started: false } });
 const fresh = useFreshGrowth(animate && !!phase, `${growthKey}:${phase}`, seen);
 return <svg className={s.marker} data-state={status} data-phase={phase ?? "untried"} data-first-correct={!!milestones?.firstCorrect || undefined} data-growing={fresh || undefined} viewBox="0 0 64 64" aria-hidden="true"><DiscoveryMarkerArt phase={phase}/></svg>;
}
// Kept for older component consumers; the visual is now a discovery marker.
export const Leaf = DiscoveryMarker;

export function Award({ rank, earned, topicId, seen }: { rank: "doctor" | "professor"; earned: boolean; topicId: string; seen: Set<string> }) {
 const fresh = useFreshGrowth(earned, awardKey(topicId, rank), seen);
 return <svg className={s.award} data-rank={rank} data-earned={earned} data-growing={fresh || undefined} viewBox="0 0 48 52" aria-hidden="true">
  {rank === "doctor" ? <>
   <path d="M10 10h26v31H12c-5 0-7-7-3-10V14" className={s.paper}/>
   <path d="M10 10c-5 0-5 8 0 8h4V10Zm2 21h24c-5 0-5 10 0 10H12c-5 0-5-10 0-10Z" className={s.paperRoll}/>
   <path d="M19 18h11m-11 5h8" className={s.ink}/>
   <path d="m24 35-2 13 6-3 6 3-2-13" className={s.ribbon}/>
   <circle cx="28" cy="34" r="7" className={s.seal}/><path d="m25 34 2 2 4-5" className={s.ink}/>
  </> : <>
   <path d="M11 23v12c7 8 19 8 26 0V23" className={s.capBand}/>
   <path d="m3 20 21-11 21 11-21 11Z" className={s.cap}/>
   <path d="m24 20 18 5v13" className={s.cord}/>
   <path d="m42 35-3 9h6Z" className={s.tassel}/><circle cx="24" cy="20" r="2" className={s.seal}/>
  </>}
 </svg>;
}


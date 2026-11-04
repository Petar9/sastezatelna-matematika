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
  {rank === "doctor" ? <><path d="m13 29-3 20 14-8 14 8-3-20" className={s.ribbon}/><circle cx="24" cy="22" r="17" className={s.medal}/><circle cx="24" cy="22" r="12" fill="none" stroke="currentColor"/><path d="m24 12 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor"/></> : <><path d="M24 46V25m0 14c-11 0-15-6-15-6 10-3 15 6 15 6Z" className={s.flowerStem}/><path d="M24 7C35-4 43 10 35 17C50 20 45 35 34 30C35 46 18 46 18 32C5 42-3 26 11 21C-1 11 14 1 20 12Z" className={s.blossom}/><circle cx="24" cy="23" r="6" className={s.flowerCentre}/></>}
 </svg>;
}


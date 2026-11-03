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

export function leafPhase(concept: Pick<LearningSkillView, "status" | "milestones">) {
 return concept.status === "confirmed" || concept.status === "review" ? "confirmed" : concept.milestones?.firstCorrect ? "correct" : concept.milestones?.started ? "started" : undefined;
}
export function Leaf({ status, milestones, growthKey, seen, animate = true }: { status: LearningSkillView["status"]; milestones?: LearningSkillView["milestones"]; growthKey: string; seen: Set<string>; animate?: boolean }) {
 const phase = leafPhase({ status, milestones: milestones ?? { started: false } });
 const fresh = useFreshGrowth(animate && !!phase, `${growthKey}:${phase}`, seen);
 return <svg className={s.leaf} data-state={status} data-first-correct={!!milestones?.firstCorrect || undefined} data-growing={fresh || undefined} viewBox="0 0 64 64" aria-hidden="true">
  {status === "untried" ? <><path d="M31 55V31" className={s.stem}/><path d="M32 36C13 33 18 15 31 9C44 19 48 33 32 36Z" className={s.bud}/></> : <>
   <path d={status === "practising" ? "M15 51C5 27 29 11 46 14C50 34 39 51 15 51Z" : "M12 53C0 19 28 5 55 9C57 38 42 59 12 53Z"} className={s.leafBody}/>
   <path d="M9 59 43 23M22 45l-1-16m10 7 15-1" className={s.stem}/>
   {status === "confirmed" && <path d="m28 27 6 6 12-13" className={s.check}/>}
   {status === "review" && <path d="M49 34c0 0-10 12-10 18a10 10 0 0 0 20 0c0-6-10-18-10-18Z" fill="#a8d7f3" stroke="#254f63" strokeWidth="2"/>}
  </>}
  {milestones?.firstCorrect && <path d="m51 2 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" className={s.sparkle}/>}
 </svg>;
}

export function Award({ rank, earned, topicId, seen }: { rank: "doctor" | "professor"; earned: boolean; topicId: string; seen: Set<string> }) {
 const fresh = useFreshGrowth(earned, awardKey(topicId, rank), seen);
 return <svg className={s.award} data-rank={rank} data-earned={earned} data-growing={fresh || undefined} viewBox="0 0 48 52" aria-hidden="true">
  {rank === "doctor" ? <><path d="m13 29-3 20 14-8 14 8-3-20" className={s.ribbon}/><circle cx="24" cy="22" r="17" className={s.medal}/><circle cx="24" cy="22" r="12" fill="none" stroke="currentColor"/><path d="m24 12 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor"/></> : <><path d="M24 46V25m0 14c-11 0-15-6-15-6 10-3 15 6 15 6Z" className={s.flowerStem}/><path d="M24 7C35-4 43 10 35 17C50 20 45 35 34 30C35 46 18 46 18 32C5 42-3 26 11 21C-1 11 14 1 20 12Z" className={s.blossom}/><circle cx="24" cy="23" r="6" className={s.flowerCentre}/></>}
 </svg>;
}


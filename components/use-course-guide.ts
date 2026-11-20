"use client";

import { useEffect, useState, type RefObject } from "react";
import { guideStorageKey, initialGuide, loadGuide, saveGuide, type GuideState } from "@/src/core/course-guide";
function browserStorage() { try { return window.localStorage; } catch { return undefined; } }
export function useCourseGuide({ learnerId, hasActivity, overview, question, answered, targets }: {
 learnerId?: string; hasActivity: boolean; overview: boolean; question: boolean; answered: boolean;
 targets: readonly RefObject<HTMLElement | null>[];
}) {
 const key = guideStorageKey(learnerId);
 const [state, setState] = useState<GuideState>();
 useEffect(() => {
  const value = loadGuide(key, browserStorage()) ?? initialGuide(hasActivity);
  saveGuide(key, value, browserStorage()); setState(value);
 // A mounted player belongs to one learner; activity changes must not reset a pending guide.
 }, [key]);
 function update(value: GuideState) { saveGuide(key, value, browserStorage()); setState(value); }
 useEffect(() => {
  if (question && state?.phase === "overview") update({phase:"hint"});
  else if (answered && state?.phase === "hint") update({phase:"done"});
  else if (overview && state?.phase === "overview" && !targets[state.step]?.current) {
   const next = ([0,1,2] as const).find(step => step > state.step && targets[step]?.current);
   update(next === undefined ? {phase:"hint"} : {phase:"overview",step:next});
  }
 });
 const index: 0|1|2|3|undefined = overview && state?.phase === "overview" ? state.step : question && state?.phase === "hint" ? 3 : undefined;
 const previousStep=state?.phase === "overview" ? ([2,1,0] as const).find(step=>step<state.step && targets[step]?.current) : undefined;
 return {
  index, ready: state !== undefined,
  close: () => update({phase:"dismissed"}),
  next: () => {
   if (state?.phase !== "overview" || state.step === 2) update({phase:state?.phase === "hint" ? "done" : "hint"});
   else update({phase:"overview",step:(state.step+1) as 1|2});
  },
  previous: previousStep !== undefined ? () => update({phase:"overview",step:previousStep}) : undefined,
  replay: (inQuestion: boolean) => update(inQuestion ? {phase:"hint"} : {phase:"overview",step:0}),
 };
}

import type { CourseTopicView, LearningSkillView } from "@/src/core";
import s from "./kids-learning-progress.module.css";
import { GoldCoin, Treasure } from "./kids-adventure";

export const learningStates = { untried: "Да открием", practising: "Откриваме заедно", confirmed: "Вече го умея", review: "Да си припомним" };

export function discoveryProgress(leaves: LearningSkillView[]) {
 return { earned: leaves.reduce((count, leaf) => count + Number(leaf.milestones.started) + Number(!!leaf.milestones.firstCorrect) + Number(leaf.confirmation.earned), 0), total: leaves.length * 3 };
}

export function IslandGoldBar({ title, gold: { earned, total } }: { title: string; gold: CourseTopicView["gold"] }) {
 const progress = Math.min(earned, total);
 return <div className={`${s.discovery} ${s.gold}`}>
  <div className={s.heading}><span className={s.goldAmount} aria-label={`${progress} от ${total} злато`}><GoldCoin/>{progress}/{total}</span></div>
  <div className={s.islandTrack}><div className={s.track} role="progressbar" aria-label={`Злато: ${title}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={progress} aria-valuetext={`${progress} от ${total} злато`}><span style={{ width: `${total ? progress / total * 100 : 0}%` }}/></div><span className={s.chest} role="img" aria-label={progress >= total ? "Съкровището е открито" : "Съкровище в края на острова"} data-open={progress >= total}><Treasure open={progress >= total}/></span></div>
 </div>;
}

export function KidsLearningProgress({ leaf, concise = false }: { leaf: LearningSkillView; concise?: boolean }) {
 const { earned } = discoveryProgress([leaf]);
 const remaining = Math.max(0, leaf.confirmation.target - leaf.confirmation.streak);
 const goal = leaf.confirmation.revisit || !leaf.confirmation.earned
  ? `${leaf.confirmation.revisit ? "Да затвърдим: о" : "О"}ще ${remaining} ${remaining === 1 ? "верен отговор" : "верни отговора"} самостоятелно.`
  : leaf.status === "review" ? "Да си припомним! Откритията ти остават." : undefined;
 const label = leaf.confirmation.revisit ? "Да затвърдим отново" : leaf.confirmation.earned ? "Вече го умея ✓" : leaf.milestones.firstCorrect ? `Първо откритие${leaf.milestones.firstCorrect === "hinted" ? " · С помощ" : ""}` : leaf.milestones.started ? "Първа стъпка ✓" : "Да открием";
 return <div className={s.detail} aria-label={`Стъпки: ${leaf.title}`}>
  {!concise && <div className={s.heading}><span>{label}</span><span>{earned}/3</span></div>}
  <div className={`${s.track} ${s.skillTrack}`} role="progressbar" aria-label={`Открития за умението: ${leaf.title}`} aria-valuemin={0} aria-valuemax={3} aria-valuenow={earned} aria-valuetext={`${earned} от 3 малки открития${leaf.milestones.firstCorrect === "hinted" ? "; първият верен отговор е с помощ" : ""}`}><span style={{ width: `${earned / 3 * 100}%` }}/></div>
  {goal && <p className={s.goal}>{goal}</p>}
 </div>;
}

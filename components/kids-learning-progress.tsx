import type { LearningSkillView } from "@/src/core";
import s from "./kids-learning-progress.module.css";
import { GoldCoin } from "./kids-adventure";

export const learningStates = { untried: "Да открием", practising: "Откриваме заедно", confirmed: "Вече го умея", review: "Да си припомним" };

export function discoveryProgress(leaves: LearningSkillView[]) {
 return { earned: leaves.reduce((count, leaf) => count + Number(leaf.milestones.started) + Number(!!leaf.milestones.firstCorrect) + Number(leaf.confirmation.earned), 0), total: leaves.length * 3 };
}

export function IslandGoldTotal({ title, earned }: { title: string; earned: number }) {
 return <div className={s.gold}>
  <span className={s.goldAmount} aria-label={`${title}: ${earned} злато`}><GoldCoin/>{earned}</span>
 </div>;
}

export function KidsLearningProgress({ leaf, concise = false }: { leaf: LearningSkillView; concise?: boolean }) {
 const { earned } = discoveryProgress([leaf]);
 const remaining = Math.max(0, leaf.confirmation.target - leaf.confirmation.streak);
 const goal = leaf.confirmation.revisit || !leaf.confirmation.earned
  ? `${leaf.confirmation.revisit ? "Да затвърдим: р" : "Р"}еши самостоятелно още ${remaining} ${remaining === 1 ? "различна задача" : "различни задачи"} подред.`
  : leaf.status === "review" ? "Да си припомним! Откритията ти остават." : undefined;
 const label = leaf.confirmation.revisit ? "Да затвърдим отново" : leaf.confirmation.earned ? "Вече го умея ✓" : leaf.milestones.firstCorrect ? `Първо откритие${leaf.milestones.firstCorrect === "hinted" ? " · С помощ" : ""}` : leaf.milestones.started ? "Първа стъпка ✓" : "Да открием";
 return <div className={s.detail} aria-label={`Стъпки: ${leaf.title}`}>
  {!concise && <div className={s.heading}><span>{label}</span><span>{earned}/3</span></div>}
  <div className={`${s.track} ${s.skillTrack}`} role="progressbar" aria-label={`Открития за умението: ${leaf.title}`} aria-valuemin={0} aria-valuemax={3} aria-valuenow={earned} aria-valuetext={`${earned} от 3 малки открития${leaf.milestones.firstCorrect === "hinted" ? "; първият верен отговор е с помощ" : ""}`}><span style={{ width: `${earned / 3 * 100}%` }}/></div>
  {goal && <p className={s.goal}>{goal}</p>}
 </div>;
}

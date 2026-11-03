import type { LearningSkillView } from "@/src/core";
import s from "./kids-learning-progress.module.css";

export const learningStates = { untried: "Да открием", practising: "Откриваме заедно", confirmed: "Вече го умея", review: "Да си припомним" };

export function discoveryProgress(leaves: LearningSkillView[]) {
 return { earned: leaves.reduce((count, leaf) => count + Number(leaf.milestones.started) + Number(!!leaf.milestones.firstCorrect) + Number(leaf.confirmation.earned), 0), total: leaves.length * 3 };
}

export function IslandDiscoveryBar({ title, leaves }: { title: string; leaves: LearningSkillView[] }) {
 const { earned, total } = discoveryProgress(leaves);
 return <div className={s.discovery}>
  <div className={s.heading}><span>Моите малки открития</span><span>{earned}/{total}</span></div>
  <div className={s.track} role="progressbar" aria-label={`Открития: ${title}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={earned} aria-valuetext={`${earned} от ${total} открития`}><span style={{ width: `${total ? earned / total * 100 : 0}%` }}/></div>
 </div>;
}

export function KidsLearningProgress({ leaf }: { leaf: LearningSkillView }) {
 const steps = [
  { label: "Първа стъпка", icon: "🌱", earned: leaf.milestones.started },
  { label: "Първо откритие", icon: "✨", earned: !!leaf.milestones.firstCorrect },
  { label: "Вече го умея", icon: "🍃", earned: leaf.confirmation.earned },
 ];
 const remaining = Math.max(0, leaf.confirmation.target - leaf.confirmation.streak);
 const goal = leaf.confirmation.revisit || !leaf.confirmation.earned
  ? `${leaf.confirmation.revisit ? "Да затвърдим: о" : "О"}ще ${remaining} ${remaining === 1 ? "верен отговор" : "верни отговора"} самостоятелно.`
  : leaf.status === "review" ? "Да си припомним! Листото ти остава зелено." : undefined;
 return <div className={s.detail} aria-label={`Стъпки: ${leaf.title}`}>
  <ol className={s.steps}>{steps.map(step => <li key={step.label} data-earned={step.earned}><span aria-hidden="true">{step.icon}</span> {step.label}{step.earned ? " ✓" : ""}{step.label === "Първо откритие" && leaf.milestones.firstCorrect === "hinted" ? " (С помощ)" : ""}</li>)}</ol>
  {goal && <p className={s.goal}>{goal}</p>}
 </div>;
}

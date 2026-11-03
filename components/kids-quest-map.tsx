import type { CourseAction, CourseTopicView, KidsCourseView } from "@/src/core";
import { Fragment, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { KidsActionBar } from "./kids-action-bar";
import { KidsWorldMap, IslandLandmark } from "./kids-world-map";
import { KidsOwl } from "./kids-owl";
import { Award, Leaf, leafKey, leafPhase } from "./kids-map-decorations";
import { IslandDiscoveryBar, KidsLearningProgress, learningStates } from "./kids-learning-progress";
import s from "./kids.module.css";

export function adventureAchievement(text = "") {
 return text.replace("в този куест.", "в това приключение.");
}

export function Treasure({ open = false }: { open?: boolean }) {
 return <svg className={s.treasure} viewBox="0 0 160 130" width="150" height="122" role="img" aria-label={open ? "Отворено съкровище" : "Съкровището в края на приключението"}>
  {open && <g fill="#f5cf72"><path d="m80 0 5 15 16 1-13 10 4 16-12-10-13 10 5-16-13-10 16-1Z"/><circle cx="35" cy="32" r="5"/><circle cx="128" cy="21" r="4"/></g>}
  <path d={open ? "M22 57 34 18 136 38 138 64Z" : "M22 66Q22 32 55 32H105Q138 32 138 66Z"} fill="#bd8554" stroke="#f0c77a" strokeWidth="5"/>
  <path d="M22 64H138V113Q80 129 22 113Z" fill="#79523b" stroke="#f0c77a" strokeWidth="5"/>
  <path d="M43 66v51m74-51v51" stroke="#e2af65" strokeWidth="9"/><rect x="68" y="65" width="24" height="27" rx="5" fill="#f5cf72"/><circle cx="80" cy="78" r="4" fill="#79523b"/>
 </svg>;
}

export function QuestTrail({ quest }: { quest: NonNullable<KidsCourseView["quest"]> }) {
 return <section className={s.questTrail} aria-label="Пътят на приключението">
  <div className={s.questCaption}><KidsOwl small/><div><strong>Стъпка {quest.step} от 5</strong></div></div>
  <ol className={s.stones}>{Array.from({ length: 5 }, (_, i) => <li key={i} className={i < quest.completed ? s.stoneDone : ""} aria-current={!quest.finished && i === quest.step - 1 ? "step" : undefined}><span aria-hidden="true">{i < quest.completed ? "✓" : i + 1}</span><span className={s.srOnly}>Стъпка {i + 1}{i < quest.completed ? ", задачата е разгледана" : ""}</span></li>)}</ol>
  <div className={s.trailEnd}><Treasure/></div>
 </section>;
}

export function QuestFinish({ view, busy, act, finish }: { view: KidsCourseView; busy: boolean; act: (a: CourseAction) => Promise<void>; finish: () => void }) {
 return <><section className={`${s.reward} ${s.questFinish}`} aria-label="Приключението е завършено">
  <div className={s.chestScene}><KidsOwl/><Treasure open/></div>
  <h2>Приключението е завършено! <span aria-hidden="true">🎉</span></h2><p>{adventureAchievement(view.quest?.achievement)}</p>
  <span className={s.questStamp}>Печат от приключение №{view.stamps?.length}</span>
  <p className={s.small}>Печатът е за завършеното приключение. Бухалите Доктор и Професор показват отделните ти постижения.</p>
  <div className={s.actions}><button className={s.secondary} disabled={busy} onClick={() => void act({ type: "dashboard" })}>Към картата</button><button className={s.quiet} disabled={busy} onClick={finish}>Приключвам за сега</button></div>
 </section><KidsActionBar label="Ново приключение" disabled={busy} onClick={() => void act({ type: "startQuest" })}/></>;
}

const statusLabels = learningStates;
function topicStatus(topic: CourseTopicView): keyof typeof statusLabels {
 if (topic.needsPractice) return "practising";
 if (topic.confirmed === topic.total) return topic.reviewDue ? "review" : "confirmed";
 return topic.leaves?.some(c => c.status !== "untried") ? "practising" : "untried";
}
type MapProps = {
 topics: CourseTopicView[];
 progress: Pick<KidsCourseView, "complete" | "doctors" | "professors" | "professorGoal" | "previouslyCompleted">;
 busy: boolean;
 act: (action: CourseAction) => Promise<void>;
 seenGrowth: Set<string>;
 selection: { topicId?: string; conceptId?: string };
 select: (topicId?: string, conceptId?: string) => void;
};

function IslandDetails({ topic, busy, act, seenGrowth, conceptId, select, close, panelId, showProgress = false }: {
 topic: CourseTopicView; busy: boolean; act: MapProps["act"]; seenGrowth: Set<string>;
 conceptId?: string; select: (conceptId?: string) => void; close: () => void; panelId: string; showProgress?: boolean;
}) {
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.closest("section")?.scrollIntoView?.({ block: "nearest", behavior: "instant" }); }, []);
 return <section className={s.islandPanel} id={panelId} aria-label={`Умения: ${topic.title}`}>
  <button className={s.quiet} onClick={close}>← Към картата</button>
  <div className={s.islandPanelHeading}><KidsOwl small/><h3 ref={heading} tabIndex={-1}>{topic.title}</h3><button className={s.practiceIsland} disabled={busy} onClick={() => void act({ type: "selectTopic", topicId: topic.id })}>Да упражним</button></div>
  {showProgress && <IslandDiscoveryBar title={topic.title} leaves={topic.leaves ?? []}/>}
  <div className={s.islandAwards}>{(["doctor", "professor"] as const).map(rank => <span key={rank} data-earned={topic[rank]}><Award rank={rank} earned={topic[rank]} topicId={topic.id} seen={seenGrowth}/><span><strong>{rank === "doctor" ? "Доктор" : "Професор"}</strong><small>{topic[rank] ? "Постигнато ✓" : "Предстои"}</small></span></span>)}</div>
  <ul className={s.skillRows}>{topic.leaves?.map(leaf => {
   const open = conceptId === leaf.id;
   return <li key={leaf.id}><button className={s.skillRow} aria-expanded={open} aria-controls={open ? `${panelId}-skill` : undefined} onClick={() => select(open ? undefined : leaf.id)}><Leaf key={`${leaf.status}:${leafPhase(leaf)}`} status={leaf.status} milestones={leaf.milestones} growthKey={leafKey(topic.id, leaf.id)} seen={seenGrowth}/><span><strong>{leaf.title}</strong><small>{statusLabels[leaf.status]}</small></span><span className={s.rowArrow} aria-hidden="true">{open ? "−" : "+"}</span></button>
    {open && <div className={s.skillDetail} id={`${panelId}-skill`}><KidsLearningProgress leaf={leaf}/>{leaf.prerequisites.length > 0 && <p>Помагат ти: {leaf.prerequisites.map(p => p.title).join(" · ")}.</p>}</div>}
   </li>;
  })}</ul>
  {topic.doctor && <button className={s.quiet} disabled={busy} onClick={() => void act({ type: "selectTopic", topicId: topic.id, review: true })}>Проверка на запомненото</button>}
  <details className={s.awardExplanation}><summary>Как да стана Доктор и Професор?</summary><p>За Доктор затвърди всички умения на острова. За Професор след това реши самостоятелно две поредни по-трудни задачи от различни умения, ако на острова има повече от едно. Наградите остават твои.</p></details>
 </section>;
}

export function LearningMap({ topics, progress, busy, act, seenGrowth, selection, select }: MapProps) {
 const id = useId(), islands = useRef(new Map<string, HTMLButtonElement>());
 const [mode, setMode] = useState<"world" | "topics">("world");
 const selected = topics.find(topic => topic.id === selection.topicId);
 const close = () => { if (selected) islands.current.get(selected.id)?.focus({ preventScroll: true }); select(); };
 const viewControls = <div className={s.mapModes} role="group" aria-label="Избери изглед">{([['world', 'Карта'], ['topics', 'Теми']] as const).map(([value, label]) => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}</div>;
 const rows = Array.from({ length: Math.ceil(topics.length / 2) }, (_, i) => topics.slice(i * 2, i * 2 + 2));
 return <section className={s.learningWorld} aria-label="Карта на ученето" id="learning-map">
  <div className={s.mapHeading}><span className={s.mapEyebrow}>Светът на бухала</span><h2>Твоите острови на знанието</h2><p>Къде ще откриваме днес? Всеки остров те очаква.</p></div>
  <details className={s.mapAwards}><summary>Бухали Доктор и Професор</summary><section aria-label="Напредък в курса"><h3>{progress.complete ? "Браво! Завърши курса!" : "Твоят път през курса"}</h3><p>Доктор: {progress.doctors} от {topics.length} теми · Професор: {progress.professors} от {progress.professorGoal} за завършване</p><p>Курсът е завършен с всички умения потвърдени, Доктор във всяка тема и Професор в поне половината теми. Постигнатото се запазва.</p>{progress.previouslyCompleted && <p>Предишните ти награди са запазени. Новите умения те очакват.</p>}</section></details>
  {mode === "topics" && viewControls}
  {mode === "world" ? <><KidsWorldMap viewControls={viewControls} topics={topics} selectedId={selected?.id} panelId={`${id}-panel`} seen={seenGrowth} buttons={islands} onSelect={topicId => select(topicId)}/>
   {selected && <IslandDetails key={selected.id} topic={selected} busy={busy} act={act} seenGrowth={seenGrowth} conceptId={selection.conceptId} select={conceptId => select(selected.id, conceptId)} close={close} panelId={`${id}-panel`} showProgress/>}
  </> : <div className={s.islandGrid}>{rows.map((row, rowIndex) => <div className={s.islandMapRow} key={row[0]!.id}>
   {row.map((topic, i) => <Fragment key={topic.id}><section className={s.island} id={`island-${topic.id}`} data-state={topicStatus(topic)} data-selected={selected?.id === topic.id} style={{ order: i * 2 }}>
    <button ref={element => { if (element) islands.current.set(topic.id, element); else islands.current.delete(topic.id); }} className={s.islandSelect} aria-label={topic.title} aria-expanded={selected?.id === topic.id} aria-controls={selected?.id === topic.id ? `${id}-panel` : undefined} onClick={() => selected?.id === topic.id ? close() : select(topic.id)}><span className={s.islandNumber}>Остров {rowIndex * 2 + i + 1}</span><h3>{topic.title}</h3><span className={s.islandOpen}>{selected?.id === topic.id ? "Затвори острова ↑" : "Разгледай острова →"}</span></button>
    <IslandDiscoveryBar title={topic.title} leaves={topic.leaves ?? []}/>
   </section>
   {selected?.id === topic.id && <div className={s.islandPanelSlot} style={{ "--mobile-panel-order": i * 2 + 1 } as CSSProperties}><IslandDetails key={selected.id} topic={selected} busy={busy} act={act} seenGrowth={seenGrowth} conceptId={selection.conceptId} select={conceptId => select(selected.id, conceptId)} close={close} panelId={`${id}-panel`}/></div>}
   </Fragment>)}
  </div>)}</div>}
 </section>;
}

export function TreasureCollection({ stamps, topics }: { stamps: NonNullable<KidsCourseView["stamps"]>; topics: CourseTopicView[] }) {
 if (!stamps.length) return null;
 return <details className={s.treasureCollection}><summary>Моите съкровища <span>{stamps.length}</span></summary><ul>{stamps.map((stamp, i) => <li key={stamp.questId}><div className={s.souvenir} aria-hidden="true"><span>✦</span><IslandLandmark topicId={topics[i % topics.length]?.id ?? "counting"} golden/><span>✧</span></div><div><h3>Приключение {i + 1}</h3><p>{adventureAchievement(stamp.achievement)}</p></div></li>)}</ul></details>;
}

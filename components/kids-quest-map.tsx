import { Button } from "./ui/button";
import type { CourseAction, CourseTopicView, KidsCourseView } from "@/src/core";
import { useEffect, useId, useRef, useState } from "react";
import { KidsActionBar } from "./kids-action-bar";
import { IslandLandmark, KidsWorldMap } from "./kids-world-map";
import { AdventureRoute, AdventureSouvenir, souvenirs, Treasure } from "./kids-adventure";
import { KidsOtter } from "./kids-otter";
import { Award, DiscoveryMarker, leafKey, leafPhase } from "./kids-map-decorations";
import { IslandGoldTotal, learningStates } from "./kids-learning-progress";
import s from "./kids.module.css";

export { Treasure } from "./kids-adventure";

export function adventureAchievement(text = "") {
 return text.replace("в този куест.", "в това приключение.");
}

export function QuestTrail({ quest }: { quest: NonNullable<KidsCourseView["quest"]> }) {
 return <section className={s.questTrail} aria-label="Пътят на приключението">
  <AdventureRoute completed={quest.completed} total={quest.total} compact/>
  <span className={s.questCount}>{quest.completed}/{quest.total} задачи</span>
 </section>;
}

export function QuestFinish({ view, busy, act, finish, map }: { view: KidsCourseView; busy: boolean; act: (a: CourseAction) => Promise<void>; finish: () => void; map: () => void }) {
 return <><section className={`${s.reward} ${s.questFinish}`} aria-label="Приключението е завършено">
  <div className={s.chestScene}><KidsOtter mood="celebrate"/><Treasure open/></div>
  <h2>Приключението е завършено! <span aria-hidden="true">🎉</span></h2><p>{adventureAchievement(view.quest?.achievement)}</p>
  <div className={s.treasureReveal}><AdventureSouvenir index={Math.max(0, (view.stamps?.length ?? 1)-1)}/><span className={s.questStamp}>Твоето съкровище №{view.stamps?.length}</span></div>
  <div className={s.actions}><Button variant="secondary" className={s.secondary} disabled={busy} onClick={map}>Към картата</Button><Button variant="quiet" className={s.quiet} disabled={busy} onClick={finish}>Приключвам засега</Button></div>
 </section>{view.questAvailable !== false ? <KidsActionBar label="Ново приключение" disabled={busy} onClick={() => void act({ type: "startQuest" })}/> : <p className={s.small}>Разгледа всички задачи за момента. Съкровищата ти остават!</p>}</>;
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
 selection: { topicId?: string };
 select: (topicId?: string) => void;
 viewMode?: "world" | "topics";
 setViewMode?: (mode: "world" | "topics") => void;
};

function IslandDetails({ topic, busy, act, seenGrowth, close, panelId }: {
 topic: CourseTopicView; busy: boolean; act: MapProps["act"]; seenGrowth: Set<string>;
 close: () => void; panelId: string;
}) {
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.closest("section")?.scrollIntoView?.({ block: "nearest", behavior: "instant" }); }, []);
 return <section className={s.islandPanel} id={panelId} aria-label={`Умения: ${topic.title}`}>
  <Button variant="quiet" className={s.quiet} onClick={close}>← Към картата</Button>
  <div className={s.focusedIslandArt} aria-hidden="true"><svg viewBox="-110 -65 220 140" focusable="false"><ellipse cy="29" rx="104" ry="40" fill="#d6ebeb"/><path d="M-85 20C-100-7-54-35-22-27 5-47 47-30 65-14c47 12 40 41 15 53-29 19-55 8-83 13-35 6-83-6-82-32Z" fill="#a9c7a9"/><IslandLandmark topicId={topic.id} golden={topic.professor}/></svg></div>
  <div className={s.islandPanelHeading}><KidsOtter small/><h3 ref={heading} tabIndex={-1}>{topic.title}</h3><Button variant="primary" className={s.practiceIsland} disabled={busy} onClick={() => void act({ type: "selectTopic", topicId: topic.id })}>Към задачите</Button></div>
  <IslandGoldTotal title={topic.title} earned={topic.gold.earned}/>
  {(topic.doctor || topic.professor) && <div className={s.islandAwards} aria-label="Моите награди">{(["doctor", "professor"] as const).filter(rank => topic[rank]).map(rank => <span key={rank} data-earned="true"><Award rank={rank} earned topicId={topic.id} seen={seenGrowth}/><strong>{rank === "doctor" ? "Доктор" : "Професор"} ✓</strong></span>)}</div>}
  <ul className={s.skillRows}>{topic.leaves?.map(leaf => <li key={leaf.id}>
   <button className={s.skillRow} disabled={busy} aria-label={`Упражнения: ${leaf.title}`} onClick={() => void act({ type: "selectTopic", topicId: topic.id, skillId: leaf.id })}>
    <DiscoveryMarker confirmed={leaf.confirmation.earned} key={`${leaf.status}:${leafPhase(leaf)}`} status={leaf.status} milestones={leaf.milestones} growthKey={leafKey(topic.id, leaf.id)} seen={seenGrowth}/>
    <span><strong>{leaf.title}</strong>{leaf.status !== "untried" && <small>{statusLabels[leaf.status]}</small>}</span><span className={s.rowArrow} aria-hidden="true">→</span>
   </button>
  </li>)}</ul>
  {topic.doctor && <Button variant="quiet" className={s.quiet} disabled={busy} onClick={() => void act({ type: "selectTopic", topicId: topic.id, review: true })}>Да си припомним</Button>}
 </section>;
}

export function LearningMap({ topics, progress, busy, act, seenGrowth, selection, select, viewMode, setViewMode }: MapProps) {
 const id = useId(), islands = useRef(new Map<string, HTMLButtonElement>());
 const [localMode, setLocalMode] = useState<"world" | "topics">("world");
 const mode=viewMode ?? localMode, setMode=setViewMode ?? setLocalMode;
 const selected = topics.find(topic => topic.id === selection.topicId);
 const returnFocus=useRef<string | undefined>(undefined);
 useEffect(()=>{if(!selected && returnFocus.current){islands.current.get(returnFocus.current)?.focus({preventScroll:true});returnFocus.current=undefined;}},[selected,mode]);
 const close = () => { returnFocus.current=selected?.id; select(); };
 const viewControls = <div className={s.mapModes} role="group" aria-label="Избери изглед">{([['world', 'Карта'], ['topics', 'Теми']] as const).map(([value, label]) => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}</div>;
 return <section className={s.learningWorld} data-focused={!!selected} aria-label="Карта на ученето" id="learning-map">
  {selected ? <IslandDetails key={selected.id} topic={selected} busy={busy} act={act} seenGrowth={seenGrowth} close={close} panelId={`${id}-panel`}/> : <>
   <div className={s.mapHeading}><h2 tabIndex={-1}>Острови на откритията</h2></div>
   {(progress.doctors > 0 || progress.professors > 0) && <details className={s.mapAwards}><summary>Моите награди</summary><section aria-label="Напредък в курса">{progress.complete && <h3>Браво! Завърши курса!</h3>}<p>{[progress.doctors > 0 ? `Доктор в ${progress.doctors} теми` : undefined, progress.professors > 0 ? `Професор в ${progress.professors} теми` : undefined].filter(Boolean).join(" · ")}</p>{progress.previouslyCompleted && <p>Предишните ти награди са запазени. Новите умения те очакват.</p>}</section></details>}
   {mode === "world" ? <KidsWorldMap viewControls={viewControls} topics={topics} panelId={`${id}-panel`} seen={seenGrowth} buttons={islands} onSelect={topicId => select(topicId)}/> : <>
    {viewControls}<div className={s.islandGrid}>{topics.map(topic => <section key={topic.id} className={s.island} id={`island-${topic.id}`} data-state={topicStatus(topic)}>
     <button ref={element => { if (element) islands.current.set(topic.id, element); else islands.current.delete(topic.id); }} type="button" className={s.islandSelect} aria-label={topic.title} onClick={() => select(topic.id)}><h3>{topic.title}</h3></button>
     <IslandGoldTotal title={topic.title} earned={topic.gold.earned}/>
    </section>)}</div>
   </>}
  </>}
 </section>;
}

export function TreasureCollection({ stamps }: { stamps: NonNullable<KidsCourseView["stamps"]>; topics?: CourseTopicView[] }) {
 if (!stamps.length) return null;
 return <details className={s.treasureCollection}><summary>Моите съкровища <span>{stamps.length}</span></summary><ul>{souvenirs.map((name, i) => { const count = stamps.filter((_, index) => index % souvenirs.length === i).length; return count ? <li key={name}><div className={s.souvenir}><AdventureSouvenir index={i}/></div><div><h3>{name}</h3><p>×{count}</p></div></li> : null; })}</ul></details>;
}

"use client";

import { Input } from "./ui/field";
import { Badge } from "./ui/badge";
import { Message } from "./ui/message";
import { Button } from "./ui/button";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import Image from "next/image";
import { publicImage } from "@/src/core/public-images";
import {competitions, competitionDifficultyLabel, DEFAULT_COMPETITION_ID} from "@/src/core/competitions";
import type {Competition} from "@/src/core/competitions";
import type { CourseAction, KidsCourseView, KidsSessionSummary, LearningSkillView } from "@/src/core";
import { LearningMap, QuestTrail, QuestFinish, TreasureCollection } from "./kids-quest-map";
import { KidsActionBar } from "./kids-action-bar";
import { AppMenu } from "./app-menu";
import { KidsOtter } from "./kids-otter";
import type {Appreciation} from "../src/core/accomplishments";
import { PersonalProgressDialog } from "./personal-progress-dialog";
import { CompetitionPreparation } from "./competition-preparation";
import { KidsLearningProgress } from "./kids-learning-progress";
import { AdventureHome, GoldReward, GoldWallet, ProblemGoldPreview } from "./kids-adventure";
import { knowledgeGrowthKeys } from "./kids-map-decorations";
import { kidsOutcomeLabels } from "./kids-player";
import s from "./kids.module.css";

export interface KidsCoursePlayerProps { initialView: KidsCourseView; sessions?: KidsSessionSummary[]; learnerId?: string; learnerNickname?: string; competitionId?: string; competitionChoices?: Competition[]; refreshing?: boolean; refreshedView?: KidsCourseView; onViewChange?:(view:KidsCourseView)=>void; onCompetitionChange?:(id:string)=>void; navigationGuard?:{current:(()=>Promise<boolean>)|null}; onBusyChange?:(busy:boolean)=>void; onAccessDenied?:(status:number)=>void }
export function KidsCoursePlayer({ initialView, sessions = [], learnerId, learnerNickname, competitionId = DEFAULT_COMPETITION_ID, competitionChoices = [], refreshing=false, refreshedView, onViewChange, onCompetitionChange, navigationGuard, onBusyChange, onAccessDenied }: KidsCoursePlayerProps) {
	const [view, setView] = useState(initialView), [dashboard, setDashboard] = useState(true);
 const [refreshEpoch,setRefreshEpoch]=useState(0);
 const [personalProgress,setPersonalProgress]=useState<Appreciation[]>();
 const celebratedProgress=useRef(new Set<string>());
	const [saving, setBusy] = useState(false), [error, setError] = useState("");
 const busy=saving||refreshing;
	const [mapTopic, setMapTopic] = useState<string>();
 const [mapMode,setMapMode]=useState<"world"|"topics">("world");
 const [dashboardSection,setDashboardSection]=useState<"home"|"map">("home");
 const mapScroll=useRef<"focus"|"scroll">(undefined);
 const viewRef = useRef(initialView);
 const commandQueue = useRef<Promise<unknown>>(Promise.resolve());
 const pendingDraft = useRef<Extract<CourseAction, { type: "saveDraft" }>>(undefined);
 const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
 const dashboardScroll = useRef<number | undefined>(undefined);
 const router=useRouter(), leaving=useRef(false), accessDenied=useRef(false);

	const [seenMapGrowth] = useState(() => new Set(knowledgeGrowthKeys(initialView.topics)));
	const inFlight = useRef(false), heading = useRef<HTMLHeadingElement>(null);
 useEffect(()=>{onBusyChange?.(saving);},[saving,onBusyChange]);
 useEffect(()=>{if(refreshedView && refreshedView.revision>=viewRef.current.revision){const changed=refreshedView.revision!==viewRef.current.revision;viewRef.current=refreshedView;setView(refreshedView);if(changed)setRefreshEpoch(value=>value+1);}},[refreshedView]);
 useEffect(()=>{if(!navigationGuard)return;navigationGuard.current=flushBeforeNavigation;return()=>{navigationGuard.current=null;};},[navigationGuard]);
	const topic = view.topics.find(t => t.id === view.active?.topicId);
 const activeLeaf = topic?.leaves?.find(leaf => leaf.id === view.task?.skillId);
	const stageKey = `${dashboard}:${view.stage}:${view.task?.key}:${view.paused}`;
	useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [stageKey]);
 useEffect(() => {
  if (dashboardScroll.current !== undefined) { window.scrollTo?.(0, dashboardScroll.current); dashboardScroll.current = undefined; }
  if (dashboard && mapScroll.current) { const map=document.getElementById("learning-map"); map?.scrollIntoView?.({block:"start",behavior:"instant"}); if(mapScroll.current==="focus") map?.querySelector<HTMLElement>("h2, h3")?.focus({preventScroll:true}); mapScroll.current=undefined; }
 }, [stageKey,dashboard,dashboardSection,mapTopic]);
 async function flushBeforeNavigation() {
  clearTimeout(draftTimer.current);
  const waiting=inFlight.current;
  if((await commandQueue.current===false&&waiting)||accessDenied.current)return false;
  inFlight.current=true;setBusy(true);
  try{return await enqueue();}finally{inFlight.current=false;setBusy(false);}
 }
 function leave(event:MouseEvent<HTMLAnchorElement>,href:string) {
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button>0)return;
  event.preventDefault();
  if(leaving.current)return;
  leaving.current=true;
  void flushBeforeNavigation().then(saved=>{if(saved&&!accessDenied.current)router.push(href);else leaving.current=false;});
 }
 function navigate(changeView:()=>void) {
  if(inFlight.current||refreshing) return;
  inFlight.current=true; setBusy(true); clearTimeout(draftTimer.current);
  void enqueue().then(saved=>{if(saved) changeView();}).finally(()=>{inFlight.current=false;setBusy(false);});
 }
 function showHome() { navigate(()=>{setDashboardSection("home"); dashboardScroll.current=0; setDashboard(true);}); }
 function showMap(topicId:string|null=mapTopic ?? null) { navigate(()=>{setMapTopic(topicId ?? undefined); setDashboardSection("map"); mapScroll.current="focus"; setDashboard(true);}); }
 function selectIsland(topicId?:string){setMapTopic(topicId);setDashboardSection("map");mapScroll.current="scroll";}
 function draftChanged(draft: Extract<CourseAction, { type: "saveDraft" }>) {
  pendingDraft.current = draft;
  clearTimeout(draftTimer.current);
  draftTimer.current = setTimeout(() => { void enqueue(); }, 400);
 }
 useEffect(() => {
  const flush = () => { void enqueue(); };
  const hide = () => { if (document.visibilityState === "hidden") flush(); };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", hide);
  return () => { clearTimeout(draftTimer.current); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hide); };
 // The mounted player owns one child and competition; queued requests use viewRef.
 }, []);
 function act(action: CourseAction): Promise<void> {
  if (inFlight.current||refreshing) return Promise.resolve();
  inFlight.current = true; setBusy(true);
  return enqueue(action).then(() => {}).finally(() => { inFlight.current = false; setBusy(false); });
 }
 function enqueue(action?: CourseAction): Promise<boolean> {
  const job = commandQueue.current.then(async () => {
   const draft = pendingDraft.current, revision = viewRef.current.revision;
   pendingDraft.current = undefined;
   try {
    const answerIncludesDraft=draft&&action?.type==="answer"&&action.taskKey===draft.taskKey&&
     draft.partIndex===(viewRef.current.task?.part?viewRef.current.task.part.index-1:0)&&
     action.answers.length===draft.answers.length&&action.answers.every((value,index)=>value===draft.answers[index]);
    if (draft&&!answerIncludesDraft) await send(draft);
    if (action) await send(action);
    return true;
   } catch {
    // Retain unsaved input for an explicit retry, without overwriting newer remote work.
    if(draft && !pendingDraft.current && viewRef.current.revision===revision) pendingDraft.current=draft;
    return false;
   }
  });
  commandQueue.current = job;
  return job;
 }
 async function send(action: CourseAction) {
  setError("");
		const receive = (next: KidsCourseView, acceptedAnswer = false) => {
   if(accessDenied.current)return;
   const previous=viewRef.current.task;
   if(acceptedAnswer && action.type==="answer" && previous?.key===action.taskKey && !previous.outcome && next.task?.key===action.taskKey && (next.appreciations?.length || next.task.personalProgress) && !celebratedProgress.current.has(action.taskKey)) {
    celebratedProgress.current.add(action.taskKey); setPersonalProgress(next.appreciations?.length?next.appreciations:[{kind:"hint-independent"}]);
   }
   viewRef.current = next; setView(next); onViewChange?.(next);
  };
  const checked = (response:Response) => {
   if([401,403,428].includes(response.status)){
    accessDenied.current=true;onAccessDenied?.(response.status);
    throw new Error("Достъпът е прекратен.");
   }
   return response;
  };
		try {
			const post = async (revision: number) => checked(await fetch("/api/kids/course", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", "X-Maths-Competition": competitionId, ...(learnerId ? {"X-Maths-Child": learnerId} : {}) }, body: JSON.stringify({ revision, action }) }));
			const opensPractice = action.type === "selectTopic" || action.type === "resume" || action.type === "startQuest";
			let response = await post(viewRef.current.revision);
			let body = await response.json() as { course?: KidsCourseView; error?: string };
			if (response.status === 409 && opensPractice) {
				const latest = checked(await fetch("/api/kids/course", { cache: "no-store", headers: {"X-Maths-Competition":competitionId,...(learnerId ? {"X-Maths-Child":learnerId} : {})} }));
				const refreshed = await latest.json() as { course?: KidsCourseView };
				if (latest.ok && refreshed.course && refreshed.course.revision !== viewRef.current.revision) {
					receive(refreshed.course);
					// Only retry navigation once; answers and task steps keep their revision guard.
					response = await post(refreshed.course.revision);
					body = await response.json() as typeof body;
				}
			}
			if (!response.ok || !body.course) {
				throw new Error(response.status === 409 || /чернова|съвместима версия/i.test(body.error ?? "") ? "Не успяхме да продължим. Презареди страницата." : body.error || "Не успяхме да запазим. Опитай отново.");
			}
			receive(body.course, true);
			if (opensPractice) { setDashboard(false); dashboardScroll.current = 0; }
			if (action.type === "selectTopic") setMapTopic(action.topicId);
   if (action.type === "resume" && !body.course.inQuest) setMapTopic(body.course.active?.topicId);
		} catch (error) {
   if(accessDenied.current)throw error;
			// A lost response may already have saved the answer. Reconcile without replaying it.
			try {
				const latest = checked(await fetch("/api/kids/course", { cache: "no-store", headers: {"X-Maths-Competition":competitionId,...(learnerId ? {"X-Maths-Child":learnerId} : {})} }));
				if (latest.ok) receive((await latest.json() as { course: KidsCourseView }).course);
			} catch { /* A later command still has the revision guard. */ }
			setError(error instanceof Error ? error.message : "Провери връзката и опитай отново.");
   throw error;
		}
	}
	const showDashboard = dashboard || !view.active;
 const focusedIsland=dashboardSection==="map" && !!mapTopic;
 const competition = competitionChoices.find(item => item.id === competitionId) ?? competitions.find(item => item.id === competitionId);
	return <main lang="bg" className={s.shell} aria-busy={busy}><div className={s.content}>
		<header className={s.header}>{!showDashboard && <nav className={s.headerNavigation} aria-label="Навигация"><Button variant="secondary" className={s.secondary} disabled={busy} onClick={showHome}>← Начало</Button><Button variant="quiet" className={s.quiet} disabled={busy} onClick={() => showMap()}>Карта</Button></nav>}<div className={s.brand}>Състезателна математика{!showDashboard && competition && <span className={s.competitionTitle}>{competition.title} · {competition.grade}. клас</span>}</div><div className={s.headerUtilities}><GoldWallet balance={view.gold ?? 0}/><AppMenu childId={learnerId} competitionId={competitionId} taskKey={!showDashboard && !view.paused ? view.task?.key : undefined} allowLogout={!!learnerId} allowFeedback={!!learnerId} onNavigate={leave} beforeLogout={flushBeforeNavigation}/></div>
			{!showDashboard && <div className={s.headerActions}>
				{!view.paused && <Button variant="secondary" className={s.secondary} disabled={busy} onClick={() => void act({ type: "pause" })}>Почивка</Button>}</div>}
		</header>
		{error && <Message tone="error" className={s.courseError}><p>{error}</p>{error === "Не успяхме да продължим. Презареди страницата." && <Button variant="secondary" className={s.secondary} onClick={() => window.location.reload()}>Презареди страницата</Button>}</Message>}
		{showDashboard ? <>
   {competitionChoices.length > 1 && <CompetitionPicker choices={competitionChoices} competitionId={competitionId} disabled={saving} onSelect={onCompetitionChange}/>}
   {!focusedIsland && <AdventureHome view={view} nickname={learnerNickname} busy={busy} start={() => void act({ type: "startQuest" })} resumeTopic={() => void act({ type: "resume" })} headingRef={heading}/>}
   {!focusedIsland && <TreasureCollection stamps={view.stamps ?? []} />}
   <LearningMap topics={view.topics} progress={view} busy={busy} act={act} seenGrowth={seenMapGrowth} selection={{topicId:focusedIsland?mapTopic:undefined}} select={selectIsland} viewMode={mapMode} setViewMode={setMapMode}/>

			{!focusedIsland && sessions.length > 0 && <details className={s.card}><summary>Предишни кратки занимания</summary><ul className={s.list}>{sessions.slice(0, 3).map(session => <li key={session.id}><Link href={`/kids/${session.id}`} className={s.secondary}>Отвори заниманието от {new Date(session.updatedAt).toLocaleDateString("bg-BG")}</Link></li>)}</ul></details>}
   {!focusedIsland && <CompetitionPreparation progress={view.preparation} href={`/progress?competition=${encodeURIComponent(competitionId)}${learnerId ? `&child=${encodeURIComponent(learnerId)}` : ""}`} onNavigate={event => leave(event, `/progress?competition=${encodeURIComponent(competitionId)}${learnerId ? `&child=${encodeURIComponent(learnerId)}` : ""}`)}/>}
		</> : view.paused ? <section className={s.card}><h1 ref={heading} tabIndex={-1} className={s.title}>Време за почивка</h1><p>Запазихме задачата и стъпките от решението. Продължи, когато поискаш.</p><KidsActionBar label="Продължи" disabled={busy} onClick={() => void act({ type: "resume" })}/></section> : <>
			{view.stage!=="questComplete" && <h1 ref={heading} tabIndex={-1} className={`${s.title} ${s.practiceTitle}`}>{topic?.title}</h1>}
			{view.inQuest && view.quest && <QuestTrail quest={view.quest}/>}
   {view.stage === "questComplete" && <QuestFinish view={view} busy={busy} act={act} finish={showHome} map={() => showMap(null)}/>}
			{view.active?.mode === "review" && <p className={s.small}>Да си припомним.</p>}
			{view.exhausted && <section className={s.card}><h2>{view.active?.skillId ? "За момента няма следваща задача в тази подтема." : "За момента няма следваща задача за тази стъпка."}</h2><KidsActionBar label={view.active?.skillId ? "Към острова" : "Към картата"} disabled={busy} onClick={() => showMap(view.active?.skillId ? view.active.topicId : null)}/></section>}
			{view.lesson && <section className={s.card}><h2>Да научим: {view.lesson.title}</h2><ol className={s.steps}>{view.lesson.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>{view.lesson.illustration && <TeachingFigure figure={view.lesson.illustration} />}<p className={s.small}>Стъпка {view.lesson.steps.length} от {view.lesson.total}</p><KidsActionBar label={view.lesson.steps.length < view.lesson.total ? "Следваща стъпка" : view.inQuest && view.quest?.completed === view.quest?.total ? "Отвори съкровището" : "Да пробвам нова задача"} disabled={busy} onClick={() => void act({ type: "lessonNext" })}/></section>}
			{view.task && <section className={`${s.card} ${s.taskCard}`}>{topic?.skills.find(skill => skill.id === view.task?.skillId)?.title !== topic?.title && <h2 className={s.taskSkill}>{topic?.skills.find(skill => skill.id === view.task?.skillId)?.title}</h2>}<CourseQuestion key={`${view.task.key}:${view.task.part?.index ?? 0}:${refreshEpoch}`} task={view.task} competitionId={competitionId} leaf={activeLeaf} inQuest={view.inQuest} goldGain={view.goldGain} busy={busy} act={act} draftChanged={draftChanged} />
				{view.reward && <div className={s.reward} role="status"><KidsOtter rank={view.reward.rank} mood="celebrate" /><h2>Браво! Вече си {view.reward.rank === "doctor" ? "доктор" : "професор"} по {view.reward.topic}! <span aria-hidden="true">🎓</span></h2></div>}
				{view.complete && view.reward && <div className={s.feedback}><h2>Завърши курса! <span aria-hidden="true">🎉</span></h2></div>}
				{view.task.outcome && <div className={s.actions}><KidsActionBar label={view.inQuest && view.quest?.completed === view.quest?.total ? "Отвори съкровището" : view.task.connected ? view.task.connected.index < view.task.connected.total ? "Следващо подусловие" : "Следваща задача" : view.task.part?.completed ? "Следващо подусловие" : view.task.outcome === "independent" ? "Следваща задача" : "Продължи"} disabled={busy} onClick={() => void act({ type: "nextQuestion" })}/><Button variant="secondary" className={s.secondary} disabled={busy} onClick={() => showMap()}>Към картата</Button></div>}
			</section>}
		</>}
  {personalProgress && <PersonalProgressDialog appreciations={personalProgress} onDismiss={()=>{setPersonalProgress(undefined);heading.current?.focus({preventScroll:true});}}/>}
	</div></main>;
}

export function CompetitionPicker({ choices, competitionId, disabled=false, onSelect }: { choices: Competition[]; competitionId: string; disabled?:boolean; onSelect?:(id:string)=>void }) {
 const [open, setOpen] = useState(false);
 const container = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
 const id = useId();
 const current = choices.find(item => item.id === competitionId);
 useEffect(() => {
  if (!open) return;
  const dismiss = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
  document.addEventListener("pointerdown", dismiss);
  return () => document.removeEventListener("pointerdown", dismiss);
 }, [open]);
 return <div className={s.competitionPicker} ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }} onKeyDown={event => {
  if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
 }}>
  <button ref={trigger} disabled={disabled} className={s.competitionTrigger} aria-label={`Избери състезание: ${current?.title ?? "Състезания"}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
   <span className={s.competitionName}><small>Състезание · 4. клас</small><strong>{current?.title ?? "Избери състезание"}</strong></span>
   <Badge tone="warning">{competitionDifficultyLabel(current?.difficulty ?? "hard")}</Badge><span className={s.competitionChevron} aria-hidden="true">⌄</span>
  </button>
  {open && <nav id={id} className={s.competitionOptions} aria-label="Състезания">{choices.map(item => <Link key={item.id} prefetch={onSelect?false:undefined} className={s.competitionOption} aria-current={item.id === competitionId ? "page" : undefined} href={`/?competition=${encodeURIComponent(item.id)}`} onClick={event => {if(disabled){event.preventDefault();return;}if(onSelect&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onSelect(item.id);}setOpen(false);}}>
   <span>{item.title}</span><Badge tone="warning">{competitionDifficultyLabel(item.difficulty)}</Badge><span className={s.competitionCheck} aria-hidden="true">{item.id === competitionId ? "✓" : ""}</span>
  </Link>)}</nav>}
 </div>;
}

function CourseQuestion({ task, competitionId, leaf, inQuest, goldGain, busy, act, draftChanged }: { task: NonNullable<KidsCourseView["task"]>; competitionId: string; leaf?: LearningSkillView; inQuest?: boolean; goldGain?: KidsCourseView["goldGain"]; busy: boolean; act: (action: CourseAction) => Promise<void>; draftChanged: (draft: Extract<CourseAction, { type: "saveDraft" }>) => void }) {
	const [choice, setChoice] = useState<number | undefined>(() => task.draft?.[0] ? Number(task.draft[0]) : undefined), [values, setValues] = useState<string[]>(task.answers ?? task.draft ?? task.fields.map(() => ""));
	const [field, setField] = useState(0);
 const reasoning = task.reasoning ?? "";
 const competitionTitle = competitions.find(item => item.id === competitionId)?.title ?? "Състезание";
 const sourceLabel = `${task.sourceIsPractice ? "По " : ""}${competitionTitle}${task.sourceYear ? ` · ${task.sourceYear}` : ""}`;
	const done = !!task.outcome;
	const feedbackHeading = useRef<HTMLHeadingElement>(null);
	useEffect(() => { if (task.outcome) feedbackHeading.current?.focus(); }, [task.outcome]);
 const previousHint = useRef(task.hintLevel);
 useEffect(() => {
  if (previousHint.current !== task.hintLevel) setChoice(undefined);
  previousHint.current = task.hintLevel;
 }, [task.hintLevel]);
 function saveDraft(answers: string[]) { draftChanged({ type: "saveDraft", taskKey: task.key, partIndex: (task.part?.index ?? 1) - 1, answers }); }
 function updateValues(next: string[]) { setValues(next); saveDraft(next); }
	const ready = task.options ? choice !== undefined : values.every(v => /^\d+(?:[.,]\d{1,2})?$/.test(v));
 const question = task.connected ? connectedStatement(task).instruction : task.text;
	function digit(value: string) { updateValues(values.map((s, i) => i !== field ? s : value === "back" ? s.slice(0, -1) : (s + value).slice(0, 12))); }
	return <>
		{task.connected && <ConnectedProblemContext task={task}/>}
		{task.connected && task.connected.total > 1 && <p className={s.connectedPart} role="status">Подусловие {task.connected.index} от {task.connected.total}</p>}
		{question && <p className={s.question}>{question}</p>}
  {task.part && !task.connected && <p className={s.small} role="status">Отговор {task.part.index} от {task.part.total}</p>}
		{task.figure && !task.connected && <figure className={s.figure}><Image src={publicImage(task.figure.src)} alt={task.figure.alt} width={360} height={360} unoptimized /><figcaption>{task.source.startsWith("Учебно") ? "Учебна схема; числата са в условието." : "Оригинален чертеж. Не измервай по изображението."}</figcaption></figure>}
		{task.options ? <div className={s.options} role="group" aria-label="Отговори">{task.options.map((option, index) => <button key={index} className={s.option} aria-pressed={done ? task.answers?.[0] === String(index) : choice === index} disabled={busy || done} onClick={() => { setChoice(index); saveDraft([String(index)]); }}><span className={s.letter}>{["А", "Б", "В", "Г"][index]})</span>{option}</button>)}</div> : <>
			<div className={s.numberFields}>{task.fields.map((item, i) => <label key={i} className={s.numberLabel}>{item.label}<Input aria-label={item.label} type="text" inputMode="decimal" autoComplete="off" maxLength={12} value={values[i] ?? ""} disabled={busy || done} onFocus={() => setField(i)} onChange={e => { const value = e.target.value; if (/^[\d.,]*$/.test(value)) updateValues(values.map((v, n) => n === i ? value : v)); }} /></label>)}</div>
			{!done && <div className={s.keypad} role="group" aria-label={`Клавиатура: ${task.fields[field]?.label}`}>{["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "back"].map(key => <Button variant="secondary" key={key} className={s.secondary} disabled={busy} onClick={() => digit(key)} aria-label={key === "back" ? "Изтрий последната цифра" : key === "," ? "Десетична запетая" : key}>{key === "back" ? "⌫" : key}</Button>)}</div>}
		</>}
		{!done && !!task.solutionParts?.length && <aside className={s.hint} aria-label="Подсказка" aria-live="polite"><h3>Подсказка · {task.solutionParts.length} от 3</h3><ol className={s.steps}>{task.solutionParts.map((part, i) => <li key={i}><strong>{part.title}</strong>{part.paragraphs.map((text, n) => <p key={n}>{text}</p>)}</li>)}</ol></aside>}
		{!inQuest && !done && leaf && <KidsLearningProgress leaf={leaf}/>}
  {!done && ((task.hintLevel ?? 0) >= 3 ? <p className={s.small} role="status">Без злато след третата подсказка</p> : task.goldReward && <ProblemGoldPreview reward={task.goldReward}/>)}
  {!done && <div className={s.actions}><KidsActionBar label="Провери отговора" disabled={busy || !ready} onClick={() => { if (ready) void act({ type: "answer", taskKey: task.key, answers: task.options ? [String(choice)] : values, reasoning }); }} secondary={{label:task.hintLevel ? "Следваща подсказка" : "Подсказка",disabled:busy || (task.hintLevel ?? 0) >= 3,onClick:() => { setChoice(undefined); if (task.options) saveDraft([""]); void act({ type: "hint", taskKey: task.key, reasoning }); }}}/><Button variant="quiet" className={s.quiet} disabled={busy} onClick={() => void act({ type: "reveal", taskKey: task.key, reasoning })}>Покажи решението</Button></div>}
		{task.outcome && <div className={s.feedback} role="status"><div className={s.feedbackHeading}><KidsOtter small mood={task.outcome === "independent" || task.outcome === "hinted" ? "celebrate" : "support"}/><h3 ref={feedbackHeading} tabIndex={-1}>{task.outcome === "incorrect" ? "Отговорът не е верен." : task.outcome === "hinted" ? "Верен отговор с помощ" : kidsOutcomeLabels[task.outcome]}</h3></div>{task.outcome === "incorrect" && <p>Нека разгледаме решението стъпка по стъпка.</p>}{goldGain && <GoldReward gain={goldGain} concise/>}{leaf && <KidsLearningProgress leaf={leaf} concise/>} {task.outcome === "independent" || task.outcome === "hinted" ? <details><summary>Виж решението</summary><ol className={s.steps}>{task.explanation?.map((step, i) => <li key={i}>{step}</li>)}</ol>{task.teachingFigure && <TeachingFigure figure={task.teachingFigure} />}</details> : <ol className={s.steps}>{task.explanation?.map((step, i) => <li key={i}>{step}</li>)}</ol>}{task.outcome !== "independent" && task.outcome !== "hinted" && task.teachingFigure && <TeachingFigure figure={task.teachingFigure} />}</div>}
		<p className={s.small}>{task.sourceProblemId ? <a href={`/sources?competition=${encodeURIComponent(competitionId)}&problem=${encodeURIComponent(task.sourceProblemId)}`} target="_blank" rel="noopener noreferrer">{sourceLabel}</a> : sourceLabel}</p>
	</>;
}

function connectedStatement(task: NonNullable<KidsCourseView["task"]>) {
 const text = task.connected!.text;
 // A few natural parts append answer-entry instructions that are not in the original statement.
 const current = text.includes(task.text) ? task.text : task.text.split("\n\n")[0]!;
 const start = text.indexOf(current);
 if (start < 0) return { before: text, current: "", after: "", instruction: task.text };
 return { before: text.slice(0, start), current, after: text.slice(start + current.length), instruction: task.text.slice(current.length).trim() };
}

function ConnectedProblemContext({ task }: { task: NonNullable<KidsCourseView["task"]> }) {
 const connected = task.connected!;
 const statement = connectedStatement(task);
 const figures = [...new Map([...(connected.figures ?? []), ...(task.figure ? [task.figure] : [])].map(figure => [figure.src, figure])).values()];
 return <div className={s.connectedContext}>
  <p className={s.question}>{statement.before}{statement.current && (connected.total > 1 ? <span className={s.currentStatement} aria-current="step">{statement.current}</span> : statement.current)}{statement.after}</p>
  {figures.map(figure => <figure key={figure.src} className={s.figure}><Image src={publicImage(figure.src)} alt={figure.alt} width={360} height={360} unoptimized/><figcaption>{task.source.startsWith("Учебно") ? "Учебна схема; числата са в условието." : "Оригинален чертеж. Не измервай по изображението."}</figcaption></figure>)}
  {connected.completed.length > 0 && <details className={s.connectedDisclosure}><summary>Предишни подусловия · {connected.completed.length}</summary><ol className={s.completedParts}>{connected.completed.map(part => <li key={part.id}><p>{part.text}</p><strong>{kidsOutcomeLabels[part.outcome]}</strong>{part.answers.length > 0 && <dl>{part.fields.map((field, index) => <div key={index}><dt>{field.label}</dt><dd>{part.answers[index] ?? "-"}</dd></div>)}</dl>}<details><summary>Виж решението</summary><ol className={s.steps}>{part.explanation.map((step, index) => <li key={index}>{step}</li>)}</ol></details></li>)}</ol></details>}
 </div>;
}

function TeachingFigure({ figure }: { figure: NonNullable<KidsCourseView["lesson"]>["illustration"] }) {
	if (!figure) return null;
	return <figure className={`${s.figure} ${s.teachingFigure}`}><Image src={publicImage(figure.src)} alt={figure.alt} width={640} height={270} unoptimized /><figcaption>Схема към обяснението.</figcaption></figure>;
}

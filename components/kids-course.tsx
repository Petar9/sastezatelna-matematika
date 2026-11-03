"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {DEFAULT_COMPETITION_ID} from "@/src/core/competitions";
import type {Competition} from "@/src/core/competitions";
import type { CourseAction, KidsCourseView, KidsSessionSummary } from "@/src/core";
import { LearningMap, QuestTrail, QuestFinish, TreasureCollection } from "./kids-quest-map";
import { KidsActionBar } from "./kids-action-bar";
import { KidsOwl } from "./kids-owl";
import { knowledgeGrowthKeys } from "./kids-map-decorations";
import { kidsOutcomeLabels } from "./kids-player";
import s from "./kids.module.css";

type GrowthKind = "started" | "revealed" | "correct" | "hinted" | "confirmed";
const growthMessages: Record<GrowthKind, string> = {
 started: "Първа стъпка! Започна ново листо. 🌱",
 revealed: "Разгледа нова идея. Пъпката се отвори. 🌱",
 correct: "Първо откритие! Листото ти заблестя. ✨",
 hinted: "Откри решението с помощ! ✨",
 confirmed: "Ново зелено листо на острова! 🌿",
};
function newGrowth(before: KidsCourseView, after: KidsCourseView): { taskKey: string; kind: GrowthKind } | undefined {
 const task = after.task;
 if (!task?.outcome || before.task?.key !== task.key || before.task.outcome || after.reward) return;
 const findConcept = (view: KidsCourseView) => view.topics.find(t => t.id === view.active?.topicId)?.leaves?.find(c => c.id === task.skillId);
 const previous = findConcept(before), current = findConcept(after);
 if (!previous || !current) return;
 let kind: GrowthKind | undefined;
 if (current.confirmation.earned && !previous.confirmation.earned) kind = "confirmed";
 else if (!previous.milestones.firstCorrect && current.milestones.firstCorrect) kind = current.milestones.firstCorrect === "hinted" ? "hinted" : "correct";
 else if (!previous.milestones.started && current.milestones.started) kind = task.outcome === "revealed" ? "revealed" : "started";
 if (kind) return { taskKey: task.key, kind };
}

export function KidsCoursePlayer({ initialView, sessions = [], learnerId, competitionId = DEFAULT_COMPETITION_ID, competitionChoices = [] }: { initialView: KidsCourseView; sessions?: KidsSessionSummary[]; learnerId?: string; competitionId?: string; competitionChoices?: Competition[] }) {
	const [view, setView] = useState(initialView), [dashboard, setDashboard] = useState(true);
	const [busy, setBusy] = useState(false), [error, setError] = useState("");
	const [mapTopic, setMapTopic] = useState<string>(), [mapLeaf, setMapLeaf] = useState<string>();
 const dashboardScroll = useRef<number | undefined>(undefined);
 const [growth, setGrowth] = useState<ReturnType<typeof newGrowth>>();
	const [seenMapGrowth] = useState(() => new Set(knowledgeGrowthKeys(initialView.topics)));
	const inFlight = useRef(false), heading = useRef<HTMLHeadingElement>(null);
	const topic = view.topics.find(t => t.id === view.active?.topicId);
	const stageKey = `${dashboard}:${view.stage}:${view.task?.key}:${view.paused}`;
	useEffect(() => {
  heading.current?.focus({ preventScroll: true });
  if (dashboardScroll.current !== undefined) { window.scrollTo?.(0, dashboardScroll.current); dashboardScroll.current = undefined; }
 }, [stageKey]);
 function showHome() {
  setMapTopic(undefined); setMapLeaf(undefined); dashboardScroll.current = 0; setDashboard(true);
 }
	async function act(action: CourseAction) {
		if (inFlight.current) return;
		inFlight.current = true; setBusy(true); setError("");
		const receive = (next: KidsCourseView) => { setGrowth(newGrowth(view, next)); setView(next); };
		try {
			const post = (revision: number) => fetch("/api/kids/course", { method: "POST", headers: { "Content-Type": "application/json", "X-Maths-Competition": competitionId, ...(learnerId ? {"X-Maths-Child": learnerId} : {}) }, body: JSON.stringify({ revision, action }) });
			const opensPractice = action.type === "selectTopic" || action.type === "resume" || action.type === "startQuest";
			let response = await post(view.revision);
			let body = await response.json() as { course?: KidsCourseView; error?: string };
			if (response.status === 409 && opensPractice) {
				const latest = await fetch("/api/kids/course", { cache: "no-store", headers: {"X-Maths-Competition":competitionId,...(learnerId ? {"X-Maths-Child":learnerId} : {})} });
				const refreshed = await latest.json() as { course?: KidsCourseView };
				if (latest.ok && refreshed.course && refreshed.course.revision !== view.revision) {
					receive(refreshed.course);
					// Only retry navigation once; answers and task steps keep their revision guard.
					response = await post(refreshed.course.revision);
					body = await response.json() as typeof body;
				}
			}
			if (!response.ok || !body.course) {
				throw new Error(body.error || "Не успяхме да запазим. Опитай отново.");
			}
			receive(body.course);
			if (opensPractice) { setDashboard(false); dashboardScroll.current = 0; }
			if (action.type === "dashboard") setDashboard(true);
		} catch (error) {
			// A lost response may already have saved the answer. Reconcile without replaying it.
			try {
				const latest = await fetch("/api/kids/course", { cache: "no-store", headers: {"X-Maths-Competition":competitionId,...(learnerId ? {"X-Maths-Child":learnerId} : {})} });
				if (latest.ok) receive((await latest.json() as { course: KidsCourseView }).course);
			} catch { /* A later command still has the revision guard. */ }
			setError(error instanceof Error ? error.message : "Провери връзката и опитай отново.");
		}
		finally { inFlight.current = false; setBusy(false); }
	}
	const showDashboard = dashboard || !view.active;
	return <main lang="bg" className={s.shell} aria-busy={busy}><div className={s.content}>
		<header className={s.header}>{!showDashboard && <nav className={s.headerNavigation} aria-label="Навигация"><button className={s.secondary} disabled={busy} onClick={showHome}>← Начало</button></nav>}<span className={s.brand}>Математически открития</span><span className={s.small}>4. клас · Български</span>
			{!showDashboard && <div className={s.headerActions}>
				{!view.paused && <button className={s.secondary} disabled={busy} onClick={() => void act({ type: "pause" })}>Почивка</button>}</div>}
		</header>
		{error && <p className={s.error} role="alert">{error}</p>}
		{showDashboard ? <>
   {competitionChoices.length>1 && <nav className={s.actions} aria-label="Състезания">{competitionChoices.map(item=><Link key={item.id} className={s.secondary} aria-current={item.id===competitionId?"page":undefined} href={`/?competition=${encodeURIComponent(item.id)}`}>{item.title}</Link>)}</nav>}
			<div className={s.hero}><KidsOwl /><div><h1 ref={heading} tabIndex={-1} className={s.title}>Пет стъпки. Ново приключение.</h1><p>Ела с бухала до съкровището! Познати идеи, малки открития и помощ, когато ти трябва.</p></div></div>
			<div className={s.actions}><button className={`${s.button} ${s.questButton}`} disabled={busy} onClick={() => void act({ type: "startQuest" })}>{view.quest && !view.quest.finished && !view.quest.exhausted ? "Продължи приключението" : "Започни приключение"}</button><a className={s.secondary} href="#learning-map">Избери тема</a></div>
   {view.active && !view.inQuest && <div className={s.actions}><button className={s.secondary} disabled={busy} onClick={() => void act({ type: "resume" })}>Продължи: {topic?.title}</button></div>}
   <TreasureCollection stamps={view.stamps ?? []} topics={view.topics}/>
   <LearningMap topics={view.topics} progress={view} busy={busy} act={act} seenGrowth={seenMapGrowth} selection={{topicId:mapTopic,conceptId:mapLeaf}} select={(topicId,conceptId) => {setMapTopic(topicId);setMapLeaf(conceptId);}}/>

			{sessions.length > 0 && <details className={s.card}><summary>Предишни кратки занимания</summary><ul className={s.list}>{sessions.slice(0, 3).map(session => <li key={session.id}><Link href={`/kids/${session.id}`} className={s.secondary}>Отвори заниманието от {new Date(session.updatedAt).toLocaleDateString("bg-BG")}</Link></li>)}</ul></details>}
		</> : view.paused ? <section className={s.card}><h1 ref={heading} tabIndex={-1} className={s.title}>Време за почивка</h1><p>Запазихме задачата и стъпките от решението. Продължи, когато поискаш.</p><KidsActionBar label="Продължи" disabled={busy} onClick={() => void act({ type: "resume" })}/></section> : <>
			<h1 ref={heading} tabIndex={-1} className={s.title}>{topic?.title}</h1>
			{view.inQuest && view.quest ? <QuestTrail quest={view.quest}/> : <OwlPath view={view} />}
   {view.stage === "questComplete" && <QuestFinish view={view} busy={busy} act={act} finish={() => void act({ type: "pause" }).then(() => setDashboard(true))}/>}
			{view.active?.mode === "review" && <p className={s.small}>Проверка на запомненото с нова задача. Можеш да продължиш и без нея.</p>}
			{view.active?.mode === "challenge" && <p>Две по-трудни задачи без помощ водят до Професор.</p>}
			{view.exhausted && <section className={s.card}><h2>Всички подготвени задачи за тази стъпка са опитани.</h2><p>Избери друга тема или си почини. Старите задачи не се броят за нов самостоятелен успех.</p><KidsActionBar label="Избери друга тема" disabled={busy} onClick={() => void act({ type: "dashboard" })}/></section>}
			{view.lesson && <section className={s.card}><h2>Да научим: {view.lesson.title}</h2><ol className={s.steps}>{view.lesson.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>{view.lesson.illustration && <TeachingFigure figure={view.lesson.illustration} />}<p className={s.small}>Стъпка {view.lesson.steps.length} от {view.lesson.total}</p><KidsActionBar label={view.lesson.steps.length < view.lesson.total ? "Следваща стъпка" : view.inQuest && view.quest?.completed === 5 ? "Отвори съкровището" : "Да пробвам нова задача"} disabled={busy} onClick={() => void act({ type: "lessonNext" })}/></section>}
			{view.task && <section className={s.card}><h2>{topic?.skills.find(s => s.id === view.task?.skillId)?.title}</h2><CourseQuestion key={view.task.key} task={view.task} growth={growth?.taskKey === view.task.key ? growth.kind : undefined} busy={busy} act={act} />
				{view.reward && <div className={s.reward} role="status"><KidsOwl rank={view.reward.rank} /><h2>Браво! Вече си {view.reward.rank === "doctor" ? "доктор" : "професор"} по {view.reward.topic}! <span aria-hidden="true">🎓</span></h2><p>{view.reward.rank === "doctor" ? "Потвърди всички основни умения в темата. Можеш веднага да продължиш към Професор." : "Справи се с две по-трудни задачи самостоятелно!"}</p><p className={s.small}>След два дни ще ти предложим нова проверка. Можеш да продължиш още сега.</p></div>}
				{view.complete && view.reward && <div className={s.feedback}><h2>Завърши курса! <span aria-hidden="true">🎉</span></h2><p>Доктор във всички теми и Професор в поне половината. Можеш да продължиш с още задачи.</p></div>}
				{view.task.outcome && <div className={s.actions}><KidsActionBar label={view.inQuest && view.quest?.completed === 5 ? "Отвори съкровището" : view.task.outcome === "independent" ? "Следваща задача" : "Да опитам подобна"} disabled={busy} onClick={() => void act({ type: "nextQuestion" })}/><button className={s.secondary} disabled={busy} onClick={() => void act({ type: "dashboard" })}>Избери друга тема</button></div>}
			</section>}
		</>}
		<footer className={s.footer}><Link href="/about" className={s.quiet}>За Математически открития</Link><Link href="/profiles" className={s.quiet}>Профили</Link></footer>
	</div></main>;
}

function OwlPath({ view }: { view: KidsCourseView }) {
	const topic = view.topics.find(t => t.id === view.active?.topicId);
	const stage = view.reward?.rank === "professor" ? 4 : view.reward?.rank === "doctor" ? 3 : view.stage === "lesson" ? 1 : view.streak ? 2 : topic?.professor ? 4 : topic?.doctor ? 3 : 0;
	return <><ol className={s.stages} aria-label="Път на бухала">{["Опитай", "Научи", `${Math.min(view.streak ?? 0, view.target ?? 2)}/${view.target ?? 2} самостоятелно`, "Доктор", "Професор"].map((label, i) => <li key={i} aria-current={stage === i ? "step" : undefined}>{label}{i === 3 && topic?.doctor || i === 4 && topic?.professor ? " ✓" : ""}</li>)}</ol>
		<p className={s.small}>{topic?.confirmed} от {topic?.total} основни умения потвърдени. Верният отговор с помощ е стъпка напред; след него пробваш нова задача самостоятелно.</p></>;
}

function CourseQuestion({ task, growth, busy, act }: { task: NonNullable<KidsCourseView["task"]>; growth?: GrowthKind; busy: boolean; act: (action: CourseAction) => Promise<void> }) {
	const [choice, setChoice] = useState<number>(), [values, setValues] = useState<string[]>(task.answers ?? task.fields.map(() => ""));
	const [field, setField] = useState(0), [reasoning, setReasoning] = useState(task.reasoning ?? "");
	const done = !!task.outcome;
	const feedbackHeading = useRef<HTMLHeadingElement>(null);
	useEffect(() => { if (task.outcome) feedbackHeading.current?.focus(); }, [task.outcome]);
	useEffect(() => { setChoice(undefined); }, [task.hintLevel]);
	const ready = task.options ? choice !== undefined : values.every(v => /^\d+(?:[.,]\d{1,2})?$/.test(v));
	function digit(value: string) { setValues(previous => previous.map((s, i) => i !== field ? s : value === "back" ? s.slice(0, -1) : (s + value).slice(0, 12))); }
	return <>
		<p className={s.question}>{task.text}</p>
		{task.figure && <figure className={s.figure}><Image src={task.figure.src} alt={task.figure.alt} width={360} height={360} unoptimized /><figcaption>{task.source.startsWith("Нова") ? "Учебна схема; числата са в условието." : "Оригинален чертеж. Не измервай по изображението."}</figcaption></figure>}
		{task.options ? <div className={s.options} role="group" aria-label="Отговори">{task.options.map((option, index) => <button key={index} className={s.option} aria-pressed={done ? task.answers?.[0] === String(index) : choice === index} disabled={busy || done} onClick={() => setChoice(index)}><span className={s.letter}>{["А", "Б", "В", "Г"][index]})</span>{option}</button>)}</div> : <>
			<div className={s.numberFields}>{task.fields.map((item, i) => <label key={i} className={s.numberLabel}>{item.label}<input aria-label={item.label} type="text" inputMode="decimal" autoComplete="off" maxLength={12} value={values[i] ?? ""} disabled={busy || done} onFocus={() => setField(i)} onChange={e => { const value = e.target.value; if (/^[\d.,]*$/.test(value)) setValues(old => old.map((v, n) => n === i ? value : v)); }} /></label>)}</div>
			{!done && <div className={s.keypad} role="group" aria-label={`Клавиатура: ${task.fields[field]?.label}`}>{["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "back"].map(key => <button key={key} className={s.secondary} disabled={busy} onClick={() => digit(key)} aria-label={key === "back" ? "Изтрий последната цифра" : key === "," ? "Десетична запетая" : key}>{key === "back" ? "⌫" : key}</button>)}</div>}
		</>}
		{!done && !!task.solutionParts?.length && <aside className={s.hint} aria-label="Решаваме заедно" aria-live="polite"><h3>Решаваме заедно · {task.solutionParts.length} от 3</h3><ol className={s.steps}>{task.solutionParts.map((part, i) => <li key={i}><strong>{part.title}</strong>{part.paragraphs.map((text, n) => <p key={n}>{text}</p>)}</li>)}</ol></aside>}
		{!done && <details className={s.reasoning}><summary>Как мислиш? (по желание)</summary><textarea aria-label="Как мислиш?" value={reasoning} disabled={busy} maxLength={500} onChange={e => setReasoning(e.target.value)} placeholder="Можеш и да обясниш на глас." /><p className={s.small}>Свободното обяснение се запазва за възрастния. Проверяваме избраните или числовите отговори.</p></details>}
		{!done && <div className={s.actions}><KidsActionBar label="Провери отговора" disabled={busy || !ready} onClick={() => { if (ready) void act({ type: "answer", taskKey: task.key, answers: task.options ? [String(choice)] : values, reasoning }); }}/><button className={s.secondary} disabled={busy || (task.hintLevel ?? 0) >= 3} onClick={() => { setChoice(undefined); void act({ type: "hint", taskKey: task.key, reasoning }); }}>{task.hintLevel ? "Следваща стъпка" : "Решаваме заедно"}</button><button className={s.quiet} disabled={busy} onClick={() => void act({ type: "reveal", taskKey: task.key, reasoning })}>Покажи решението</button></div>}
		{!done && <p className={s.small}>Бухалът показва решението на три стъпки. Можеш да опиташ отговор след всяка от тях.</p>}
		{task.outcome && <div className={s.feedback} role="status"><h3 ref={feedbackHeading} tabIndex={-1}>{task.outcome === "hinted" ? "Верен отговор с помощ" : kidsOutcomeLabels[task.outcome]}</h3>{task.outcome !== "revealed" && <p>{task.outcome === "independent" ? <>Браво, справи се! <span aria-hidden="true">🎉</span></> : task.outcome === "hinted" ? <>Откри решението с помощ! Следващата подобна задача те чака. <span aria-hidden="true">🌟</span></> : <>Нека открием следващата стъпка заедно. <span aria-hidden="true">🦉</span></>}</p>}{growth && <div className={s.growthFeedback} data-growth={growth}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 27C0 10 15 2 29 5C30 20 21 31 6 27Z" fill={growth === "confirmed" ? "#8ac69a" : "#e0bb68"}/><path d="M4 30 23 11m-9 11-1-9m6 4 7-1" fill="none" stroke="#416a45" strokeWidth="2" strokeLinecap="round"/></svg><span>{growthMessages[growth]}</span></div>}{task.outcome === "independent" || task.outcome === "hinted" ? <details><summary>Виж решението</summary><ol className={s.steps}>{task.explanation?.map((step, i) => <li key={i}>{step}</li>)}</ol>{task.teachingFigure && <TeachingFigure figure={task.teachingFigure} />}</details> : <ol className={s.steps}>{task.explanation?.map((step, i) => <li key={i}>{step}</li>)}</ol>}{task.outcome !== "independent" && task.outcome !== "hinted" && task.teachingFigure && <TeachingFigure figure={task.teachingFigure} />}</div>}
		<p className={s.small}>{task.source}</p>
	</>;
}

function TeachingFigure({ figure }: { figure: NonNullable<KidsCourseView["lesson"]>["illustration"] }) {
	if (!figure) return null;
	return <figure className={`${s.figure} ${s.teachingFigure}`}><Image src={figure.src} alt={figure.alt} width={640} height={270} unoptimized /><figcaption>Учебна схема за метода; не е оригиналният чертеж.</figcaption></figure>;
}

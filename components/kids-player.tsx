"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { KidsAction, KidsOutcome, KidsView } from "@/src/core";
import s from "./kids.module.css";

export const kidsOutcomeLabels: Record<KidsOutcome, string> = {
	independent: "Верен отговор",
	hinted: "Верен отговор с подсказка",
	incorrect: "Още не се получи",
	revealed: "Да разгледаме решението 🦉",
};

export function KidsPlayer({ initialView }: { initialView: KidsView }) {
	const [view, setView] = useState(initialView);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const inFlight = useRef(false);
	const heading = useRef<HTMLHeadingElement>(null);
	const stage = view.stage === "recap" ? 3 : view.stage === "practice" ? 2 : view.stage === "lesson" ? 1 : 0;
	useEffect(() => { heading.current?.focus(); }, [view.stage, view.task?.key, view.paused]);

	async function act(action: KidsAction) {
		if (inFlight.current) return;
		inFlight.current = true; setBusy(true); setError("");
		try {
			const response = await fetch(`/api/kids/${view.id}`, { method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ revision: view.revision, action }) });
			const body = await response.json() as { session?: KidsView; error?: string };
			if (!response.ok || !body.session) {
				// Never replay an answer automatically after a conflict or uncertain network result.
				if (response.status === 409) {
					const latest = await fetch(`/api/kids/${view.id}`, { cache: "no-store" });
					if (latest.ok) setView((await latest.json() as { session: KidsView }).session);
				}
				throw new Error(body.error || "Не успяхме да запазим. Опитай отново.");
			}
			setView(body.session);
		} catch (error) { setError(error instanceof Error ? error.message : "Не успяхме да запазим. Опитай отново."); }
		finally { inFlight.current = false; setBusy(false); }
	}

	return <main lang="bg" className={s.shell} aria-busy={busy}>
		<div className={s.content}>
			<header className={s.header}>
				<span className={s.brand}>Математически открития</span>
				{!view.paused && <button className={s.secondary} disabled={busy} onClick={() => void act({ type: "pause" })}>Почивка</button>}
			</header>
			<p className={s.small}>Кръг {view.roundNumber}</p>
			{!view.paused && <ol className={s.stages} aria-label="Стъпки на кръга">{["Опитай", "Да научим", "Провери", "Готово"].map((label, index) =>
				<li key={label} aria-current={stage === index ? "step" : undefined}>{label}</li>)}</ol>}
			{error && <p role="alert" className={s.error}>{error}</p>}
			{view.paused ? <section className={s.card}>
				<h1 ref={heading} tabIndex={-1} className={s.title}>Време за почивка</h1>
				<p>Запазихме докъде стигна. Можеш да продължиш, когато поискаш.</p>
				<div className={s.actions}><button className={s.button} disabled={busy} onClick={() => void act({ type: "resume" })}>Продължи</button><Link href="/" className={s.secondary}>За днес стига</Link></div>
			</section> : <>
				{view.task && <section className={s.card}>
					<h1 ref={heading} tabIndex={-1} className={s.title}>{view.stage === "practice" ? "Сега пробвай нова задача" : `Задача ${view.taskNumber} от 2`}</h1>
					<KidsQuestion key={`${view.task.key}:${view.roundNumber}`} task={view.task} busy={busy} onAction={act} />
					{view.task.outcome && <div className={s.actions}><button className={s.button} disabled={busy} onClick={() => void act({ type: "advance" })}>
						{view.stage === "practice" ? "Виж какво направихме" : view.taskNumber === 1 ? "Към втората задача" : "Да научим една идея"}
					</button></div>}
				</section>}
				{view.lesson && <section className={s.card}>
					<h1 ref={heading} tabIndex={-1} className={s.title}>{view.lesson.title}</h1>
					<p className={s.small}>{view.lesson.extension ? "Двете задачи се получиха самостоятелно. Да надградим една идея." : "Нека разгледаме една полезна идея от задачите."}</p>
					<ol className={s.steps} aria-live="polite">{view.lesson.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
					<p className={s.small}>Стъпка {view.lesson.steps.length} от {view.lesson.totalSteps}</p>
					<div className={s.actions}><button className={s.button} disabled={busy} onClick={() => void act({ type: "lessonNext" })}>
						{view.lesson.steps.length < view.lesson.totalSteps ? "Следваща стъпка" : "Да пробвам"}
					</button></div>
				</section>}
				{view.recap && <section className={s.card}>
					<h1 ref={heading} tabIndex={-1} className={s.title}>За този кръг стига!</h1>
					{view.recap.results.length === 0 ? <p>Спряхме преди първия отговор. Можеш да се върнеш към задачите друг път.</p> : <>
						<p>Ето какво направихме. Това е малка проба, а не оценка по математика.</p>
						<ul className={s.list}>{view.recap.results.map((result, index) => <li key={index}>
							<strong>{result.topic}</strong><p>{kidsOutcomeLabels[result.outcome]}{result.role === "practice" ? " - след обяснението" : ""}.</p>
						</li>)}</ul>
					</>}
					{view.recap.lessonTopic && <p className={s.small}>След два дни можем да проверим отново идеята „{view.recap.lessonTopic}“ с друга задача.</p>}
					{!view.canContinue && <p className={s.small}>Стигнахме до края на подготвените кръгове. Останалите теми още не са проверени.</p>}
					<div className={s.actions}><button className={s.button} disabled={busy} onClick={() => void act({ type: "pause" })}>Почивка</button>
						{view.canContinue && <button className={s.secondary} disabled={busy} onClick={() => void act({ type: "nextRound" })}>Още един кръг</button>}
					</div>
				</section>}
			</>}
			<footer className={s.footer}>
				<Link className={s.quiet} href="/">Начало</Link>
				{!view.paused && view.stage !== "recap" && <button className={s.quiet} disabled={busy} onClick={() => void act({ type: "finish" })}>Завърши засега</button>}
			</footer>
		</div>
	</main>;
}

function KidsQuestion({ task, busy, onAction }: { task: NonNullable<KidsView["task"]>; busy: boolean; onAction: (action: KidsAction) => Promise<void> }) {
	const [selected, setSelected] = useState<number>();
	const [reasoning, setReasoning] = useState(task.reasoning ?? "");
	const done = Boolean(task.outcome);
	useEffect(() => { setSelected(undefined); }, [task.hint]);
	return <>
		<p className={s.question}>{task.text}</p>
		<div className={s.options} role="group" aria-label="Отговори">
			{task.options.map((option, index) => <button key={index} type="button" className={s.option}
				aria-pressed={done ? task.choice === index : selected === index} disabled={busy || done}
				onClick={() => setSelected(index)}><span className={s.letter}>{["А", "Б", "В", "Г"][index]})</span> {option}</button>)}
		</div>
		{task.hint && <aside className={s.hint} role="status"><h3>Малка подсказка</h3><p>{task.hint}</p></aside>}
		{!done && <details className={s.reasoning}><summary>Искаш ли да обясниш как мислиш? (по желание)</summary>
			<textarea aria-label="Как мислиш?" maxLength={500} value={reasoning} disabled={busy} onChange={event => setReasoning(event.target.value)} placeholder="Можеш и да обясниш на глас." />
		</details>}
		<div className={s.actions}>
			{!done && <button className={s.button} disabled={busy || selected === undefined} onClick={() => {
				if (selected !== undefined) void onAction({ type: "answer", taskKey: task.key, choice: selected, reasoning });
			}}>Провери отговора</button>}
			<button type="button" className={s.secondary} disabled={busy || done} onClick={() => { setSelected(undefined); void onAction({ type: "dontKnow", taskKey: task.key, reasoning }); }}>Не знам</button>
		</div>
		{!done && <p className={s.small}>{task.hint ? "Още е трудно? Второто „Не знам“ ще покаже цялото решение." : "„Не знам“ ще покаже малка подсказка."}</p>}
		{task.outcome && <div className={s.feedback} role="status">
			<h3>{kidsOutcomeLabels[task.outcome]}</h3>
			{task.outcome === "independent" || task.outcome === "hinted" ? <details className={s.reasoning}><summary>Виж решението стъпка по стъпка</summary><Explanation steps={task.explanation ?? []} /></details>
				: <Explanation steps={task.explanation ?? []} />}
		</div>}
		<p className={`${s.small} mt-6`}>{task.source}</p>
	</>;
}

function Explanation({ steps }: { steps: string[] }) {
	return <ol className={s.steps}>{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>;
}

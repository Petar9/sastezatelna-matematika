"use client";

import { useEffect, useRef } from "react";
import s from "./kids.module.css";

export function KidsActionBar({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
	const bar = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = bar.current;
		const shell = element?.closest("main");
		if (!element || !shell) return;
		const viewport = window.visualViewport;
		const update = () => {
			// Some mobile browsers shrink only the visual viewport when the keyboard opens.
			const inset = viewport && viewport.scale === 1 ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
			shell.style.setProperty("--kids-keyboard-inset", `${inset}px`);
			shell.style.setProperty("--kids-action-height", `${element.getBoundingClientRect().height}px`);
		};
		update();
		const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
		observer?.observe(element);
		viewport?.addEventListener("resize", update);
		viewport?.addEventListener("scroll", update);
		window.addEventListener("resize", update);
		return () => {
			observer?.disconnect();
			viewport?.removeEventListener("resize", update);
			viewport?.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
			shell.style.removeProperty("--kids-keyboard-inset");
			shell.style.removeProperty("--kids-action-height");
		};
	}, []);
	return <div ref={bar} className={s.actionBar} role="group" aria-label="Следващо действие"><div className={s.actionBarContent}>
		<button className={s.button} disabled={disabled} onClick={onClick}>{label}</button>
	</div></div>;
}

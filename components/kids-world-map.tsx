"use client";

import { useEffect, useId, useRef, useState, type RefObject, type ReactNode } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import type { CourseTopicView } from "@/src/core";
import { fitGraphView, fitZoomFor, type Viewport } from "./pan-zoom";
import { DiscoveryMarkerArt, leafPhase, knowledgeGrowthKeys } from "./kids-map-decorations";
import s from "./kids-world-map.module.css";

const defaultWorld = { w: 1100, h: 1060 };
const olympiadWorld = { w: 720, h: 500 };
const nvoWorld = { w: 1100, h: 710 };
// Positions belong to topic IDs, not course order or current attainment.
export const islandPlaces: Record<string, { x: number; y: number; name: string }> = {
 "nvo-numbers": { x: 190, y: 135, name: "Числа и редици" },
 "nvo-addition": { x: 550, y: 135, name: "Събиране и изваждане" },
 "nvo-multiplication": { x: 910, y: 135, name: "Умножение и деление" },
 "nvo-expressions": { x: 190, y: 350, name: "Неизвестни числа и изрази" },
 "nvo-fractions": { x: 550, y: 350, name: "Части от цяло" },
 "nvo-measures": { x: 910, y: 350, name: "Мерки и време" },
 "nvo-geometry": { x: 145, y: 565, name: "Фигури и ъгли" },
 "nvo-areas": { x: 415, y: 565, name: "Обиколки и лица" },
 "nvo-data": { x: 690, y: 565, name: "Таблици и схеми" },
 "nvo-stories": { x: 950, y: 565, name: "Текстови задачи" },
 "oli-numbers": { x: 190, y: 145, name: "Числови загадки" },
 "oli-geometry": { x: 525, y: 145, name: "Геометрични открития" },
 "oli-stories": { x: 190, y: 365, name: "Истории с числа" },
 "oli-logic": { x: 525, y: 365, name: "Логически загадки" },
 digits: { x: 145, y: 125, name: "Цифри и векове" },
 backwards: { x: 415, y: 160, name: "Рачешки задачи" },
 matches: { x: 690, y: 115, name: "Точки и мачове" },
 money: { x: 950, y: 165, name: "Пари и цени" },
 totals: { x: 240, y: 340, name: "Брой и възрасти" },
 pieces: { x: 555, y: 330, name: "Разрези и части" },
 perimeters: { x: 870, y: 365, name: "Обиколки" },
 areas: { x: 140, y: 545, name: "Лица на фигури" },
 clocks: { x: 420, y: 530, name: "Часовник" },
 constraints: { x: 685, y: 550, name: "Най-малко и най-много" },
 sequences: { x: 960, y: 550, name: "Числови редици" },
 counting: { x: 245, y: 735, name: "Възможности" },
 grids: { x: 555, y: 750, name: "Квадратна мрежа" },
 fractions: { x: 875, y: 745, name: "Части от цяло" },
 units: { x: 150, y: 945, name: "Мерни единици" },
 motion: { x: 490, y: 945, name: "Движение" },
 sets: { x: 830, y: 950, name: "Групи и общи елементи" },
};
const compactNames: Record<string, string> = { "nvo-numbers": "Числа", "nvo-addition": "Събиране и изваждане", "nvo-multiplication": "Умножение и деление", "nvo-expressions": "Неизвестни числа", "nvo-fractions": "Части", "nvo-measures": "Мерки и време", "nvo-geometry": "Фигури и ъгли", "nvo-areas": "Обиколки и лица", "nvo-data": "Таблици и схеми", "nvo-stories": "Текстови задачи", digits: "Цифри", backwards: "Рачешки", matches: "Точки", money: "Пари", totals: "Брой и възрасти", pieces: "Разрези", perimeters: "Обиколки", areas: "Лица", clocks: "Часовник", constraints: "Най-малко / най-много", sequences: "Редици", counting: "Броим", grids: "Мрежа", fractions: "Части", units: "Мерки", motion: "Движение", sets: "Групи" };
const shores = [
 "M-108 14C-126-18-91-59-56-57C-36-84 3-65 31-66C75-80 113-45 105-16C139 16 98 59 61 54C28 80-9 63-43 66C-80 76-116 48-108 14Z",
 "M-109-6C-110-47-70-66-34-58C-4-81 29-60 58-65C100-63 127-26 111 4C123 41 83 67 49 60C15 79-12 57-48 63C-86 61-122 32-109-6Z",
 "M-105 17C-132-11-99-46-69-51C-53-80-10-72 14-59C46-81 93-58 96-31C127-11 124 34 92 43C73 75 30 60 3 69C-30 80-62 58-83 54C-103 49-116 33-105 17Z",
];

export function IslandLandmark({ topicId, golden = false }: { topicId: string; golden?: boolean }) {
 const stone = golden ? "#f5cb68" : "#f6e4ba", dark = "#485e59", coral = "#e79678", blue = "#88cbe1";
 const shapes: Record<string, ReactNode> = {
  digits: <><path d="M-27 31V-25H23V31" fill={stone}/><path d="m-35-25 33-23 33 23Z" fill={coral}/><path d="M-15-12v10m28-10v10M-16 9h29M-2 2v19" stroke={dark} strokeWidth="5"/><path d="M-10 31V20H7V31" fill={dark}/></>,
  backwards: <><path d="m-29 7-15-15m73 15L44-8M-27 17l-18 7m72-7 18 7M-16 24l-9 14m41-14 9 14" stroke={coral} strokeWidth="5"/><ellipse cy="11" rx="30" ry="22" fill={coral}/><path d="M-18 0v-16m36 16v-16" stroke={coral} strokeWidth="7"/><circle cx="-18" cy="-17" r="8" fill={stone}/><circle cx="18" cy="-17" r="8" fill={stone}/><circle cx="-18" cy="-17" r="3" fill={dark}/><circle cx="18" cy="-17" r="3" fill={dark}/><path d="M-7 17q7 7 14 0" fill="none" stroke={dark} strokeWidth="3"/></>,
  matches: <><path d="m-44 22 12-46h64l12 46" fill="none" stroke={stone} strokeWidth="6"/><path d="M-30-20v38m20-38v38m20-38v38m20-38v38M-34-8h69M-38 5h76" stroke={stone} opacity=".5"/><circle cx="4" cy="22" r="18" fill={stone}/><path d="m4 10 10 7-4 12H-2l-4-12Z" fill={dark}/></>,
  money: <><path d="M-36 16h39v16h-39Zm10-17h39v16h-39Z" fill={stone} stroke="#bb964c" strokeWidth="3"/><circle cx="21" cy="1" r="26" fill="#efc76e" stroke={stone} strokeWidth="4"/><path d="M21-13V15M11-8q22-7 20 5-1 7-11 6-17-1-8 10" fill="none" stroke="#9b7639" strokeWidth="4"/></>,
  totals: <><path d="M0-33v66m-30 0h60M-42-19h84M-30-19-45 10h30Zm60 0L15 10h30Z" fill={stone} stroke={stone} strokeWidth="4" strokeLinejoin="round"/><circle cy="-29" r="8" fill={coral}/></>,
  pieces: <><path d="m-40 13 22-39 20 13-22 40Zm32 3 22-39 20 13-22 40Zm31 3 17-29 13 9-17 29Z" fill="#bb986c" stroke={stone} strokeWidth="3"/><path d="m-24 7 10-18M8 9l10-18" stroke="#785b43" strokeWidth="4"/></>,
  perimeters: <><path d="m-39-13 49-15 34 27-48 25Z" fill="#82b99a"/><path d="m-39-13 49-15 34 27-48 25Z" fill="none" stroke={stone} strokeWidth="5"/>{[[-39,-13],[10,-28],[44,-1],[-4,24]].map(([x,y],i)=><path key={i} d={`M${x} ${y!+5}v-21`} stroke={stone} strokeWidth="6"/>)}</>,
  areas: <><path d="M-38-29h76v60h-76Z" fill={stone}/><path d="M-32-23H-2V1h-30Zm36 0h28V1H4ZM-32 7H-2v18h-30Z" fill="#88bea0"/><path d="M4 7h28v18H4Z" fill={coral}/></>,
  clocks: <><path d="M-21 31V-8h42v39" fill={stone}/><path d="m-31-8 31-36L31-8Z" fill={coral}/><circle cy="-4" r="20" fill="#fdf4d9" stroke={dark} strokeWidth="3"/><path d="M0-18V-4l11 6" fill="none" stroke={dark} strokeWidth="4"/><path d="M-8 31V19H8v12" fill={dark}/></>,
  constraints: <><path d="m-48 27 24-51 25 51Zm36 0L18-45l35 72Z" fill="#83b5b5" stroke={stone} strokeWidth="2"/><path d="m7-19 11-26 13 27-12-6Z" fill={stone}/></>,
  sequences: <>{[-34,-11,12,35].map((x,i)=><g key={x}><path d={`M${x-9} 27v${-15-i*11}h18V27Z`} fill={i%2?stone:blue}/><circle cx={x} cy={4-i*11} r="5" fill={coral}/></g>)}</>,
  counting: <><path d="m0-43 13 27 30 4-22 22 5 30L0 26l-26 14 5-30-22-22 30-4Z" fill={stone}/><circle cx="-10" cy="1" r="3" fill={dark}/><circle cx="10" cy="1" r="3" fill={dark}/><path d="M-8 12q8 7 16 0" fill="none" stroke={dark} strokeWidth="3"/></>,
  grids: <><path d="m-42-25 42-20 42 20Z" fill={coral}/><path d="M-35-22h70v54h-70Z" fill={stone}/><path d="M-12-20v49m24-49v49M-33-4h66M-33 14h66" stroke={dark} strokeWidth="3"/></>,
  fractions: <><circle r="37" fill={stone}/><path d="M0 0v-37A37 37 0 0 1 32 18Z" fill={coral}/><path d="m0 0 32 18A37 37 0 0 1-32 18Z" fill={blue}/><path d="M0-37V0l32 18M0 0l-32 18" stroke={stone} strokeWidth="4"/></>,
  units: <><path d="m-43 9 72-41 19 33-72 41Z" fill={stone}/><path d="m-30 3 6 10m6-17 10 17m2-23 6 10M12-14l10 17m1-23 6 10" stroke={dark} strokeWidth="3"/></>,
  motion: <><path d="M-44 15h88L28 33h-56Z" fill={coral}/><path d="M0 15v-65l39 53H5Z" fill={stone}/><path d="m-6-36-30 39h30Z" fill={blue}/><path d="M-50 39q13-9 26 0t26 0t26 0t26 0" fill="none" stroke={blue} strokeWidth="3"/></>,
  sets: <><circle cx="-15" r="29" fill={blue} fillOpacity=".8" stroke={stone} strokeWidth="3"/><circle cx="15" r="29" fill={coral} fillOpacity=".7" stroke={stone} strokeWidth="3"/><circle r="6" fill={stone}/><circle cx="-28" r="4" fill={stone}/><circle cx="28" r="4" fill={stone}/></>,
 };
 return <svg viewBox="-60 -55 120 105" width="86" height="76" aria-hidden="true">{shapes[({ "oli-numbers": "digits", "oli-geometry": "perimeters", "oli-stories": "money", "oli-logic": "counting", "nvo-numbers": "sequences", "nvo-addition": "totals", "nvo-multiplication": "counting", "nvo-expressions": "backwards", "nvo-fractions": "fractions", "nvo-measures": "units", "nvo-geometry": "perimeters", "nvo-areas": "areas", "nvo-data": "grids", "nvo-stories": "money" } as Record<string, string>)[topicId] ?? topicId] ?? shapes.counting}</svg>;
}

function SkillDiscoveries({ topic }: { topic: CourseTopicView }) {
 return <g>{(topic.leaves ?? []).map((skill, i, skills) => <g key={skill.id} data-skill-marker={skill.id} data-phase={leafPhase(skill) ?? "untried"} transform={`translate(${(i-(skills.length-1)/2)*32-15} 19)`}><svg width="30" height="30" viewBox="0 0 64 64"><DiscoveryMarkerArt phase={leafPhase(skill)}/></svg></g>)}</g>;
}

export function IslandScenery({ topic, variant, seen }: { topic: CourseTopicView; variant: number; seen: Set<string> }) {
 const keys = knowledgeGrowthKeys([topic]);
 const [fresh] = useState(() => keys.some(key => !seen.has(key)));
 useEffect(() => { for (const key of keys) seen.add(key); }, [keys, seen]);
 return <g className={s.scenery} data-island-scenery={topic.id} data-new-growth={fresh || undefined}>
  <ellipse cy="28" rx="118" ry="57" fill="#8dd0cd" opacity=".12"/>
  <path d={shores[variant % shores.length]} transform="translate(0 8)" fill="#c3b78a" stroke="#91c8c5" strokeWidth="14"/>
  <path d={shores[variant % shores.length]} fill="#ead6a0"/>
  <path d={shores[variant % shores.length]} transform="scale(.85 .78) translate(0 -7)" fill={variant % 2 ? "#699b74" : "#78aa7d"}/>
  <path d="M-62 16q22-14 45-8t43-6" fill="none" stroke="#d8ca8d" strokeWidth="8" strokeLinecap="round" opacity=".6"/>
  <ellipse cx="-65" cy="-23" rx="12" ry="8" fill="#afbf9a"/><ellipse cx="64" cy="28" rx="9" ry="6" fill="#b3c39e"/>
  <SkillDiscoveries topic={topic}/>
  <g transform="translate(-43 -60)"><IslandLandmark topicId={topic.id} golden={topic.professor}/></g>
  {topic.doctor && <g data-scenery="doctor-flag" transform="translate(58 -35)"><path d="M0 25v-63" stroke="#f4dfb0" strokeWidth="4"/><path d="M2-38h30l-7 11 7 11H2Z" fill="#89cde5"/><path d="m15-34 2 5 6 1-4 4 1 5-5-3-4 3 1-5-4-4 5-1Z" fill="#fff2cb"/></g>}
  {topic.professor && <g data-scenery="professor-gold" transform="translate(0 -67)" fill="#ffe1a0"><path d="m0-12 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><circle cx="26" cy="7" r="3"/><circle cx="-30" cy="4" r="3"/></g>}
 </g>;
}

type Props = {
 topics: CourseTopicView[];
 selectedId?: string;
 panelId: string;
 seen: Set<string>;
 buttons: RefObject<Map<string, HTMLButtonElement>>;
 viewControls: ReactNode;
 onSelect: (topicId: string) => void;
};
export function KidsWorldMap({ topics, selectedId, panelId, seen, buttons, onSelect, viewControls }: Props) {
 const world = topics.length > 0 && topics.every(topic => topic.id.startsWith("oli-")) ? olympiadWorld : topics.length > 0 && topics.every(topic => topic.id.startsWith("nvo-")) ? nvoWorld : defaultWorld;
 const id = useId().replace(/:/g, "");
 const pointerNavigation = useRef(false);
 const surface = useRef<HTMLDivElement>(null), behavior = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
 const [size, setSize] = useState({ w: 720, h: 560 });
 const [camera, setCamera] = useState<Viewport>(() => fitGraphView(world, size, fitZoomFor(world, size)));
 const floor = fitZoomFor(world, size);
 useEffect(() => {
  const node = surface.current;
  if (!node) return;
  const viewport = { w: node.clientWidth || 720, h: node.clientHeight || 560 };
  const fit = fitZoomFor(world, viewport);
  const z = zoom<HTMLDivElement, unknown>().extent([[0, 0], [viewport.w, viewport.h]])
   .translateExtent([[0, 0], [world.w, world.h]]).scaleExtent([fit, fit * 4])
   .filter(event => event.type !== "wheel" && event.type !== "dblclick" && !event.button && !event.target?.closest?.("button"))
   .touchable(() => true).clickDistance(8)
   .on("zoom", ({ transform }) => setCamera({ x: transform.x, y: transform.y, zoom: transform.k }));
  behavior.current = z;
  const selection = select(node).call(z).on("wheel.zoom", null).on("dblclick.zoom", null);
  const reset = () => {
   const next = { w: node.clientWidth || 720, h: node.clientHeight || 560 };
   const min = fitZoomFor(world, next), view = fitGraphView(world, next, min);
   z.extent([[0, 0], [next.w, next.h]]).scaleExtent([min, min * 4]);
   selection.call(z.transform, zoomIdentity.translate(view.x, view.y).scale(view.zoom));
   setSize(next);
  };
  reset();
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(reset);
  observer?.observe(node);
  return () => { observer?.disconnect(); selection.on(".zoom", null); behavior.current = null; };
 }, [world]);
 useEffect(() => {
  const place = selectedId ? islandPlaces[selectedId] : undefined;
  if (!place || !surface.current || !behavior.current) return;
  const selection = select(surface.current), z = behavior.current;
  selection.call(z.scaleTo, floor * 3).call(z.translateTo, place.x, place.y);
 }, [selectedId, floor]);
 function changeZoom(factor: number) { if (surface.current && behavior.current) select(surface.current).call(behavior.current.scaleBy, factor); }
 function reset() {
  if (!surface.current || !behavior.current) return;
  const view = fitGraphView(world, size, floor);
  select(surface.current).call(behavior.current.transform, zoomIdentity.translate(view.x, view.y).scale(view.zoom));
 }
 return <div className={s.world}>
  <div className={s.toolbar}>{viewControls}<div className={s.tools} role="group" aria-label="Изглед на картата"><button aria-label="Приближи картата" disabled={camera.zoom >= floor * 4 - .001} onClick={() => changeZoom(1.4)}>+</button><button aria-label="Отдалечи картата" disabled={camera.zoom <= floor + .001} onClick={() => changeZoom(1 / 1.4)}>−</button><button onClick={reset}>Цялата карта</button></div></div>
  <div ref={surface} className={s.surface} onPointerDownCapture={() => { pointerNavigation.current = true; }} onKeyDownCapture={() => { pointerNavigation.current = false; }} aria-label="Морето с островите" aria-describedby={`${id}-help`} data-camera={`${camera.x.toFixed(2)},${camera.y.toFixed(2)},${camera.zoom.toFixed(3)}`}>
   <svg className={s.sea} width="100%" height="100%" aria-hidden="true">
    <defs><pattern id={`${id}-waves`} width="100" height="90" patternUnits="userSpaceOnUse"><path d="M12 30q9-6 18 0t18 0m17 35q7-5 14 0t14 0" fill="none" stroke="#45838c" strokeWidth="2" opacity=".16"/></pattern><radialGradient id={`${id}-water`}><stop stopColor="#c6e8ea"/><stop offset="1" stopColor="#e3f3f4"/></radialGradient></defs>
    <rect width="100%" height="100%" fill={`url(#${id}-water)`}/><rect width="100%" height="100%" fill={`url(#${id}-waves)`}/>
    <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
     <g fill="none" stroke="#9bd0c4" strokeWidth="2" opacity=".45"><path d="M40 310q12-14 24 0 12-14 24 0M710 860q12-14 24 0 12-14 24 0M510 60q12-14 24 0 12-14 24 0"/></g>
     <g transform={`translate(${world === defaultWorld ? 1020 : world.w - 65} ${world === defaultWorld ? 900 : world.h - 65})`} fill="none" stroke="#53898c" opacity=".6"><circle r="31"/><path d="M0-43V43M-43 0H43m-15-28L28 28m-56 0 56-56"/><path d="M0-32 8 0 0 32-8 0Z" fill="#53898c"/><text y="-49" textAnchor="middle" fill="#53898c" stroke="none" fontSize="17">С</text></g>
     {topics.map((topic, i) => { const place = islandPlaces[topic.id]; return place && <g key={topic.id} transform={`translate(${place.x} ${place.y})`}><IslandScenery topic={topic} variant={i} seen={seen}/></g>; })}
    </g>
   </svg>
   {topics.map(topic => {
    const place = islandPlaces[topic.id]; if (!place) return null;
    return <button key={topic.id} id={`island-${topic.id}`} ref={node => { if (node) buttons.current.set(topic.id, node); else buttons.current.delete(topic.id); }} className={s.islandTarget} data-compact={camera.zoom < .32} title={`${topic.title}${topic.professor ? " · Професор" : topic.doctor ? " · Доктор" : ""}`} style={{ left: camera.x + place.x * camera.zoom, top: camera.y + place.y * camera.zoom, width: Math.max(44, 222 * camera.zoom), height: Math.max(44, 150 * camera.zoom), fontSize: Math.max(13, Math.min(18, 24 * camera.zoom)) }} aria-label={topic.title} aria-expanded={selectedId === topic.id} aria-controls={selectedId === topic.id ? panelId : undefined} data-selected={selectedId === topic.id} onFocus={() => { if (!pointerNavigation.current && surface.current && behavior.current) select(surface.current).call(behavior.current.translateTo, place.x, place.y); }} onClick={() => onSelect(topic.id)}><span>{camera.zoom < .32 ? compactNames[topic.id] ?? place.name : place.name}</span></button>;
   })}
  </div>
  <p id={`${id}-help`} className={s.help}>Докосни остров и го разгледай. Премести морето с пръст или мишка.</p>
 </div>;
}

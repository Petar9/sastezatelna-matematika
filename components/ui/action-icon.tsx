export type ActionIconName = "copy" | "check" | "close" | "menu" | "progress" | "profiles" | "book" | "info" | "feedback" | "logout" | "pencil" | "share" | "chevron" | "arrow" | "plus";
const paths: Record<Exclude<ActionIconName, "copy">, string> = {
 check: "m5 12 4 4L19 6", close: "m7 7 10 10M17 7 7 17",
 menu: "M4 6h16M4 12h16M4 18h16", progress: "M4 19V5m0 14h16M8 15l4-5 4 2 4-7",
 profiles: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
 book: "M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z",
 info: "M12 11v6m0-10h.01", feedback: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 2V11.5a10 10 0 0 1 20 0Z",
 logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9",
 pencil: "m16 3 5 5-13 13H3v-5Zm-2 2 5 5", share: "m8 11 8-5m-8 7 8 5",
 chevron: "m8 10 4 4 4-4", arrow: "M4 12h16m-6-6 6 6-6 6", plus: "M12 5v14M5 12h14",
};
export function ActionIcon({name}:{name:ActionIconName}) {
 return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {name === "copy" ? <><rect x="8" y="8" width="12" height="13" rx="2.5"/><path d="M15 8V5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/></> : <path d={paths[name]}/>}
  {name === "profiles" && <circle cx="9" cy="7" r="4"/>}
  {name === "info" && <circle cx="12" cy="12" r="9"/>}
  {name === "share" && <><circle cx="5" cy="12" r="3"/><circle cx="19" cy="4" r="3"/><circle cx="19" cy="20" r="3"/></>}
 </svg>;
}

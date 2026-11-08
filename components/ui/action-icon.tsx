type Name = "copy" | "check" | "close";

export function ActionIcon({name}:{name:Name}) {
 return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {name==="copy"?<><rect x="8" y="8" width="12" height="13" rx="2.5"/><path d="M15 8V5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/></>:<path d={name==="check"?"m5 12 4 4L19 6":"m7 7 10 10M17 7 7 17"}/>}
 </svg>;
}

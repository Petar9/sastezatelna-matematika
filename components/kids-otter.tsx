type OtterProps = {
 rank?: "learner" | "doctor" | "professor";
 small?: boolean;
 mood?: "welcome" | "celebrate" | "support";
};

export function KidsOtter({ rank = "learner", small = false, mood = "welcome" }: OtterProps) {
 const celebrating = mood === "celebrate";
 return <svg viewBox="0 0 180 190" width={small ? 52 : 112} height={small ? 55 : 118} role="img"
  aria-label={rank === "professor" ? "Видра професор" : rank === "doctor" ? "Видра доктор" : celebrating ? "Видрата се радва на откритието ти" : mood === "support" ? "Видрата е до теб" : "Видрата изследовател"}>
  <ellipse cx="88" cy="178" rx="64" ry="7" fill="#487b75" opacity=".13"/>
  <path d="M114 127q55 17 46 44-8 17-42-3l-16-20" fill="#986443" stroke="#74482f" strokeWidth="3"/>
  <path d="M53 90q-10 23-7 57 3 29 40 29 40 0 42-30 3-35-14-58" fill="#a5724b" stroke="#74482f" strokeWidth="3"/>
  <ellipse cx="86" cy="132" rx="27" ry="34" fill="#ead1ac"/>
  <path d="M56 168q-20 0-19 10 8 9 29 1m42-11q20 0 19 10-8 9-29 1" fill="#74482f"/>
  <path d={celebrating ? "M53 112Q25 98 21 70" : "M53 114Q29 122 34 144"} fill="none" stroke="#986443" strokeWidth="17" strokeLinecap="round"/>
  <path d={celebrating ? "M121 112q26-14 31-42" : "M119 113q25-13 25-31"} fill="none" stroke="#986443" strokeWidth="17" strokeLinecap="round"/>
  <circle cx="48" cy="46" r="16" fill="#986443" stroke="#74482f" strokeWidth="3"/><circle cx="126" cy="46" r="16" fill="#986443" stroke="#74482f" strokeWidth="3"/>
  <circle cx="48" cy="46" r="9" fill="#d9af88"/><circle cx="126" cy="46" r="9" fill="#d9af88"/>
  <path d="M40 58q0-36 47-36 46 0 47 36 9 42-47 45-55-3-47-45" fill="#a5724b" stroke="#74482f" strokeWidth="3"/>
  <path d="M50 61q8-16 23-8l14 9 14-9q15-8 23 8 8 32-37 33-45-1-37-33" fill="#f6e4c7"/>
  {celebrating ? <path d="M61 57q6-9 12 0m28 0q6-9 12 0" stroke="#2c3d3c" strokeWidth="4" fill="none" strokeLinecap="round"/> : <g fill="#2c3d3c"><ellipse cx="67" cy="55" rx="4" ry="6"/><ellipse cx="107" cy="55" rx="4" ry="6"/><circle cx="68" cy="53" r="1.2" fill="white"/><circle cx="108" cy="53" r="1.2" fill="white"/></g>}
  <path d="M78 68q9-6 18 0l-9 8Z" fill="#2c3d3c"/>
  <path d="M87 76v5m-10-1q10 12 20 0" stroke="#74482f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  <path d="m64 74-23-4m23 10-24 3m70-9 23-4m-23 10 24 3" stroke="#74482f" strokeWidth="2" strokeLinecap="round"/>
  <path d="M51 94q36 16 71 0l-4 13q-33 13-63-1Z" fill="#df8a59"/><path d="m104 105 17 23-16 3-12-24" fill="#df8a59"/>
  <g transform="translate(78 131)"><circle r="12" fill="#f2cc78" stroke="#ac7c38" strokeWidth="2"/><path d="m0-8 4 8-4 8-4-8Z" fill="#14665f"/></g>
  {rank !== "learner" && <g><path d="M55 23v12q32 12 65 0V23" fill="#284e55"/><path d="m38 21 49-17 49 17-49 18Z" fill="#345f66"/><path d="M133 22v27" stroke="#e7bc58" strokeWidth="3"/><circle cx="133" cy="51" r="4" fill="#e7bc58"/></g>}
  {rank === "professor" && <g stroke="#284e55" strokeWidth="2.5" fill="none"><circle cx="67" cy="56" r="12"/><circle cx="107" cy="56" r="12"/><path d="M79 55h16"/></g>}
  {celebrating && <g fill="#dfae45"><path d="m20 29 3 8 8 3-8 3-3 8-3-8-8-3 8-3Zm134 1 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><circle cx="145" cy="12" r="3"/></g>}
 </svg>;
}

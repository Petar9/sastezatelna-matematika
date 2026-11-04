import {KidsOtter} from "./kids-otter";
import l from "./landing.module.css";

export function LandingIllustration(){
 return <div className={l.illustration} aria-hidden="true">
  <svg className={l.map} viewBox="0 0 520 420" fill="none" focusable="false">
   <path d="M47 100C76 43 152 60 210 39c67-24 125-11 174 32 48 42 118 79 109 146-9 65-80 69-117 116-43 54-98 74-159 54-53-17-73-53-117-75C32 278 12 168 47 100Z" fill="#e4f1f0"/>
   <g stroke="#bdd9dc" strokeWidth="3" strokeLinecap="round">
    <path d="M69 165h28m-16 10h28M358 280h27m-16 10h27M178 339h24m-13 10h24M394 69h18"/>
   </g>
   <path d="M107 267c-28-47 82-40 92-87s91 14 123-17 33-42 72-40" stroke="#c49843" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 11"/>
   <g>
    <path d="M49 265c-3 30 28 53 65 53s76-19 76-50l-25-15-100-1Z" fill="#ddc89b"/>
    <path d="M49 261c7-14 27-24 46-22 13-21 43-23 59-9 22-2 38 17 36 32-2 19-38 30-72 30s-75-12-69-31Z" fill="#9cbfa4"/>
    <path d="m81 260 12-19 12 19m-12-19v35" stroke="#497b68" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M144 263h14" stroke="#f8f3df" strokeWidth="5" strokeLinecap="round"/>
   </g>
   <g>
    <path d="M170 154c0 27 30 45 62 45s63-16 63-43l-26-16-75-1Z" fill="#ddc89b"/>
    <path d="M170 151c5-15 18-20 32-19 12-17 32-20 47-8 18-3 45 9 46 27 2 17-29 28-63 28s-64-12-62-28Z" fill="#adc9ac"/>
    <path d="m213 151 11-22 11 22Z" fill="#507f6c"/><path d="M224 150v13" stroke="#507f6c" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="259" cy="151" r="5" fill="#f8f3df"/>
   </g>
   <g>
    <path d="M337 114c0 30 28 49 63 49s66-17 66-47l-31-15-74-1Z" fill="#ddc89b"/>
    <path d="M337 111c4-15 22-22 38-23 12-14 36-18 51-6 20-1 41 13 40 29-1 19-31 30-66 30s-65-13-63-30Z" fill="#adc9ac"/>
    <path d="M381 90h38v28h-38Z" fill="#b67a42" stroke="#805a37" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M381 97h38m-30-7v28m22-28v28" stroke="#efc769" strokeWidth="5"/>
    <path d="M381 90c0-13 38-13 38 0" fill="#d6a153" stroke="#805a37" strokeWidth="2.5"/>
    <path d="M397 99h7v9h-7Z" fill="#fff0b4"/>
   </g>
   <g fill="#ddb658">
    <path d="m332 63 3 8 8 3-8 3-3 8-3-8-8-3 8-3Zm118 112 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>
    <circle cx="139" cy="111" r="3"/>
   </g>
  </svg>
  <div className={l.mascot}><KidsOtter /></div>
 </div>;
}

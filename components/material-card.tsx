import Link from "next/link";
import type {MaterialGuide} from "@/src/public-site";
import s from "./materials.module.css";
export function MaterialCard({guide}:{guide:MaterialGuide}){
 return <article className={s.card}><Link className={s.cardLink} href={guide.path}>
  <div className={s.cardMeta}><span className={s.school}>{"school" in guide?guide.school:guide.label}</span><span>{"year" in guide?`Прием ${guide.year} г.`:"4. клас"}</span></div>
  <h2>{guide.title}</h2><p>{guide.summary}</p><span className={s.read}>Прочети материала <span aria-hidden="true">→</span></span>
 </Link></article>;
}

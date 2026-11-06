import Link from "next/link";
import type {AdmissionGuide} from "@/src/public-site";
import s from "./materials.module.css";
export function MaterialCard({guide}:{guide:AdmissionGuide}){
 return <article className={s.card}><Link className={s.cardLink} href={guide.path}>
  <div className={s.cardMeta}><span className={s.school}>{guide.school}</span><span>Прием {guide.year} г.</span></div>
  <h2>{guide.title}</h2><p>{guide.summary}</p><span className={s.read}>Прочети материала <span aria-hidden="true">→</span></span>
 </Link></article>;
}

import Link from "next/link";
import type {ReactNode} from "react";
import {MaterialsHeader} from "./materials-header";
import {MaterialCard} from "./material-card";
import {articleStructuredData,type AdmissionGuide} from "@/src/public-site";
import l from "./landing.module.css";
import s from "./materials.module.css";
export function MaterialsArticle({guide,related,intro,contents,children}:{guide:AdmissionGuide;related:AdmissionGuide;intro:ReactNode;contents:{id:string;label:string}[];children:ReactNode}){
 return <main className={`${l.shell} ${s.shell}`}><div className={l.content}><MaterialsHeader/>
  <article className={s.article}>
   <nav className={s.breadcrumbs} aria-label="Път до страницата"><Link href="/materiali">← Ценни материали</Link></nav>
   <header className={s.articleHeader}><p className={s.eyebrow}>Прием {guide.year} г.</p><h1>{guide.title}</h1><p className={s.date}>Състезателна математика · Проверено на <time dateTime={guide.reviewedAt}>6 ноември 2026 г.</time></p><p className={s.lead}>{intro}</p></header>
   <nav className={s.contents} aria-label="В тази статия">{contents.map(item=><a key={item.id} href={`#${item.id}`}>{item.label}<span aria-hidden="true">↓</span></a>)}</nav>
   <div className={s.prose}>{children}</div>
   <aside className={s.related} aria-label="Свързан материал"><MaterialCard guide={related}/></aside>
   <p className={s.cta}><Link href="/about">Как работи подготовката в „Състезателна математика“ →</Link></p>
  </article>
 </div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(articleStructuredData(guide)).replace(/</g,"\\u003c")}}/></main>;
}

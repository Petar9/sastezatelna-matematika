import {MaterialsHeader} from "@/components/materials-header";
import {MaterialCard} from "@/components/material-card";
import {LandingIllustration} from "@/components/landing-illustration";
import {admissionGuides,publicMetadata} from "@/src/public-site";
import l from "@/components/landing.module.css";
import s from "@/components/materials.module.css";
export const metadata=publicMetadata("Ценни материали | Математика за 4. клас","Разяснения за състезанията и приема след 4. клас. Практични материали за родители с връзки към официалните източници.","/materiali");
export default function Materials(){
 return <main className={`${l.shell} ${s.shell}`}><div className={l.content}><MaterialsHeader/>
  <section className={s.hero} aria-labelledby="materials-title"><div><h1 id="materials-title">Ценни материали</h1><p className={s.lead}>За състезанията по математика и приема след 4. клас. Ясни обяснения, проверени източници.</p></div><div className={s.illustration}><LandingIllustration/></div></section>
  <div className={s.cards}>{Object.values(admissionGuides).map(guide=><MaterialCard key={guide.path} guide={guide}/>)}</div>
 </div></main>;
}

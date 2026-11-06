import Link from "next/link";
import {CompetitionCalendar} from "@/components/competition-calendar";
import {MaterialsArticle} from "@/components/materials-article";
import {admissionGuides,publicMetadata} from "@/src/public-site";
import s from "@/components/materials.module.css";
const guide=admissionGuides.npmg;
const npmg="https://npmg.org/прием/5-клас/";
const rules="https://npmg.org/wp-content/uploads/2026/09/информация-олимпиади-и-състезания-26-27.pdf";
export const metadata=publicMetadata(guide.title,guide.description,guide.path,{article:true});
export default function NpmgAdmissions(){
 return <MaterialsArticle guide={guide} related={admissionGuides.smg} intro={<>За приема в 5. клас през 2027/2028 г. НПМГ е обявила състезанията, които определят правото на участие. Методиката за класиране предстои да бъде публикувана.</>} contents={[{id:"competitions",label:"Състезанията"},{id:"scoring",label:"Балообразуване"},{id:"preparation",label:"Какво да следите"}]}>
  <section id="competitions"><h2>Кои състезания са посочени?</h2>
   <p>В <a href={rules}>официалното съобщение на НПМГ (PDF)</a> са посочени три състезания за 4. клас през учебната 2026/2027 г. Те се използват за определяне на правото на участие в приема за 2027/2028 г.:</p>
   <ul><li>Олимпиада по математика - областен кръг.</li><li>Пролетно математическо състезание.</li><li>„Математика за всеки“.</li></ul>
   <h3>Общ календар за 4. клас през 2026/2027 г.</h3><CompetitionCalendar/>
   <p>Списъкът не дава сам по себе си пълните условия за кандидатстване. Проверете ги в правилата за съответния прием, когато бъдат публикувани.</p>
  </section>
  <section id="scoring"><h2>Как ще се образува балът?</h2>
   <p className={s.notice}><strong>Методиката за класиране и тежестта на резултатите ще бъдат публикувани допълнително.</strong> Към 6 ноември 2026 г. съобщението не съдържа формула за изчисляване на бала.</p>
   <p>Затова още не може да се посочи приносът на всяко състезание към крайния резултат. <Link href={admissionGuides.smg.path}>Формулата на СМГ за 2026/2027 г.</Link> е за друго училище и минал прием; не я прилагайте към НПМГ.</p>
  </section>
  <section id="preparation"><h2>Какво да следите оттук нататък</h2>
   <ul><li><strong>Пълните правила.</strong> Условията за участие, методиката и коефициентите.</li><li><strong>Записването за състезания.</strong> Датите и редът за участие се проверяват отделно от сроковете за кандидатстване.</li><li><strong>Документите и класирането.</strong> Следете <a href={npmg}>официалната страница за прием в 5. клас на НПМГ</a>.</li></ul>
   <p>Докато методиката се уточнява, подготовката по задачите от посочените състезания има практична стойност. Не планирайте бала по неофициални коефициенти или правила от друга година.</p>
  </section>
 </MaterialsArticle>;
}

import Link from "next/link";
import {competitionGuides,publicMetadata} from "@/src/public-site";
export const metadata=publicMetadata("За приложението | Състезателна математика","Подготовка по математика за 4. клас с истински състезателни задачи, ясни подсказки и приключения с награди.","/about");
import s from "@/components/kids.module.css";
import styles from "./about.module.css";

export default function About() {
 return <main className={s.shell}>
  <div className={`${s.content} ${styles.content}`}>
   <Link className={s.secondary} href="/">← Начало</Link>
   <header className={styles.intro}>
    <h1 className={s.title}>За „Състезателна математика“</h1>
    <p className={styles.lead}>Подготовка по математика за 4. клас с истински задачи, ясни подсказки и приключения с награди.</p>
    <p>Включени са задачи от последните четири години от „Математика за всеки“, двата кръга на Олимпиадата по математика, Пролетното математическо състезание и НВО.</p>
    <p>Детето решава истински задачи, а сходни упражнения му помагат да затвърди наученото. Подсказките разкриват решението стъпка по стъпка. Обясненията използват подходи от опитни преподаватели по математика, които лично проверяват приложението.</p>
    <p>Подготовката следва напредъка на детето и предлага практика там, където е нужна.</p>
   </header>
   <div className={styles.competitions}>
    <section className={`${s.card} ${styles.competition}`} aria-labelledby="maths-for-everyone">
     <h2 id="maths-for-everyone">Математика за всеки</h2>
     <p>Състезание за четвъртокласници с тест и задачи с подробно решение. Развива съобразителност и умение да обясниш решението си. Резултатът участва в приема след 4. клас според правилата на съответното училище. При приема в СМГ за 2026/2027 г. трансформираният резултат от него има най-голяма тежест сред състезанията. Тежестите за приема в НПМГ за 2027/2028 г. предстои да бъдат публикувани.</p>
     <p className={styles.articleLink}><Link href={competitionGuides.maths.path}>Формат и подготовка →</Link></p>
    </section>
    <section className={`${s.card} ${styles.competition}`} aria-labelledby="olympiad">
     <h2 id="olympiad">Олимпиада по математика</h2>
     <p>За четвъртокласниците се провежда в два кръга: общински и областен. Всеки включва три задачи с подробно решение. Развива логическо мислене, съобразителност и умение да обосновеш отговора си.</p>
     <p className={styles.articleLink}><Link href={competitionGuides.olympiad.path}>Формат и подготовка →</Link></p>
    </section>
    <section className={`${s.card} ${styles.competition}`} aria-labelledby="spring">
     <h2 id="spring">Пролетно математическо състезание</h2>
     <p>Четири задачи с подробно решение за четвъртокласници. Съчетава училищния материал с допълнителна подготовка и изисква обосновка на всяка стъпка.</p>
     <p className={styles.articleLink}><Link href={competitionGuides.spring.path}>Формат и подготовка →</Link></p>
    </section>
    <section className={`${s.card} ${styles.competition}`} aria-labelledby="nvo">
     <h2 id="nvo">НВО по математика</h2>
     <p>Националното външно оценяване проверява наученото до края на 4. клас. Включва задачи по смятане, геометрия и приложение на математиката в ежедневието.</p>
     <p className={styles.articleLink}><Link href={competitionGuides.nvo.path}>Формат и подготовка →</Link></p>
    </section>
   </div>
   <p><Link href="/materiali">Ценни материали за подготовката и приема след 4. клас →</Link></p>
  </div>
 </main>;
}

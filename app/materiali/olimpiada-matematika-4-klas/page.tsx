import Link from "next/link";
import {MaterialsArticle} from "@/components/materials-article";
import {admissionGuides,competitionGuides,competitionSources,competitionCalendarSource,publicMetadata} from "@/src/public-site";
import s from "@/components/materials.module.css";
const guide=competitionGuides.olympiad;
export const metadata=publicMetadata(guide.title,guide.description,guide.path,{article:true});
export default function Article(){
 return <MaterialsArticle guide={guide} related={competitionGuides.spring} intro={<>За четвъртокласниците олимпиадата по математика има общински и областен кръг. И в двата детето записва решенията си, а не само отговорите.</>} contents={[{"id": "municipal", "label": "Общински кръг"}, {"id": "regional", "label": "Областен кръг"}, {"id": "preparation", "label": "Подготовка"}]}>

<p className={s.notice}>Форматът по-долу е по <a href={competitionSources.olympiad}>регламента за 2025/2026 г. (PDF)</a>. Датата за 2027 г. е от отделно актуално съобщение; тя не потвърждава всички правила за новата учебна година.</p>
<section id="municipal"><h2>Общински кръг: откъде започва участието?</h2>
<p>Това е първият кръг. По регламента за 2025/2026 г. учениците решават три задачи за 4 часа. Всяка задача носи до 7 точки, общо до 21. Първите две са по училищния материал, а третата изисква допълнителна подготовка.</p>
<p>По регламента за 2025/2026 г. до областния кръг се допускат учениците с поне 16 точки. Записването и конкретната дата на общинския кръг се уточняват чрез училището на детето.</p>
</section>
<section id="regional"><h2>Областен кръг: какво се променя?</h2>
<p>До него се стига след общинския. За 4. клас по същия регламент форматът отново е три задачи, до 21 точки и 4 часа работа. Четвъртокласниците не участват в национален кръг.</p>
<p>За областния кръг през 2027 г. е обявена дата <strong><time dateTime="2027-02-07">7 февруари</time></strong> в <a href={competitionCalendarSource}>съобщението на НПМГ (PDF)</a>. Проверете актуалния регламент и указанията на РУО преди участие.</p>
<p>Резултатът може да участва в приема след 4. клас според училищните правила. Вижте отделно <Link href={admissionGuides.smg.path}>СМГ</Link> и <Link href={admissionGuides.npmg.path}>НПМГ</Link>, като обърнете внимание за коя година са условията.</p>
</section>
<section id="preparation"><h2>Как да упражнявате подробните решения?</h2>
<p>Насърчавайте детето да записва какво знае, какво търси и защо избраният подход работи. Верният отговор е само част от решението; обяснението показва разбирането.</p>
<p>При задача с подусловия работете последователно и запазвайте намерените резултати. Ако едно подусловие затруднява детето, обсъдете точно тази стъпка, след което опитайте сходна задача.</p>
<p>За друг формат с подробни решения вижте <Link href={competitionGuides.maths.path}>„Математика за всеки“</Link>.</p>
</section>
 </MaterialsArticle>;
}

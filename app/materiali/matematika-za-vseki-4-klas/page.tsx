import Link from "next/link";
import {MaterialsArticle} from "@/components/materials-article";
import {admissionGuides,competitionGuides,competitionSources,competitionCalendarSource,publicMetadata} from "@/src/public-site";
import s from "@/components/materials.module.css";
const guide=competitionGuides.maths;
export const metadata=publicMetadata(guide.title,guide.description,guide.path,{article:true});
export default function Article(){
 return <MaterialsArticle guide={guide} related={competitionGuides.olympiad} intro={<>По регламента за 2025/2026 г. „Математика за всеки“ съчетава тест и две задачи с подробно решение. Подготовката включва и точно смятане, и умение детето да обясни как е стигнало до отговора.</>} contents={[{"id": "format", "label": "Формат и точки"}, {"id": "admission", "label": "Значение за приема"}, {"id": "preparation", "label": "Подготовка"}]}>

<section id="format"><h2>Какви задачи включва?</h2>
<p>По <a href={competitionSources.maths}>регламента на МОН за 2025/2026 г. (PDF)</a> първият модул съдържа 15 задачи с избираем отговор и 5 с кратък числов отговор. Те носят съответно по 1 и по 2 точки, общо до 25.</p>
<p>Вторият модул е с две задачи с подробно решение, всяка до 10 точки. Максималният резултат от състезанието е <strong>45 точки</strong>.</p>
<p>Времето по този регламент е 75 минути за първия модул и 120 за втория. Времетраенето е променяно през годините; за участието през 2027 г. следвайте регламента за 2026/2027 г.</p>
<p className={s.notice}>Обявената дата за 2027 г. е <time dateTime="2027-05-15">15 май</time> според <a href={competitionCalendarSource}>съобщението на НПМГ (PDF)</a>. Датата и сроковете за записване се проверяват отделно.</p>
</section>
<section id="admission"><h2>Какво значение има за приема след 4. клас?</h2>
<p>Зависи от правилата на училището за конкретния прием. В <Link href={admissionGuides.smg.path}>разгледаната формула на СМГ за 2026/2027 г.</Link> трансформираният резултат има тежест 6. За <Link href={admissionGuides.npmg.path}>НПМГ през 2027/2028 г.</Link> са обявени състезанията, но тежестите предстои да бъдат публикувани.</p>
</section>
<section id="preparation"><h2>Как да се подготвя детето?</h2>
<p>Редувайте кратки тестови задачи с по-дълги решения. При теста упражнявайте проверка на сметките и избор на подход. При подробните задачи детето трябва да запише защо всяка стъпка е вярна, а не само крайния отговор.</p>
<p>След трудна задача оставете време за обсъждане и за сходно упражнение. Решаването на една тема за време е полезна проверка, но не е нужно всяко занимание да бъде изпит.</p>
<p>Преди записване проверете съобщението на РУО и училището координатор. За сравнение вижте <Link href={competitionGuides.spring.path}>Пролетното математическо състезание</Link>.</p>
<p>При недостъпен сайт на МОН: <a href={competitionSources.mathsCopy}>копие на регламента за 2025/2026 г. в Danybon (PDF)</a>.</p>
</section>
 </MaterialsArticle>;
}

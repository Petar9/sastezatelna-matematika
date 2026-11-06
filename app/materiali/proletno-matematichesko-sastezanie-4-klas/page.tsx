import Link from "next/link";
import {MaterialsArticle} from "@/components/materials-article";
import {admissionGuides,competitionGuides,competitionSources,competitionCalendarSource,publicMetadata} from "@/src/public-site";
const guide=competitionGuides.spring;
export const metadata=publicMetadata(guide.title,guide.description,guide.path,{article:true});
export default function Article(){
 return <MaterialsArticle guide={guide} related={competitionGuides.olympiad} intro={<>Пролетното математическо състезание за 4. клас включва четири задачи с подробно решение. То съчетава училищния материал със задачи, които изискват допълнителна подготовка.</>} contents={[{"id": "format", "label": "Формат за 4. клас"}, {"id": "admission", "label": "Дата и прием"}, {"id": "preparation", "label": "Подготовка"}]}>

<section id="format"><h2>Колко задачи, точки и време?</h2>
<p>Според регламента за 2025/2026 г. първите две задачи са по училищния материал и носят до 10 точки всяка. Другите две са от разширената и допълнителната подготовка и носят до 15 точки всяка. Максимумът е <strong>50 точки</strong>, а времето за работа е <strong>4 часа и 30 минути</strong>.</p>
<p>Състезанието за 4. клас е в един областен кръг. Не пренасяйте към него точките и организацията за по-големите ученици.</p>
<p>Източник: <a href={competitionSources.spring}>регламент на МОН за 2025/2026 г. (копие, PDF)</a>. За следващото издание проверете регламента за съответната учебна година.</p>
</section>
<section id="admission"><h2>Кога е през 2027 г. и участва ли в приема?</h2>
<p>В <a href={competitionCalendarSource}>съобщението на НПМГ (PDF)</a> е посочена дата <strong><time dateTime="2027-03-27">27 март 2027 г.</time></strong> Датите могат да се променят; следете и отделния срок за записване.</p>
<p>Значението на резултата зависи от училището и годината на приема. Вижте <Link href={admissionGuides.smg.path}>правилата на СМГ за 2026/2027 г.</Link> и <Link href={admissionGuides.npmg.path}>обявеното от НПМГ за 2027/2028 г.</Link>, без да смесвате двата приема.</p>
</section>
<section id="preparation"><h2>Как да се подготви детето?</h2>
<p>Работете върху целия ход на решението: разбиране на условието, избор на подход, смятане и проверка. При геометрична задача е полезен собствен чертеж с означени данни; при изброяване - подреден списък или таблица.</p>
<p>Не е нужно всяко занимание да продължава колкото състезанието. Решавайте една задача или подусловие с време за обяснение, а периодично опитвайте цяла тема. Това помага да се упражни и разпределянето на времето.</p>
<p>Друг формат с подробни решения е <Link href={competitionGuides.maths.path}>„Математика за всеки“</Link>.</p>
</section>
 </MaterialsArticle>;
}

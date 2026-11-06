import Link from "next/link";
import {MaterialsArticle} from "@/components/materials-article";
import {admissionGuides,competitionGuides,competitionSources,publicMetadata} from "@/src/public-site";
import s from "@/components/materials.module.css";
const guide=competitionGuides.nvo;
export const metadata=publicMetadata(guide.title,guide.description,guide.path,{article:true});
export default function Article(){
 return <MaterialsArticle guide={guide} related={competitionGuides.maths} intro={<>НВО по математика проверява наученото до края на 4. клас. То е външно оценяване по училищния материал, а не математическо състезание.</>} contents={[{"id": "format", "label": "Какво включва"}, {"id": "preparation", "label": "Подготовка"}, {"id": "admission", "label": "Роля при приема"}]}>

<section id="format"><h2>Какви знания и задачи проверява?</h2>
<p>В <a href={competitionSources.nvoCopy}>модела на МОН за 2026/2027 г. (копие, PDF)</a> са включени числа и действия, неизвестно число, мерни единици, геометрични фигури, текстови задачи и разчитане на данни.</p>
<p>Тестът съдържа <strong>25 задачи</strong> с избираем и свободен отговор, включително задача с три подусловия. Времето е <strong>60 минути</strong>, а максималният резултат - <strong>100 точки</strong>. Моделът предвижда допълнително време за ученици със специални образователни потребности.</p>
<p className={s.notice}>Параметрите са от модела за 2026/2027 г. Следете <a href={competitionSources.nvo}>страницата на МОН</a> и указанията на училището за организацията на изпита.</p>
</section>
<section id="preparation"><h2>Как да се подготвя детето?</h2>
<p>Започнете от задачите, които го затрудняват в училище. Редувайте смятане с текстови задачи, мерни единици и геометрия. Детето трябва да разчита условието и да избира действие, а не само да пресмята бързо.</p>
<p>Упражнявайте записването в бланка и проверката на отговорите. При задача с подусловия прочитайте всяко от тях отделно и проверявайте дали всички търсени отговори са дадени.</p>
</section>
<section id="admission"><h2>Достатъчно ли е НВО за прием след 4. клас?</h2>
<p>Не приемайте, че добрият резултат сам по себе си осигурява участие или място. Проверете условията на избраното училище: <Link href={admissionGuides.smg.path}>разгледания прием в СМГ за 2026/2027 г.</Link> и <Link href={admissionGuides.npmg.path}>обявеното от НПМГ за 2027/2028 г.</Link>.</p>
<p>Състезанията могат да изискват допълнителна подготовка. Вижте разликата във формата на <Link href={competitionGuides.olympiad.path}>олимпиадата</Link>.</p>

</section>
 </MaterialsArticle>;
}

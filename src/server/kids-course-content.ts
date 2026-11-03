import { workedSolution } from "./kids-worked-solutions.ts";
import type { CourseProblem, CourseSkill, CourseTopic, KidsCourseContent } from "../core/kids-course.ts";
import { expandedOriginal, expandedVariant, expansionRows, extendTopics } from "./kids-course-expansion.ts";
import originals from "./kids-course-originals.json" with { type: "json" };

import { learningConcepts, buildObjectiveMap } from "./kids-learning-map.ts";

const source = "Математика за всеки · 01.06.2024 · 4. клас";
const authored = (id: string) => `Нова учебна задача по ${id} · ${source}`;
const figures: Record<string, string> = {
	"M1-09": "Равнобедрен триъгълник с два външни равностранни триъгълника върху бедрата.",
	"M1-10": "Два еднакви квадрата с обща отсечка AB.",
	"M1-11": "Правоъгълниците П1, П2 и П3 от оригиналния чертеж.",
	"M1-14": "Квадрат ABCD с три реда и три колони; средният правоъгълник е 3 на 1 см.",
	"M2-2a": "Чертеж 1: квадрат с девет правоъгълника; обиколки 22, 44, 14, x и y.",
	"M2-2b": "Чертеж 2: квадрат с девет правоъгълника; лица 72, s, 2s и 3s.",
};
const skill = (id: string, title: string, ...lesson: string[]): CourseSkill => ({ id, title, lesson });
export const courseTopics: CourseTopic[] = [
	{ id: "digits", title: "Цифри и векове", rewardName: "цифри и векове", skills: [skill("M1-01", "Цифри и векове", "Векът започва в година, завършваща на 01, и свършва в година, завършваща на 00.", "Провери годините подред по правилото за цифрите, за да намериш първата.", "Ако се пита след колко години, извади сегашната от намерената година.")] },
	{ id: "backwards", title: "Рачешки задачи", rewardName: "рачешки задачи", skills: [
		skill("M1-02", "Обратни действия", "Частно 1 означава, че делителят е равен на делимото.", "Върни действията от последното към първото: извади добавеното, раздели на множителя.", "Намери неизвестното умалително и провери чрез заместване."),
		skill("M1-16", "Правоъгълници назад", "Запиши дължините на всички правоъгълници до последния.", "Раздели последното лице на последната дължина, за да намериш ширината.", "Върни всички намаления на ширината. Обиколката е два пъти сборът на дължината и ширината.")] },
	{ id: "matches", title: "Точки и мачове", rewardName: "точки и мачове", skills: [skill("M1-03", "Точки и мачове", "Раздели мачовете на победи, равенства и загуби.", "Извади точките от победите. Всяка останала точка е едно равенство.", "От всички мачове извади победите и равенствата.")] },
	{ id: "money", title: "Пари и цени", rewardName: "пари и цени", skills: [
		skill("M1-04", "Остават и не достигат", "Подреди сумите: евтина покупка → моите пари → скъпа покупка.", "Разликата между покупките е остатъкът плюс недостигът. Раздели я на оскъпяването на един предмет.", "Парите са евтината покупка плюс остатъка. Работи в една мерна единица."),
		skill("M1-08", "Сравняваме покупки", "Намали двете покупки така, че да имат еднакъв брой моливи.", "Извади равните покупки: моливите се премахват.", "Останалата разлика е за две замени на гума с химикалка. Раздели я на две.")] },
	{ id: "totals", title: "Общ брой, разлики и възрасти", rewardName: "общ брой и разлики", skills: [
		skill("M1-05", "Сбор и разлика", "Намери общия брой деца след влизането.", "От общия брой махни разликата и раздели на две, за да намериш по-малката група.", "Върни се до началото, като извадиш влезлите момичета."),
		skill("M1-07", "Петици и шестици", "Подреди възможностите за шестиците, без сборът им да надхвърля общия сбор.", "Остатъкът трябва да се дели на пет. Запиши само целите възможности.", "Провери и условието: шестиците са повече от петиците. После събери броя им."),
		skill("M1-13", "Обща възраст", "От преди две до след две години минават четири години, а не две.", "Намери увеличението на общия сбор на възрастите.", "Раздели увеличението на годините, с които пораства всяко дете.")] },
	{ id: "pieces", title: "Разрези и части", rewardName: "разрези и части", skills: [skill("M1-06", "Разрези и части", "Разрезите на една тръба дават с една повече части.", "Представи си, че всички части са къси. Намери колко дължина остава.", "Всяка замяна с дълга част добавя разликата между двете дължини.")] },
	{ id: "perimeters", title: "Обиколки на свързани фигури", rewardName: "обиколки", skills: [
		skill("M1-09", "Триъгълници и външна граница", "От обиколката на равнобедрения триъгълник махни основата и раздели на две.", "Проследи само външната граница. Двете бедра във вътрешността не участват.", "Външната граница съдържа четири страни с дължина на бедрото и една основа."),
		skill("M1-10", "Допиращи се квадрати", "Сборът на обиколките на двата квадрата е осем пъти страната.", "Общата отсечка е преброена два пъти, а е вътрешна: махни я два пъти.", "Лицата не се застъпват: общото лице е два пъти лицето на един квадрат.")] },
	{ id: "areas", title: "Сравняваме и разделяме лица", rewardName: "лица на фигури", skills: [
		skill("M1-11", "Сравняваме лица", "Използвай лицето на П1 като една част.", "Ако общото лице на П1 и П3 е девет части, за П3 остават осем.", "Намери по същия начин частите за П2 и сравни П2 с П3."),
		skill("M1-14", "Четирите ъгъла", "Намери страната на квадрата от обиколката.", "Събери ширините на двете крайни колони и височините на двата крайни реда.", "Четирите ъгъла имат общо лице (страна − средна ширина) · (страна − средна височина). Средата не се изважда два пъти.")] },
	{ id: "clocks", title: "Часовник и денонощия", rewardName: "часове и денонощия", skills: [skill("M1-12", "Часовник и денонощия", "След всяко цяло денонощие часовникът показва същия час.", "Раздели изминалите часове на 24 и вземи само остатъка.", "Прибави остатъка към началния час. Ако получиш 24 или повече, извади 24.")] },
	{ id: "constraints", title: "Най-малко и най-много", rewardName: "задачи с ограничения", skills: [
		skill("M1-15", "Най-малко събираеми", "Намери най-голямото разрешено събираемо, което не надхвърля сбора.", "Докажи, че с един по-малко събираеми дори най-големите не стигат.", "Покажи и конкретен разрешен сбор. Само долна граница не е достатъчна."),
		skill("M1-19", "Частно и остатък", "Остатъкът е по-малък от делителя.", "Изрази остатъка чрез частното. Така намираш най-голямото допустимо частно.", "Числото е делител · частно + остатък. Провери отново остатъка."),
		skill("M2-1c", "Запазваме най-много числа", "Да изтриеш най-малко означава да запазиш най-много различни числа.", "Сборът на първите k естествени числа е k · (k + 1) : 2. По-малък сбор за k различни положителни числа няма.", "Намери максималното k и покажи възможен сбор с толкова числа, като увеличиш последното. Извади k от общия брой.")] },
	{ id: "sequences", title: "Числови редици", rewardName: "числови редици", skills: [
		skill("M1-17", "Броим цифри в блокове", "Записът е съставен от блокове: 1; 1,2; 1,2,3 и т.н.", "Брой срещанията на цифрата, включително в двуцифрените числа. Например 14 съдържа четворка.", "Спри точно при търсеното срещане и преброй всички изписани цифри дотогава."),
		skill("M1-18", "Последователни четни числа", "При нечетен брой последователни четни числа средното е сборът, разделен на броя.", "От средното до най-малкото има (брой − 1) : 2 стъпки.", "Всяка стъпка е две. Извади два пъти броя на стъпките."),
		skill("M2-1a", "Брой числа в редица", "В редицата 1 до N числата след a са N − a, а преди b са b − 1.", "Запиши условието за разликата на двата броя и събери a и b от едната страна.", "Намери и самите a и b от сбора и разликата им, за да провериш условията.")] },
	{ id: "counting", title: "Броим възможности", rewardName: "броене на възможности", skills: [
		skill("M1-20", "Разпределяме бонбони", "Всеки от тримата приятели трябва да получи поне един бонбон.", "Подреди възможностите по броя за първия приятел. За всеки такъв брой преброй положителните разпределения за другите двама.", "Събери случаите. Приятелите са различни, затова размяна на различни дялове дава нов случай."),
		skill("M2-1b", "Числа с дадена цифра", "Броим числа, а не колко пъти се среща цифрата. 44 е едно число.", "За цял блок 000 до 999 има 1000 записа. Без цифра 4 има 9 · 9 · 9 = 729.", "Извади записите без цифрата и разгледай отделно непълния последен блок.")] },
	{ id: "grids", title: "Правоъгълници в квадратна мрежа", rewardName: "правоъгълни мрежи", skills: [
		skill("M2-2a", "Мрежа с обиколки", "Половината от всяка дадена обиколка е сбор на ширина и височина. Трите дадени сбора покриват всички ширини и височини.", "Сборът им е два пъти страната на квадрата. Намери страната и x + y.", "Всички ширини и височини са положителни цели числа. За максимум x намали средната ширина и запази всички останали размери поне 1 см. Провери с конкретни размери."),
		skill("M2-2b", "Мрежа с лица", "Нека долу вдясно страните са a и b, така че s = a · b. Височините на редовете са b, 3b и 2b.", "Средната колона е широка 2a. Централното лице е 2a · 3b = 6s. От него намери s.", "Страната на квадрата е 6b, а лявата ширина е 6b − 3a. Провери целите двойки a · b = s, като всички размери са над 1 см, и избери най-малката възможна страна.")] },
];
const topicPictures: Record<string, string> = { backwards: "backwards", perimeters: "boundary", areas: "boundary", totals: "parts", money: "parts", grids: "grid", pieces: "parts" };
for (const topic of courseTopics) for (const item of topic.skills) item.illustration = {
 src: `/kids/lessons/${item.id === "M2-2b" ? "grid-areas" : topicPictures[topic.id] ?? "cases"}.svg`, alt: `Учебна схема към ${item.title}; не е чертеж по мащаб.`,
};

function numeric(skillId: string, index: number, text: string, values: [string, number][], explanation: string[], hint: string, figure?: CourseProblem["figure"]): CourseProblem {
	return { id: `${skillId}:v${index}`, skillId, text, source: authored(skillId),
		fields: values.map(([label, answer]) => ({ label, answer: String(answer) })), explanation, hint, figure, teachingFigure: courseTopics.flatMap(t => t.skills).find(s => s.id === skillId)?.illustration };
}
function digitSequence(occurrences: number): number {
	let seen = 0, digits = 0;
	for (let end = 1; end < 1000; end++) for (let n = 1; n <= end; n++) for (const digit of String(n)) {
		digits++; if (digit === "4" && ++seen === occurrences) return digits;
	}
	throw new Error("Sequence bound");
}
const countFours = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1).includes("4")).filter(Boolean).length;
const sums = (n: number) => n * (n + 1) / 2;

function variant(id: string, n: number, harder: boolean): CourseProblem {
	const k = n + (harder ? 100 : 0), j = k + 1;
	const lesson = courseTopics.flatMap(t => t.skills).find(s => s.id === id)!;
	const make = (text: string, values: [string, number][], steps: string[], extra?: [string, number][], figure?: CourseProblem["figure"]) => numeric(id, k, text, harder && extra ? [...values, ...extra] : values, steps, lesson.lesson[0]!, figure);
	switch (id) {
		case "M1-01": {
			const start = (harder ? 2100 : 2000) + j % 99 + 1, century = Math.floor((start - 1) / 100) + 1;
			let year = century * 100 + 1;
			while (String(year).slice(0, 3).split("").reduce((a, d) => a + Number(d), 0) !== year % 10) year++;
			return make(`Годината е ${start}. „Интересна“ е година, в която сборът на първите три цифри е равен на последната. След колко години е първата такава година от следващия век?`, [["След колко години?", year - start]], [`Следващият век започва през ${century * 100 + 1} г.`, `Първата подходяща година е ${year}. Разликата е ${year} − ${start} = ${year - start}.`], [["Коя е намерената година?", year]]);
		}
		case "M1-02": {
			const factor = harder ? 12 : 5, part = 30 + j, add = 20 + j, total = factor * part + add, x = total - part;
			return make(`Намери x: ${total} : ((${total} − x) · ${factor} + ${add}) = 1.`, [["x =", x]], [`Делителят е ${total}.`, `Преди добавянето: ${total} − ${add} = ${factor * part}; преди умножението: ${factor * part} : ${factor} = ${part}.`, `x = ${total} − ${part} = ${x}.`], [["Стойност на (общото число − x)", part]]);
		}
		case "M1-03": {
			const wins = 4 + j, draws = harder ? 7 : 3, losses = 2 + j, matches = wins + draws + losses, points = 3 * wins + draws;
			return make(`Победа носи 3 точки, равенство 1, загуба 0. Отбор има ${points} точки от ${matches} мача и ${wins} победи. Колко загуби има?`, [["Загуби", losses]], [`Победите носят ${wins * 3} точки.`, `Равенства: ${points} − ${wins * 3} = ${draws}.`, `Загуби: ${matches} − ${wins} − ${draws} = ${losses}.`], [["Равенства", draws]]);
		}
		case "M1-04": {
			const cheap = 100 + 10 * j, delta = harder ? 75 : 50, count = 3 + j, left = delta, short = delta * (count - 1), total = cheap * count + left;
			return make(`Тефтер струва ${cheap} ст., а друг вид ${cheap + delta} ст. При покупка на няколко евтини тефтера остават ${left} ст.; за същия брой скъпи не достигат ${short} ст. Колко стотинки имам?`, [["Пари (ст.)", total]], [`Разлика между покупките: ${left} + ${short} = ${left + short} ст.`, `Тефтери: ${left + short} : ${delta} = ${count}.`, `Пари: ${count} · ${cheap} + ${left} = ${total} ст.`], [["Брой тефтери", count]]);
		}
		case "M1-05": {
			const girls = 2 + j, boys = girls + 4, inGirls = harder ? 9 : 5, inBoys = 8, total = girls + boys + inGirls + inBoys, diff = boys + inBoys - girls - inGirls;
			return make(`Първоначално има ${girls + boys} деца. Влизат ${inBoys} момчета и ${inGirls} момичета. Тогава момчетата са с ${diff} повече. Колко момичета е имало първоначално?`, [["Момичета в началото", girls]], [`Сега децата са ${total}. Момичета: (${total} − ${diff}) : 2 = ${girls + inGirls}.`, `В началото: ${girls + inGirls} − ${inGirls} = ${girls}.`], [["Момчета в началото", boys]]);
		}
		case "M1-06": {
			const long = j + 2, short = harder ? 7 : 4, a = harder ? 5 : 3, b = a + 1, pieces = long + short, length = a * short + b * long;
			return make(`Тръба с дължина ${length} см е разрязана с ${pieces - 1} разреза на части по ${a} или ${b} см. Колко са дългите части?`, [["Дълги части", long]], [`Частите са ${pieces - 1} + 1 = ${pieces}.`, `Ако всички са къси: ${pieces} · ${a} = ${pieces * a} см.`, `Дългите са (${length} − ${pieces * a}) : ${b - a} = ${long}.`], [["Къси части", short]]);
		}
		case "M1-07": {
			// These totals each have exactly one nonnegative solution with more sixes.
			const totals = Array.from({ length: 140 }, (_, i) => i + 20).filter(sum => {
				let count = 0;
				for (let h = 0; h * 6 <= sum; h++) { const f = (sum - h * 6) / 5; if (Number.isInteger(f) && f >= 0 && h > f) count++; }
				return count === 1;
			});
			const total = totals[n % totals.length]!;
			const pairs = Array.from({ length: Math.floor(total / 6) + 1 }, (_, h) => [h, (total - 6 * h) / 5]).filter(([h, f]) => Number.isInteger(f) && f! >= 0 && h! > f!);
			const [h, f] = pairs[0]!;
			// Harder variants use an extra constraint and a different total, preserving uniqueness.
			const sixes = h! + (harder ? 30 + n : 0), fives = f!, sum = 6 * sixes + 5 * fives;
			return make(`Оценките са само петици и шестици, шестиците са повече. Сборът е ${sum}.${harder ? ` Петиците са по-малко от 6.` : ""} Колко са оценките?`, [["Брой оценки", sixes + fives]], [`Проверяваме целите решения на 6 · шестици + 5 · петици = ${sum}.`, `${sixes} шестици и ${fives} петици дават ${sum}; условията изключват останалите двойки.`, `Общо: ${sixes} + ${fives} = ${sixes + fives}.`], [["Шестици", sixes], ["Петици", fives]]);
		}
		case "M1-08": {
			const pencil = 30 + j, rubber = 20 + j, difference = 40 + 2 * j, pen = rubber + difference, first = 2 * pencil + 4 * rubber, second = 3 * pencil + 6 * pen;
			return make(`2 молива и 4 гуми струват ${first} ст.; 3 молива и 6 химикалки струват ${second} ст. С колко стотинки химикалката е по-скъпа от гумата?`, [["Разлика (ст.)", difference]], [`Половината от първата покупка е ${first / 2} ст.`, `Третината от втората е ${second / 3} ст.`, `Разликата е за две замени: (${second / 3} − ${first / 2}) : 2 = ${difference} ст.`], [["Цена на 1 молив и 2 химикалки (ст.)", second / 3]]);
		}
		case "M1-09": {
			const ratio = 7 + 2 * j, base = 2 + j, side = (ratio - 1) / 2, outer = 4 * side + 1;
			return make(`Използвай същото построение като в оригиналния чертеж: върху двете бедра на равнобедрен триъгълник външно са построени равностранни триъгълници. Обиколката на равнобедрения триъгълник е ${ratio} пъти основата. Колко пъти външната обиколка е по-голяма от основата?${harder ? ` Основата е ${base} см.` : ""}`, [["Колко пъти?", outer]], [`Едно бедро е (${ratio} − 1) : 2 = ${side} основи.`, `Външната граница е 4 бедра и основата: 4 · ${side} + 1 = ${outer}.`], [["Външна обиколка (см)", base * outer]], { src: "/kids/figures/M1-09.png", alt: figures[id]! });
		}
		case "M1-10": {
			const side = 6 + j, shared = harder ? 5 : 3, perimeter = 8 * side - 2 * shared;
			return make(`Два еднакви квадрата се допират по обща отсечка с дължина ${shared} см и имат обща външна обиколка ${perimeter} см. Не се застъпват. Колко е общото им лице? Подредбата е като на чертежа; числовите данни са от условието.`, [["Общо лице (кв.см)", 2 * side * side]], [`8 страни = ${perimeter} + 2 · ${shared} = ${8 * side} см.`, `Страна: ${side} см; общо лице: 2 · ${side} · ${side} = ${2 * side * side} кв.см.`], [["Страна (см)", side]], { src: "/kids/figures/M1-10.png", alt: figures[id]! });
		}
		case "M1-11": {
			const a = 2 + j, factor = harder ? 5 : 3, b = a * factor, unit = 2 + j;
			return make(`Лицето на П1 е 1/${b + 1} от общото лице на П1 и П3 и 1/${a + 1} от общото лице на П1 и П2. Колко пъти П3 е по-голям от П2?${harder ? ` П1 има лице ${unit} кв.см.` : ""}`, [["Колко пъти?", factor]], [`Ако П1 е една част, П3 е ${b} части, а П2 е ${a} части.`, `${b} : ${a} = ${factor}.`], [["Лице на П2 (кв.см)", a * unit]], { src: "/kids/figures/M1-11.png", alt: figures[id]! });
		}
		case "M1-12": {
			const start = (7 + j) % 24, hours = 49 + 7 * j, remainder = hours % 24;
			return make(`Сега е ${start} часът. Колко ще е часът след ${hours} часа?`, [["Час (0–23)", (start + remainder) % 24]], [`${hours} = ${Math.floor(hours / 24)} · 24 + ${remainder}.`, `Прибавяме ${remainder} часа и при нужда изваждаме 24: ${(start + remainder) % 24} часът.`], [["Цели денонощия", Math.floor(hours / 24)], ["Останали часове", remainder]]);
		}
		case "M1-13": {
			const count = 8 + j, past = harder ? 3 : 2, future = harder ? 4 : 1, before = count * 8, after = before + count * (past + future);
			return make(`Преди ${past} години общата възраст на група деца е ${before} години, а след ${future} години ще е ${after}. Броят деца не се променя. Колко са те?`, [["Брой деца", count]], [`Между двата момента минават ${past + future} години.`, `Броят е (${after} − ${before}) : ${past + future} = ${count}.`], [["Колко години между двата момента?", past + future]]);
		}
		case "M1-14": {
			const side = 7 + j, width = harder ? 4 : 2, height = harder ? 3 : 1, area = (side - width) * (side - height);
			return make(`Квадрат с обиколка ${4 * side} см е разделен на 9 правоъгълника с три реда и три колони. Средният е широк ${width} см и висок ${height} см. Какъв е сборът на лицата на четирите ъглови правоъгълника? Чертежът показва подредбата; надписите 3 см и 1 см са от оригиналната задача, тук използвай ${width} см и ${height} см.`, [["Четири ъгъла (кв.см)", area]], [`Страната е ${side} см.`, `Лицето е (${side} − ${width}) · (${side} − ${height}) = ${area} кв.см.`], [["Лице на премахнатия кръст (кв.см)", side * side - area]], { src: "/kids/figures/M1-14.png", alt: figures[id]! });
		}
		case "M1-15": {
			const count = 2 + j, total = 666 * count + 26;
			return make(`Събираме числа, всяко най-много трицифрено, записано само с цифри 2 и 6. Сборът е ${total}. Колко най-малко събираеми трябват?`, [["Най-малък брой", count + 1]], [`Най-голямото допустимо събираемо е 666. С ${count} събираеми сборът е най-много ${666 * count}, което не стига.`, `${count} пъти 666 и още 26 дават ${total}, значи ${count + 1} събираеми стигат.`], [["Сбор с един по-малко, ако всички са максимални", count * 666]]);
		}
		case "M1-16": {
			const length = 32 + j * 8, lastWidth = 3 + j, delta = harder ? 3 : 2, lastLength = length / 8, area = lastLength * lastWidth, width = lastWidth + 3 * delta;
			return make(`Всеки следващ правоъгълник е с два пъти по-малка дължина и с ${delta} см по-малка ширина. Първият е дълъг ${length} см, четвъртият има лице ${area} кв.см. Колко е обиколката на първия?`, [["Обиколка (см)", 2 * (length + width)]], [`Четвъртата дължина е ${length} : 8 = ${lastLength} см. Ширината е ${area} : ${lastLength} = ${lastWidth} см.`, `Първата ширина е ${lastWidth} + 3 · ${delta} = ${width} см. Обиколката е ${2 * (length + width)} см.`], [["Първа ширина (см)", width]]);
		}
		case "M1-17": {
			const occurrence = 7 + j, answer = digitSequence(occurrence);
			return make(`Пишем блоковете 1; 1,2; 1,2,3; ... без разделители. Спираме веднага след ${occurrence}-ото изписване на цифрата 4, включително четворките в двуцифрени числа. Колко цифри сме написали?`, [["Брой цифри", answer]], [`Броим всеки блок цифра по цифра, включително цифрите в 14, 24 и т.н.`, `Точно ${occurrence}-ата четворка е на позиция ${answer}.`], [["Колко четворки има до спирането?", occurrence]]);
		}
		case "M1-18": {
			const count = harder ? 13 : 7, minimum = 20 + 2 * j, middle = minimum + count - 1, total = count * middle;
			return make(`Сборът на ${count} последователни четни числа е ${total}. Кое е най-малкото?`, [["Най-малко число", minimum]], [`Средното е ${total} : ${count} = ${middle}.`, `Най-малкото е ${middle} − ${count - 1} = ${minimum}.`], [["Най-голямо число", minimum + 2 * (count - 1)]]);
		}
		case "M1-19": {
			const divisor = 20 + j, factor = harder ? 5 : 3, q = Math.floor((divisor - 1) / factor), r = factor * q;
			return make(`Намери най-голямото естествено число, което при деление на ${divisor} има остатък ${factor} пъти частното.`, [["Най-голямо число", divisor * q + r]], [`${factor} · частно < ${divisor}, значи най-голямото частно е ${q}.`, `Остатъкът е ${r}; числото е ${divisor} · ${q} + ${r} = ${divisor * q + r}.`], [["Частно", q], ["Остатък", r]]);
		}
		case "M1-20": {
			const candies = 6 + j, count = (candies - 1) * (candies - 2) / 2;
			return make(`Трима различни приятели разделят ${candies} еднакви бонбона. Всеки получава поне един. Колко са разпределенията?`, [["Брой начини", count]], [`За първия приятел подреждаме случаите от 1 до ${candies - 2} бонбона.`, `За другите двама има ${candies - 2}, ${candies - 3}, ..., 1 случая. Сборът е ${count}.`], [["Начини, ако първият получи 2 бонбона", candies - 3]]);
		}
		case "M2-1a": {
			const a = 30 + j, diff = harder ? 7 : 5, b = a + diff, difference = 20 + j, N = a + b + difference - 1;
			return make(`В редицата 1 до ${N}, b − a = ${diff}. Числата след a са с ${difference} повече от числата преди b. Намери a + b и провери двете числа.`, [["a + b", a + b], ["a", a], ["b", b]], [`${N} − a = b − 1 + ${difference}, затова a + b = ${a + b}.`, `От сбора и разликата: a = ${a}, b = ${b}.`]);
		}
		case "M2-1b": {
			const N = harder ? 1300 + j : 100 + j, previous = Math.floor(N / 100) * 100 - 1;
			return make(`Колко числа от 1 до ${N} съдържат цифрата 4? Провери отделно числата до ${previous} и последния непълен блок.`, [["Общо числа с 4", countFours(N)], [`Числа с 4 от 1 до ${previous}`, countFours(previous)], [`Числа с 4 от ${previous + 1} до ${N}`, countFours(N) - countFours(previous)]], [`Броим всяко число само веднъж.`, `До ${previous}: ${countFours(previous)}; след това: ${countFours(N) - countFours(previous)}. Общо ${countFours(N)}.`]);
		}
		case "M2-1c": {
			const N = 90 + j * 3; let keep = 1; while (sums(keep + 1) <= N) keep++;
			const last = N - sums(keep - 1);
			return make(`От редицата 1 до ${N} изтрий най-малко числа, така че сборът на останалите да е ${N}. Намери и проверката за максималния запазен брой.`, [["Изтрити числа", N - keep], ["Максимален запазен брой", keep], [`Най-малък сбор на ${keep + 1} различни положителни числа`, sums(keep + 1)], [`Последно число след 1, 2, ..., ${keep - 1}`, last]], [`Сборът до ${keep} е ${sums(keep)}, а до ${keep + 1} е ${sums(keep + 1)} > ${N}.`, `Може да запазим 1 до ${keep - 1} и ${last}. Изтриваме ${N} − ${keep} = ${N - keep}.`]);
		}
		case "M2-2a": {
			const L = 12 + j, A = Math.floor(L / 2) + 1, B = L + 2, C = 2 * L - A - B;
			const u = L - 2, v = 1, w = 1, p = A - 1, q = B - u, r = C - w;
			return make(`Квадрат е разделен на 3 реда и 3 колони. Както на чертеж 1, горе в средата, вляво в средата и долу вдясно са дадени обиколки. В учебния чертеж те са A = ${2 * A}, B = ${2 * B} и C = ${2 * C} см. x и y са обиколките горе вляво и в центъра. Всички размери са положителни цели сантиметри. Намери най-голямото x, x + y и лицето; провери с ширини u,v,w и височини p,q,r отляво надясно и отгоре надолу.`, [["Максимално x (см)", 2 * (u + p)], ["x + y (см)", 2 * (A + B)], ["Лице (кв.см)", L * L], ["u (см)", u], ["v (см)", v], ["w (см)", w], ["p (см)", p], ["q (см)", q], ["r (см)", r]], [`Половините на дадените обиколки дават 2L = ${A + B + C}, така че L = ${L}.`, `x + y = 2 · (${A} + ${B}) = ${2 * (A + B)}.`, `v,w ≥ 1, затова u ≤ ${L - 2} и p ≤ ${A - 1}. Равенството се постига при ширини ${u},1,1 и височини ${p},${q},${r}.`], undefined, { src: "/kids/lessons/grid-notation.svg", alt: "Учебни означения: обиколки A, B, C, x, y; ширини u,v,w; височини p,q,r." });
		}
		case "M2-2b": {
		const b = 3 + j, a = harder ? b + 1 : b, s = a * b;
			// Use only s whose smallest feasible integer b is the chosen value.
			let minB = 2; while (!(s % minB === 0 && s / minB > 1 && 6 * minB - 3 * (s / minB) > 1)) minB++;
			return make(`В учебния чертеж долу вдясно лицето е s; над него са 3s и 2s, а долу в средата е 2s. Централното лице C е ${6 * s} кв.см. Всички размери са цели и над 1 см. Намери s и най-малката обиколка. За проверка: централното лице е колко пъти s? Какви са ширината a и височината b на долния десен правоъгълник при минимума?`, [["s (кв.см)", s], ["Централното лице е колко пъти s?", 6], ["Най-малка обиколка (см)", 24 * minB], ["a (см)", s / minB], ["b (см)", minB]], [`Центърът има ширина 2a и височина 3b, значи лице 6s. s = ${6 * s} : 6 = ${s}.`, `Проверяваме делителите b ≥ 2 на ${s}, с a = ${s} : b > 1 и лява ширина 6b − 3a > 1.`, `Най-малкият допустим b е ${minB}; страна ${6 * minB} см, обиколка ${24 * minB} см.`, `При избраната двойка всички девет правоъгълника имат страни над 1 см.`], undefined, { src: "/kids/lessons/grid-areas.svg", alt: "Учебни означения: лица s, 2s, 3s и C; a и b са размерите долу вдясно." });
		}
	}
	throw new Error(`Unknown skill ${id}`);
}

const originalAnswers = [2, 2, 0, 1, 1, 0, 1, 2, 2, 3, 2, 2, 3, 1, 0];
const originalExplanations: Record<string, string[]> = {
	"M1-01": ["XXII век започва през 2101 г. Първата подходяща година е 2103: 2 + 1 + 0 = 3.", "2103 − 2024 = 79 години."],
	"M1-02": ["Частното е 1, затова делителят е 2024. След изваждане на 24 получаваме (2024 − x) · 20 = 2000.", "Разделяме на 20: 2024 − x = 100, затова x = 1924. Проверка: (2024 − 1924) · 20 + 24 = 2024."],
	"M1-03": ["13 · 3 = 39 точки от победи.", "44 − 39 = 5 равенства. Загуби: 22 − 13 − 5 = 4."],
	"M1-04": ["3 + 4 = 7 лв. е разликата между покупките. Разликата на шоколад е 1 лв., значи шоколадите са 7.", "7 · 350 + 300 = 2750 ст. = 27 лв. и 50 ст."],
	"M1-05": ["След влизането децата са 24. Момичетата са (24 − 2) : 2 = 11.", "Първоначално момичетата са 11 − 8 = 3."],
	"M1-06": ["11 разреза дават 12 части. 4 дм 4 см = 44 см.", "Ако всички са по 3 см, получаваме 36 см. Остават 8 см, по един за всяка дълга част. Значи дългите са 8."],
	"M1-07": ["Целите решения (шестици, петици) са (3,16), (8,10), (13,4).", "Само 13 шестици и 4 петици изпълняват „шестиците са повече“. Общо 17 оценки."],
	"M1-08": ["1 молив и 2 гуми струват 280 ст.; 1 молив и 2 химикалки струват 520 ст.", "Две замени струват 240 ст.; една е 120 ст."],
	"M1-09": ["Двете бедра са общо 8 основи, значи едно бедро е 4 основи.", "Външната граница е 4 бедра и основата: 4 · 4 + 1 = 17 основи."],
	"M1-10": ["Осем страни на квадратите са 48 + 2 · 4 = 56 см. Страната е 7 см.", "Квадратите не се застъпват: общо лице 2 · 7 · 7 = 98 кв.см."],
	"M1-11": ["Нека П1 е една част. Тогава П3 е 8 части, а П2 е 2 части.", "П2 е четвъртинка от П3."],
	"M1-12": ["2024 = 84 · 24 + 8. След целите денонощия часът е същият.", "10 + 8 = 18 часът."],
	"M1-13": ["От преди 2 до след 2 години са 4 години. Общият сбор расте с 80.", "80 : 4 = 20 деца."],
	"M1-14": ["Страната е 32 : 4 = 8 см.", "Четирите ъгъла имат общо лице (8 − 3) · (8 − 1) = 35 кв.см."],
	"M1-15": ["Най-голямото допустимо събираемо е 666, защото 2222 е над 2024.", "3 · 666 = 1998 не стига. 666 + 666 + 666 + 26 = 2024, значи минимумът е 4."],
	"M1-16": ["Дължините са 32, 16, 8, 4 см. Последната ширина е 12 : 4 = 3 см.", "Първата ширина е 3 + 3 · 2 = 9 см. Обиколка 2 · (32 + 9) = 82 см."],
	"M1-17": ["До блока 1..9 има 45 цифри и 6 четворки. Блоковете до 10,11,12,13 добавят 56 цифри и 4 четворки.", "Блокът до 14 добавя 19 цифри и 2 четворки. В следващия блок спираме след 14: още 19 цифри и 2 четворки. Общо 139 цифри."],
	"M1-18": ["Средното число е 2024 : 11 = 184.", "Преди него има 5 четни числа. Най-малкото е 184 − 10 = 174."],
	"M1-19": ["Остатъкът е 4q < 44, значи най-голямото частно е 10.", "Числото е 44 · 10 + 40 = 480."],
	"M1-20": ["За първия приятел 1,2,...,7 бонбона за другите двама има 7,6,...,1 разпределения.", "7 + 6 + 5 + 4 + 3 + 2 + 1 = 28 начина."],
};
const numericOriginals: Record<string, number> = { "M1-16": 82, "M1-17": 139, "M1-18": 174, "M1-19": 480, "M1-20": 28 };

function original(id: string): CourseProblem {
	const item = (originals as Record<string, { text: string; options?: string[] }>)[id];
	const lesson = courseTopics.flatMap(t => t.skills).find(s => s.id === id)!;
	if (item) return { id: `${id}:original`, skillId: id, source: `${source} · ${id}`, provenance: { year: 2024, objective: id, page: Number(id.slice(3)) <= 8 ? 1 : 2, video: "https://www.youtube.com/watch?v=ASgvZZMQ8Zk" }, text: item.text, options: item.options,
		fields: [{ label: item.options ? "Избери отговор" : "Числов отговор", answer: String(item.options ? originalAnswers[Number(id.slice(3)) - 1] : numericOriginals[id]) }],
		hint: lesson.lesson[0]!, explanation: originalExplanations[id]!, teachingFigure: lesson.illustration, ...(figures[id] ? { figure: { src: `/kids/figures/${id}.png`, alt: figures[id]! } } : {}) };
	const p = variant(id, 0, false);
	p.id = `${id}:original`; if (figures[id]) p.figure = { src: `/kids/figures/${id}.png`, alt: figures[id]! }; p.provenance = { year: 2024, objective: id, page: 3, video: "https://www.youtube.com/watch?v=ASgvZZMQ8Zk" }; p.source = `${source} · ${id}`;
	if (id === "M2-1a") {
		p.text = "Числата от 1 до 2024 са написани последователно в нарастващ ред в редица 1, 2, ..., 2023, 2024.\n\nНека a и b са две от числата в редицата, като b − a = 5. Ако броят на числата в редицата, по-големи от a, е с 44 повече от броя на числата в редицата, по-малки от b, то колко е b + a?";
		p.fields = [{ label: "b + a", answer: "1981" }];
		p.explanation = ["2024 − a = b − 1 + 44, значи a + b = 1981.", "От разликата 5: a = 988 и b = 993. Това проверява и двете условия."];
	} else if (id === "M2-1b") {
		p.text = "Числата от 1 до 2024 са написани последователно в нарастващ ред. Колко от числата в редицата имат в записа си цифрата 4?";
		p.fields = [{ label: "Брой числа", answer: "545" }];
		p.explanation = ["В 000..999 има 1000 − 9³ = 271 записа с 4. Между 1000 и 1999 са още 271.", "Накрая са 2004, 2014 и 2024. Общо 271 + 271 + 3 = 545."];
	} else if (id === "M2-1c") {
		p.text = "Числата от 1 до 2024 са написани последователно в нарастващ ред. Колко най-малко от числата в редицата трябва да се изтрият, така че сборът на останалите да е 2024?";
		p.fields = [{ label: "Изтрити числа", answer: "1961" }];
		p.explanation = ["1 + ... + 64 = 2080 > 2024, затова най-много 63 числа остават.", "1 + ... + 62 + 71 = 2024. Изтриваме 2024 − 63 = 1961."];
	} else if (id === "M2-2a") {
		p.text = "Всеки от двата квадрата на чертежите в тази задача е разделен на 9 правоъгълника с дължини на страните цели числа сантиметри.\n\nНа чертеж 1 обиколките (в сантиметри) на пет от правоъгълниците са написани в самите тях. Колко най-много може да е числото x? Колко е числото x + y? Колко квадратни дециметра е лицето на квадрата?";
		p.fields = [["Максимално x (см)", "56"], ["x + y (см)", "66"], ["Лице (кв.дм)", "4"]].map(([label, answer]) => ({ label: label!, answer: answer! }));
		p.teachingFigure = { src: "/kids/lessons/grid.svg", alt: "Учебни означения: ширини u, v, w; височини p, q, r; x и y са обиколки." };
		p.explanation = ["x и y също са обиколки. Нека ширините отляво надясно са u,v,w, а височините отгоре надолу p,q,r, както в учебната схема.", "11 + 22 + 7 = 40 е два пъти страната. Страна 20 см, лице 400 кв.см = 4 кв.дм.", "x + y = 2 · (11 + 22) = 66. Понеже v,w ≥ 1, u ≤ 18 и p ≤ 10, значи x ≤ 56.", "При u,v,w = 18,1,1 и p,q,r = 10,4,6 всички условия са изпълнени и x = 56."];
	} else if (id === "M2-2b") {
		p.text = "Всеки от двата квадрата на чертежите в тази задача е разделен на 9 правоъгълника с дължини на страните цели числа сантиметри.\n\nНа чертеж 2 лицата (в квадратни сантиметри) на пет от правоъгълниците са написани в самите тях (числото s е 2 пъти по-малко от числото 2·s и 3 пъти по-малко от числото 3·s). Да се обясни защо числото s е 12. Колко сантиметра е обиколката на квадрата, ако тя е възможно най-малка и страните на правоъгълниците са по-дълги от 1 см?";
		p.fields = [{ label: "Най-малка обиколка (см)", answer: "72" }];
		p.explanation = ["Нека a,b са ширината и височината долу вдясно. Центърът има лице 2a · 3b = 6s = 72, затова s = 12.", "Страната е 6b. При b = 2, a = 6 лявата ширина 6b − 3a е отрицателна.", "При b = 3, a = 4 лявата ширина е 6, всички размери са над 1 и обиколката е 4 · 18 = 72 см."];
	}
	return p;
}

function evidenceKey(problem: CourseProblem): string {
	// These families can reproduce an original with different wording or units.
	const originalKeys: Record<string, string> = { "M1-01": "2024", "M1-06": "44,11,3,4", "M1-07": "98", "M1-09": "9", "M1-15": "2024", "M1-17": "14", "M1-20": "9" };
	if (problem.id.endsWith(":original")) return originalKeys[problem.skillId] ?? problem.text;
	const patterns: Record<string, RegExp> = { "M1-01": /Годината е (\d+)/, "M1-07": /Сборът е (\d+)/, "M1-09": /е (\d+) пъти основата/, "M1-15": /Сборът е (\d+)/, "M1-17": /след (\d+)-ото/, "M1-20": /разделят (\d+)/ };
	if (problem.skillId === "M1-06") return problem.text.match(/\d+/g)!.slice(0, 4).join(",");
	const pattern = patterns[problem.skillId];
	return pattern ? problem.text.match(pattern)![1]! : problem.text;
}

// Rewording the same mathematical task never creates independent evidence.
const pools = new Map<string, { core: CourseProblem[]; hard: CourseProblem[] }>();
for (const s of courseTopics.flatMap(t => t.skills)) {
	const first = original(s.id), seen = new Set([evidenceKey(first)]);
	const core = [first], hard: CourseProblem[] = [];
	for (const [harder, target] of [[false, core], [true, hard]] as const) {
		for (let i = 0; i < 40; i++) {
			const p = variant(s.id, i, harder);
			const key = evidenceKey(p);
			if (!seen.has(key)) { seen.add(key); target.push(p); }
		}
	}
	pools.set(s.id, { core, hard });
}
extendTopics(courseTopics);
for (const row of expansionRows) {
	const first = expandedOriginal(row), core = [first], hard: CourseProblem[] = [];
	const originalParameters: Record<string, string> = { cuts: "4", sets: "26", transfer: "40", polygons: "140", tiling: "1536" };
	const parameterPatterns: Record<string, RegExp> = {
		cuts: /^С (\d+) прави/, sets: /^От (\d+) ученици/, transfer: /^Подарък от (\d+) лв/,
		polygons: /граница е (\d+) см/, tiling: /общото лице е (\d+) кв/,
	};
	const key = (p: CourseProblem) => {
		const pattern = parameterPatterns[row.family];
		if (pattern) return p === first ? originalParameters[row.family]! : p.text.match(pattern)![1]!;
		return row.family === "calendar" ? p.text.split(". На коя")[0]! : p.text.split("?")[0]!;
	};
	const seen = new Set([key(first)]);
	for (const [harder, target] of [[false, core], [true, hard]] as const) for (let i = 0; i < 8; i++) {
		const p = expandedVariant(row, i, harder), evidence = key(p);
		if (!seen.has(evidence)) { seen.add(evidence); target.push(p); }
	}
	pools.set(row.id, { core, hard });
}
const objectiveMap = buildObjectiveMap(expansionRows);
for (const [skillId, pool] of pools) {
 const concept = learningConcepts.find(c => c.id === objectiveMap[skillId]?.primary);
 if (!concept) throw new Error(`Missing teaching concept: ${skillId}`);
 for (const p of [...pool.core, ...pool.hard]) p.solution = workedSolution(p, expansionRows.find(row => row.id === skillId)?.family);
}
export const kidsCourseContent: KidsCourseContent = {
	version: "bg4-2024-2026-v2", topics: courseTopics, concepts: learningConcepts, objectiveMap,
	solutionFor: problem => {
  const pool = pools.get(problem.skillId);
  const same = [...(pool?.core ?? []), ...(pool?.hard ?? [])].find(p => p.id === problem.id && p.text === problem.text && JSON.stringify(p.fields) === JSON.stringify(problem.fields) && JSON.stringify(p.options) === JSON.stringify(problem.options));
  return same?.solution;
 },
 problem: (skillId, index, harder) => pools.get(skillId)?.[harder ? "hard" : "core"][index] ?? null,
};

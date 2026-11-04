import type { CourseProblem, CourseSolution } from "../core/kids-course.ts";

const display = (n: number | string) => String(n).replace(".", ",");
const sum = (n: number) => n * (n + 1) / 2;
const answerLine = (p: CourseProblem) => p.fields.map(f => `${f.label}: ${p.options ? p.options[Number(f.answer)] : display(f.answer)}`).join("; ") + ".";

// Each entry checks the original's own data, including the geometric constraints.
const originalChecks: Record<string, string> = {
 "M1-01": "2 + 1 + 0 = 3 и 2024 + 79 = 2103. Годините 2101 и 2102 не изпълняват правилото.",
 "M1-02": "(2024 − 1924) · 20 + 24 = 2024; 2024 : 2024 = 1.",
 "M1-03": "13 + 5 + 4 = 22 мача и 13 · 3 + 5 = 44 точки.",
 "M1-04": "2750 − 7 · 350 = 300 ст. остават; 7 · 450 − 2750 = 400 ст. не достигат.",
 "M1-05": "В началото са 3 момичета и 1 момче. После 3 + 8 = 11 момичета и 1 + 12 = 13 момчета: общо 24, разлика 2.",
 "M1-06": "8 · 4 + 4 · 3 = 44 см. Парчетата са 12, разрезите са 12 − 1 = 11.",
 "M1-07": "13 · 6 + 4 · 5 = 98 и 13 > 4. Оценките са 13 + 4 = 17.",
 "M1-08": "520 − 280 = 240 ст. за две замени; 240 : 2 = 120 ст. за една.",
 "M1-09": "4 + 4 + 1 = 9 основи за първия триъгълник; отвън 4 · 4 + 1 = 17.",
 "M1-10": "8 · 7 − 2 · 4 = 48 см външна граница. Общото лице е 49 + 49 = 98 кв.см.",
 "M1-11": "1 + 8 = 9 части, 1 + 2 = 3 части и 8 : 2 = 4.",
 "M1-12": "84 · 24 + 8 = 2024 часа. След 84 денонощия и още 8 часа от 10 ч. става 18 ч.",
 "M1-13": "20 деца порастват с по 4 години: 20 · 4 = 80 години общо.",
 "M1-14": "4 · 8 = 32 см обиколка; крайните колони са общо 5 см, крайните редове 7 см: 5 · 7 = 35 кв.см.",
 "M1-15": "666 + 666 + 666 + 26 = 2024. Всяко събираемо е разрешено, а три събираеми дават най-много 1998.",
 "M1-16": "32 → 16 → 8 → 4 см и 9 → 7 → 5 → 3 см. Последното лице е 4 · 3 = 12, първата обиколка 2 · (32 + 9) = 82.",
 "M1-17": "45 + 56 + 19 + 19 = 139 цифри; четворките са 6 + 4 + 2 + 2 = 14.",
 "M1-18": "Числата от 174 до 194 през 2 са 11. Средното е 184 и 11 · 184 = 2024.",
 "M1-19": "480 = 44 · 10 + 40; 40 = 4 · 10 < 44. При частно 11 остатъкът би бил 44 и вече не е допустим.",
 "M1-20": "При 1 бонбон за първия има 7 начина за останалите, при 2 има 6, …, при 7 има 1. Сборът е 28 и всеки получава поне един.",
 "M2-1a": "993 − 988 = 5; след 988 има 1036 числа, преди 993 има 992. Разликата е 44, а 988 + 993 = 1981.",
 "M2-1b": "271 + 271 + 3 = 545. Последният блок добавя само 2004, 2014 и 2024; число като 44 се брои веднъж.",
 "M2-1c": "1 + … + 62 + 71 = 1953 + 71 = 2024. Остават 63 числа; 64 различни положителни числа имат сбор поне 2080.",
 "M2-2a": "Ширини 18,1,1 и височини 10,4,6 дават страна 20. Дадените обиколки са 2 · (1 + 10) = 22, 2 · (18 + 4) = 44, 2 · (1 + 6) = 14. x = 56, y = 10, а 20 · 20 : 100 = 4 кв.дм.",
 "M2-2b": "При a = 4, b = 3 ширините са 6,8,4, височините 6,9,3. Центърът е 8 · 9 = 72, долу вдясно 4 · 3 = 12; страна 18 и обиколка 72 см.",
 "2025-M1-01": "(2025 − 1925) · 20 + 25 = 2025.",
 "2025-M1-02": "4 лв. 4 ст. = 400 + 4 = 404 ст.; 4 см 4 мм = 44 мм, а 4 кв.см 4 кв.мм = 404 кв.мм. При превръщането умножаваме по различни числа.",
 "2025-M1-03": "2025 = 4 · 506 + 1, 1 < 4 и 4 + 1 = 5.",
 "2025-M1-04": "1000 · 4 = 4000 и 2499 · 4 = 9996 са четирицифрени; 2500 · 4 = 10000 вече не е. Броят е 2499 − 1000 + 1 = 1500.",
 "2025-M1-05": "2 · (4 + 20) = 48 см и 48 + 48 − 2 · 4 = 88 см. Лицето е 4 · 20 = 80 кв.см.",
 "2025-M1-06": "18 · 3,5 = 63 км по езерото и (18 − 2) · 1,5 = 24 км срещу течението. 63 + 24 = 87 км.",
 "2025-M1-07": "20 + 40 = 60 лв.; Мила дава 15 и остава с 45. Сестра ѝ има 15 + 15 = 30. Разликата е 15 лв.",
 "2025-M1-08": "53 · 25 + 35 · 20 = 2025 мм, а 53 + 35 = 88 парчета.",
 "2025-M1-09": "Всяка от 4-те стари части става на 11: 4 · 11 = 44. За 11 части вътрешните нови точки са 10.",
 "2025-M1-10": "Външните страни са 7 · (a + b) = 7 · 20 = 140 см; правоъгълникът има обиколка 2 · 20 = 40 см.",
 "2025-M1-11": "Четните сборове от 4 до 4048 са (4048 − 4) : 2 + 1 = 2023. Най-малкият е 1 + 3, най-големият 2023 + 2025.",
 "2025-M1-12": "1 · 44 = 2 · 22 = 4 · 11 = 44. Обиколките са 90,48,30; 90 + 48 + 30 = 168 см.",
 "2025-M1-13": "8 само по математика + 3 и по двата предмета + 9 само по български + 6 без шестица = 26. Първите 18 може да са извън търсената група; 19-ото вече е в нея.",
 "2025-M1-14": "След 0,1,2,3,4 разреза максимумът е 1,2,4,7,11 части. Последният пресича предишните три и добавя 4.",
 "2025-M1-15": "11 · 25 + 3 · 60 = 455 лв. С петолевки са платени 11 · 25 = 275 лв.",
 "2025-M1-16": "a = 16 см и b = 8 см дават 6 · 256 = 1536 кв.см. Три квадрата заемат 768, четирите правоъгълника по 192 заемат още 768.",
 "2025-M1-17": "44 числа стават едно след 43 действия. 990 + 43 · 4 = 1162, независимо кои две числа избираме.",
 "2025-M1-18": "Големият букет има 5 рози и 8 лалета; другите пет имат по 1 роза и 4 лалета. 5 + 5 = 10 рози и 8 + 20 = 28 лалета.",
 "2025-M1-19": "321 + 30 · 4 + 3 = 444. След 4029 идва 4030; търсената цифра е третата в него.",
 "2025-M1-20": "20 + 12 + 6 + 2 = 40. Четирите случая за C са отделни и A винаги е поне 1.",
 "2025-M2-1a": "403 + 810 + 812 = 2025; 812 − 810 = 2 и 810 : 2 − 403 = 2.",
 "2025-M2-1b": "От 198 до 207 има 10 последователни числа; (198 + 207) · 10 : 2 = 2025.",
 "2025-M2-1c": "1 + 3 + … + 89 = 45² = 2025. Още един различен положителен нечетен дял изисква поне 46² = 2116.",
 "2025-M2-1d": "От 11 до 64 има 54 дяла и (11 + 64) · 54 : 2 = 2025. Приятелите са 54 − 1 = 53.",
 "2025-M2-2a": "19 − 3 + 9 = 25 см широчина; разрезът има 3 + 9 = 12 см хоризонтално и 10 см вертикално: общо 22 см.",
 "2025-M2-2b": "2 · 5 + 10 = 20 см разрези, изрязано лице 5 · 10 = 50. 20 · 25 − 50 = 450 кв.см остават.",
 "2025-M2-2c": "2 · (25 + 20) + 2 · 10 + 2 · 9 = 90 + 20 + 18 = 128 см.",
 "2026-M1-01": "2026 − 6 · 304 = 2026 − 1824 = 202.",
 "2026-M1-02": "39 : 3 = 13 кг; 26 + 13 = 39 кг.",
 "2026-M1-03": "2 · (26 + 20) + 2 · 13 = 118 см. Дълбочината 13 см се побира в картона и дава най-голямото увеличение.",
 "2026-M1-04": "25 + 7 = 32, тоест 1 септември. Ако последната неделя е по-рано от 25 август, след още 7 дни ще има друга августовска неделя.",
 "2026-M1-05": "4a + 4b + 4c − 2b − 2b = 4a + 4c. Общите ръбове се махат по два пъти.",
 "2026-M1-06": "200 км изминати + 120 км оставащи = 320 км. 80 · 1,5 = 120 км и 1,5 часа = 90 минути.",
 "2026-M1-07": "26 + 26 + 20 = 72 см за ABC. За ABP: AB + BP + PA = 20 + BP + PC = 20 + 26 = 46 см.",
 "2026-M1-08": "26 + 125 · 10 = 1276 и 2026 − 125 · 6 = 1276 карти.",
 "2026-M1-09": "12 + 16 + 20 = 48 задачи; 12 е четвърт от 48, 16 е трета, а 48 е между 40 и 60.",
 "2026-M1-10": "Член 3 е 20. 2026 − 3 = 404 · 5 + 3; три стъпки след 20 в цикъла стигаме до 16.",
 "2026-M1-11": "3 · 4 + 6,90 = 18,90 евро. След трите двойки паста + сок остава точно паста + два еклера.",
 "2026-M1-12": "При височина 6 двете ширини са 10 − 6 = 4 и 13 − 6 = 7. 4 + 7 = 11, обиколките са 20 и 26, лицето 11 · 6 = 66.",
 "2026-M1-13": "10 само математика + 6 и двете + 8 само информатика + 2 без школа = 26. 16 : 2 = 8 и 10 − 6 = 4.",
 "2026-M1-14": "6 · 50 + 17 · 20 = 640; 8 · 50 + 12 · 20 = 640. И двете двойки спазват наличните бройки, останалите ги надхвърлят.",
 "2026-M1-15": "Осемте записа дават 16,24,24,24,32,68,68,256. След премахване на повторенията остават 5 стойности.",
 "2026-M1-16": "8 + 6 + 5 + 5 + 4 + 4 + 3 + 3 + 2 + 2 + 1 + 1 = 44. Всяка цифра се среща най-много два пъти. В числото 86554433221100 цифрите са подредени от най-голямата към най-малката.",
 "2026-M1-17": "50 − 30 = 20, 50 − 24 = 26; 2 · 30 + 4 · 50 + 2 · 24 = 308 см. 900 + 2500 + 576 = 3976 кв.см.",
 "2026-M1-18": "45 + 225 + 125 + 8 = 403. В последния непълен блок са само 2000,2002,2004,2006,2008,2020,2022,2024, всички под 2026.",
 "2026-M1-19": "41 едноцветни са възможни, ако първо теглим от кутията с 26 от този цвят. На 42-рото теглене се връщаме в другата, чиито 20 вече са изтеглени.",
 "2026-M1-20": "7 · 23 = 161 → 16; 16 · 8 = 128 → 12. Изтриваме само последната цифра при всяка стрелка.",
 "2026-M2-1a": "1901 − 26 = 1875 преди него; 2026 − 1901 = 125 след него; 1875 = 15 · 125.",
 "2026-M2-1b": "171 + 2 + 11 = 184 срещания до 429. 430 и 431 не добавят двойка; 432 добавя още една и вече е недопустимо.",
 "2026-M2-1c": "651 + 672 + 678 = 2001 числа. Последният червен блок съдържа 48 от тях, последният бял е пълен и съдържа 61.",
 "2026-M2-2a": "30 − 20 = 20 − 10 = 10 мм, по две ширини на ивицата. 900 − 400 + 100 = 600 кв.мм = 6 кв.см.",
 "2026-M2-2b": "20 · 10 + 22 · 83 = 2026 см. За 92 фигури дори 92 · 22 = 2024 не стига, затова 93 е минимумът.",
 "2026-M2-2c": "7 · 12 = 84; 7 + 12 + 3 = 22 знака. Шестте двойки делители с разменените места дават 12 кода.",
};

interface Working { first?: string; rest?: string[]; check: string }
export function workedSolution(p: CourseProblem, family?: string): CourseSolution {
 const original = p.id.endsWith(":original");
 const working: Working = original ? { check: originalChecks[p.skillId] ?? "" } : variantWorking(p, family ?? p.skillId);
 if (!working.check) throw new Error(`Missing worked verification: ${p.id}`);
 return [
  { title: "Първата стъпка", paragraphs: [working.first ?? p.explanation[0]!] },
  { title: "Продължаваме заедно", paragraphs: working.rest ?? p.explanation.slice(working.first ? 0 : 1) },
  { title: "Отговор и проверка", paragraphs: [answerLine(p), `Проверка: ${working.check}`] },
 ];
}

function variantWorking(p: CourseProblem, family: string): Working {
 const n = [...p.text.matchAll(/\d+(?:[.,]\d+)?/g)].map(m => Number(m[0].replace(",", ".")));
 const [a=0,b=0,c=0,d=0,e=0] = n;
 const v = p.fields.map(f => Number(f.answer)), x = v[0]!;
 switch (family) {
 case "equation": return { check: `(${a} − ${x}) · ${b} + ${c} = ${(a-x)*b+c}. Стойността в скобите е ${a-x}.` };
 case "subtractProduct": return { first: `Изваждаме ${c} от ${a}, за да намерим произведението: ${b} · x = ${a} − ${c} = ${a-c}.`, rest: [`Делим на ${b}, защото ${b} еднакви части правят ${a-c}: x = ${a-c} : ${b} = ${x}.`], check: `${a} − ${b} · ${x} = ${a-b*x}. Произведението е ${b*x}.` };
 case "units": return { check: `${x} мм = ${a} см и ${b} мм.${v.length>1 ? ` За лице 1 кв.см = 100 кв.мм, затова ${a} · 100 + ${b} = ${v[1]} кв.мм.` : ""}` };
 case "division": return { first: `Намираме най-голямото кратно на ${b}, което не надхвърля ${a}: ${b} · ${x} = ${b*x}.`, rest: [`Остава ${a} − ${b*x} = ${a-b*x}. То е по-малко от ${b}, затова частното е ${x}, остатъкът ${a-b*x}.`], check: `${b} · ${x} + ${a-b*x} = ${a}; ${a-b*x} < ${b}.` };
 case "interval": return { check: `От ${b/a} до ${c/a} включително има ${c/a-b/a+1} числа. Последното кратно е ${a} · ${c/a} = ${c}.` };
 case "join": {const side=(2*a-b)/2, long=a/2-side;return { check:`2 · (${side} + ${long}) = ${a} см и ${2*a} − 2 · ${side} = ${b} см. Лице ${side} · ${long} = ${x} кв.см.` };}
 case "boat": return { check:`По езерото: ${c} · ${a} = ${c*a} км; по реката: (${c} − ${d}) · ${b} = ${(c-d)*b} км. Общо ${x} км.` };
 case "transfer": {const part=a/2,total=3*part,given=total/4;return {check:`${part} + ${a} = ${total}; ${total} − ${given} = ${total-given}, братът има ${2*given}. ${total-given} − ${2*given} = ${x} лв.`};}
 case "pieces": return { check:`${x} · ${d} + ${b-x} · ${c} = ${x*d+(b-x)*c} мм и ${x} + ${b-x} = ${b} парчета.` };
 case "marks": return { check:`В една стара част има ${x+1} нови части и ${x} вътрешни точки. ${a} · ${x+1} = ${b}; общо добавяме ${a*x} точки.` };
 case "polygons": return {check:`7 · ${x/2} = ${7*x/2} см външна граница; правоъгълникът има обиколка 2 · ${x/2} = ${x} см.`};
 case "oddSums": return {check:`Най-големият сбор е ${b-2} + ${b} = ${2*b-2}. Четните от 4 дотам са (${2*b-2} − 4) : 2 + 1 = ${x}.`};
 case "factors": {const pairs=divisorPairs(a);return {rest:[`Обиколките са ${pairs.map(([u,w])=>`2 · (${u} + ${w}) = ${2*(u+w)}`).join("; ")}. Сборът е ${x} см.`],check:`${pairs.map(([u,w])=>`${u} · ${w} = ${a}`).join("; ")}. Има ${pairs.length} правоъгълника, без повторно броене при завъртане.`};}
 case "guarantee": {const total=a,clubA=b,clubB=c,neither=d,both=clubA+clubB-(total-neither),only=clubA-both;return {check:`Само А: ${only}; и двата: ${both}; само Б: ${clubB-both}; нито един: ${neither}. Сборът е ${total}. Първите ${total-only} може да са извън само А, но ${x}-ото вече не може.`};}
 case "cuts": return {first:`Първият разрез добавя 1 част, вторият 2. При ${a}-ия разрез има ${a-1} пресичания, които го делят на ${a} отсечки; всяка добавя част.`,check:`1 + (1 + 2 + … + ${a}) = 1 + ${sum(a)} = ${x}. Последният разрез добавя ${a} части, ако всички пресичания са различни.`};
 case "daily": {const total=c,pairs:number[][]=[];for(let q=0;60*q<=total;q++)if((total-60*q)%25===0)pairs.push([(total-60*q)/25,q]);return {first:`Един ден по 60 лв. оставя ${total} − 60 = ${total-60} лв. Проверяваме дали остатъкът се дели на 25; после проверяваме всички бройки от 0 до ${Math.floor(total/60)} такива дни.`,check:`${pairs.map(([u,w])=>`${u} · 25 + ${w} · 60 = ${total}`).join("; ")}. Двойките са ${x}; най-много дни по 25 лв. са ${Math.max(...pairs.map(p=>p[0]!))}.`};}
 case "tiling": {const total=n[2]!,square=total/6,side=Math.sqrt(square);return {check:`Трите квадрата: 3 · ${square} = ${3*square}; четирите правоъгълника: 4 · ${x} = ${4*x}. Сборът е ${total} кв.см, а a = ${side} см.`};}
 case "merge": return {check:`От ${b} числа до едно има ${b-1} действия: ${sum(b)} + ${b-1} · ${c} = ${x}.`};
 case "bouquets": {const k=(b-a)/c,rose=a-k+1;return {check:`Големият букет има ${rose} рози и ${rose+c} лалета. Останалите ${k-1} имат по 1 и ${1+c}. Розите са ${rose+k-1}, лалетата ${rose+c+(k-1)*(1+c)}. Букетите са ${k}.`};}
 case "digitPosition": {const target=n.at(-1)!,position=(target-322)%4+1;return {check:`321 + (${x} − 4000) · 4 + ${position} = ${target}. Търсим ${position}-та цифра в ${x}.`};}
 case "fiveDigits": {const target=a,rows=Array.from({length:10},(_,middle)=>{let ab=0,de=0;for(let u=0;u<=9;u++)for(let w=0;w<=9;w++)if(u+w+middle===target){de++;if(u>0)ab++;}return {middle,ab,de};}).filter(r=>r.ab&&r.de);if(!rows.length)return {first:`Сборът на три цифри е най-много 9 + 9 + 9 = 27. Тук се иска ${target}, което е повече.`,rest:[`Няма допустима тройка ABC, значи няма и петцифрено число с двете условия.`],check:`${target} > 27, затова броят е 0.`};const first=rows[0]!;return {first:`При C = ${first.middle} трябва A + B = ${target-first.middle} и D + E = ${target-first.middle}. За AB с A ≥ 1 има ${rows[0]!.ab} избора, за DE има ${rows[0]!.de}; получаваме ${rows[0]!.ab*rows[0]!.de} числа.`,rest:[`За всеки възможен C: ${rows.map(r=>`C = ${r.middle}: ${r.ab} · ${r.de} = ${r.ab*r.de}`).join("; ")}. Събираме резултатите: ${x}.`],check:`Случаите за C не се застъпват, водещата A не е нула. ${rows.map(r=>r.ab*r.de).join(" + ")} = ${x}.${v.length>1?` При C = 0 получаваме ${v[1]} числа.`:""}`};}
 case "shares": {const total=a,delta=b,part=total/5;return {check:`${part-delta} + ${2*part} + ${2*part+delta} = ${total}; първият е с ${delta} под ${part}, третият с ${delta} над ${2*part}.`};}
 case "consecutive": return {check:`Най-малкият е ${x-a+1}. От него до ${x} има ${a} дяла: (${x-a+1} + ${x}) · ${a} : 2 = ${b}.`};
 case "oddShares": {const players=Math.sqrt(a);return {check:`${players}² = ${a}, а ${players+1}² = ${(players+1)**2} > ${a}. Най-големият дял е ${2*players-1}, приятелите са ${players-1}.`};}
 case "consecutiveMax": {const k=x+1,start=(a-sum(k-1))/k;const candidates=[];for(let count=k+1;sum(count)<=a;count++)candidates.push(`${count} играчи: ${a-sum(count-1)} : ${count} дава остатък ${(a-sum(count-1))%count}`);return {first:`За ${k} играчи най-малките добавки над първия дял са 0 + 1 + … + ${k-1} = ${sum(k-1)}. Първият дял е (${a} − ${sum(k-1)}) : ${k} = ${start}.`,rest:[`Проверяваме по-големите бройки играчи: ${candidates.length?candidates.join("; ")+". Никой получен първи дял не е положително цяло число.":`още ${k+1} играчи изискват поне ${sum(k+1)} жетона, повече от ${a}.`} Значи приятелите са ${k} − 1 = ${x}.`],check:`Дяловете от ${start} до ${start+k-1} имат сбор (${start} + ${start+k-1}) · ${k} : 2 = ${a}. Най-малкият дял е ${start}.`};}
 case "stairCut": return {check:`${a} + ${b} = ${x} см.${v.length>1?` Връщането 3 см наляво изисква още 3 надясно: ${x} + 3 + 3 = ${v[1]} см.`:""}`};
 case "notch": {const budget=c,h=Math.floor(c/4),w=c-2*h;return {check:`2 · ${h} + ${w} = ${budget} см разрези. Изрязваме ${h*w} кв.см; ${a} · ${b} − ${h*w} = ${x}. Съседните дълбочини дават ${(h-1)*(budget-2*(h-1))} и ${(h+1)*(budget-2*(h+1))}, не по-голямо лице.`};}
 case "notchPerimeter": return {check:`${x} − ${2*(a+b)} = ${2*(c+d)} = 2 · (${c} + ${d}) см увеличение.`};
 case "fractionWhole": {const denominator=p.text.includes("трета")?3:p.text.includes("четвърт")?4:p.text.includes("пета")?5:6;return {check:`${x} : ${denominator} = ${x/denominator} кг; ${a} + ${x/denominator} = ${x} кг.`};}
 case "cutPerimeter": return {check:`Начална обиколка ${2*(a+b)} см + 2 · ${c} см дълбочина = ${x} см. Увеличението е ${2*c} см.`};
 case "calendar": return {check:`${x} + 7 = ${x+7} > ${a}, значи няма следваща неделя в месеца. Предпоследната е ${x} − 7 = ${x-7}.`};
 case "threeSquares": return {check:`4 · (${a} + ${b} + ${c}) − 4 · ${b} = ${x} см. Лицето е ${a}² + ${b}² + ${c}² = ${a*a+b*b+c*c} кв.см.`};
 case "motion": {const travel=a*b,whole=2*(travel-c);return {check:`За ${x} минути колата изминава ${a} · ${x} : 60 = ${whole-travel} км. ${travel} + ${whole-travel} = ${whole} км; средата е ${whole/2}, а ${travel} − ${whole/2} = ${c}.`};}
 case "triangle": return {check:`Основата е ${a} − 2 · ${b} = ${a-2*b} см; ${a-2*b} + ${b} = ${x}. Замяната PA = PC запазва обиколката.`};
 case "piles": {const moves=(b-a)/(c+d);return {check:`А: ${a} + ${moves} · ${c} = ${x}; Б: ${b} − ${moves} · ${d} = ${x}. Нужни са ${moves} хода.`};}
 case "fractions": return {check:`${a/4} + ${a/3} + ${x} = ${a} задачи. Решените общо са ${a-a/4}, защото ${a/4} са нерешени.`};
 case "cycle": {const position=n.at(-1)!,block=n.slice(0,-1),len=block.length,q=Math.floor((position-1)/len),r=(position-1)%len;return {first:`В блока има ${len} числа. Позиция ${position} е след ${q} пълни блока: ${q} · ${len} = ${q*len}, остават ${r+1} места в следващия.`,rest:[`Броим ${r+1} места в блока ${block.join(", ")}: стигаме до ${x}.`],check:`${q} · ${len} + ${r+1} = ${position}. На място ${r+1} в блока е ${x}.`};}
 case "prices": return {check:`Паста и сок: ${b} : 2 = ${b/2} ст. Три двойки и остатъкът: 3 · ${b/2} + ${x} = ${a} ст.`};
 case "splitRectangle": {const h=(b/2+c/2-a)/2;return {check:`Ширини ${b/2-h} и ${c/2-h} дават ${a}; обиколките са ${b} и ${c}. ${a} · ${h} = ${x} кв.см.`};}
 case "sets": {const math=2*(x+2),onlyInfo=math/2;return {check:`Само математика ${x+4} + общи ${x} + само информатика ${onlyInfo} + 2 = ${a}. По математика са ${math}, два пъти ${onlyInfo}.`};}
 case "banknotes": {const pairs=[];for(let u=0;u<=a;u++)for(let w=0;w<=c;w++)if(50*u+20*w===e)pairs.push(`${u} · 50 + ${w} · 20 = ${e}`);return {check:`${pairs.length?pairs.join("; "):"Нито една двойка с наличните бройки не дава точната сума"}. Начините са ${x}; налични са ${a*50+c*20} евро.`};}
 case "operators": return {first:`Първите два избора са ${a} + ${a} + ${a} + ${a} = ${4*a} и ${a} · ${a} + ${a} + ${a} = ${a*a+2*a}. Умножаваме преди събирането.`,check:`Четирите ${a} с три знака имат 2 · 2 · 2 = 8 записа. Най-голямата стойност е ${a} · ${a} · ${a} · ${a} = ${a**4}; повторените стойности броим веднъж.`};
 case "maxDigits": {const best=bestDigits(a),digits=[...best].map(Number);return {first:`Първите ${best.length} различни цифри 0,1,…,${best.length-1} имат най-малък сбор ${sum(best.length-1)}. Още една цифра изисква поне ${sum(best.length)}, което е над ${a}.`,rest:[`За ${best.length} цифри със сбор ${a} избираме ${digits.join(", ")}. Подредени от най-голямата, дават ${best}; първите три са ${x}.`],check:`${digits.join(" + ")} = ${a}. Всяка цифра е използвана веднъж; броят цифри е ${best.length}.`};}
 case "squareAreas": {const mid=(c+38)/8,left=mid-8,top=mid-11;return {check:`${mid} − ${left} = 8, ${mid} − ${top} = 11. 2 · ${left} + 4 · ${mid} + 2 · ${top} = ${c}; лицето е ${left*left} + ${mid*mid} + ${top*top} = ${x}.`};}
 case "parityDigits": {const groups=new Map<string,number>();for(let i=10;i<a;i++)if([...String(i)].every(d=>Number(d)%2===Number(String(i)[0])%2)){const key=`${String(i).length}-цифрени`;groups.set(key,(groups.get(key)??0)+1);}return {first:`Двуцифрените с четни цифри са 4 · 5 = 20; с нечетни 5 · 5 = 25. Общо 45. Съседните цифри трябва да са с еднаква четност.`,rest:[`Броим отделно само записите под ${a}: ${[...groups].map(([k,v])=>`${k}: ${v}`).join("; ")}. Общият брой е ${x}.`],check:`${[...groups.values()].join(" + ")} = ${x}; двуцифрените са 45. Първата цифра никога не е 0.`};}
 case "alternating": return {check:`${a+1} + ${a} = ${2*a+1} едноцветни са възможни. Следващото, номер ${x}, идва от кутията с изчерпани ${a} от този цвят.`};
 case "erase": {const first=x*23,truncated=Math.floor(first/10),second=truncated*8;return {rest:[`Кратните на 8 от ${10*c} до ${10*c+9} дават възможните междинни числа. При начално ${x}: ${first} → ${truncated} → ${second} → ${c}.`],check:`${x} · 23 = ${first}; изтриваме единиците: ${truncated}. ${truncated} · 8 = ${second}; пак изтриваме единиците: ${Math.floor(second/10)}.`};}
 case "beforeAfter": return {check:`Преди ${x}: ${x-a}; след него: ${b-x}. ${x-a} = ${c} · ${b-x}; общият брой е ${b-a+1}.`};
 case "occurrences": {const start=a,target=b,groups:string[]=[];let subtotal=0;for(let lower=start;lower<=x;){const upper=Math.min(x,Math.floor(lower/100)*100+99);let count=0;for(let i=lower;i<=upper;i++)count+=[...String(i)].filter(d=>d==="2").length;groups.push(`${lower}–${upper}: ${count}`);subtotal+=count;lower=upper+1;}return {first:`В числото 22 има две двойки. Броим срещанията във всяка позиция от ${start} нататък; първият блок ${groups[0]}.`,rest:[`Останалите блокове: ${groups.slice(1).join("; ")||"няма"}. Общо ${subtotal} срещания. Продължаваме през числата без 2 до ${x}.`],check:`До ${x} има ${target} двойки; ${x+1} добавя ${[...String(x+1)].filter(d=>d==="2").length} и надхвърля ${target}.`};}
 case "colorBlocks": {const blocks=[];let left=a,k=1;while(left){const size=Math.min(k,left);if((k-1)%3===0)blocks.push(size);left-=size;k++;}return {first:`Първите бели блокове имат 1,4,7,… числа. До блок ${k-2} са записани ${sum(k-2)} числа; остават ${a-sum(k-2)} в последния блок.`,rest:[`Белите блокове са ${blocks.join(", ")}. Сборът им е ${x}. Последният бял блок съдържа ${blocks.at(-1)} числа.`],check:`${blocks.join(" + ")} = ${x}; пълните блокове и последният дават ${sum(k-2)} + ${a-sum(k-2)} = ${a}.`};}
 case "nested": {const stripe=(a-b)/4;return {check:`${x} − ${b} = ${a} − ${x} = ${2*stripe} мм. Черно лице: ${a}² − ${x}² + ${b}² = ${a*a-x*x+b*b} кв.мм.`};}
 case "linearMin": {const total=c;let y=0,u=0;for(let j=1;22*j<total;j++)if((total-22*j)%20===0){y=j;u=(total-22*j)/20;}return {first:`Ако всички ${Math.ceil(total/22)} фигури бяха от по 22 см, сборът щеше да е ${22*Math.ceil(total/22)} см. Всяка замяна с фигура по 20 см го намалява с 2.`,rest:[`Търсим броя фигури от всеки вид: x с обиколка 20 см и y с обиколка 22 см, като и двата броя са поне 1. Равенството е 20x + 22y = ${total}. Най-много фигури от втория вид са y = ${y}; тогава x = ${u}. Общо са ${x} фигури.`],check:`20 · ${u} + 22 · ${y} = ${total}. ${x-1} фигури дават най-много ${(x-1)*22} см, ако това не стига, а иначе проверката на целите двойки изключва по-малките бройки.`};}
 case "factorCodes": return {check:`${divisorPairs(b).map(([u,w])=>`${u} · ${w} = ${b}`).join("; ")}. Разменяме различните членове, квадратната двойка броим веднъж. Получаваме ${x} кода; минимумът с трите постоянни знака е ${v[1]??Math.min(...divisorPairs(b).map(([u,w])=>u+w))+3}.`};
 default: return legacyVariantWorking(p, n);
 }
}

function divisorPairs(n: number): [number, number][] {const pairs: [number,number][]=[];for(let a=1;a*a<=n;a++)if(n%a===0)pairs.push([a,n/a]);return pairs;}
function bestDigits(target: number) {let best="";for(let mask=1;mask<1024;mask++){const digits=Array.from({length:10},(_,i)=>9-i).filter(i=>mask&(1<<i));if(digits.reduce((s,d)=>s+d,0)!==target)continue;const candidate=digits.join("");if(candidate.length>best.length||candidate.length===best.length&&candidate>best)best=candidate;}return best;}

function legacyVariantWorking(p: CourseProblem, numbers: number[]): Working {
 const k = Number(p.id.match(/:v(\d+)$/)?.[1]), j = k + 1, harder = k >= 100;
 const [a=0,b=0,c=0,d=0] = numbers, x = Number(p.fields[0]!.answer);
 let check: string;
 switch (p.skillId) {
 case "M1-01": {const year=a+x;check=`${String(year).slice(0,3).split("").join(" + ")} = ${year%10}; ${a} + ${x} = ${year}.`;break;}
 case "M1-02": {const factor=harder?12:5, part=30+j,add=20+j,total=factor*part+add;check=`(${total} − ${x}) · ${factor} + ${add} = ${total}; ${total} : ${total} = 1.`;break;}
 case "M1-03": {const wins=4+j,draws=harder?7:3;check=`${wins} + ${draws} + ${x} = ${wins+draws+x} мача; ${wins} · 3 + ${draws} = ${3*wins+draws} точки.`;break;}
 case "M1-04": {const cheap=100+10*j,delta=harder?75:50,count=3+j;check=`${x} − ${count} · ${cheap} = ${delta} ст. остават; ${count} · ${cheap+delta} − ${x} = ${delta*(count-1)} ст. не достигат.`;break;}
 case "M1-05": {const boys=x+4,girlsIn=harder?9:5;check=`Първоначално ${x} + ${boys} = ${x+boys} деца. После момичетата са ${x+girlsIn}, момчетата ${boys+8}; разликата е ${boys+8-x-girlsIn}.`;break;}
 case "M1-06": {const short=harder?7:4,small=harder?5:3;check=`${x} · ${small+1} + ${short} · ${small} = ${x*(small+1)+short*small} см. Частите са ${x+short}, разрезите ${x+short-1}.`;break;}
 case "M1-07": {const total=a,pairs: [number,number][]=[];for(let six=0;6*six<=total;six++){const five=(total-6*six)/5;if(Number.isInteger(five)&&five>=0&&six>five&&(!harder||five<6))pairs.push([six,five]);}const [six,five]=pairs[0]!;return {first:`Пробваме броя петици. При ${five} петици сборът им е 5 · ${five} = ${5*five}. Остават ${total} − ${5*five} = ${6*six} за шестиците.`,rest:[`Шестиците са ${6*six} : 6 = ${six}. Те са повече от ${five}${harder?", а петиците са под 6":""}. Останалите цели двойки не изпълняват всички условия. Общо ${six} + ${five} = ${x} оценки.`],check:`${six} · 6 + ${five} · 5 = ${total}; ${six} > ${five}.`};}
 case "M1-08": {const pencil=30+j,rubber=20+j;check=`${pencil+2*(rubber+x)} − ${pencil+2*rubber} = ${2*x}; ${2*x} : 2 = ${x} ст. за една замяна.`;break;}
 case "M1-09": {const side=(a-1)/2;check=`${side} + ${side} + 1 = ${a} основи; отвън 4 · ${side} + 1 = ${x} основи.`;break;}
 case "M1-10": {const side=6+j,shared=harder?5:3;check=`8 · ${side} − 2 · ${shared} = ${8*side-2*shared} см; 2 · ${side}² = ${x} кв.см.`;break;}
 case "M1-11": {const small=2+j,large=small*x;check=`П1 + П2 = 1 + ${small} = ${small+1} части; П1 + П3 = 1 + ${large} = ${large+1}; ${large} : ${small} = ${x}.`;break;}
 case "M1-12": {const hours=49+7*j,start=(7+j)%24;check=`${Math.floor(hours/24)} · 24 + ${hours%24} = ${hours} часа. (${start} + ${hours%24}) при отчитане на цели денонощия дава ${x} ч.`;break;}
 case "M1-13": {const past=harder?3:2,future=harder?4:1;check=`${x} деца · ${past+future} години = ${x*(past+future)} години общо увеличение.`;break;}
 case "M1-14": {const side=7+j,w=harder?4:2,h=harder?3:1;check=`${side} · 4 = ${4*side} см; (${side} − ${w}) · (${side} − ${h}) = ${x} кв.см.`;break;}
 case "M1-15": check=`${x-1} · 666 = ${(x-1)*666} не достига ${(x-1)*666+26}; с още 26 получаваме ${(x-1)*666+26}. С ${x} събираеми целта е постигната.`;break;
 case "M1-16": {const length=32+j*8,last=3+j,delta=harder?3:2,width=last+3*delta;check=`${length} : 8 · ${last} = ${length/8*last} кв.см за четвъртия. Първа ширина ${last} + 3 · ${delta} = ${width}; 2 · (${length} + ${width}) = ${x} см.`;break;}
 case "M1-17": {const target=7+j,blocks:string[]=[],counts:number[]=[];let fours=0,total=0;for(let block=1;fours<target;block++){let digits=0;for(let value=1;value<=block&&fours<target;value++)for(const digit of String(value)){digits++;if(digit==="4")fours++;if(fours===target)break;}blocks.push(`${block}: ${digits}`);counts.push(digits);total+=digits;}return {first:`В първите три блока 1; 12; 123 има 1 + 2 + 3 = 6 цифри и няма четворки. Първата четворка е в следващия блок 1234, на обща позиция 10.`,rest:[`Записваме броя изписани цифри във всеки блок, докато стигнем четворка №${target} (последният блок може да е непълен): ${blocks.join("; ")}.`],check:`${counts.join(" + ")} = ${total} цифри. Спираме при четворка №${target}, на позиция ${x}.`};}
 case "M1-18": {const count=harder?13:7,last=x+2*(count-1);check=`От ${x} до ${last} през 2 има ${count} числа; (${x} + ${last}) · ${count} : 2 = ${count*(x+count-1)}.`;break;}
 case "M1-19": {const divisor=20+j,factor=harder?5:3,q=Math.floor((divisor-1)/factor);check=`${divisor} · ${q} + ${factor*q} = ${x}; ${factor*q} < ${divisor}, а ${factor*(q+1)} ≥ ${divisor}.`;break;}
 case "M1-20": {const candies=6+j;check=`(${candies-2} + 1) · ${candies-2} : 2 = ${x}. Всеки случай оставя поне по един бонбон на другите двама.`;break;}
 case "M2-1a": {const left=Number(p.fields[1]!.answer),right=Number(p.fields[2]!.answer);check=`${b} − ${left} = ${right} − 1 + ${d}; ${right} − ${left} = ${c}; ${left} + ${right} = ${x}.`;break;}
 case "M2-1b": {const limit=b,previous=Math.floor(limit/100)*100-1,first=[];for(let i=previous+1;i<=limit;i++)if(String(i).includes("4"))first.push(i);return {first:`От 00 до 99 без цифра 4 има 9 · 9 = 81 записа. Значи с 4 са 100 − 81 = 19; например 44 броим само веднъж.`,rest:[`До ${previous} има ${p.fields[1]!.answer} числа с 4. В последния блок ${previous+1}–${limit} са ${first.length?first.join(", "):"нула такива числа"}. Общо ${x}.`],check:`${p.fields[1]!.answer} + ${first.length} = ${x}.`};}
 case "M2-1c": {const keep=Number(p.fields[1]!.answer),last=Number(p.fields[3]!.answer);check=`1 + … + ${keep-1} + ${last} = ${sum(keep-1)} + ${last} = ${b}. За ${keep+1} запазени трябват поне ${sum(keep+1)} > ${b}; изтриваме ${b} − ${keep} = ${x}.`;break;}
 case "M2-2a": {const [mx,xy,area,u,v,w,h,q,r]=p.fields.map(f=>Number(f.answer)),side=Math.sqrt(area!);check=`Ширини ${u},${v},${w} и височини ${h},${q},${r} дават страна ${side}. 2 · (${v} + ${h}) = ${2*(v!+h!)}; 2 · (${u} + ${q}) = ${2*(u!+q!)}; 2 · (${w} + ${r}) = ${2*(w!+r!)}. x = ${mx}, x + y = ${xy}, лице ${side}² = ${area}.`;break;}
 case "M2-2b": {const w=Number(p.fields[3]!.answer),h=Number(p.fields[4]!.answer);check=`a · b = ${w} · ${h} = ${x}; центърът е 6 · ${x} = ${6*x}. Лява ширина 6 · ${h} − 3 · ${w} = ${6*h-3*w} > 1; страна ${6*h}, обиколка ${24*h}.`;break;}
 default: throw new Error(`Missing worked solution: ${p.id}`);
 }
 return {check};
}

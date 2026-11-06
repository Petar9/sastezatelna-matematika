import type {Metadata} from "next";

export const siteName="Състезателна математика";
export const admissionGuides={
 smg:{
  path:"/materiali/priem-sled-4-klas-smg",school:"СМГ",year:"2026/2027",
  title:"Прием след 4. клас в СМГ: балообразуване",
  description:"Как се образува балът за СМГ за 2026/2027 г., защо „Математика за всеки“ има тежест 6 и какви са условията за участие. Официални източници.",
  summary:"Формулата за бала, тежестта на „Математика за всеки“ и условията за участие в миналия прием.",
  reviewedAt:"2026-11-06",modifiedAt:"2026-11-06",
 },
 npmg:{
  path:"/materiali/priem-sled-4-klas-npmg",school:"НПМГ",year:"2027/2028",
  title:"Прием след 4. клас в НПМГ: състезания и условия",
  description:"Кои състезания са обявени за приема в НПМГ за 2027/2028 г. и какво още предстои да бъде публикувано за балообразуването. Официални източници.",
  summary:"Обявените състезания за следващия прием и какво предстои да научим за балообразуването.",
  reviewedAt:"2026-11-06",modifiedAt:"2026-11-06",
 },
};
export type AdmissionGuide=(typeof admissionGuides)[keyof typeof admissionGuides];
export const competitionGuides={
 maths:{path:"/materiali/matematika-za-vseki-4-klas",label:"Математика за всеки",eyebrow:"Състезание · 4. клас",title:"Математика за всеки за 4. клас: формат и подготовка",description:"Модули, задачи, оценяване и подготовка за „Математика за всеки“ в 4. клас. Дата за 2027 г. и източници с обозначена учебна година.",summary:"Как се различават тестът и задачите с подробно решение и какво да упражнява детето.",reviewedAt:"2026-11-06",modifiedAt:"2026-11-06"},
 olympiad:{path:"/materiali/olimpiada-matematika-4-klas",label:"Олимпиада",eyebrow:"Два кръга · 4. клас",title:"Олимпиада по математика за 4. клас: общински и областен кръг",description:"Как се различават общинският и областният кръг на олимпиадата по математика за 4. клас. Формат, подготовка и дата за областния кръг през 2027 г.",summary:"Двата кръга, преминаването между тях и защо обяснението на решението е важно.",reviewedAt:"2026-11-06",modifiedAt:"2026-11-06"},
 spring:{path:"/materiali/proletno-matematichesko-sastezanie-4-klas",label:"Пролетно състезание",eyebrow:"Състезание · 4. клас",title:"Пролетно математическо състезание за 4. клас",description:"Какъв е форматът на Пролетното математическо състезание за 4. клас, как се оценяват задачите и как да се подготви детето. Официални източници.",summary:"Четири задачи с подробно решение: какво изискват и как да се подготвите.",reviewedAt:"2026-11-06",modifiedAt:"2026-11-06"},
 nvo:{path:"/materiali/nvo-matematika-4-klas",label:"НВО",eyebrow:"Външно оценяване · 4. клас",title:"НВО по математика в 4. клас: задачи и подготовка",description:"Какво проверява НВО по математика в 4. клас, какви задачи включва и как да се подготви детето. Разлика спрямо състезанията и официални източници.",summary:"Какво проверява оценяването и как да упражнявате училищния материал.",reviewedAt:"2026-11-06",modifiedAt:"2026-11-06"},
};
export type CompetitionGuide=(typeof competitionGuides)[keyof typeof competitionGuides];
export type MaterialGuide=AdmissionGuide|CompetitionGuide;
export const materialGuides=[...Object.values(admissionGuides),...Object.values(competitionGuides)];
export {competitionCalendar} from "./competition-dates";
export const competitionSources={
 maths:"https://www.mon.bg/nfs/2025/10/reglament-ns-mat-za-vseki_2025-2026_29102025.pdf",
 mathsCopy:"https://danybon.com/wp-content/uploads/2025/10/reglament-ns-mat-za-vseki_2025-2026_29102025.pdf",
 olympiad:"https://ruo.mon.bg/files/sites/2/2025/11/regl-ol-math-4-7kl_05112025.pdf",
 spring:"https://tutunjian.bg/wp-content/uploads/2026/02/regl-ns-proletno-math-4kl_2026.pdf",
 nvo:"https://mon.bg/obshto-obrazovanie/natsionalno-vanshno-otsenyavane-nvo/nvo-za-iv-klas/model-na-nvo-za-iv-klas/",
 nvoCopy:"https://ou-gm.com/download-239/",
};
export const legacyAdmissionPath="/materiali/priem-sled-4-klas-smg-npmg";
export const publicPagePaths=["/","/about","/materiali",...materialGuides.map(guide=>guide.path)];

export function publicOrigin(){
 const url=new URL(process.env.MATHS_APP_URL??"https://sastezatelna-matematika.vercel.app");
 if(!["https:","http:"].includes(url.protocol)||url.username||url.password)throw new Error("Invalid public site URL");
 return url.origin;
}
export function indexableDeployment(){
 return process.env.MATHS_MODE==="hosted"&&(!process.env.VERCEL_ENV||process.env.VERCEL_ENV==="production");
}
export function searchVerification(){
 const google=process.env.MATHS_GOOGLE_SITE_VERIFICATION?.trim();
 return indexableDeployment()&&google?{google}:undefined;
}
export const publicReadPaths=[...publicPagePaths.filter(path=>path!=="/"),legacyAdmissionPath,"/robots.txt","/sitemap.xml"];
export function publicReadPath(path:string){
 return publicReadPaths.includes(path);
}
export function publicMetadata(title:string,description:string,path:string,options:{index?:boolean;article?:boolean}={}):Metadata{
 const url=new URL(path,publicOrigin()).href;
 return {
  title,description,alternates:{canonical:url},
  robots:{index:indexableDeployment()&&options.index!==false,follow:true},
  openGraph:{title,description,url,siteName,locale:"bg_BG",type:options.article?"article":"website"},
  twitter:{card:"summary",title,description},
 };
}
export function hasAuthCookie(names:string[]){
 return names.some(name=>/^sb-.*-auth-token(?:\.\d+)?$/.test(name));
}
export function articleStructuredData(guide:MaterialGuide){
 const origin=publicOrigin(),url=origin+guide.path;
 return {"@context":"https://schema.org","@graph":[
  {"@type":"Article",headline:guide.title,description:guide.description,inLanguage:"bg",dateModified:guide.modifiedAt,mainEntityOfPage:url,author:{"@type":"Organization",name:siteName,url:origin+"/about"},publisher:{"@type":"Organization",name:siteName,url:origin}},
  {"@type":"BreadcrumbList",itemListElement:[
   {"@type":"ListItem",position:1,name:"Начало",item:origin+"/"},
   {"@type":"ListItem",position:2,name:"Ценни материали",item:origin+"/materiali"},
   {"@type":"ListItem",position:3,name:guide.title,item:url},
  ]},
 ]};
}

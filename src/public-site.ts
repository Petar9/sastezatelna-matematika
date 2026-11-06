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
export const legacyAdmissionPath="/materiali/priem-sled-4-klas-smg-npmg";
export const publicPagePaths=["/","/about","/materiali",...Object.values(admissionGuides).map(guide=>guide.path)];

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
export function articleStructuredData(guide:AdmissionGuide){
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

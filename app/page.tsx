import {notFound,redirect} from "next/navigation";
import {KidsCompetitionPlayer} from "@/components/kids-competition-player";
import {Landing} from "@/components/landing";
import {learnerContext,readKidsCourseView,mode} from "@/src/server";
import {availableCompetitions} from "@/src/server/competitions";
import {KidsError} from "@/src/core";
export const dynamic="force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<{competition?:string;request?:string}>}){
 const params=await searchParams;
 if(mode()==="hosted"&&process.env.VERCEL_ENV==="preview")return <Landing request={params.request}/>;
 try {
  const context=await learnerContext({api:false,competitionId:params.competition});
  const choices=availableCompetitions();
  return <KidsCompetitionPlayer key={`${context.childId??"local"}:${choices.map(choice=>choice.contentVersion).join(":")}`} learnerId={context.childId} learnerNickname={context.childNickname} competitionId={context.competitionId} competitionChoices={choices} initialView={await readKidsCourseView(context.courseStore,context.content)} sessions={context.legacyStore?.list()??[]}/>;
 }catch(error){
  if(error instanceof KidsError){
   if(error.status===401)return <Landing request={params.request}/>;
   if(error.status===428)redirect("/profiles");
   if(error.status===403)redirect("/login?denied=1");
   if(error.status===404)notFound();
  }
  throw error;
 }
}

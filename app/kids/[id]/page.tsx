import {notFound,redirect} from "next/navigation";
import {KidsPlayer} from "@/components/kids-player";
import {learnerContext,readKidsView} from "@/src/server";
import {KidsError} from "@/src/core";
export const dynamic="force-dynamic";
export default async function LegacyPage({params}:{params:Promise<{id:string}>}){
 const context=await learnerContext().catch(error=>{if(error instanceof KidsError&&error.status===401)redirect("/login");throw error;});
 if(!context.legacyStore)notFound();const view=readKidsView((await params).id,context.legacyStore);if(!view)notFound();return <KidsPlayer initialView={view}/>;
}

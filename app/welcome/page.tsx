import {Landing} from "@/components/landing";
export const dynamic="force-dynamic";
export default async function Welcome({searchParams}:{searchParams:Promise<{request?:string}>}){return <Landing request={(await searchParams).request}/>;}

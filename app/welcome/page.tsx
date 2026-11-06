import {Landing} from "@/components/landing";
import {publicMetadata} from "@/src/public-site";
export const metadata=publicMetadata("Състезателна математика","Подготовка по математика за 4. клас.","/",{index:false});
export const dynamic="force-dynamic";
export default async function Welcome({searchParams}:{searchParams:Promise<{request?:string}>}){return <Landing request={(await searchParams).request}/>;}

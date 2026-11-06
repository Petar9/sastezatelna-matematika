import type {Metadata} from "next";
import {Source_Sans_3} from "next/font/google";
import "./globals.css";
import {publicOrigin,searchVerification} from "@/src/public-site";
const font=Source_Sans_3({subsets:["latin","cyrillic"],variable:"--font-sans3"});
export const metadata: Metadata={metadataBase:new URL(publicOrigin()),verification:searchVerification(),robots:{index:false,follow:false},title:"Състезателна математика",description:"Малки открития и големи приключения с математиката за 4. клас."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="bg" className={font.variable}><body>{children}</body></html>;}

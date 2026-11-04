import type {Metadata} from "next";
import {Source_Sans_3} from "next/font/google";
import "./globals.css";
const font=Source_Sans_3({subsets:["latin","cyrillic"],variable:"--font-sans3"});
export const metadata: Metadata={title:"Състезателна математика",description:"Малки открития и големи приключения с математиката за 4. клас."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="bg" className={font.variable}><body>{children}</body></html>;}

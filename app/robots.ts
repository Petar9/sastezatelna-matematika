import type {MetadataRoute} from "next";
import {indexableDeployment,publicOrigin} from "@/src/public-site";
export default function robots():MetadataRoute.Robots{
 // Crawlers must reach preview pages to see their noindex header.
 if(!indexableDeployment())return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/auth/"]}};
 return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/auth/"]},sitemap:publicOrigin()+"/sitemap.xml"};
}

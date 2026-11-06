import type {MetadataRoute} from "next";
import {admissionGuides,indexableDeployment,publicOrigin,publicPagePaths} from "@/src/public-site";
export default function sitemap():MetadataRoute.Sitemap{
 if(!indexableDeployment())return [];
 return publicPagePaths.map(path=>{
  const guide=Object.values(admissionGuides).find(guide=>guide.path===path);
  return {url:new URL(path,publicOrigin()).href,...(guide?{lastModified:guide.modifiedAt}:{})};
 });
}

import type {MetadataRoute} from "next";
import {materialGuides,indexableDeployment,publicOrigin,publicPagePaths} from "@/src/public-site";
export default function sitemap():MetadataRoute.Sitemap{
 if(!indexableDeployment())return [];
 return publicPagePaths.map(path=>{
  const guide=materialGuides.find(guide=>guide.path===path);
  return {url:new URL(path,publicOrigin()).href,...(guide?{lastModified:guide.modifiedAt}:{})};
 });
}

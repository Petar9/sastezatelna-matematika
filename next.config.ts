import type { NextConfig } from "next";
import {indexableDeployment,publicReadPaths} from "./src/public-site";
import images from "./src/generated/public-images.json";

const config: NextConfig = {
 output: "standalone",
 turbopack: {root:process.cwd()},
 outputFileTracingRoot: process.cwd(),
 outputFileTracingExcludes: {"/*":["./data/**/*","./backups/**/*","./materials/**/*","./assets/**/*","./.env*"]},
 async redirects() {
  return [
   {source:"/kids",destination:"/",permanent:true},
   {source:"/kids/review",destination:"/about",permanent:true},
   ...Object.entries(images).map(([source,destination])=>({source,destination,permanent:false})),
  ];
 },
 async headers() {
  return [
   {source:"/(.*)",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"Referrer-Policy",value:"same-origin"},
    {key:"X-Frame-Options",value:"DENY"},
    {key:"Cache-Control",value:"no-store"},
   ]},
   ...publicReadPaths.map(source=>({source,headers:[{key:"Cache-Control",value:indexableDeployment()?"public, max-age=0, s-maxage=3600, stale-while-revalidate=86400":"no-store"}]})),
   {source:"/assets/images/:path*",headers:[{key:"Cache-Control",value:"public, max-age=31536000, immutable"}]},
   {source:"/kids/lessons/:path*",headers:[{key:"Cache-Control",value:"public, max-age=0, must-revalidate"}]},
  ];
 },
};
export default config;

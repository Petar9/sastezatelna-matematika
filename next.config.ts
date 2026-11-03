import type { NextConfig } from "next";
const config: NextConfig = {
 output: "standalone",
 turbopack:{root:process.cwd()},
 outputFileTracingRoot:process.cwd(),
 outputFileTracingExcludes: { "/*": ["./data/**/*", "./backups/**/*", "./materials/**/*", "./.env*"] },
 async redirects() { return [{source:"/kids",destination:"/",permanent:true},{source:"/kids/review",destination:"/about",permanent:true}]; },
 async headers() { return [{source:"/(.*)",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"same-origin"},{key:"X-Frame-Options",value:"DENY"},{key:"Cache-Control",value:"no-store"}]}]; },
};
export default config;

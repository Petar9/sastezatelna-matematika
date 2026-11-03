export function mode(): "local"|"hosted" {
 const value=process.env.MATHS_MODE;
 if(value!=="local"&&value!=="hosted")throw new Error("Set MATHS_MODE explicitly to local or hosted");
 if(value==="local"&&(process.env.VERCEL||process.env.NETLIFY||process.env.RENDER||process.env.FLY_APP_NAME))throw new Error("Local mode is forbidden on hosted platforms");
 return value;
}
export function required(name:string){const value=process.env[name];if(!value)throw new Error(`Missing ${name}`);return value;}
export function appOrigin(){const url=new URL(required("MATHS_APP_URL"));if(url.protocol!=="https:"&&url.hostname!=="localhost"&&url.hostname!=="127.0.0.1")throw new Error("Hosted app requires HTTPS");return url.origin;}
export function isLoopbackHost(host:string|null){return !!host&&/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);}
export function mutationAllowed(request:Request, deployment:"local"|"hosted"){
 if(["GET","HEAD","OPTIONS"].includes(request.method))return true;
 const origin=request.headers.get("origin");
 if(!origin||request.headers.get("sec-fetch-site")==="cross-site")return false;
 if(deployment==="hosted")return origin===appOrigin();
 const url=new URL(request.url), host=request.headers.get("host")||url.host;
 // Next normalizes the internal URL hostname; the browser sends the public loopback Host.
 return isLoopbackHost(host)&&origin===`${url.protocol}//${host}`;
}

export function assertHostedDataAccess(){if(process.env.VERCEL_ENV==="preview")throw new Error("Authenticated access is disabled in Vercel Preview");}

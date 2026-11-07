import {createHash,randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {appOrigin} from "./config.ts";

export const invitationCookie="maths_invitation";
export function invitationToken(value:unknown):string|null {
 return typeof value==="string"&&/^[A-Za-z0-9_-]{43}$/.test(value)?value:null;
}
export function newInvitationToken(){return randomBytes(32).toString("base64url");}
export function invitationHash(token:string){return createHash("sha256").update(token).digest("hex");}
export function invitationCookieOptions(){return {httpOnly:true,secure:appOrigin().startsWith("https:"),sameSite:"lax" as const,path:"/",maxAge:60*60*24*7};}
export async function pendingInvitation(){return invitationToken((await cookies()).get(invitationCookie)?.value);}
export function uuid(value:unknown):value is string{return typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);}

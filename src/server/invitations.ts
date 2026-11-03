export function invitationEmail(value:FormDataEntryValue|null):string|null {
 if(typeof value!=="string")return null;
 const email=value.trim().toLowerCase();
 return email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
}

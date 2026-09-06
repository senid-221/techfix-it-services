import crypto from 'node:crypto';
import { cookies } from 'next/headers';
const COOKIE='techfix_admin_session';
function secret(){return process.env.TECHFIX_SESSION_SECRET||'CHANGE_ME_IN_PRODUCTION'}
function sign(value:string){return crypto.createHmac('sha256',secret()).update(value).digest('hex')}
export function createSessionToken(){const payload=`${Date.now()}.${crypto.randomBytes(24).toString('hex')}`;return `${payload}.${sign(payload)}`}
export function isValidSession(token:string|undefined){if(!token)return false;const parts=token.split('.');if(parts.length!==3)return false;const[created,nonce,signature]=parts;const expected=sign(`${created}.${nonce}`);const a=Buffer.from(signature),b=Buffer.from(expected);if(a.length!==b.length)return false;if(!crypto.timingSafeEqual(a,b))return false;const age=Date.now()-Number(created);return Number.isFinite(age)&&age>=0&&age<1000*60*60*12}
export async function isAdminSession(){const store=await cookies();return isValidSession(store.get(COOKIE)?.value)}
export const adminCookieName=COOKIE;

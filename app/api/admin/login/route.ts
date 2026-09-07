import {NextResponse} from 'next/server';
import {createSessionToken,adminCookieName} from '@/lib/admin-auth';

export async function POST(request:Request){
 try{
  const contentType=request.headers.get('content-type')||'';
  if(!contentType.toLowerCase().includes('application/json'))return NextResponse.json({error:'Invalid request format.'},{status:400});
  const body=await request.json();
  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  const password=typeof body?.password==='string'?body.password:'';
  if(!email||!password)return NextResponse.json({error:'Email and password are required.'},{status:400});
  const configuredEmail=(process.env.TECHFIX_ADMIN_EMAIL||'').trim().toLowerCase();
  const configuredPassword=process.env.TECHFIX_ADMIN_PASSWORD||'';
  if(!configuredEmail||!configuredPassword)return NextResponse.json({error:'Admin login is not configured on the server.'},{status:500});
  if(email!==configuredEmail||password!==configuredPassword)return NextResponse.json({error:'Invalid admin credentials.'},{status:401});
  const r=NextResponse.json({ok:true});
  r.cookies.set(adminCookieName,createSessionToken(),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:43200});
  return r;
 }catch{
  return NextResponse.json({error:'Invalid sign-in request. Please refresh and try again.'},{status:400});
 }
}
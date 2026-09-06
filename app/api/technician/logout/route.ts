import { NextResponse } from 'next/server';
const OPTIONS={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:0};
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set('techfix_tech_access','',OPTIONS);r.cookies.set('techfix_tech_refresh','',OPTIONS);return r;}

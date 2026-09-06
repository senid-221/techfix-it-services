import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const ACCESS='techfix_tech_access'; const REFRESH='techfix_tech_refresh'; const MAX_AGE=60*60*24*7;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'Email na password birakenewe.' }, { status: 400 });
    const auth = await getSupabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (auth.error || !auth.data.session || !auth.data.user) return NextResponse.json({ error: 'Email cyangwa password ntabwo ari byo.' }, { status: 401 });
    const admin = (await import('@/lib/supabase')).getSupabaseAdmin();
    const { data: tech } = await admin.from('technicians').select('id,active,name,email').eq('auth_user_id', auth.data.user.id).maybeSingle();
    if (!tech || !tech.active) return NextResponse.json({ error: 'Iyi Technician account ntirafungurwa cyangwa yarahagaritswe.' }, { status: 403 });
    await admin.from('technicians').update({ last_login_at: new Date().toISOString() }).eq('id', tech.id);
    const response = NextResponse.json({ ok: true, technician: tech });
    const options={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:MAX_AGE};
    response.cookies.set(ACCESS, auth.data.session.access_token, options);
    response.cookies.set(REFRESH, auth.data.session.refresh_token, options);
    return response;
  } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
}

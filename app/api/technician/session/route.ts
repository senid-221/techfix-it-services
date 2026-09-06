import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

export async function GET(){
  const store=await cookies(); const token=store.get('techfix_tech_access')?.value;
  if(!token)return NextResponse.json({authenticated:false});
  const {data,error}=await getSupabase().auth.getUser(token);
  if(error||!data.user)return NextResponse.json({authenticated:false});
  const {data:tech}=await getSupabaseAdmin().from('technicians').select('id,name,phone,email,active').eq('auth_user_id',data.user.id).maybeSingle();
  if(!tech?.active)return NextResponse.json({authenticated:false});
  return NextResponse.json({authenticated:true,technician:tech});
}

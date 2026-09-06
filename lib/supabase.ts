import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export function getSupabaseAdmin(){if(!url||!serviceRoleKey)throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');return createClient(url,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}})}
export function getSupabase(){if(!url||!anonKey)throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');return createClient(url,anonKey,{auth:{autoRefreshToken:false,persistSession:false}})}

import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';

const ACCESS = 'techfix_tech_access';
const REFRESH = 'techfix_tech_refresh';

export async function getTechnicianUser() {
  const store = await cookies();
  const access = store.get(ACCESS)?.value;
  if (!access) return null;
  const { data, error } = await getSupabase().auth.getUser(access);
  if (error || !data.user) return null;
  return data.user;
}

export function setTechnicianSession(response: Response, accessToken: string, refreshToken: string) {
  const headers = new Headers(response.headers);
  return { access: { name: ACCESS, value: accessToken }, refresh: { name: REFRESH, value: refreshToken }, headers };
}

export async function clearTechnicianSession() {
  const store = await cookies();
  store.set(ACCESS, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  store.set(REFRESH, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

export const technicianAccessCookie = ACCESS;
export const technicianRefreshCookie = REFRESH;

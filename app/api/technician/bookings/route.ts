import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

async function getTechnician() {
  const c = await cookies();
  const token = c.get('techfix_tech_access')?.value;
  if (!token) return null;
  const { data } = await getSupabase().auth.getUser(token);
  if (!data.user) return null;
  const { data: tech } = await getSupabaseAdmin()
    .from('technicians')
    .select('id,name,email,active')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  return tech?.active ? tech : null;
}

async function withService(admin: ReturnType<typeof getSupabaseAdmin>, bookings: any[]) {
  const ids = [...new Set(bookings.map((b) => Number(b.service_id)).filter(Number.isFinite))];
  if (!ids.length) return bookings.map((b) => ({ ...b, service_name: null }));
  const { data: services } = await admin.from('services').select('id,name,slug').in('id', ids);
  const map = new Map((services || []).map((s) => [Number(s.id), s]));
  return bookings.map((b) => {
    const service = map.get(Number(b.service_id));
    return { ...b, service_name: service?.name || null, service_slug: service?.slug || null };
  });
}

export async function GET() {
  const tech = await getTechnician();
  if (!tech) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('bookings')
    .select('id,booking_number,service_id,customer_name,customer_phone,preferred_date,preferred_time,notes,status,technician_id,created_at')
    .eq('technician_id', tech.id)
    .order('preferred_date')
    .order('preferred_time');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: await withService(admin, data || []), technician: tech });
}

export async function PATCH(request: Request) {
  const tech = await getTechnician();
  if (!tech) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status;
    if (!id || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: booking } = await admin
      .from('bookings')
      .select('id,status,service_id')
      .eq('id', id)
      .eq('technician_id', tech.id)
      .maybeSingle();
    if (!booking) return NextResponse.json({ error: 'Booking not found or not assigned to you.' }, { status: 404 });
    if (status === 'IN_PROGRESS' && booking.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only approved jobs can be started.' }, { status: 409 });
    }
    if (status === 'COMPLETED' && booking.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Start the job before completing it.' }, { status: 409 });
    }

    // Live DB compatibility: bookings currently has no started_at/completed_at columns.
    // Status history is recorded by the database trigger when status changes.
    const { data: updated, error } = await admin
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .eq('technician_id', tech.id)
      .select('id,booking_number,service_id,customer_name,customer_phone,preferred_date,preferred_time,notes,status,technician_id,created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const [enriched] = await withService(admin, [updated]);
    return NextResponse.json({ booking: enriched });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

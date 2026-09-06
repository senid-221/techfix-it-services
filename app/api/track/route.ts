import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function clean(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingNumber = clean(body.bookingNumber, 40).toUpperCase();
    const token = clean(body.token, 100);
    if (!bookingNumber || !token) {
      return NextResponse.json({ error: 'Booking number and tracking token are required.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: booking, error } = await db
      .from('bookings')
      .select('id,booking_number,service_name,preferred_date,preferred_time,status,created_at,updated_at,rejection_reason,admin_note')
      .eq('booking_number', bookingNumber)
      .eq('tracking_token', token)
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Unable to load booking.' }, { status: 500 });
    if (!booking) return NextResponse.json({ error: 'Booking not found. Check the booking number and tracking link.' }, { status: 404 });

    const { id, ...safeBooking } = booking;
    const { data: history, error: historyError } = await db
      .from('booking_status_history')
      .select('from_status,to_status,note,created_at')
      .eq('booking_id', id)
      .order('created_at', { ascending: true });

    if (historyError) return NextResponse.json({ error: 'Unable to load booking history.' }, { status: 500 });

    return NextResponse.json({ booking: safeBooking, history: history ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to track booking.' }, { status: 500 });
  }
}

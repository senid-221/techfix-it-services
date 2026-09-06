import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function clean(v: unknown, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

function kigaliNowKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = clean(searchParams.get('date'), 20);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    let query = db.from('bookings').select('preferred_time').in('status', ['PENDING','APPROVED','IN_PROGRESS']);
    if (date) query = query.eq('preferred_date', date);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const booked = new Set((data ?? []).map((row) => String(row.preferred_time).slice(0,5)));
    return NextResponse.json({ date: date || null, slots: TIME_SLOTS.map((time) => ({ time, available: !booked.has(time) })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load availability.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serviceSlug=clean(body.serviceSlug,80), serviceName=clean(body.serviceName,120), name=clean(body.name,120), phone=clean(body.phone,40), date=clean(body.date,20), time=clean(body.time,10), notes=clean(body.notes,1500);
    if (!serviceSlug || !serviceName || !name || !phone || !date || !time) return NextResponse.json({error:'Service, date, time, name and phone are required.'},{status:400});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !TIME_SLOTS.includes(time)) return NextResponse.json({error:'Invalid date or time slot.'},{status:400});
    // Booking hours are interpreted in Africa/Kigali, not the server's timezone.
    if (`${date}T${time}` <= kigaliNowKey()) return NextResponse.json({error:'Please choose a future booking date and time.'},{status:400});
    const supabase=getSupabaseAdmin();
    const {data:service}=await supabase.from('services').select('id,name,slug').eq('slug',serviceSlug).eq('active',true).maybeSingle();
    if (!service) return NextResponse.json({error:'Selected service is unavailable.'},{status:400});
    const {data,error}=await supabase.from('bookings').insert({service_id:service.id,service_slug:service.slug,service_name:service.name,customer_name:name,customer_phone:phone,preferred_date:date,preferred_time:time,notes:notes||null,status:'PENDING'}).select('id,booking_number,tracking_token,status,service_name,preferred_date,preferred_time,customer_name,customer_phone,notes,created_at').single();
    if(error) {
      if (error.code === '23505') return NextResponse.json({error:'That time slot was just booked. Please choose another available time.'},{status:409});
      return NextResponse.json({error:error.message},{status:500});
    }
    return NextResponse.json({booking:data},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:'Unable to create booking.'},{status:500}); }
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAdminSession } from '@/lib/admin-auth';
import { services } from '@/lib/services';

function clean(v: unknown, max = 500) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const ACTIVE_STATUSES = ['PENDING','APPROVED','IN_PROGRESS'];

function kigaliParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Kigali', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return { year:get('year'), month:get('month'), day:get('day'), hour:get('hour'), minute:get('minute') };
}
function kigaliNowKey(offsetMinutes = 0) {
  const p=kigaliParts(new Date(Date.now()+offsetMinutes*60000));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
function todayKigali() { const p=kigaliParts(); return `${p.year}-${p.month}-${p.day}`; }
function slotIsTooSoon(date:string,time:string) { return `${date}T${time}` < kigaliNowKey(120); }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = clean(searchParams.get('date'),20);

  if (!date && await isAdminSession()) {
    try {
      const db=getSupabaseAdmin();
      const {data,error}=await db.from('bookings').select('id,booking_number,service_id,technician_id,customer_name,customer_phone,preferred_date,preferred_time,notes,admin_note,status,tracking_token,created_at,updated_at').order('created_at',{ascending:false});
      if(error)return NextResponse.json({error:error.message},{status:500});
      const serviceIds=Array.from(new Set((data??[]).map(row=>row.service_id).filter((id): id is number => typeof id==='number')));
      const techIds=Array.from(new Set((data??[]).map(row=>row.technician_id).filter((id): id is number => typeof id==='number')));
      const [serviceResult,techResult]=await Promise.all([
        serviceIds.length?db.from('services').select('id,name,slug,description,active').in('id',serviceIds):Promise.resolve({data:[],error:null}),
        techIds.length?db.from('technicians').select('id,name,full_name,phone,email,active').in('id',techIds):Promise.resolve({data:[],error:null}),
      ]);
      if(serviceResult.error||techResult.error)return NextResponse.json({error:'Unable to load booking references.'},{status:500});
      const serviceMap=new Map((serviceResult.data??[]).map(s=>[String(s.id),s]));
      const techMap=new Map((techResult.data??[]).map(t=>[String(t.id),{...t,name:t.name||t.full_name||'Technician'}]));
      const bookings=(data??[]).map(row=>({
        ...row,
        service_name:serviceMap.get(String(row.service_id))?.name||'IT Service',
        service_slug:serviceMap.get(String(row.service_id))?.slug||null,
        technicians:row.technician_id?techMap.get(String(row.technician_id))||null:null,
      }));
      return NextResponse.json({bookings},{headers:{'Cache-Control':'no-store'}});
    } catch(error) {
      return NextResponse.json({error:error instanceof Error?error.message:'Unable to load bookings.'},{status:500});
    }
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({error:'Invalid date.'},{status:400});
  try {
    const db=getSupabaseAdmin();
    let query=db.from('bookings').select('preferred_time').in('status',ACTIVE_STATUSES);
    if(date)query=query.eq('preferred_date',date);
    const {data,error}=await query;
    if(error)return NextResponse.json({error:error.message},{status:500});
    const booked=new Set((data??[]).map(row=>String(row.preferred_time).slice(0,5)));
    const slots=TIME_SLOTS.map(time=>{const taken=booked.has(time);const tooSoon=Boolean(date)&&slotIsTooSoon(date,time);return {time,available:!taken&&!tooSoon,reason:taken?'taken':tooSoon?'past':undefined};});
    return NextResponse.json({date:date||null,today:todayKigali(),minAdvanceHours:2,slots},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:'Unable to load availability.'},{status:500}); }
}

export async function POST(request: Request) {
  try {
    const body=await request.json();
    const serviceSlug=clean(body.serviceSlug,80);
    const serviceName=clean(body.serviceName,120);
    const name=clean(body.name,120);
    const phone=clean(body.phone,40);
    const date=clean(body.date,20);
    const time=clean(body.time,10);
    const notes=clean(body.notes,1500);

    if(!serviceSlug&&!serviceName||!name||!phone||!date||!time)
      return NextResponse.json({error:'Service, date, time, name and phone are required.'},{status:400});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||!TIME_SLOTS.includes(time))
      return NextResponse.json({error:'Invalid date or time slot.'},{status:400});
    if(slotIsTooSoon(date,time))
      return NextResponse.json({error:'Igihe cyarenze. Booking igomba gukorwa nibura amasaha 2 mbere.'},{status:400});

    const supabase=getSupabaseAdmin();
    let service:any=null;

    // Primary lookup: stable service slug. Secondary lookup: service name,
    // which keeps older/deployed booking clients compatible.
    if(serviceSlug) {
      const result=await supabase.from('services').select('id,name,slug').eq('slug',serviceSlug).eq('active',true).maybeSingle();
      if(result.error && result.error.code!=='PGRST116')
        return NextResponse.json({error:result.error.message},{status:500});
      service=result.data;
    }

    if(!service && serviceName) {
      const result=await supabase.from('services').select('id,name,slug').eq('name',serviceName).eq('active',true).maybeSingle();
      if(result.error && result.error.code!=='PGRST116')
        return NextResponse.json({error:result.error.message},{status:500});
      service=result.data;
    }

    // If the service is missing from Supabase, restore it from the canonical
    // local catalogue instead of returning the misleading "service not found" error.
    if(!service) {
      const localService=services.find(item=>item.slug===serviceSlug || item.name===serviceName);
      if(localService) {
        const upsert=await supabase.from('services').upsert({
          slug:localService.slug,
          name:localService.name,
          description:localService.description,
          active:true
        },{onConflict:'slug'}).select('id,name,slug').single();
        if(upsert.error)
          return NextResponse.json({error:`Unable to load service: ${upsert.error.message}`},{status:500});
        service=upsert.data;
      }
    }

    if(!service)
      return NextResponse.json({error:'Service not found. Please go back and select a service again.'},{status:400});

    const {data:existing,error:existingError}=await supabase.from('bookings').select('id').eq('preferred_date',date).eq('preferred_time',time).in('status',ACTIVE_STATUSES).limit(1).maybeSingle();
    if(existingError)return NextResponse.json({error:existingError.message},{status:500});
    if(existing)return NextResponse.json({error:'Time has been taken — Isaha yafashwe. Please choose another available time.'},{status:409});

    const {data,error}=await supabase.from('bookings').insert({
      service_id:service.id,
      customer_name:name,
      customer_phone:phone,
      preferred_date:date,
      preferred_time:time,
      notes:notes||null,
      status:'PENDING'
    }).select('id,booking_number,tracking_token,status,service_id,preferred_date,preferred_time,customer_name,customer_phone,notes,created_at').single();

    if(error){
      if(error.code==='23505')return NextResponse.json({error:'Time has been taken — Isaha yafashwe. Please choose another available time.'},{status:409});
      return NextResponse.json({error:error.message},{status:500});
    }

    return NextResponse.json({booking:{...data,service_name:service.name,service_slug:service.slug}},{status:201,headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to create booking.'},{status:500});
  }
}

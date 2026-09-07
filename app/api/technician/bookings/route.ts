import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {getSupabase,getSupabaseAdmin} from '@/lib/supabase';

async function getTechnician(){
  const c=await cookies();
  const token=c.get('techfix_tech_access')?.value;
  if(!token)return null;
  const{data}=await getSupabase().auth.getUser(token);
  if(!data.user)return null;
  const{data:tech}=await getSupabaseAdmin().from('technicians').select('id,name,email,active').eq('auth_user_id',data.user.id).maybeSingle();
  return tech?.active?tech:null;
}

function maskPhone(value:string|null|undefined){
  const phone=String(value||'').trim();
  if(!phone)return 'Hidden';
  const digits=phone.replace(/\D/g,'');
  if(digits.length<=4)return '••••';
  return `${phone.slice(0,Math.min(8,phone.length))}......${digits.slice(-2)}`;
}

function maskName(value:string|null|undefined){
  const name=String(value||'').trim();
  if(!name)return 'Customer';
  const parts=name.split(/\s+/).filter(Boolean);
  if(parts.length===1)return `${parts[0].slice(0,1)}•••`;
  return `${parts[0].slice(0,1)}••• ${parts[parts.length-1].slice(0,1)}•••`;
}

async function withService(admin:ReturnType<typeof getSupabaseAdmin>,bookings:any[]){
  const ids=[...new Set(bookings.map(b=>Number(b.service_id)).filter(Number.isFinite))];
  const mediaIds=bookings.map(b=>b.id);
  const[{data:services},{data:media}]=await Promise.all([
    ids.length?admin.from('services').select('id,name,slug,category_name,price_type,min_price,max_price,currency,estimated_duration_minutes,booking_methods,technician_job_fee').in('id',ids):Promise.resolve({data:[]}),
    mediaIds.length?admin.from('booking_media').select('id,booking_id,file_name,mime_type,size_bytes,storage_path').in('booking_id',mediaIds):Promise.resolve({data:[]})
  ]);
  const serviceMap=new Map((services||[]).map(s=>[Number(s.id),s]));
  const mediaMap=new Map<string,any[]>();
  for(const m of media||[]){
    const signed=await admin.storage.from('booking-evidence').createSignedUrl(m.storage_path,900);
    const list=mediaMap.get(m.booking_id)||[];
    list.push({id:m.id,file_name:m.file_name,mime_type:m.mime_type,size_bytes:m.size_bytes,url:signed.data?.signedUrl||null});
    mediaMap.set(m.booking_id,list);
  }
  return bookings.map(b=>{
    const service=serviceMap.get(Number(b.service_id));
    const unlocked=b.technician_fee_status==='PAID';
    const base={
      id:b.id,
      booking_number:b.booking_number,
      service_id:b.service_id,
      service_name:service?.name||null,
      service_slug:service?.slug||null,
      service_category:service?.category_name||null,
      price_type:service?.price_type||'QUOTE',
      min_price:service?.min_price??null,
      max_price:service?.max_price??null,
      currency:service?.currency||'RWF',
      estimated_duration_minutes:service?.estimated_duration_minutes??null,
      booking_methods:service?.booking_methods||[],
      service_technician_job_fee:service?.technician_job_fee??b.technician_job_fee??2000,
      technician_job_fee:b.technician_job_fee??null,
      technician_fee_status:b.technician_fee_status,
      status:b.status,
      preferred_date:b.preferred_date,
      preferred_time:b.preferred_time,
      service_method:b.service_method||null,
      customer_name:unlocked?b.customer_name:maskName(b.customer_name),
      customer_phone:unlocked?b.customer_phone:maskPhone(b.customer_phone),
      details_unlocked:unlocked,
    };
    if(!unlocked)return base;
    return {
      ...base,
      customer_name:b.customer_name,
      customer_phone:b.customer_phone,
      notes:b.notes,
      problem_description:b.problem_description,
      province:b.province,
      district:b.district,
      sector:b.sector,
      cell:b.cell,
      address:b.address,
      google_maps_url:b.google_maps_url,
      device_type:b.device_type,
      problem_started:b.problem_started,
      powers_on:b.powers_on,
      error_message:b.error_message,
      diagnosis_unknown:b.diagnosis_unknown,
      media:mediaMap.get(b.id)||[],
      full_details_available:true,
    };
  });
}

export async function GET(){
  const tech=await getTechnician();
  if(!tech)return NextResponse.json({error:'Unauthorized'},{status:401});
  const admin=getSupabaseAdmin();
  const{data,error}=await admin.from('bookings').select('id,booking_number,service_id,customer_name,customer_phone,preferred_date,preferred_time,notes,problem_description,service_method,province,district,sector,cell,address,google_maps_url,device_type,problem_started,powers_on,error_message,diagnosis_unknown,status,technician_id,requested_technician_id,technician_selection_status,technician_job_fee,technician_fee_status,created_at').eq('technician_id',tech.id).order('preferred_date').order('preferred_time');
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({bookings:await withService(admin,data||[]),technician:tech},{headers:{'Cache-Control':'no-store'}});
}

export async function PATCH(request:Request){
  const tech=await getTechnician();
  if(!tech)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const body=await request.json();
    const id=typeof body.id==='string'?body.id:'';
    const status=body.status;
    if(!id||!['IN_PROGRESS','COMPLETED'].includes(status))return NextResponse.json({error:'Invalid update.'},{status:400});
    const admin=getSupabaseAdmin();
    const{data:booking}=await admin.from('bookings').select('id,status,service_id,technician_fee_status').eq('id',id).eq('technician_id',tech.id).maybeSingle();
    if(!booking)return NextResponse.json({error:'Booking not found or not assigned to you.'},{status:404});
    if(status==='IN_PROGRESS'){
      if(booking.status!=='APPROVED')return NextResponse.json({error:'Only approved jobs can be started.'},{status:409});
      if(booking.technician_fee_status!=='PAID')return NextResponse.json({error:'Job fee must be paid and approved by Admin before starting this service.'},{status:409});
    }
    if(status==='COMPLETED'&&booking.status!=='IN_PROGRESS')return NextResponse.json({error:'Start the job before completing it.'},{status:409});
    const{data:updated,error}=await admin.from('bookings').update({status}).eq('id',id).eq('technician_id',tech.id).select('id,booking_number,service_id,customer_name,customer_phone,preferred_date,preferred_time,notes,problem_description,service_method,province,district,sector,cell,address,google_maps_url,device_type,problem_started,powers_on,error_message,diagnosis_unknown,status,technician_id,requested_technician_id,technician_selection_status,technician_job_fee,technician_fee_status,created_at').single();
    if(error)return NextResponse.json({error:error.message},{status:500});
    const[enriched]=await withService(admin,[updated]);
    return NextResponse.json({booking:enriched});
  }catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
}

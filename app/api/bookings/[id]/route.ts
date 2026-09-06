import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAdminSession } from '@/lib/admin-auth';

const transitions: Record<string,string[]>={PENDING:['APPROVED','REJECTED'],APPROVED:['IN_PROGRESS'],IN_PROGRESS:['COMPLETED']};

function shapeHistory(rows:any[]){return rows.map(h=>({id:h.id,from_status:h.old_status??null,to_status:h.new_status,note:h.note??null,changed_by:h.changed_by??null,created_at:h.created_at}));}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await isAdminSession()))return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;
  try{
    const db=getSupabaseAdmin();
    const {data,error}=await db.from('bookings').select('id,booking_number,service_id,technician_id,customer_name,customer_phone,preferred_date,preferred_time,notes,admin_note,status,tracking_token,created_at,updated_at').eq('id',id).maybeSingle();
    if(error)return NextResponse.json({error:error.message},{status:500});
    if(!data)return NextResponse.json({error:'Booking not found.'},{status:404});
    const [serviceResult,techResult,historyResult]=await Promise.all([
      db.from('services').select('id,name,slug,description,active').eq('id',data.service_id).maybeSingle(),
      data.technician_id?db.from('technicians').select('id,name,full_name,phone,email,active').eq('id',data.technician_id).maybeSingle():Promise.resolve({data:null,error:null}),
      db.from('booking_status_history').select('id,old_status,new_status,note,changed_by,created_at').eq('booking_id',id).order('created_at',{ascending:true}),
    ]);
    if(historyResult.error)return NextResponse.json({error:historyResult.error.message},{status:500});
    const technician=techResult.data?{...techResult.data,name:techResult.data.name||techResult.data.full_name||'Technician'}:null;
    return NextResponse.json({booking:{...data,service_name:serviceResult.data?.name||'IT Service',service_slug:serviceResult.data?.slug||null,technicians:technician},history:shapeHistory(historyResult.data??[])});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load booking.'},{status:500});}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await isAdminSession()))return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;
  try{
    const body=await request.json();const db=getSupabaseAdmin();
    const {data:current,error:ce}=await db.from('bookings').select('id,status,technician_id,admin_note').eq('id',id).single();
    if(ce||!current)return NextResponse.json({error:'Booking not found.'},{status:404});

    if(body.technicianId!==undefined){
      const technicianId=body.technicianId===null||body.technicianId===''?null:Number(body.technicianId);
      if(technicianId!==null&&!Number.isFinite(technicianId))return NextResponse.json({error:'Invalid technician.'},{status:400});
      if(technicianId!==null){const {data:tech,error:te}=await db.from('technicians').select('id').eq('id',technicianId).eq('active',true).maybeSingle();if(te||!tech)return NextResponse.json({error:'Selected technician is unavailable.'},{status:400});}
      const {data,error}=await db.from('bookings').update({technician_id:technicianId,admin_note:typeof body.note==='string'?body.note.trim().slice(0,1000):current.admin_note}).eq('id',id).select('id,booking_number,service_id,technician_id,customer_name,customer_phone,preferred_date,preferred_time,notes,admin_note,status,tracking_token,created_at,updated_at').single();
      if(error)return NextResponse.json({error:error.message},{status:500});
      const {data:service}=await db.from('services').select('name,slug').eq('id',data.service_id).maybeSingle();
      const {data:tech}=data.technician_id?await db.from('technicians').select('id,name,full_name,phone,email,active').eq('id',data.technician_id).maybeSingle():{data:null};
      return NextResponse.json({booking:{...data,service_name:service?.name||'IT Service',service_slug:service?.slug||null,technicians:tech?{...tech,name:tech.name||tech.full_name||'Technician'}:null}});
    }

    const next=typeof body.status==='string'?body.status:'';
    if(!['APPROVED','REJECTED','IN_PROGRESS','COMPLETED'].includes(next))return NextResponse.json({error:'Invalid status.'},{status:400});
    if(!transitions[current.status]?.includes(next))return NextResponse.json({error:`Invalid transition from ${current.status} to ${next}.`},{status:409});
    // Keep the current database schema compatible: rejection text is stored in
    // admin_note because rejection_reason is not present in the live table.
    const patch:Record<string,unknown>={status:next};
    if(typeof body.note==='string')patch.admin_note=body.note.trim().slice(0,1000);
    const {data,error}=await db.from('bookings').update(patch).eq('id',id).select('id,booking_number,service_id,technician_id,customer_name,customer_phone,preferred_date,preferred_time,notes,admin_note,status,tracking_token,created_at,updated_at').single();
    if(error){if(error.code==='23505')return NextResponse.json({error:'This booking slot conflicts with another active booking.'},{status:409});return NextResponse.json({error:error.message},{status:500});}
    const [{data:service},{data:tech}]=await Promise.all([db.from('services').select('name,slug').eq('id',data.service_id).maybeSingle(),data.technician_id?db.from('technicians').select('id,name,full_name,phone,email,active').eq('id',data.technician_id).maybeSingle():Promise.resolve({data:null})]);
    return NextResponse.json({booking:{...data,service_name:service?.name||'IT Service',service_slug:service?.slug||null,technicians:tech?{...tech,name:tech.name||tech.full_name||'Technician'}:null}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to update booking.'},{status:500});}
}

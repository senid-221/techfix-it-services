import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAdminSession } from '@/lib/admin-auth';

const transitions: Record<string,string[]> = { PENDING:['APPROVED','REJECTED'], APPROVED:['IN_PROGRESS'], IN_PROGRESS:['COMPLETED'] };

export async function GET(_request: Request, { params }: { params: Promise<{id:string}> }) {
  if (!(await isAdminSession())) return NextResponse.json({error:'Unauthorized'},{status:401});
  const { id } = await params;
  try {
    const db=getSupabaseAdmin();
    const { data, error }=await db.from('bookings').select('*,technicians(id,name,phone,email)').eq('id',id).maybeSingle();
    if(error)return NextResponse.json({error:error.message},{status:500});
    if(!data)return NextResponse.json({error:'Booking not found.'},{status:404});
    const { data:history }=await db.from('booking_status_history').select('id,from_status,to_status,note,changed_by,created_at').eq('booking_id',id).order('created_at',{ascending:true});
    return NextResponse.json({booking:data,history:history??[]});
  } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load booking.'},{status:500});}
}

export async function PATCH(request: Request,{params}:{params:Promise<{id:string}>}) {
  if(!(await isAdminSession()))return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;
  try{
    const body=await request.json(); const db=getSupabaseAdmin();
    const {data:current,error:ce}=await db.from('bookings').select('*').eq('id',id).single();
    if(ce)return NextResponse.json({error:'Booking not found.'},{status:404});

    if(body.technicianId !== undefined) {
      const technicianId=body.technicianId === null || body.technicianId === '' ? null : String(body.technicianId);
      if(technicianId){
        const {data:tech,error:te}=await db.from('technicians').select('id').eq('id',technicianId).eq('active',true).maybeSingle();
        if(te||!tech)return NextResponse.json({error:'Selected technician is unavailable.'},{status:400});
      }
      const {data,error}=await db.from('bookings').update({technician_id:technicianId,admin_note:typeof body.note==='string'?body.note.trim().slice(0,1000):current.admin_note}).eq('id',id).select('*,technicians(id,name,phone,email)').single();
      if(error)return NextResponse.json({error:error.message},{status:500});
      return NextResponse.json({booking:data});
    }

    const next=typeof body.status==='string'?body.status:'';
    if(!['APPROVED','REJECTED','IN_PROGRESS','COMPLETED'].includes(next))return NextResponse.json({error:'Invalid status.'},{status:400});
    if(!transitions[current.status]?.includes(next))return NextResponse.json({error:`Invalid transition from ${current.status} to ${next}.`},{status:409});
    const patch:Record<string,unknown>={status:next};
    if(next==='REJECTED')patch.rejection_reason=typeof body.note==='string'?body.note.trim().slice(0,1000):null;
    if(next==='IN_PROGRESS')patch.started_at=new Date().toISOString();
    if(next==='COMPLETED')patch.completed_at=new Date().toISOString();
    if(typeof body.note==='string' && next!=='REJECTED')patch.admin_note=body.note.trim().slice(0,1000);
    const {data,error}=await db.from('bookings').update(patch).eq('id',id).select('*,technicians(id,name,phone,email)').single();
    if(error){if(error.code==='23505')return NextResponse.json({error:'This booking slot conflicts with another active booking.'},{status:409});return NextResponse.json({error:error.message},{status:500});}
    return NextResponse.json({booking:data});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to update booking.'},{status:500});}
}

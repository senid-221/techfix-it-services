import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAdminSession } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await getSupabaseAdmin().from('technician_applications').select('id,full_name,phone,email,specialty,notes,payment_amount,payment_method,payment_code,payment_proof_path,status,rejection_reason,reviewed_by,reviewed_at,technician_id,created_at,initial_password_set').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const applications = await Promise.all((data || []).map(async a => {
    const signed = await getSupabaseAdmin().storage.from('technician-payment-proofs').createSignedUrl(a.payment_proof_path, 60 * 15);
    return { ...a, payment_proof_url: signed.data?.signedUrl || null };
  }));
  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const decision = body.decision === 'APPROVE' || body.decision === 'REJECT' ? body.decision : '';
    const initialPassword = typeof body.initialPassword === 'string' ? body.initialPassword : '';
    const rejectionReason = typeof body.rejectionReason === 'string' ? body.rejectionReason.trim().slice(0, 500) : '';
    if (!id || !decision) return NextResponse.json({ error: 'Application and decision are required.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: application, error: readError } = await admin.from('technician_applications').select('*').eq('id', id).single();
    if (readError || !application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    if (application.status !== 'PENDING') return NextResponse.json({ error: 'This application has already been reviewed.' }, { status: 409 });

    if (decision === 'REJECT') {
      const { data, error } = await admin.from('technician_applications').update({ status: 'REJECTED', rejection_reason: rejectionReason || 'Payment proof was not approved.', reviewed_by: process.env.TECHFIX_ADMIN_EMAIL || 'ADMIN', reviewed_at: new Date().toISOString() }).eq('id', id).select('id,status,rejection_reason').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ application: data });
    }

    if (initialPassword.length < 8) return NextResponse.json({ error: 'Mugihe wemeza, tanga password nibura inyuguti 8.' }, { status: 400 });
    const created = await admin.auth.admin.createUser({ email: application.email, password: initialPassword, email_confirm: true, user_metadata: { role: 'TECHNICIAN', full_name: application.full_name } });
    if (created.error || !created.data.user) return NextResponse.json({ error: created.error?.message || 'Unable to create technician login.' }, { status: 500 });

    const { data: tech, error: techError } = await admin.from('technicians').insert({ name: application.full_name, phone: application.phone, email: application.email, active: true, auth_user_id: created.data.user.id }).select('id,name,phone,email,active,auth_user_id').single();
    if (techError) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      return NextResponse.json({ error: techError.message }, { status: 500 });
    }

    const { data, error } = await admin.from('technician_applications').update({ status: 'APPROVED', technician_id: tech.id, initial_password_set: true, reviewed_by: process.env.TECHFIX_ADMIN_EMAIL || 'ADMIN', reviewed_at: new Date().toISOString() }).eq('id', id).select('id,status,technician_id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ application: data, technician: tech });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to review application.' }, { status: 500 });
  }
}

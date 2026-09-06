import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = 'technician-payment-proofs';
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const fullName = String(form.get('fullName') || '').trim().slice(0, 120);
    const phone = String(form.get('phone') || '').trim().slice(0, 40);
    const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 160);
    const specialty = String(form.get('specialty') || '').trim().slice(0, 160) || null;
    const notes = String(form.get('notes') || '').trim().slice(0, 1000) || null;
    const proof = form.get('paymentProof');

    if (!fullName || !phone || !email) return NextResponse.json({ error: 'Amazina, telefone na email birakenewe.' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Email ntabwo ari yo.' }, { status: 400 });
    if (!(proof instanceof File)) return NextResponse.json({ error: 'Shyiraho payment proof.' }, { status: 400 });
    if (proof.size <= 0 || proof.size > MAX_BYTES) return NextResponse.json({ error: 'Payment proof ntigomba kurenza 5MB.' }, { status: 400 });
    if (!ALLOWED.has(proof.type)) return NextResponse.json({ error: 'Payment proof yemerewe: JPG, PNG, WEBP cyangwa PDF.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const existing = await admin
      .from('technician_applications')
      .select('id,status')
      .ilike('email', email)
      .in('status', ['PENDING', 'APPROVED'])
      .maybeSingle();
    if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
    if (existing.data) {
      return NextResponse.json({
        error: existing.data.status === 'PENDING' ? 'Hari ubusabe bwawe bugitegereje kwemezwa.' : 'Iyi email isanzwe ifite technician account.'
      }, { status: 409 });
    }

    const ext = proof.type === 'application/pdf' ? 'pdf' : proof.type.split('/')[1];
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await proof.arrayBuffer());
    const upload = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: proof.type,
      upsert: false,
      cacheControl: '3600'
    });
    if (upload.error) return NextResponse.json({ error: `Payment proof upload failed: ${upload.error.message}` }, { status: 500 });

    const { data, error } = await admin.from('technician_applications').insert({
      full_name: fullName,
      phone,
      email,
      specialty,
      notes,
      payment_amount: 30000,
      payment_method: 'MoMo Pay',
      payment_code: '*182*8*1*935237#',
      payment_proof_path: path,
      status: 'PENDING'
    }).select('id').single();

    if (error) {
      await admin.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      applicationId: data.id,
      message: 'Ubusabe bwo kuba Technician bwoherejwe. Admin azabanza gusuzuma payment proof.'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to submit application.' }, { status: 500 });
  }
}

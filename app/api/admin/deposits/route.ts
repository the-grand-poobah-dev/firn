import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function getAdmin() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data } = await session.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  return data?.is_admin === true ? user : null;
}
export async function GET() {
  const actor = await getAdmin();
  if (!actor) return json({ error: 'Administrator access required.' }, 403);
  const admin = createAdminClient();
  const { data, error } = await admin.from('deposits').select('id,user_id,txid,claimed_amount,created_at,failure_reason,status,verified_amount')
    .in('status', ['needs_review','pending_verification']).order('created_at', { ascending: true }).limit(200);
  if (error) { console.error('Admin deposit list failed:', error.code); return json({ error: 'Could not load deposits.' }, 503); }
  const ids = [...new Set((data ?? []).map(row => row.user_id))];
  const { data: profiles } = ids.length ? await admin.from('profiles').select('id,full_name').in('id', ids) : { data: [] as Array<{ id: string; full_name: string | null }> };
  const names = new Map((profiles ?? []).map(p => [p.id, p.full_name]));
  return json({ deposits: (data ?? []).map(row => ({ ...row, user_label: names.get(row.user_id) ?? row.user_id })) });
}
export async function POST(request: Request) {
  const actor = await getAdmin();
  if (!actor) return json({ error: 'Administrator access required.' }, 403);
  let parsed: unknown;
  try { parsed = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!parsed || typeof parsed !== 'object') return json({ error: 'Invalid request body.' }, 400);
  const body = parsed as { depositId?: unknown; action?: unknown; amount?: unknown; reason?: unknown };
  const id = typeof body.depositId === 'string' ? body.depositId : '';
  const action = body.action;
  const amount = typeof body.amount === 'string' ? body.amount.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid deposit ID.' }, 400);
  const admin = createAdminClient();
  const { data: deposit } = await admin.from('deposits').select('id,status').eq('id', id).maybeSingle();
  if (!deposit || !['pending_verification','needs_review'].includes(deposit.status)) return json({ error: 'Deposit is no longer awaiting review.' }, 409);
  if (action === 'approve') {
    if (!/^(?:0|[1-9]\d{0,20})(?:\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) return json({ error: 'Enter a positive amount with at most six decimal places.' }, 400);
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin.from('deposits').update({
      status: 'confirmed', verified_amount: amount, reviewed_by: actor.id, reviewed_at: now,
      failure_reason: null, updated_at: now,
    }).eq('id', id).in('status', ['pending_verification','needs_review']).select('id').maybeSingle();
    if (updateError || !updated) return json({ error: 'Deposit changed concurrently; refresh before reviewing.' }, 409);
    const { error: auditError } = await admin.from('deposit_review_events').insert({ deposit_id: id, actor_id: actor.id, action: 'approved', approved_amount: amount });
    if (auditError) { console.error('Deposit approval audit write failed:', auditError.code); return json({ error: 'Approval saved but audit logging failed. Contact support before retrying.' }, 503); }
    const { error: creditError } = await admin.rpc('credit_deposit', { p_deposit_id: id });
    if (creditError) { console.error('Admin credit failed:', creditError.code); return json({ error: 'Approval recorded, but wallet credit did not complete. It is safe to retry credit after checking the deposit.' }, 503); }
    return json({ ok: true });
  }
  if (action === 'reject') {
    if (reason.length < 5 || reason.length > 500) return json({ error: 'Provide a rejection reason between 5 and 500 characters.' }, 400);
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin.from('deposits').update({
      status: 'rejected', rejection_reason: reason, failure_reason: reason,
      reviewed_by: actor.id, reviewed_at: now, updated_at: now,
    }).eq('id', id).in('status', ['pending_verification','needs_review']).select('id').maybeSingle();
    if (updateError || !updated) return json({ error: 'Deposit changed concurrently; refresh before reviewing.' }, 409);
    const { error: auditError } = await admin.from('deposit_review_events').insert({ deposit_id: id, actor_id: actor.id, action: 'rejected', reason });
    if (auditError) { console.error('Deposit rejection audit write failed:', auditError.code); return json({ error: 'Rejection saved but audit logging failed. Contact support.' }, 503); }
    return json({ ok: true });
  }
  return json({ error: 'Unsupported review action.' }, 400);
}

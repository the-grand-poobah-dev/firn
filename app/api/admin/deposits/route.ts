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
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid deposit ID.' }, 400);
  if (action !== 'approve' && action !== 'reject') return json({ error: 'Unsupported review action.' }, 400);
  if (action === 'approve') return json({ error: 'Manual approval is disabled. Only automated on-chain verification can credit a deposit.' }, 409);
  if (action === 'reject' && (reason.length < 5 || reason.length > 500)) {
    return json({ error: 'Provide a rejection reason between 5 and 500 characters.' }, 400);
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('review_deposit', {
    p_deposit_id: id,
    p_actor_id: actor.id,
    p_action: 'rejected',
    p_amount: null,
    p_reason: reason,
  });
  if (error) {
    console.error('Admin deposit review transaction failed:', error.code);
    return json({ error: 'The deposit could not be reviewed. Refresh and try again.' }, 409);
  }
  return json({ ok: true, ledgerId: data ?? null });
}

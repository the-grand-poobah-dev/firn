import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTronUsdtTransfer } from '@/lib/deposits/tron';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  let parsed: unknown;
  try { parsed = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!parsed || typeof parsed !== 'object') return json({ error: 'Invalid request body.' }, 400);
  const body = parsed as { depositId?: unknown };
  const id = typeof body.depositId === 'string' ? body.depositId : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Invalid deposit ID.' }, 400);
  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc('consume_deposit_rate_limit', { p_user_id: user.id });
  if (limitError) return json({ error: 'Recheck is temporarily unavailable.' }, 503);
  if (!allowed) return json({ error: 'Too many attempts. Try again later.' }, 429);
  const { data: deposit } = await session.from('deposits').select('id,txid,status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!deposit || !['pending_verification','needs_review'].includes(deposit.status)) return json({ error: 'This deposit is not eligible for rechecking.' }, 404);
  try {
    const result = await verifyTronUsdtTransfer(deposit.txid);
    if (result.state === 'verified') {
      const { error } = await admin.rpc('confirm_and_credit_deposit', {
        p_deposit_id: id,
        p_verified_amount: result.amount,
        p_from_address: result.fromAddress,
        p_to_address: result.toAddress,
        p_block_timestamp: result.blockTimestamp,
        p_confirmations: 1,
      });
      if (error) throw error;
      return json({ status: 'confirmed', message: 'Transaction verified and wallet credited.' });
    }
    if (result.state === 'rejected') {
      await admin.from('deposits').update({ status: 'rejected', failure_reason: result.reason, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
      return json({ status: 'rejected', message: result.reason });
    }
    await admin.from('deposits').update({ status: 'needs_review', failure_reason: result.reason, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
    return json({ status: 'needs_review', message: result.reason }, 202);
  } catch {
    console.error('User-requested deposit recheck failed; sensitive details withheld.');
    return json({ error: 'Automatic recheck is temporarily unavailable. The deposit remains in review.' }, 503);
  }
}

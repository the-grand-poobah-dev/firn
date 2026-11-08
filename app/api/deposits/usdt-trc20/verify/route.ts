import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTronUsdtTransfer } from '@/lib/deposits/tron';

export const dynamic = 'force-dynamic';
const TXID = /^[a-fA-F0-9]{64}$/;
const AMOUNT = /^(?:0|[1-9]\d{0,20})(?:\.\d{1,6})?$/;
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return response({ error: 'Authentication required.' }, 401);
  let body: any;
  try { body = await request.json(); } catch { return response({ error: 'Invalid JSON.' }, 400); }
  const txid = typeof body?.txid === 'string' ? body.txid.trim().toLowerCase() : '';
  const claimed = typeof body?.claimedAmount === 'string' ? body.claimedAmount.trim() : '';
  if (!TXID.test(txid) || !AMOUNT.test(claimed) || Number(claimed) <= 0) return response({ error: 'Provide a valid transaction ID and claimed amount.' }, 400);

  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc('consume_deposit_rate_limit', { p_user_id: user.id });
  if (limitError) { console.error('Deposit rate limit unavailable'); return response({ error: 'Deposit verification is temporarily unavailable.' }, 503); }
  if (!allowed) return response({ error: 'Too many verification attempts. Try again in an hour.' }, 429);

  const address = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return response({ error: 'Deposit receiving address is not configured.' }, 503);
  const { data: existing } = await admin.from('deposits').select('id').eq('txid', txid).maybeSingle();
  if (existing) return response({ error: 'This transaction ID has already been submitted.' }, 409);

  const { data: deposit, error: insertError } = await admin.from('deposits').insert({
    user_id: user.id, method: 'usdt_trc20', claimed_amount: claimed, txid,
    to_address: address, status: 'pending_verification',
  }).select('id').single();
  if (insertError || !deposit) {
    if (insertError?.code === '23505') return response({ error: 'This transaction ID has already been submitted.' }, 409);
    console.error('Deposit claim insert failed:', insertError?.code ?? 'unknown');
    return response({ error: 'Could not record the deposit claim.' }, 503);
  }

  try {
    const result = await verifyTronUsdtTransfer(txid);
    if (result.state === 'verified') {
      const { error } = await admin.from('deposits').update({
        status: 'confirmed', verified_amount: result.amount, from_address: result.fromAddress,
        to_address: result.toAddress, block_timestamp: result.blockTimestamp,
        confirmations: 1, failure_reason: null, updated_at: new Date().toISOString(),
      }).eq('id', deposit.id);
      if (error) throw error;
      const { error: creditError } = await admin.rpc('credit_deposit', { p_deposit_id: deposit.id });
      if (creditError) throw creditError;
      return response({ status: 'confirmed', message: 'Verified on the solidified TRON chain and credited.' }, 200);
    }
    const status = result.state === 'rejected' ? 'rejected' : 'needs_review';
    await admin.from('deposits').update({ status, failure_reason: result.reason, updated_at: new Date().toISOString() }).eq('id', deposit.id);
    return response({ status, message: result.reason }, 202);
  } catch (error) {
    console.error('TRON verification failed:', error instanceof Error ? error.message : 'unknown');
    await admin.from('deposits').update({ status: 'needs_review', failure_reason: 'Automated verification temporarily unavailable.', updated_at: new Date().toISOString() }).eq('id', deposit.id);
    return response({ status: 'needs_review', message: 'Saved for manual review because automatic verification is temporarily unavailable.' }, 202);
  }
}

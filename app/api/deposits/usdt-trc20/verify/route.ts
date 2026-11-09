import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDuplicateTxidError } from '@/lib/deposits/tron';

export const dynamic = 'force-dynamic';
const TXID = /^[a-fA-F0-9]{64}$/;
const AMOUNT = /^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/;
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Manual-review mode: claims are recorded only. No submitted TXID can trigger
// automatic verification or a wallet credit. An administrator checks TronScan
// and enters the actual received amount through the protected review endpoint.
export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return response({ error: 'Authentication required.' }, 401);

  let parsed: unknown;
  try { parsed = await request.json(); } catch { return response({ error: 'Invalid JSON.' }, 400); }
  if (!parsed || typeof parsed !== 'object') return response({ error: 'Invalid request body.' }, 400);
  const body = parsed as { txid?: unknown; claimedAmount?: unknown };
  const txid = typeof body.txid === 'string' ? body.txid.trim().toLowerCase() : '';
  const claimed = typeof body.claimedAmount === 'string' ? body.claimedAmount.trim() : '';
  const amount = Number(claimed);
  const configuredMinimum = Number(process.env.MIN_DEPOSIT_USDT ?? '10');
  const minimum = Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 10;
  if (!TXID.test(txid) || !AMOUNT.test(claimed) || !Number.isFinite(amount) || amount < minimum) {
    return response({ error: `Provide a valid transaction ID and an amount of at least ${minimum} USDT.` }, 400);
  }

  const address = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return response({ error: 'Deposit receiving address is not configured.' }, 503);

  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc('consume_deposit_rate_limit', { p_user_id: user.id });
  if (limitError) { console.error('Deposit claim rate limit unavailable'); return response({ error: 'Deposit submission is temporarily unavailable.' }, 503); }
  if (!allowed) return response({ error: 'Too many deposit submissions. Try again in an hour.' }, 429);

  const { data: existing } = await admin.from('deposits').select('id').eq('txid', txid).maybeSingle();
  if (existing) return response({ error: 'This transaction ID has already been submitted.' }, 409);

  const { error: insertError } = await admin.from('deposits').insert({
    user_id: user.id,
    method: 'usdt_trc20',
    claimed_amount: claimed,
    txid,
    to_address: address,
    status: 'pending_verification',
    failure_reason: 'Awaiting manual on-chain verification by FIRN administrator.',
  });
  if (insertError) {
    if (isDuplicateTxidError(insertError)) return response({ error: 'This transaction ID has already been submitted.' }, 409);
    console.error('Deposit claim insert failed:', insertError.code ?? 'unknown');
    return response({ error: 'Could not record the deposit claim.' }, 503);
  }

  return response({ status: 'pending_verification', message: 'Your transaction was submitted. FIRN will verify it manually before crediting your wallet.' }, 202);
}

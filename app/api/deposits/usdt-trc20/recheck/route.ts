import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTronUsdtTransfer } from '@/lib/deposits/tron';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request: Request) {
  if ((process.env.USDT_DEPOSITS_ENABLED ?? 'false').trim().toLowerCase() !== 'true') {
    return NextResponse.json({ error: 'USDT deposits are temporarily unavailable.' }, { status: 503 });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const { data: rows, error } = await admin.from('deposits')
    .select('id,txid,created_at').in('status', ['pending_verification','needs_review'])
    .lt('created_at', new Date(Date.now() - 60_000).toISOString())
    .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(5);
  if (error) return NextResponse.json({ error: 'Could not load pending deposits.' }, { status: 503 });
  let checked = 0;
  for (const row of rows ?? []) {
    try {
      const result = await verifyTronUsdtTransfer(row.txid);
      if (result.state === 'verified') {
        const { error: creditError } = await admin.rpc('confirm_and_credit_deposit', {
          p_deposit_id: row.id,
          p_verified_amount: result.amount,
          p_from_address: result.fromAddress,
          p_to_address: result.toAddress,
          p_block_timestamp: result.blockTimestamp,
          p_confirmations: 1,
        });
        if (creditError) console.error('Deposit credit retry failed:', creditError.code);
      } else if (result.state === 'rejected') {
        await admin.from('deposits').update({ status: 'rejected', failure_reason: result.reason, updated_at: new Date().toISOString() }).eq('id', row.id);
      } else {
        await admin.from('deposits').update({ failure_reason: result.reason, updated_at: new Date().toISOString() }).eq('id', row.id);
      }
    } catch { console.error('Scheduled deposit recheck failed; row retained for retry.'); }
    checked++;
  }
  await admin.from('deposits').update({ status: 'expired', failure_reason: 'Verification window expired; contact support for manual review.', updated_at: new Date().toISOString() })
    .in('status', ['pending_verification','needs_review']).lte('expires_at', new Date().toISOString());
  return NextResponse.json({ checked }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request) { return POST(request); }

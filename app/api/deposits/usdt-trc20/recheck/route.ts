import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTronUsdtTransfer } from '@/lib/deposits/tron';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const { data: rows, error } = await admin.from('deposits')
    .select('id,txid,created_at').in('status', ['pending_verification','needs_review'])
    .lt('created_at', new Date(Date.now() - 60_000).toISOString())
    .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: 'Could not load pending deposits.' }, { status: 503 });
  let checked = 0;
  for (const row of rows ?? []) {
    try {
      const result = await verifyTronUsdtTransfer(row.txid);
      if (result.state === 'verified') {
        const { error: updateError } = await admin.from('deposits').update({
          status: 'confirmed', verified_amount: result.amount, from_address: result.fromAddress,
          to_address: result.toAddress, block_timestamp: result.blockTimestamp, confirmations: 1,
          failure_reason: null, updated_at: new Date().toISOString(),
        }).eq('id', row.id).in('status', ['pending_verification','needs_review']);
        if (!updateError) {
          const { error: creditError } = await admin.rpc('credit_deposit', { p_deposit_id: row.id });
          if (creditError) console.error('Deposit credit retry failed:', creditError.code);
        }
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

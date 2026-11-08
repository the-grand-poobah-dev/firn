import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TXID_PATTERN = /^[a-fA-F0-9]{64}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return jsonError('Please sign in to view your deposits.', 401);

  const { data, error } = await supabase
    .from('deposits')
    .select('id,txid,claimed_amount,verified_amount,status,failure_reason,created_at,updated_at,credited_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Deposit status lookup failed:', error.message);
    return jsonError('Deposit status is temporarily unavailable. Please try again later.', 503);
  }

  return NextResponse.json({ deposits: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError('Please sign in before submitting a transaction.', 401);

  let body: { txid?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request body.', 400);
  }

  const txid = typeof body.txid === 'string' ? body.txid.trim() : '';
  const amount = typeof body.amount === 'string' ? body.amount.trim() : String(body.amount ?? '');
  if (!TXID_PATTERN.test(txid)) return jsonError('Transaction ID must be exactly 64 hexadecimal characters.', 400);
  if (!AMOUNT_PATTERN.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return jsonError('Enter a valid USDT amount with up to 8 decimal places.', 400);
  }

  const minimum = Number(process.env.MIN_DEPOSIT_USDT ?? '10');
  const minimumDeposit = Number.isFinite(minimum) && minimum > 0 ? minimum : 10;
  if (Number(amount) < minimumDeposit) return jsonError(`The minimum deposit is ${minimumDeposit} USDT.`, 400);

  const receivingAddress = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(receivingAddress)) {
    return jsonError('Deposits are not configured yet. Please contact support before sending funds.', 503);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError('Secure deposit submission is not configured yet. Please contact support.', 503);
  }

  // User identity is verified with their cookie session above. The service role is
  // used only on this server route because deposits intentionally have no client INSERT policy.
  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin
    .from('deposits')
    .insert({
      user_id: user.id,
      method: 'usdt_trc20',
      claimed_amount: amount,
      txid: txid.toLowerCase(),
      to_address: receivingAddress,
      status: 'pending_verification',
    })
    .select('id,txid,claimed_amount,status,created_at')
    .single();

  if (error) {
    if (error.code === '23505') return jsonError('This transaction ID has already been submitted.', 409);
    console.error('Deposit claim insert failed:', error.message);
    return jsonError('We could not save your transaction yet. Please try again later.', 503);
  }

  return NextResponse.json({ deposit: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TXID_PATTERN = /^[a-fA-F0-9]{64}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,21})(?:\.\d{1,8})?$/;

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


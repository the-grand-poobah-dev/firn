import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    console.error('Deposit status lookup failed:', error.code);
    return jsonError('Deposit status is temporarily unavailable. Please try again later.', 503);
  }
  return NextResponse.json({ deposits: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

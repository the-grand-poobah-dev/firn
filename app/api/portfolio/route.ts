import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPortfolio } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    const portfolio = await getPortfolio();
    return NextResponse.json(portfolio, { headers });
  } catch {
    return NextResponse.json({ error: 'Unable to load portfolio.' }, { status: 500, headers });
  }
}

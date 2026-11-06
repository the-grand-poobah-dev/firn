import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

function categoryFor(title: string, body: string | null): 'earnings' | 'properties' | 'account' {
  const text = (title + ' ' + (body ?? '')).toLowerCase();
  if (/profit|earning|interest|accru|return|credited|matur/.test(text)) return 'earnings';
  if (/property|tenant|occupan|rent|valuation|asset|building/.test(text)) return 'properties';
  return 'account';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const { data, error } = await supabase.from('notifications')
    .select('id, title, body, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500, headers });
  const notifications = (data ?? []).map(item => ({ ...item, category: categoryFor(item.title, item.body) }));
  return NextResponse.json({ notifications }, { headers });
}

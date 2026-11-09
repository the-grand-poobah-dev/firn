import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false);
  if (error) return NextResponse.json({ error: 'Unable to load unread notifications.' }, { status: 500 });
  return NextResponse.json({ unread: count ?? 0, userId: user.id }, { headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' } });
}

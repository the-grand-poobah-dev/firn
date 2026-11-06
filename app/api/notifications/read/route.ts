import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  const { data, error } = await supabase.from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
    .select('id');
  if (error) return NextResponse.json({ error: 'Unable to mark notifications as read.' }, { status: 500, headers });
  return NextResponse.json({ updated: data?.length ?? 0 }, { headers });
}

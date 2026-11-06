import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profilePatchSchema } from '@/lib/profile-validation';

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const parsed = profilePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile update.' }, { status: 400 });

  const patch = parsed.data;
  if (patch.prefs) {
    const { data: current, error } = await supabase.from('profiles').select('prefs').eq('id', user.id).maybeSingle();
    if (error || !current) return NextResponse.json({ error: error?.message ?? 'Profile not found.' }, { status: 404 });
    patch.prefs = { ...((current.prefs ?? {}) as Record<string, unknown>), ...patch.prefs } as typeof patch.prefs;
  }
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

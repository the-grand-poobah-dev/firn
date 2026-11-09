import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

async function getAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return null;
  const { data } = await session.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  return data?.is_admin === true ? user : null;
}

export async function GET() {
  const actor = await getAdmin();
  if (!actor) return json({ error: 'Administrator access required.' }, 403);
  const admin = createAdminClient();
  const { data, error } = await admin.from('profiles')
    .select('id,full_name,country,kyc_status,prefs,created_at')
    .eq('kyc_status', 'in_review')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    console.error('Admin KYC queue failed:', error.code);
    return json({ error: 'Could not load verification requests.' }, 503);
  }
  const applicants = await Promise.all((data ?? []).map(async row => {
    const prefs = (row.prefs ?? {}) as Record<string, unknown>;
    const path = typeof prefs.kyc_document_path === 'string' && prefs.kyc_document_path.startsWith(row.id + '/') ? prefs.kyc_document_path : null;
    const signed = path ? await admin.storage.from('kyc-documents').createSignedUrl(path, 600) : { data: null, error: new Error('No document') };
    return {
      id: row.id,
      full_name: row.full_name,
      country: row.country ?? (typeof prefs.kyc_country === 'string' ? prefs.kyc_country : null),
      phone: typeof prefs.kyc_phone === 'string' ? prefs.kyc_phone : null,
      city: typeof prefs.kyc_city === 'string' ? prefs.kyc_city : null,
      source_of_funds: typeof prefs.kyc_source_of_funds === 'string' ? prefs.kyc_source_of_funds : null,
      submitted_at: row.created_at,
      document_url: signed.data?.signedUrl ?? null,
      document_error: signed.error ? 'Document preview unavailable' : null,
    };
  }));
  return json({ applicants });
}

export async function POST(request: Request) {
  const actor = await getAdmin();
  if (!actor) return json({ error: 'Administrator access required.' }, 403);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request body.' }, 400);
  const input = body as { userId?: unknown; action?: unknown; reason?: unknown };
  const userId = typeof input.userId === 'string' ? input.userId : '';
  const action = input.action;
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: 'Invalid user ID.' }, 400);
  if (action !== 'approve' && action !== 'request_changes') return json({ error: 'Unsupported review action.' }, 400);
  if (action === 'request_changes' && (reason.length < 5 || reason.length > 500)) return json({ error: 'Explain what the applicant must correct (5–500 characters).' }, 400);

  const admin = createAdminClient();
  const { data: profile, error: readError } = await admin.from('profiles').select('prefs,kyc_status').eq('id', userId).maybeSingle();
  if (readError || !profile || profile.kyc_status !== 'in_review') return json({ error: 'This verification request is no longer awaiting review. Refresh the queue.' }, 409);
  const prefs = (profile.prefs ?? {}) as Record<string, unknown>;
  const documentPath = typeof prefs.kyc_document_path === 'string' ? prefs.kyc_document_path : '';
  if (!documentPath.startsWith(userId + '/') || typeof prefs.kyc_phone !== 'string' || typeof prefs.kyc_source_of_funds !== 'string') {
    return json({ error: 'The applicant record is incomplete. Request a corrected submission.' }, 409);
  }

  const nextPrefs: Record<string, unknown> = {
    ...prefs,
    kyc_reviewed_at: new Date().toISOString(),
    kyc_reviewed_by: actor.id,
    kyc_review_note: action === 'request_changes' ? reason : null,
  };
  if (action === 'request_changes') {
    nextPrefs.kyc_previous_document_path = documentPath;
    delete nextPrefs.kyc_document_path;
  }
  const { error } = await admin.from('profiles').update({
    kyc_status: action === 'approve' ? 'verified' : 'pending',
    prefs: nextPrefs as Json,
  }).eq('id', userId).eq('kyc_status', 'in_review');
  if (error) {
    console.error('Admin KYC decision failed:', error.code);
    return json({ error: 'Could not save the verification decision.' }, 503);
  }
  return json({ ok: true });
}

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

function validImageSignature(bytes: Uint8Array, mime: string) {
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
  if (mime === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (mime === 'image/avif') return String.fromCharCode(...bytes.slice(4, 12)).includes('ftypavif') || String.fromCharCode(...bytes.slice(4, 12)).includes('ftypavis');
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 }); }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 });
  if (!MIME_EXT[file.type] || file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WebP or AVIF image up to 10 MB.' }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validImageSignature(bytes, file.type)) return NextResponse.json({ error: 'The selected file is not a valid image.' }, { status: 400 });

  const path = `${user.id}/${randomUUID()}.${MIME_EXT[file.type]}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600', contentType: file.type, upsert: false,
  });
  if (uploadError) {
    console.error('Avatar upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Could not upload your profile picture. Please try again.' }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from('profiles').select('prefs').eq('id', user.id).maybeSingle();
  if (profileError || !profile) {
    await supabase.storage.from('avatars').remove([path]);
    return NextResponse.json({ error: 'Your profile could not be updated.' }, { status: 503 });
  }
  const prefs = (profile.prefs ?? {}) as Record<string, unknown>;
  const oldPath = typeof prefs.avatar_path === 'string' && prefs.avatar_path.startsWith(`${user.id}/`) ? prefs.avatar_path : null;
  const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await admin.from('profiles').update({ prefs: { ...prefs, avatar_url: publicUrl, avatar_path: path } }).eq('id', user.id);
  if (updateError) {
    await supabase.storage.from('avatars').remove([path]);
    return NextResponse.json({ error: 'Your profile picture was uploaded but could not be saved. Please try again.' }, { status: 503 });
  }
  if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
  return NextResponse.json({ avatarUrl: publicUrl });
}

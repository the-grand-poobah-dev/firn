import { createClient } from '@/lib/supabase/server';

export type FirnProfile = {
  id: string;
  full_name: string | null;
  country: string | null;
  currency: string;
  prefs: Record<string, unknown> | null;
  referral_code: string | null;
  kyc_status: string;
};

export async function getCurrentProfile(): Promise<FirnProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('id,full_name,country,currency,prefs,referral_code,kyc_status').eq('id', user.id).maybeSingle();
  return data as FirnProfile | null;
}

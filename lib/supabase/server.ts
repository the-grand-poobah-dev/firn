import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export async function createClient() {
  const store = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createServerClient<Database>(url, key, {
    cookies: {
      get(name: string) { return store.get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) {
        try { store.set({ name, value, ...options }); } catch { /* Server Components cannot write cookies. */ }
      },
      remove(name: string, options: CookieOptions) {
        try { store.set({ name, value: '', ...options }); } catch { /* Server Components cannot write cookies. */ }
      },
    },
  });
}

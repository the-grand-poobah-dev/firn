import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import Link from 'next/link';
import { AdminKycClient } from '@/components/admin/AdminKycClient';

export const dynamic = 'force-dynamic';

export default async function AdminKycPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (data?.is_admin !== true) redirect('/home');
  return <div className="space-y-5"><TopBar title="KYC review" /><Link href="/admin/deposits" className="inline-flex text-sm text-accent underline">Review deposits →</Link><AdminKycClient /></div>;
}

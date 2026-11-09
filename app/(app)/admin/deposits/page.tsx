import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import Link from 'next/link';
import { AdminDepositsClient } from '@/components/admin/AdminDepositsClient';

export const dynamic = 'force-dynamic';
export default async function AdminDepositsPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (data?.is_admin !== true) redirect('/home');
  return <div className="space-y-5"><TopBar title="Deposit review" /><Link href="/admin/kyc" className="inline-flex text-sm text-accent underline">Review identity checks →</Link><AdminDepositsClient /></div>;
}

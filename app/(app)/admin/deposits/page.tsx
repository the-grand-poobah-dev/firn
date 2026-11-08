import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import { AdminDepositsClient } from '@/components/admin/AdminDepositsClient';
import { getActiveDepositAddress } from '@/lib/deposits/config';

export const dynamic = 'force-dynamic';
export default async function AdminDepositsPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (data?.is_admin !== true) redirect('/home');
  const activeAddress = getActiveDepositAddress();
  return <div className="space-y-5"><TopBar title="Deposit review" /><AdminDepositsClient activeAddress={activeAddress} /></div>;
}

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import { UsdtReconciliationClient } from '@/components/admin/UsdtReconciliationClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsdtReconciliationPage() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (data?.is_admin !== true) redirect('/home');
  return <div className="space-y-5"><TopBar title="USDT reconciliation" /><UsdtReconciliationClient /></div>;
}

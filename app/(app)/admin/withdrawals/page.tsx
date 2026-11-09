import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/app/TopBar';
import { AdminWithdrawals } from '@/components/admin/AdminWithdrawals';
export const dynamic='force-dynamic';
export default async function AdminWithdrawalsPage(){const {supabase,user}=await requireUser();const {data}=await supabase.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(data?.is_admin!==true)redirect('/home');return <div className="space-y-5"><TopBar title="Withdrawal review"/><AdminWithdrawals/></div>}

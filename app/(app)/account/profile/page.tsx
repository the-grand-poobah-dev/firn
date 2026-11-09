import {requireUser} from '@/lib/auth';
import {TopBar} from '@/components/app/TopBar';
import {Card} from '@/components/ui/Card';
import {AccountProfileForm} from '@/components/account/AccountProfileForm';
export const dynamic='force-dynamic';
export default async function AccountProfilePage(){const{supabase,user}=await requireUser();const{data,error}=await supabase.from('profiles').select('full_name,prefs').eq('id',user.id).maybeSingle();if(error)throw error;return <div className="space-y-5"><TopBar title="Profile" backHref="/home"/><Card><div className="mb-5"><p className="text-sm font-semibold">Personal details</p><p className="mt-1 text-xs text-muted">Keep the name on your FIRN account up to date.</p></div><AccountProfileForm initialName={data?.full_name??(typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:'')} email={user.email??''} initialAvatarUrl={typeof (data?.prefs as Record<string,unknown>|null)?.avatar_url==='string'?(data?.prefs as Record<string,unknown>).avatar_url as string:null}/></Card></div>}

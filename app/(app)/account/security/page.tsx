import {requireUser} from '@/lib/auth';
import {TopBar} from '@/components/app/TopBar';
import {Card} from '@/components/ui/Card';
import {AppPinForm} from '@/components/account/AppPinForm';
export const dynamic='force-dynamic';
export default async function AccountSecurityPage(){await requireUser();return <div className="space-y-5"><TopBar title="App lock" backHref="/home"/><Card><div className="mb-5"><p className="text-sm font-semibold">App lock PIN</p><p className="mt-1 text-xs text-muted">Create a four-digit PIN, change an existing one, or turn the local app lock off.</p></div><AppPinForm/></Card></div>}

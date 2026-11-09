import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { NotificationsButton } from '@/components/home/NotificationsButton';
import {HomeAccountMenu} from '@/components/home/HomeAccountMenu';
export function HomeHeader({ name, unread, avatarUrl, userId }: { name: string; unread: boolean; avatarUrl:string|null; userId:string }) {
 return <header className="mb-5 flex items-center justify-between gap-2">
  <HomeAccountMenu name={name} avatarUrl={avatarUrl}/>
  <div className="flex shrink-0 items-center gap-2">
   <Link href="/home/search" aria-label="Search properties" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="search" size={18}/></Link>
   <Link href="/home/calculator" aria-label="Investment calculator" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="chart" size={18}/></Link>
   <NotificationsButton initialUnread={unread} userId={userId}/>
  </div>
 </header>;
}

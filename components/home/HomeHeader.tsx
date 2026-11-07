import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import {HomeAccountMenu} from '@/components/home/HomeAccountMenu';
export function HomeHeader({ name, unread }: { name: string; unread: boolean }) {
 return <header className="mb-5 flex items-center justify-between gap-2">
  <HomeAccountMenu name={name}/>
  <div className="flex shrink-0 items-center gap-2">
   <Link href="/home/search" aria-label="Search properties" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="search" size={18}/></Link>
   <Link href="/home/calculator" aria-label="Investment calculator" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="chart" size={18}/></Link>
   <Link href="/home/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="bell" size={19}/>{unread && <span className="absolute right-2 top-2 size-2 rounded-full bg-neg ring-2 ring-card"/>}</Link>
  </div>
 </header>;
}

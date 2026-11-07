import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function HomeHeader({ name, unread }: { name: string; unread: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'F';
  return <header className="mb-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-full bg-accent text-base font-semibold text-accent-on">{initial}</div>
      <div><p className="text-xs text-muted">Welcome back</p><p className="text-base font-semibold">{name || 'Investor'}</p></div>
    </div>
    <div className="flex items-center gap-2">
      <Link href="/home/search" aria-label="Search properties" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="search" size={18}/></Link>
      <Link href="/home/calculator" aria-label="Investment calculator" className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg"><Icon name="chart" size={18}/></Link>
      <Link href="/home/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-card text-fg">
        <Icon name="bell" size={19}/>{unread && <span className="absolute right-2 top-2 size-2 rounded-full bg-neg ring-2 ring-card"/>}
      </Link>
    </div>
  </header>;
}

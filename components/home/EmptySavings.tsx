import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

export function EmptyInvestments() {
  return <Card className="px-6 py-8 text-center">
    <div className="mx-auto grid size-14 place-items-center rounded-full bg-card2 text-accent"><Icon name="leaf" size={26}/></div>
    <h2 className="mt-4 text-lg font-semibold">Make your first investment</h2>
    <p className="mx-auto mt-2 max-w-[250px] text-sm leading-6 text-muted">Your investment journey starts with one small step. Choose a plan and put your capital to work.</p>
    <Link href="/save" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 font-semibold text-accent-on">Start investing</Link>
  </Card>;
}

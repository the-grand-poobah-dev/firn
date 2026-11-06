import Link from 'next/link';
import { PropertyArt } from '@/components/art/PropertyArt';
import { Progress } from '@/components/ui/Progress';
import { usd, pct } from '@/lib/format';
import { artKind, artSeed, type PropertyRecord } from '@/lib/property-utils';
export function PropertyCard({ property }: { property: PropertyRecord }) {
  const raised = property.target_raise > 0 ? property.raised / property.target_raise * 100 : 0;
  return <Link href={\`/properties/\${property.slug}\`} className="block w-[min(82vw,310px)] shrink-0 overflow-hidden rounded-[24px] border border-line bg-card transition-transform active:scale-[.985]">
    <div className="relative h-[174px] overflow-hidden"><PropertyArt kind={artKind(property.art)} seed={artSeed(property.slug)} /><span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">{property.country}</span><span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">{pct(property.target_return)}</span></div>
    <div className="space-y-3 p-4"><div><h3 className="truncate text-base font-semibold">{property.name}</h3><p className="mt-1 text-xs text-muted">{property.city} · {property.kind}</p></div><div className="flex items-end justify-between gap-3"><span className="text-[10px] uppercase tracking-wider text-muted">Target return</span><span className="text-sm font-semibold tabular">{pct(property.target_return)}</span></div><Progress value={raised} label={\`\${usd(property.raised)} raised of \${usd(property.target_raise)}\`} /></div>
  </Link>;
}

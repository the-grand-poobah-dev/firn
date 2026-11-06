import Link from 'next/link';
import type { Tables } from '@/lib/database.types';

export function PropertyTile({ property }: { property: Tables<'properties'> }) {
  const art: Record<string,string> = {
    tower: 'from-[#1f5062] via-[#174153] to-[#102433]', villa: 'from-[#806b50] via-[#5b503f] to-[#252f31]',
    marbella: 'from-[#b77d60] via-[#79584e] to-[#263b42]', office: 'from-[#536a78] via-[#344d5d] to-[#172d3b]',
    palm: 'from-[#4a887d] via-[#326a65] to-[#183b42]', lisbon: 'from-[#b17b4e] via-[#76543d] to-[#352d2a]',
    zurich: 'from-[#718b9c] via-[#3c6476] to-[#1c3744]'
  };
  return <Link href="/properties" className="group block min-w-0 overflow-hidden rounded-[20px] border border-line bg-card">
    <div className={'relative flex h-28 items-end overflow-hidden bg-gradient-to-br p-3 ' + (art[property.art] ?? 'from-card2 to-card')}>
      <div className="absolute -right-4 -top-7 size-28 rounded-full border border-white/15"/>
      <div className="absolute right-8 top-6 h-20 w-12 rounded-t-lg border border-white/15 bg-white/5"/>
      <div className="relative text-white"><p className="text-[10px] uppercase tracking-widest text-white/65">{property.country}</p><p className="mt-1 text-sm font-semibold">{property.name}</p></div>
    </div>
    <div className="flex items-center justify-between px-3 py-2.5 text-xs"><span className="text-muted">{property.city}</span><span className="font-semibold">{(Number(property.target_return) * 100).toFixed(1)}% target</span></div>
  </Link>;
}

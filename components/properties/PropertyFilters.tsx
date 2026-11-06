'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { Chip } from '@/components/ui/Chip';
import { pct } from '@/lib/format';
const countries = ['Dubai','Italy','Spain','Portugal','Swiss'];
const kinds = ['apartments','estate','hotel','lofts','offices','villas'];
const statuses = ['All','Funding','Fully funded'];
export function PropertyFilters() {
  const router = useRouter();
  const [country,setCountry] = useState('All');
  const [kind,setKind] = useState('All');
  const [status,setStatus] = useState('All');
  const [min,setMin] = useState(8);
  const [max,setMax] = useState(16);
  const apply = () => {
    const query = new URLSearchParams();
    if(country!=='All') query.set('country',country);
    if(kind!=='All') query.set('kind',kind);
    if(status!=='All') query.set('status',status==='Funding'?'funding':'full');
    if(min>8) query.set('minReturn',String(min));
    if(max<16) query.set('maxReturn',String(max));
    router.push('/properties'+(query.size?'?'+query.toString():''));
  };
  return <Sheet open onClose={()=>router.push('/properties')} title="Filter properties"><div className="space-y-5"><div><p className="mb-2 text-xs font-semibold text-muted">COUNTRY</p><div className="flex flex-wrap gap-2"><Chip active={country==='All'} onClick={()=>setCountry('All')}>All</Chip>{countries.map(value=><Chip key={value} active={country===value} onClick={()=>setCountry(value)}>{value}</Chip>)}</div></div><div><p className="mb-2 text-xs font-semibold text-muted">PROPERTY TYPE</p><div className="flex flex-wrap gap-2"><Chip active={kind==='All'} onClick={()=>setKind('All')}>All</Chip>{kinds.map(value=><Chip key={value} active={kind===value} onClick={()=>setKind(value)}>{value}</Chip>)}</div></div><div><div className="mb-2 flex justify-between text-xs font-semibold text-muted"><span>TARGET RETURN RANGE</span><span>{pct(min/100,0)} – {pct(max/100,0)}</span></div><input aria-label="Minimum target return" type="range" min="8" max="16" value={min} onChange={e=>setMin(Math.min(Number(e.target.value),max))} className="w-full accent-[var(--accent)]"/><input aria-label="Maximum target return" type="range" min="8" max="16" value={max} onChange={e=>setMax(Math.max(Number(e.target.value),min))} className="w-full accent-[var(--accent)]"/></div><div><p className="mb-2 text-xs font-semibold text-muted">FUNDING STATUS</p><div className="flex flex-wrap gap-2">{statuses.map(value=><Chip key={value} active={status===value} onClick={()=>setStatus(value)}>{value}</Chip>)}</div></div><button type="button" onClick={apply} className="min-h-12 w-full rounded-full bg-accent px-4 font-semibold text-accent-on">Apply filters</button></div></Sheet>;
}

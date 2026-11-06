'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Tables } from '@/lib/database.types';
import { Icon } from '@/components/ui/Icon';

const STORAGE_KEY = 'firn:recent-property-searches';
export function SearchProperties({ properties }: { properties: Tables<'properties'>[] }) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try { const value = localStorage.getItem(STORAGE_KEY); if (value) setRecent(JSON.parse(value) as string[]); } catch { /* storage may be unavailable */ }
  }, []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return properties.filter(p => [p.name,p.city,p.country,p.kind].some(v => v.toLowerCase().includes(q)));
  }, [properties, query]);
  function remember(value: string) {
    const next = [value, ...recent.filter(item => item !== value)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
  }
  return <div className="space-y-5">
    <label className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
      <Icon name="search" size={18}/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && query.trim()) remember(query.trim()); }} placeholder="Search properties, cities, countries…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted"/>
    </label>
    {!query && recent.length > 0 && <section><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Recent searches</h2><div className="flex flex-wrap gap-2">{recent.map(item => <button key={item} onClick={() => setQuery(item)} className="rounded-full bg-card2 px-3 py-2 text-xs">{item}</button>)}</div></section>}
    {query && <section className="space-y-2"><p className="text-xs text-muted">{results.length} result{results.length === 1 ? '' : 's'}</p>{results.map(property => <Link key={property.id} href="/properties" onClick={() => remember(query.trim())} className="flex items-center justify-between rounded-xl border border-line bg-card p-3"><div><p className="font-semibold">{property.name}</p><p className="mt-1 text-xs text-muted">{property.city}, {property.country}</p></div><span className="text-xs text-accent">{(Number(property.target_return) * 100).toFixed(1)}%</span></Link>)}{results.length === 0 && <p className="rounded-xl bg-card p-4 text-sm text-muted">No properties match that search.</p>}</section>}
  </div>;
}

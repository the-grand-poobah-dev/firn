'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

type Category = 'earnings' | 'properties' | 'deposits' | 'withdrawals' | 'admin' | 'account';
type Notice = { id: string; title: string; body: string | null; read: boolean | null; created_at: string | null; category: Category };
const filters = [{label:'All',value:'all'},{label:'Deposits',value:'deposits'},{label:'Withdrawals',value:'withdrawals'},{label:'Admin',value:'admin'},{label:'Earnings',value:'earnings'},{label:'Properties',value:'properties'},{label:'Account',value:'account'}] as const;

export function NotificationsList() {
  const [items,setItems] = useState<Notice[]>([]);
  const [filter,setFilter] = useState<(typeof filters)[number]['value']>('all');
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/notifications', { cache:'no-store' });
      if (!response.ok) throw new Error('Unable to load notifications.');
      const result = await response.json() as {notifications:Notice[]};
      setItems(result.notifications ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load notifications.'); }
    finally { setLoading(false); }
  },[]);
  useEffect(() => { void load(); },[load]);
  const visible = useMemo(() => filter === 'all' ? items : items.filter(item => item.category === filter),[items,filter]);
  async function markAllRead() {
    try {
      const response = await fetch('/api/notifications/read',{method:'POST'});
      if (!response.ok) throw new Error('Could not update notifications.');
      setItems(current => current.map(item => ({...item,read:true})));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update notifications.'); }
  }
  if (loading) return <div className="space-y-3">{[0,1,2,3].map(i=><div key={i} className="h-24 animate-pulse rounded-2xl bg-card2"/>)}</div>;
  if (error) return <Card className="space-y-3"><p className="text-sm text-neg">{error}</p><button onClick={() => void load()} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-on">Retry</button></Card>;
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">{filters.map(item=><button key={item.value} onClick={()=>setFilter(item.value)} className={'rounded-full px-3 py-2 text-xs font-semibold ' + (filter===item.value?'bg-accent text-accent-on':'bg-card2 text-muted')}>{item.label}</button>)}</div>
    {items.some(item=>!item.read) && <div className="flex justify-end"><button onClick={()=>void markAllRead()} className="text-xs font-semibold text-accent">Mark all read</button></div>}
    {visible.length ? <div className="space-y-2">{visible.map(item=><Card key={item.id} className="flex gap-3 py-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-card2 text-accent"><Icon name={item.category==='earnings'?'chart':item.category==='properties'?'building':'shield'} size={17}/></span>
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p>{!item.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent"/>}</div>{item.body && <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>}<p className="mt-2 text-[10px] text-muted">{item.created_at ? new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC' : 'Recently'}</p></div>
    </Card>)}</div> : <Card className="py-8 text-center"><p className="font-semibold">All caught up</p><p className="mt-1 text-xs text-muted">New account and portfolio updates will appear here.</p></Card>}
  </div>;
}

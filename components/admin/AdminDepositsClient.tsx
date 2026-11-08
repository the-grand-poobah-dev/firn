'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Deposit = { id: string; user_label: string; txid: string; claimed_amount: string; created_at: string; failure_reason: string | null; status: string };
type Props = { activeAddress: string | null };

export function AdminDepositsClient({ activeAddress }: Props) {
  const [rows, setRows] = useState<Deposit[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [reasons, setReasons] = useState<Record<string,string>>({});
  const load = useCallback(async () => {
    const r = await fetch('/api/admin/deposits', { cache: 'no-store' });
    const j = await r.json();
    if (!r.ok) { setError(j.error ?? 'Could not load deposits.'); return; }
    setRows(j.deposits ?? []); setError('');
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function reject(id: string) {
    setBusy(id); setError('');
    try {
      const r = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId: id, action: 'reject', reason: reasons[id] ?? '' }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? 'Review action failed.');
      else await load();
    } catch { setError('Network error. Refresh and check the deposit before retrying.'); }
    finally { setBusy(''); }
  }

  return <div className="space-y-4">
    <Card className="space-y-2">
      <p className="text-sm font-semibold">Active USDT receiving address</p>
      {activeAddress ? <>
        <code className="block break-all rounded-xl border border-line bg-card2 p-3 text-xs leading-5">{activeAddress}</code>
        <a className="text-sm text-accent underline" href={`https://tronscan.org/#/address/${activeAddress}`} target="_blank" rel="noreferrer">View this address on Tronscan</a>
      </> : <p className="text-sm text-neg">USDT deposits are temporarily unavailable. Check the server-side address and allowlist settings.</p>}
    </Card>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Pending verification and manual review</p><div className="flex items-center gap-2"><a className="text-sm text-accent underline" href="/admin/deposits/reconciliation">USDT reconciliation report</a><Button variant="ghost" onClick={() => void load()}>Refresh</Button></div></div>
    <p className="rounded-xl border border-line p-3 text-xs leading-5 text-muted">Manual approval and crediting are disabled. Deposits are credited only after automated on-chain verification against the address pinned to the deposit.</p>
    {error && <p role="alert" className="rounded-xl border border-neg/40 p-3 text-sm text-neg">{error}</p>}
    {!rows.length ? <Card><p className="text-sm text-muted">No deposits currently need review.</p></Card> : rows.map(row => <Card key={row.id} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{row.user_label}</strong><span className="rounded-full border border-line px-2 py-1 text-xs">{row.status}</span></div>
      <dl className="grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted">Claimed amount</dt><dd>{row.claimed_amount} USDT</dd></div><div><dt className="text-muted">Created</dt><dd>{new Date(row.created_at).toLocaleString()}</dd></div></dl>
      <div><p className="text-xs text-muted">TXID</p><code className="break-all text-xs">{row.txid}</code></div>
      <p className="text-xs text-muted">Failure reason: {row.failure_reason ?? 'None recorded'}</p>
      <label className="block text-xs font-semibold">Rejection reason
        <input value={reasons[row.id] ?? ''} onChange={e=>setReasons(v=>({...v,[row.id]:e.target.value}))} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-card2 px-3 text-sm" placeholder="Explain why this deposit is rejected" />
      </label>
      <Button variant="ghost" className="w-full" disabled={busy===row.id || (reasons[row.id] ?? '').trim().length<5} onClick={()=>void reject(row.id)}>{busy===row.id?'Processing…':'Reject deposit'}</Button>
    </Card>)}
  </div>;
}

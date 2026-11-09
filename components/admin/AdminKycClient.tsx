'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Applicant = {
  id: string;
  full_name: string | null;
  country: string | null;
  phone: string | null;
  city: string | null;
  source_of_funds: string | null;
  submitted_at: string;
  document_url: string | null;
  document_error: string | null;
};

export function AdminKycClient() {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/kyc', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load KYC requests.');
      setRows(data.applicants ?? []);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load KYC requests.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function decide(userId: string, action: 'approve' | 'request_changes') {
    setBusy(userId); setError('');
    try {
      const response = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason: reasons[userId] ?? '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the review.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the review.'); }
    finally { setBusy(''); }
  }
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">Review each submitted identity document and details before approving.</p><Button variant="ghost" onClick={() => void load()}>Refresh</Button></div>
    {error && <p role="alert" className="rounded-xl border border-neg/40 p-3 text-sm text-neg">{error}</p>}
    {!rows.length ? <Card><p className="text-sm text-muted">No identity checks are waiting for review.</p></Card> : rows.map(row => <Card key={row.id} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.full_name || 'FIRN member'}</strong><span className="text-xs text-muted">Submitted {new Date(row.submitted_at).toLocaleString()}</span></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted">User ID</dt><dd className="break-all">{row.id}</dd></div>
        <div><dt className="text-xs text-muted">Phone</dt><dd>{row.phone || 'Not supplied'}</dd></div>
        <div><dt className="text-xs text-muted">City / Country</dt><dd>{[row.city, row.country].filter(Boolean).join(', ') || 'Not supplied'}</dd></div>
        <div><dt className="text-xs text-muted">Source of funds</dt><dd>{row.source_of_funds || 'Not supplied'}</dd></div>
      </dl>
      {row.document_url ? <a href={row.document_url} target="_blank" rel="noreferrer" className="inline-block text-sm text-accent underline">Open private ID document (10-minute link)</a> : <p className="text-sm text-neg">{row.document_error || 'ID document unavailable'}</p>}
      <Button className="w-full" disabled={busy === row.id || !row.document_url} onClick={() => void decide(row.id, 'approve')}>{busy === row.id ? 'Saving…' : 'Approve identity'}</Button>
      <label className="block text-xs font-semibold">What must the applicant correct?
        <textarea value={reasons[row.id] ?? ''} onChange={e => setReasons(v => ({ ...v, [row.id]: e.target.value }))} maxLength={500} rows={2} className="mt-1 w-full rounded-xl border border-line bg-card2 p-3 text-sm" placeholder="Explain why the document or details need correction" />
      </label>
      <Button variant="ghost" className="w-full" disabled={busy === row.id || (reasons[row.id] ?? '').trim().length < 5} onClick={() => void decide(row.id, 'request_changes')}>Request changes</Button>
    </Card>)}
  </div>;
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Transfer = { txid: string; amount: string; fromAddresses: string[]; blockTimestamp: number | null; tronscanUrl: string };
type LedgerIssue = { ledgerId: string; depositId: string | null; txid: string | null; ledgerAmount: string; verifiedAmount: string | null; tronscanUrl: string | null; reason: string };
type Report = {
  generatedAt: string;
  currentAddress: string;
  contractAddress: string;
  chainTotal: string;
  confirmedDepositTotal: string;
  difference: string;
  chainTransferCount: number;
  confirmedDepositCount: number;
  unmatchedTransfers: Transfer[];
  unverifiableLedgerEntries: LedgerIssue[];
  ledgerRowsTotal: number;
  ledgerRowsChecked: number;
  historyComplete: boolean;
  depositRowsComplete: boolean;
  ledgerRowsComplete: boolean;
  historyPages: number;
  readOnly: boolean;
};
const money = (value: string) => `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`;
const shortDate = (value: number | null) => value ? new Date(value).toLocaleString() : 'Unknown';

export function UsdtReconciliationClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/deposits/reconciliation', { method: 'GET', cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not generate the reconciliation report.');
      setReport(payload as Report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not generate the reconciliation report.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const difference = report ? Number(report.difference) : 0;
  const mismatch = report && Math.abs(difference) > 0.0000001;
  const incomplete = report && (!report.historyComplete || !report.depositRowsComplete || !report.ledgerRowsComplete);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm text-muted">Read-only comparison of TronGrid and Supabase</p><p className="text-xs text-muted">No deposits, balances, or ledger entries are changed.</p></div>
      <Button onClick={() => void load()} disabled={loading}>{loading ? 'Checking…' : 'Refresh report'}</Button>
    </div>
    {error && <Card className="border border-neg/50"><p role="alert" className="text-sm text-neg">{error}</p><p className="mt-2 text-xs text-muted">If the recipient-pinning migration has not been applied to the database, this report cannot run yet.</p></Card>}
    {loading && !report && <Card><p className="text-sm text-muted">Loading confirmed TRC20 transfers and comparing records…</p></Card>}
    {report && <>
      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Active receiving address</strong><a className="text-sm text-accent underline" href={`https://tronscan.org/#/address/${report.currentAddress}`} target="_blank" rel="noreferrer">Open in Tronscan</a></div>
        <code className="block break-all rounded-xl border border-line bg-card2 p-3 text-xs">{report.currentAddress}</code>
        <p className="text-xs text-muted">Generated {new Date(report.generatedAt).toLocaleString()} · {report.historyPages} TronGrid page(s) · confirmed transfers only</p>
      </Card>
      {incomplete && <Card className="border border-neg/50"><p className="text-sm font-semibold text-neg">Report is incomplete</p><p className="mt-1 text-xs text-muted">A history, deposit, or ledger read reached its safety limit. Totals and issue lists are partial; do not treat this run as a clean reconciliation.</p></Card>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-muted">Confirmed USDT received</p><p className="mt-1 text-xl font-semibold tabular-nums">{money(report.chainTotal)}</p><p className="text-xs text-muted">{report.chainTransferCount} transfer events</p></Card>
        <Card><p className="text-xs text-muted">Confirmed deposits in Supabase</p><p className="mt-1 text-xl font-semibold tabular-nums">{money(report.confirmedDepositTotal)}</p><p className="text-xs text-muted">{report.confirmedDepositCount} deposit rows</p></Card>
        <Card className={mismatch ? 'border border-neg/60' : ''}><p className="text-xs text-muted">Difference (chain minus Supabase)</p><p className={`mt-1 text-xl font-semibold tabular-nums ${mismatch ? 'text-neg' : ''}`}>{money(report.difference)}</p><p className="text-xs text-muted">{mismatch ? 'Amounts do not reconcile' : 'Totals match'}</p></Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Unclaimed incoming transfers</strong><span className={report.unmatchedTransfers.length ? 'text-sm font-semibold text-neg' : 'text-sm text-muted'}>{report.unmatchedTransfers.length} unmatched TXID(s)</span></div>
        <p className="text-xs text-muted">Confirmed USDT transfers to the current receiving address with no deposit row anywhere in Supabase.</p>
        {!report.unmatchedTransfers.length ? <p className="text-sm text-muted">No unclaimed incoming transfers found in the retrieved history.</p> : report.unmatchedTransfers.map(row => <div key={row.txid} className="space-y-2 rounded-xl border border-neg/50 bg-neg/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-neg">{money(row.amount)} · {shortDate(row.blockTimestamp)}</span><a className="text-xs text-accent underline" href={row.tronscanUrl} target="_blank" rel="noreferrer">Tronscan</a></div>
          <code className="block break-all text-xs text-neg">{row.txid}</code>
          <p className="text-xs text-muted">From: {row.fromAddresses.join(', ') || 'Not supplied by TronGrid'}</p>
        </div>)}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">Ledger credits that failed re-verification</strong><span className={report.unverifiableLedgerEntries.length ? 'text-sm font-semibold text-neg' : 'text-sm text-muted'}>{report.unverifiableLedgerEntries.length} issue(s)</span></div>
        <p className="text-xs text-muted">Each USDT deposit ledger credit is checked against its stored TXID and pinned receiving address. Amount mismatches are also flagged.</p>
        <p className="text-xs text-muted">Checked {report.ledgerRowsChecked} of {report.ledgerRowsTotal} ledger credit(s).</p>
        {!report.unverifiableLedgerEntries.length ? <p className="text-sm text-muted">No problems found in the ledger entries checked.</p> : report.unverifiableLedgerEntries.map((row, index) => <div key={row.ledgerId} className="space-y-2 rounded-xl border border-neg/50 bg-neg/5 p-3">
          <p className="text-xs font-semibold text-neg">Issue {index + 1}: {row.reason}</p>
          {row.txid ? <><code className="block break-all text-xs text-neg">{row.txid}</code><a className="text-xs text-accent underline" href={row.tronscanUrl ?? '#'} target="_blank" rel="noreferrer">Open TXID in Tronscan</a></> : <p className="text-xs text-neg">No matching deposit TXID</p>}
          <p className="text-xs text-muted">Ledger amount: {money(row.ledgerAmount)} · Deposit verified amount: {row.verifiedAmount ? money(row.verifiedAmount) : 'Missing'}</p>
          <p className="text-xs text-muted">Ledger entry: {row.ledgerId}</p>
        </div>)}
      </Card>
      <p className="text-xs text-muted">This report is an operational cross-check, not an accounting statement. It uses confirmed TronGrid TRC20 history and reads Supabase only. Keep historical receiving addresses in ACCEPTED_DEPOSIT_ADDRESSES for re-verification of older credits.</p>
    </>}
  </div>;
}

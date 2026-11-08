'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/app/TopBar';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { formatCurrency } from '@/lib/fx';

type Tx = { id: string; kind: string; amount: number; method: string | null; created_at: string };

export default function TransactionsPage() {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState<Tx[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (next = false, nextCursor: string | null = null) => {
    setBusy(true);
    try {
      const params = new URLSearchParams({ filter });
      if (next && nextCursor) params.set('cursor', nextCursor);
      const response = await fetch('/api/wallet/transactions?' + params.toString());
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!next) setRows([]);
        setCursor(null);
        return;
      }
      const transactions: Tx[] = Array.isArray(data.transactions) ? data.transactions : [];
      setRows(current => next ? [...current, ...transactions] : transactions);
      setCursor(typeof data.nextCursor === 'string' ? data.nextCursor : null);
    } catch {
      if (!next) setRows([]);
      setCursor(null);
    } finally {
      setBusy(false);
    }
  }, [filter]);

  useEffect(() => {
    setCursor(null);
    void load(false);
  }, [load]);

  const groups = new Map<string, Tx[]>();
  for (const transaction of rows) {
    const day = new Date(transaction.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    groups.set(day, [...(groups.get(day) || []), transaction]);
  }

  return (
    <div className="space-y-5">
      <TopBar title="Transactions" backHref="/wallet" />
      <div className="flex flex-wrap gap-2">
        {([['all', 'All'], ['deposits', 'Deposits'], ['interest', 'Interest'], ['locks', 'Locks']] as const).map(([id, label]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
        ))}
      </div>
      {rows.length === 0 && !busy ? (
        <Card><p className="text-sm text-muted">No transactions yet.</p></Card>
      ) : Array.from(groups.entries()).map(([day, items]) => (
        <section key={day} className="space-y-2">
          <h2 className="text-xs font-semibold text-muted">{day}</h2>
          <Card className="divide-y divide-line p-0">
            {items.map(transaction => (
              <div key={transaction.id} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold capitalize">{transaction.kind}</span>
                  <span className="text-xs text-muted">{transaction.method || 'Firn wallet'}</span>
                </span>
                <strong className={transaction.amount < 0 ? 'text-neg' : 'text-pos'}>
                  {transaction.amount < 0 ? '−' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                </strong>
              </div>
            ))}
          </Card>
        </section>
      ))}
      {cursor && (
        <button disabled={busy} onClick={() => void load(true, cursor)} className="w-full rounded-full border border-line py-3 text-sm font-semibold">
          {busy ? 'Loading…' : 'Load more'}
        </button>
      )}
      <Link href="/wallet/statements" className="block text-center text-sm font-semibold text-accent">View statements</Link>
    </div>
  );
}

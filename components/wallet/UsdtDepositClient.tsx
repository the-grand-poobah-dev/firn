'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((module) => module.QRCodeSVG), { ssr: false });

type DepositStatus = 'awaiting_payment' | 'pending_verification' | 'confirmed' | 'needs_review' | 'rejected' | 'expired';
type DepositRow = {
  id: string;
  txid: string | null;
  claimed_amount: number | string;
  verified_amount: number | string | null;
  status: DepositStatus;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  credited_at: string | null;
};

type Props = {
  address: string | null;
  minimumDeposit: number;
  initialDeposits: DepositRow[];
  initialStatusError: string | null;
  returnTo: string;
};

const TXID_PATTERN = /^[a-fA-F0-9]{64}$/;

function statusText(status: DepositStatus) {
  const labels: Record<DepositStatus, string> = {
    awaiting_payment: 'Awaiting payment',
    pending_verification: 'Pending verification',
    confirmed: 'Confirmed',
    needs_review: 'Needs review',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return labels[status] ?? 'Pending verification';
}

function statusTone(status: DepositStatus) {
  if (status === 'confirmed') return 'border-pos/40 bg-pos/10 text-pos';
  if (status === 'rejected' || status === 'expired') return 'border-neg/40 bg-neg/10 text-neg';
  if (status === 'needs_review') return 'border-warm/40 bg-warm/10 text-warm';
  return 'border-line bg-card2 text-muted';
}

export function UsdtDepositClient({ address, minimumDeposit, initialDeposits, initialStatusError, returnTo }: Props) {
  const [copied, setCopied] = useState(false);
  const [txid, setTxid] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [deposits, setDeposits] = useState(initialDeposits);
  const [statusError, setStatusError] = useState(initialStatusError);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rechecking, setRechecking] = useState('');

  const refreshDeposits = useCallback(async () => {
    try {
      const response = await fetch('/api/deposits', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        setStatusError(payload.error || 'Deposit status is temporarily unavailable.');
        return;
      }
      setDeposits(payload.deposits ?? []);
      setStatusError(null);
      setLastUpdated(new Date());
    } catch {
      setStatusError('Could not refresh deposit status. Please try again.');
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => { void refreshDeposits(); }, 15000);
    return () => window.clearInterval(timer);
  }, [refreshDeposits]);

  async function recheckDeposit(depositId: string) {
    setRechecking(depositId);
    setFormMessage('');
    try {
      const response = await fetch('/api/deposits/usdt-trc20/recheck-own', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId }),
      });
      const payload = await response.json();
      setFormMessage(payload.message || payload.error || 'Deposit recheck finished.');
      await refreshDeposits();
    } catch {
      setFormMessage('Could not recheck this deposit. Please try again.');
    } finally { setRechecking(''); }
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setFormMessage('Copy was blocked by your browser. Please select and copy the address manually.');
    }
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage('');

    const normalizedTxid = txid.trim();
    if (!TXID_PATTERN.test(normalizedTxid)) {
      setFormMessage('Enter a valid transaction ID containing exactly 64 hexadecimal characters.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < minimumDeposit) {
      setFormMessage(`The minimum deposit is ${minimumDeposit} USDT.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/deposits/usdt-trc20/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid: normalizedTxid, claimedAmount: amount }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFormMessage(payload.error || 'We could not submit your transaction. Please try again.');
        return;
      }
      setTxid('');
      setAmount('');
      setFormMessage(payload.status === 'confirmed' ? 'Transfer verified and wallet credited.' : 'Transaction recorded for verification or manual review. Your wallet has not been credited yet.');
      await refreshDeposits();
    } catch {
      setFormMessage('Network error while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href={returnTo} className="inline-flex min-h-9 items-center gap-2 text-sm text-muted hover:text-fg"><Icon name="back" size={16}/> Back</Link>
      <header>
        <p className="label">FUND YOUR FIRN WALLET</p>
        <h1 className="mt-2 text-2xl font-semibold">Deposit USDT (TRC20)</h1>
        <p className="mt-2 text-sm text-muted">Send Tether using the TRON network only.</p>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-muted">Coin</p><p className="mt-1 text-sm font-semibold">USDT</p></div>
          <div><p className="text-xs text-muted">Network</p><p className="mt-1 text-sm font-semibold">TRON (TRC20)</p></div>
          <div className="col-span-2 border-t border-line pt-3"><p className="text-xs text-muted">Minimum deposit</p><p className="mt-1 text-lg font-semibold tabular-nums">{minimumDeposit} USDT</p></div>
        </div>
      </Card>

      {address ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">Your receiving address</p><p className="mt-1 text-xs text-muted">Only send USDT over TRON (TRC20).</p></div>
            <span className="rounded-full bg-pos/10 px-2 py-1 text-[10px] font-semibold text-pos">TRC20</span>
          </div>
          <div className="mt-3 flex items-stretch gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-card2 p-3 text-xs leading-5 text-fg">{address}</code>
            <Button type="button" variant="ghost" className="shrink-0 self-stretch px-3" onClick={copyAddress} aria-label="Copy receiving address">
              {copied ? <><Icon name="check" size={16}/> Copied</> : <><Icon name="doc" size={16}/> Copy</>}
            </Button>
          </div>
          <p className="mt-2 min-h-5 text-xs text-pos" role="status" aria-live="polite">{copied ? 'Address copied to clipboard.' : ''}</p>
          <div className="mt-3 flex justify-center rounded-2xl bg-white p-4">
            <QRCodeSVG value={address} size={196} level="M" includeMargin aria-label="QR code for the USDT TRC20 receiving address" />
          </div>
          <p className="mt-2 text-center text-xs text-muted">Scan this QR code from your sending wallet.</p>
        </Card>
      ) : (
        <Card className="border-neg/40">
          <div className="flex gap-2"><Icon name="warn" className="shrink-0 text-neg" size={18}/><div><p className="text-sm font-semibold">USDT deposits are not active yet</p><p className="mt-1 text-xs leading-5 text-muted">FIRN has a receiving wallet configured, but deposit processing is still locked while wallet ownership verification and database security checks are completed. Do not send funds or submit a transaction yet.</p></div></div>
        </Card>
      )}

      <Card className="border-neg/50 bg-neg/5">
        <div className="flex gap-2">
          <Icon name="warn" className="shrink-0 text-neg" size={20}/>
          <div>
            <p className="text-sm font-bold text-neg">Important network warning</p>
            <p className="mt-1 text-sm leading-6 text-fg">Send USDT on the TRON (TRC20) network ONLY. Sending any other coin or network may result in permanent loss of funds. Crypto transfers cannot be reversed.</p>
          </div>
        </div>
      </Card>

      {address && <Card>
        <h2 className="text-sm font-semibold">How to send your USDT</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Open Binance or another wallet and choose <strong className="text-fg">USDT</strong> and <strong className="text-fg">Withdraw / Send</strong>.</li>
          <li>Select <strong className="text-fg">TRON (TRC20)</strong> as the network.</li>
          <li>Paste or scan the Firn receiving address shown above.</li>
          <li>Enter an amount of at least {minimumDeposit} USDT and review the network and address carefully.</li>
          <li>Confirm the transfer. After it is broadcast, copy its transaction ID (TXID) from your wallet.</li>
        </ol>
        <p className="mt-3 rounded-xl bg-card2 p-3 text-xs leading-5 text-muted">If you send from one Binance account to another Binance account, Binance may process it as an internal transfer rather than an on-chain transaction. Such transfers may need manual review and can take longer to reconcile.</p>
      </Card>}

      {address && <Card>
        <div>
          <h2 className="text-sm font-semibold">I have sent my USDT</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Submit the on-chain transaction ID and amount you sent. This records your claim for verification; it does not itself confirm the transfer or credit your wallet.</p>
        </div>
        <form className="mt-4 space-y-3" onSubmit={submitClaim}>
          <label className="block text-xs font-semibold" htmlFor="deposit-txid">Transaction ID (TXID)</label>
          <input id="deposit-txid" value={txid} onChange={(event) => setTxid(event.target.value)} placeholder="64-character transaction hash" autoComplete="off" spellCheck={false} required pattern="[a-fA-F0-9]{64}" title="Enter exactly 64 hexadecimal characters." className="min-h-12 w-full rounded-xl border border-line bg-card2 px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"/>
          <label className="block text-xs font-semibold" htmlFor="deposit-amount">Amount sent (USDT)</label>
          <input id="deposit-amount" type="number" min={minimumDeposit} step="0.000001" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={String(minimumDeposit)} required className="min-h-12 w-full rounded-xl border border-line bg-card2 px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"/>
          <Button type="submit" className="w-full" disabled={!address || submitting}>{submitting ? 'Submitting…' : 'Submit transaction for verification'} <Icon name="arrow" size={16}/></Button>
          {formMessage && <p role="status" aria-live="polite" className="rounded-xl bg-card2 p-3 text-xs leading-5 text-muted">{formMessage}</p>}
        </form>
      </Card>}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold">Deposit status</h2><p className="mt-1 text-xs text-muted">Your latest submitted transactions.</p></div>
          <Button type="button" variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => void refreshDeposits()}><Icon name="clock" size={14}/> Refresh</Button>
        </div>
        {statusError ? <p role="status" className="mt-3 rounded-xl bg-warm/10 p-3 text-xs leading-5 text-muted">{statusError}</p> : deposits.length ? (
          <div className="mt-3 space-y-3">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums">{Number(deposit.claimed_amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} USDT</span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${statusTone(deposit.status)}`}>{statusText(deposit.status)}</span>
                </div>
                <p className="mt-2 break-all font-mono text-[10px] text-muted">{deposit.txid || 'Transaction ID not provided'}</p>
                <p className="mt-2 text-[10px] text-muted">Submitted {new Date(deposit.created_at).toLocaleString()}</p>
                {deposit.verified_amount !== null && <p className="mt-1 text-xs text-muted">Verified amount: {deposit.verified_amount} USDT</p>}
                {deposit.failure_reason && <p className="mt-2 text-xs text-neg">{deposit.failure_reason}</p>}
                {(deposit.status === 'pending_verification' || deposit.status === 'needs_review') && <Button type="button" variant="ghost" className="mt-2 min-h-9 px-3 text-xs" disabled={rechecking === deposit.id} onClick={() => void recheckDeposit(deposit.id)}>{rechecking === deposit.id ? 'Rechecking…' : 'Recheck transaction'}</Button>}
              </div>
            ))}
          </div>
        ) : <p className="mt-3 rounded-xl bg-card2 p-3 text-xs text-muted">No deposits submitted yet.</p>}
        {lastUpdated && <p className="mt-3 text-right text-[10px] text-muted">Updated {lastUpdated.toLocaleTimeString()}</p>}
      </Card>

      <p className="pb-2 text-center text-xs leading-5 text-muted">Deposits are credited after network confirmation and verification.</p>
    </div>
  );
}

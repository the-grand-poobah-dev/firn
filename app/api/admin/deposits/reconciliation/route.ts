import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decimalToUnits, isValidTronAddress, verifyTronUsdtTransfer } from '@/lib/deposits/tron';
import { getActiveDepositAddress } from '@/lib/deposits/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const DEFAULT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const PAGE_SIZE = 200;
const MAX_HISTORY_PAGES = 25;
const MAX_LEDGER_CHECKS = 40;
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

type TronTransfer = {
  transaction_id?: string;
  from?: string;
  to?: string;
  value?: string;
  block_timestamp?: number;
  event_index?: number;
  token_info?: { address?: string; decimals?: number; symbol?: string };
};
type DepositRow = {
  id: string;
  txid: string;
  status: string;
  verified_amount: string | number | null;
  receiving_address: string | null;
  from_address: string | null;
  to_address: string | null;
  block_timestamp: string | null;
  confirmations: number;
  credited_at: string | null;
};
type LedgerRow = {
  id: string;
  deposit_id: string | null;
  amount: string | number;
  created_at: string;
};

function unitsToDecimal(units: bigint, decimals = 6): string {
  const base = 10n ** BigInt(decimals);
  const whole = units / base;
  const fraction = (units % base).toString().padStart(decimals, '0');
  return decimals ? `${whole}.${fraction}` : whole.toString();
}
function safeUnits(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  return decimalToUnits(String(value));
}
function addUnits(a: bigint, b: bigint) { return a + b; }
async function loadConfirmedIncoming(address: string, contract: string, apiKey: string) {
  const rows: TronTransfer[] = [];
  let fingerprint: string | undefined;
  let pages = 0;
  do {
    const params = new URLSearchParams({
      only_confirmed: 'true',
      only_to: 'true',
      limit: String(PAGE_SIZE),
      contract_address: contract,
      order_by: 'block_timestamp,asc',
    });
    if (fingerprint) params.set('fingerprint', fingerprint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'TRON-PRO-API-KEY': apiKey },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`TronGrid returned HTTP ${response.status}`);
      const payload = await response.json() as { data?: TronTransfer[]; meta?: { fingerprint?: string } };
      const pageRows = Array.isArray(payload.data) ? payload.data : [];
      rows.push(...pageRows);
      fingerprint = payload.meta?.fingerprint || undefined;
      pages++;
      if (pageRows.length < PAGE_SIZE) fingerprint = undefined;
    } finally {
      clearTimeout(timeout);
    }
  } while (fingerprint && pages < MAX_HISTORY_PAGES);
  return { rows, complete: !fingerprint, pages };
}
async function readAllDepositTxids(admin: ReturnType<typeof createAdminClient>) {
  const txids = new Set<string>();
  const pageSize = 1000;
  for (let offset = 0; offset < 50000; offset += pageSize) {
    const { data, error } = await admin.from('deposits').select('txid').order('created_at', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw new Error('Could not read deposit TXIDs from Supabase.');
    for (const row of data ?? []) if (row.txid) txids.add(String(row.txid).toLowerCase());
    if (!data || data.length < pageSize) return { txids, complete: true };
  }
  return { txids, complete: false };
}
async function readConfirmedDepositsForAddress(admin: ReturnType<typeof createAdminClient>, address: string) {
  const rows: DepositRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 50000; offset += pageSize) {
    const { data, error } = await admin.from('deposits')
      .select('id,txid,status,verified_amount,receiving_address,from_address,to_address,block_timestamp,confirmations,credited_at')
      .eq('status', 'confirmed').eq('receiving_address', address)
      .order('created_at', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw new Error('Could not read confirmed deposits. Confirm the recipient-pinning migration has been applied.');
    rows.push(...(data ?? []) as DepositRow[]);
    if (!data || data.length < pageSize) return { rows, complete: true };
  }
  return { rows, complete: false };
}
async function readLedgerRows(admin: ReturnType<typeof createAdminClient>) {
  const rows: LedgerRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 10000; offset += pageSize) {
    const { data, error } = await admin.from('wallet_ledger')
      .select('id,deposit_id,amount,created_at')
      .eq('kind', 'deposit').eq('method', 'usdt_trc20').not('deposit_id', 'is', null)
      .order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw new Error('Could not read USDT deposit ledger entries.');
    rows.push(...(data ?? []) as LedgerRow[]);
    if (!data || data.length < pageSize) return { rows, complete: true };
  }
  return { rows, complete: false };
}
async function readDepositsByIds(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const map = new Map<string, DepositRow>();
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { data, error } = await admin.from('deposits')
      .select('id,txid,status,verified_amount,receiving_address,from_address,to_address,block_timestamp,confirmations,credited_at')
      .in('id', batch);
    if (error) throw new Error('Could not match ledger entries to their deposit rows.');
    for (const row of (data ?? []) as DepositRow[]) map.set(row.id, row);
  }
  return map;
}
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }));
  return output;
}

export async function GET() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return json({ error: 'Administrator access required.' }, 403);
  const { data: profile } = await session.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (profile?.is_admin !== true) return json({ error: 'Administrator access required.' }, 403);

  const address = getActiveDepositAddress();
  const apiKey = process.env.TRONGRID_API_KEY;
  const contract = process.env.USDT_TRC20_CONTRACT?.trim() || DEFAULT_CONTRACT;
  if (!address || !apiKey || !isValidTronAddress(contract)) {
    return json({ error: 'Reconciliation is unavailable. Check the active receiving address, allowlist, USDT contract, and TronGrid API key.' }, 503);
  }

  try {
    const admin = createAdminClient();
    const [chain, confirmedDeposits, ledger, allDepositTxids] = await Promise.all([
      loadConfirmedIncoming(address, contract, apiKey),
      readConfirmedDepositsForAddress(admin, address),
      readLedgerRows(admin),
      readAllDepositTxids(admin),
    ]);

    let chainTotal = 0n;
    const incomingByTxid = new Map<string, { txid: string; amountUnits: bigint; fromAddresses: Set<string>; blockTimestamp: number | null }>();
    for (const row of chain.rows) {
      const txid = String(row.transaction_id ?? '').toLowerCase();
      const to = String(row.to ?? '');
      const from = String(row.from ?? '');
      const decimals = Number(row.token_info?.decimals ?? 6);
      const value = String(row.value ?? '');
      if (!/^[a-f0-9]{64}$/.test(txid) || to !== address || !/^[0-9]+$/.test(value) || decimals !== 6) continue;
      const units = BigInt(value);
      chainTotal = addUnits(chainTotal, units);
      const current = incomingByTxid.get(txid) ?? { txid, amountUnits: 0n, fromAddresses: new Set<string>(), blockTimestamp: null };
      current.amountUnits += units;
      if (from) current.fromAddresses.add(from);
      if (Number.isFinite(Number(row.block_timestamp))) current.blockTimestamp = Number(row.block_timestamp);
      incomingByTxid.set(txid, current);
    }

    const confirmedTotal = confirmedDeposits.rows.reduce((sum, row) => sum + safeUnits(row.verified_amount), 0n);
    const unmatched = [...incomingByTxid.values()]
      .filter(row => !allDepositTxids.txids.has(row.txid))
      .map(row => ({
        txid: row.txid,
        amount: unitsToDecimal(row.amountUnits),
        fromAddresses: [...row.fromAddresses],
        blockTimestamp: row.blockTimestamp,
        tronscanUrl: `https://tronscan.org/#/transaction/${row.txid}`,
      }));

    const ledgerRows = ledger.rows;
    const depositsById = await readDepositsByIds(admin, [...new Set(ledgerRows.map(row => row.deposit_id).filter((id): id is string => Boolean(id)))]);
    const rowsToVerify = ledgerRows.slice(0, MAX_LEDGER_CHECKS);
    const unverifiable = await mapLimit(rowsToVerify, 5, async (ledgerRow) => {
      const deposit = ledgerRow.deposit_id ? depositsById.get(ledgerRow.deposit_id) : undefined;
      const base = {
        ledgerId: ledgerRow.id,
        depositId: ledgerRow.deposit_id,
        txid: deposit?.txid ?? null,
        ledgerAmount: String(ledgerRow.amount),
        verifiedAmount: deposit?.verified_amount === null || deposit?.verified_amount === undefined ? null : String(deposit.verified_amount),
        tronscanUrl: deposit?.txid ? `https://tronscan.org/#/transaction/${deposit.txid}` : null,
      };
      if (!deposit) return { ...base, reason: 'Wallet ledger entry has no matching deposit row.' };
      if (deposit.status !== 'confirmed' || !deposit.receiving_address) return { ...base, reason: 'Deposit row is not confirmed or has no pinned receiving address.' };
      try {
        const result = await verifyTronUsdtTransfer(deposit.txid, deposit.receiving_address);
        if (result.state !== 'verified') return { ...base, reason: result.reason };
        const ledgerUnits = safeUnits(ledgerRow.amount);
        const verifiedUnits = safeUnits(deposit.verified_amount);
        const chainUnits = safeUnits(result.amount);
        if (ledgerUnits !== verifiedUnits) return { ...base, reason: 'Ledger amount does not match the deposit verified_amount.' };
        if (chainUnits !== verifiedUnits) return { ...base, reason: 'On-chain verified amount does not match the deposit verified_amount.' };
        return null;
      } catch {
        return { ...base, reason: 'Could not re-verify this TXID with TronGrid or its pinned address is no longer allowlisted.' };
      }
    });
    const issues = unverifiable.filter((row): row is NonNullable<typeof row> => row !== null);

    return json({
      generatedAt: new Date().toISOString(),
      currentAddress: address,
      contractAddress: contract,
      chainTotal: unitsToDecimal(chainTotal),
      confirmedDepositTotal: unitsToDecimal(confirmedTotal),
      difference: unitsToDecimal(chainTotal - confirmedTotal),
      chainTransferCount: chain.rows.length,
      confirmedDepositCount: confirmedDeposits.rows.length,
      unmatchedTransfers: unmatched,
      unverifiableLedgerEntries: issues,
      ledgerRowsTotal: ledgerRows.length,
      ledgerRowsChecked: rowsToVerify.length,
      historyComplete: chain.complete,
      depositRowsComplete: confirmedDeposits.complete && allDepositTxids.complete,
      ledgerRowsComplete: ledger.complete && ledgerRows.length <= MAX_LEDGER_CHECKS,
      historyPages: chain.pages,
      readOnly: true,
    });
  } catch (error) {
    console.error('USDT reconciliation report failed:', error instanceof Error ? error.message : 'unknown');
    return json({ error: error instanceof Error ? error.message : 'Could not generate the reconciliation report.' }, 503);
  }
}

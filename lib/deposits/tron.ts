import 'server-only';
import { createHash } from 'node:crypto';

const TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const HEX64 = /^[a-fA-F0-9]{64}$/;
const DEFAULT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export type TronVerification =
  | { state: 'not_found' | 'unconfirmed'; reason: string }
  | { state: 'rejected'; reason: string }
  | { state: 'verified'; amount: string; fromAddress: string; toAddress: string; blockTimestamp: string; blockNumber: number };

export function decimalToUnits(value: string, decimals = 6): bigint {
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid decimal amount');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error('Too many decimal places');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0');
}
function unitsToDecimal(units: bigint): string {
  const base = 10n ** 6n;
  return `${units / base}.${(units % base).toString().padStart(6, '0')}`;
}
function checksum(payload: Buffer): Buffer {
  return createHash('sha256').update(createHash('sha256').update(payload).digest()).digest().subarray(0, 4);
}
function base58Decode(value: string): Buffer {
  let n = 0n;
  for (const char of value) {
    const digit = BASE58.indexOf(char);
    if (digit < 0) throw new Error('Invalid base58');
    n = n * 58n + BigInt(digit);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  let body = n === 0n ? Buffer.alloc(0) : Buffer.from(hex, 'hex');
  let zeros = 0;
  while (value[zeros] === '1') zeros++;
  body = Buffer.concat([Buffer.alloc(zeros), body]);
  if (body.length < 5) throw new Error('Invalid base58check');
  const payload = body.subarray(0, -4);
  if (!checksum(payload).equals(body.subarray(-4))) throw new Error('Invalid base58 checksum');
  return payload;
}
function base58Encode(payload: Buffer): string {
  const bytes = Buffer.concat([payload, checksum(payload)]);
  let n = BigInt('0x' + bytes.toString('hex'));
  let out = '';
  while (n > 0n) { const r = Number(n % 58n); out = BASE58[r] + out; n /= 58n; }
  for (const byte of bytes) { if (byte !== 0) break; out = '1' + out; }
  return out;
}
function addressToHex(address: string): string {
  return base58Decode(address).toString('hex').toLowerCase();
}
function addressFromTopic(topic: string): string | null {
  const clean = topic.replace(/^0x/i, '');
  if (!/^[a-fA-F0-9]{64}$/.test(clean)) return null;
  return base58Encode(Buffer.from('41' + clean.slice(-40), 'hex'));
}
function logAddressToHex(address: string): string {
  const clean = address.replace(/^0x/i, '').toLowerCase();
  return clean.length === 40 ? '41' + clean : clean;
}

export async function verifyTronUsdtTransfer(txid: string): Promise<TronVerification> {
  if (!HEX64.test(txid)) return { state: 'rejected', reason: 'Invalid transaction ID format.' };
  const apiKey = process.env.TRONGRID_API_KEY;
  const recipient = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  const contract = process.env.USDT_TRC20_CONTRACT?.trim() || DEFAULT_CONTRACT;
  if (!apiKey || !recipient || !contract) throw new Error('TRON verification is not configured');
  const recipientHex = addressToHex(recipient);
  const contractHex = addressToHex(contract);
  if (!/^41[0-9a-f]{40}$/.test(recipientHex) || !/^41[0-9a-f]{40}$/.test(contractHex)) throw new Error('Invalid configured TRON address');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const post = async (path: string) => {
      const response = await fetch('https://api.trongrid.io' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'TRON-PRO-API-KEY': apiKey },
        body: JSON.stringify({ value: txid.toLowerCase() }),
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`TronGrid HTTP ${response.status}`);
      return response.json() as Promise<Record<string, any>>;
    };
    const [body, receipt] = await Promise.all([
      post('/walletsolidity/gettransactionbyid'),
      post('/walletsolidity/gettransactioninfobyid'),
    ]);
    if (!body?.txID || String(body.txID).toLowerCase() !== txid.toLowerCase()) {
      return { state: 'not_found', reason: 'Transaction is not yet available in the solidified TRON chain.' };
    }
    if (!receipt?.id || String(receipt.id).toLowerCase() !== txid.toLowerCase()) {
      return { state: 'unconfirmed', reason: 'The solidified execution receipt is not yet available.' };
    }
    const result = String(receipt.receipt?.result ?? receipt.result ?? '').toUpperCase();
    if (result !== 'SUCCESS') {
      if (!result) return { state: 'unconfirmed', reason: 'The solidified execution receipt is incomplete.' };
      return { state: 'rejected', reason: 'The TRON transaction execution failed.' };
    }
    const logs = Array.isArray(receipt.log) ? receipt.log : [];
    const transfers = logs.filter((log: any) =>
      logAddressToHex(String(log.address ?? '')) === contractHex &&
      String(log.topics?.[0] ?? '').replace(/^0x/i, '').toLowerCase() === TRANSFER_TOPIC
    ).map((log: any) => {
      const fromAddress = addressFromTopic(String(log.topics?.[1] ?? ''));
      const toAddress = addressFromTopic(String(log.topics?.[2] ?? ''));
      const data = String(log.data ?? '').replace(/^0x/i, '');
      if (!fromAddress || !toAddress || !/^[a-fA-F0-9]{64}$/.test(data)) return null;
      return { fromAddress, toAddress, units: BigInt('0x' + data) };
    }).filter(Boolean) as { fromAddress: string; toAddress: string; units: bigint }[];
    if (!transfers.length) return { state: 'rejected', reason: 'No Transfer event from the official USDT TRON contract was found.' };
    const toWallet = transfers.filter(t => addressToHex(t.toAddress) === recipientHex);
    if (!toWallet.length) return { state: 'rejected', reason: 'The USDT transfer was not sent to the configured FIRN receiving address.' };
    const total = toWallet.reduce((sum, transfer) => sum + transfer.units, 0n);
    const minimum = decimalToUnits(process.env.MIN_DEPOSIT_USDT ?? '10');
    if (total < minimum) return { state: 'rejected', reason: 'The verified USDT transfer is below the minimum deposit.' };
    const timestamp = Number(receipt.blockTimeStamp);
    const blockNumber = Number(receipt.blockNumber);
    if (!Number.isFinite(timestamp) || timestamp <= 0 || !Number.isSafeInteger(blockNumber) || blockNumber <= 0) {
      return { state: 'unconfirmed', reason: 'The solidified receipt is missing valid block metadata.' };
    }
    return {
      state: 'verified',
      amount: unitsToDecimal(total),
      fromAddress: toWallet[0].fromAddress,
      toAddress: recipient,
      blockTimestamp: new Date(timestamp).toISOString(),
      blockNumber,
    };
  } finally {
    clearTimeout(timeout);
  }
}

import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { decimalToUnits, isDuplicateTxidError, isValidTronAddress, verifyTronUsdtTransfer } from '../lib/deposits/tron';
import { areUsdtDepositsEnabled, getActiveDepositAddress } from '../lib/deposits/config';

const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function testAddress(fill: number): string {
  const payload = Buffer.concat([Buffer.from([0x41]), Buffer.alloc(20, fill)]);
  const first = createHash('sha256').update(payload).digest();
  const checksum = createHash('sha256').update(first).digest().subarray(0, 4);
  const bytes = Buffer.concat([payload, checksum]);
  let n = BigInt('0x' + bytes.toString('hex'));
  let out = '';
  while (n > 0n) { const digit = Number(n % 58n); out = base58[digit] + out; n /= 58n; }
  for (const byte of bytes) { if (byte !== 0) break; out = '1' + out; }
  return out;
}
const recipient = testAddress(1);
const olderRecipient = testAddress(2);
const contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const txid = 'a'.repeat(64);

function b58decode(value: string): Buffer {
  let n=0n; for(const c of value)n=n*58n+BigInt(base58.indexOf(c));
  let h=n.toString(16); if(h.length%2)h='0'+h;
  let b=n===0n?Buffer.alloc(0):Buffer.from(h,'hex'); let z=0; while(value[z]==='1')z++;
  return Buffer.concat([Buffer.alloc(z),b]).subarray(0,-4);
}
function topic(address: string) { return b58decode(address).subarray(1).toString('hex').padStart(64,'0'); }
function log(contractAddress=contract, to=recipient, amount=25_000_000n) {
  const hex=b58decode(contractAddress).toString('hex');
  return { address:hex, topics:['ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',topic(recipient),topic(to)], data:amount.toString(16).padStart(64,'0') };
}
function mockChain(receipt: Record<string, unknown>, body: Record<string, unknown>={txID:txid}) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok:true, json:async()=>url.endsWith('gettransactionbyid')?body:receipt })));
}
function setVerificationEnv(allowlist = recipient) {
  vi.stubEnv('TRONGRID_API_KEY','test-key');
  vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);
  vi.stubEnv('ACCEPTED_DEPOSIT_ADDRESSES',allowlist);
  vi.stubEnv('USDT_TRC20_CONTRACT',contract);
  vi.stubEnv('MIN_DEPOSIT_USDT','10');
}
afterEach(()=>{ vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('USDT TRC20 verification',()=>{
  it('treats a database unique violation as a reused TXID',()=>{expect(isDuplicateTxidError({code:'23505'})).toBe(true);expect(isDuplicateTxidError({code:'22000'})).toBe(false);});
  it('converts six-decimal token values exactly',()=>{expect(decimalToUnits('10.000001')).toBe(10000001n);expect(decimalToUnits('10.1')).toBe(10100000n);});
  it('validates TRON Base58Check addresses, including checksum and payload',()=>{
    expect(isValidTronAddress(recipient)).toBe(true);
    expect(isValidTronAddress(recipient.slice(0,-1)+'1')).toBe(false);
    expect(isValidTronAddress('T123')).toBe(false);
  });
  it('rejects an invalid receiving-address environment value',()=>{
    vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS','T123');
    vi.stubEnv('ACCEPTED_DEPOSIT_ADDRESSES',recipient);
    expect(getActiveDepositAddress()).toBeNull();
  });
  it('allows only the active receiving address when the optional historical allowlist is unset',()=>{
    vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);
    vi.stubEnv('ACCEPTED_DEPOSIT_ADDRESSES','');
    expect(getActiveDepositAddress()).toBe(recipient);
  });
  it('rejects an invalid explicit address allowlist',()=>{
    vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);
    vi.stubEnv('ACCEPTED_DEPOSIT_ADDRESSES','not-a-tron-address');
    expect(getActiveDepositAddress()).toBeNull();
  });
  it('keeps deposits disabled until sender-wallet ownership proof is implemented',()=>{
    expect(areUsdtDepositsEnabled()).toBe(false);
    vi.stubEnv('USDT_DEPOSITS_ENABLED','true');
    expect(areUsdtDepositsEnabled()).toBe(false);
    vi.stubEnv('USDT_DEPOSITS_ENABLED','false');
    expect(areUsdtDepositsEnabled()).toBe(false);
  });
  it('accepts a successful solidified USDT transfer to its pinned recipient',async()=>{
    setVerificationEnv();
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log()]});
    const result=await verifyTronUsdtTransfer(txid,recipient);
    expect(result.state).toBe('verified');if(result.state==='verified')expect(result.amount).toBe('25.000000');
  });
  it('rejects a transfer sent to a non-allowlisted address',async()=>{
    setVerificationEnv(recipient);
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,olderRecipient)]});
    expect((await verifyTronUsdtTransfer(txid,recipient)).state).toBe('rejected');
  });
  it('accepts a transfer to an older address when that pinned address remains allowlisted',async()=>{
    setVerificationEnv([recipient,olderRecipient].join(','));
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,olderRecipient)]});
    const result=await verifyTronUsdtTransfer(txid,olderRecipient);
    expect(result.state).toBe('verified');
    if(result.state==='verified')expect(result.toAddress).toBe(olderRecipient);
  });
  it('fails closed if the configured USDT contract is not the official TRON contract',async()=>{
    setVerificationEnv();
    vi.stubEnv('USDT_TRC20_CONTRACT',olderRecipient);
    await expect(verifyTronUsdtTransfer(txid,recipient)).rejects.toThrow('official TRON USDT contract');
  });
  it('rejects a look-alike token contract',async()=>{
    setVerificationEnv();
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8')]});
    expect((await verifyTronUsdtTransfer(txid,recipient)).state).toBe('rejected');
  });
  it('rejects a transfer below the minimum',async()=>{
    setVerificationEnv();
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,recipient,9_999_999n)]});
    expect((await verifyTronUsdtTransfer(txid,recipient)).state).toBe('rejected');
  });
  it('can re-verify a historical on-chain transfer below the current minimum',async()=>{
    setVerificationEnv();
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,recipient,9_999_999n)]});
    const result=await verifyTronUsdtTransfer(txid,recipient,{enforceMinimum:false});
    expect(result.state).toBe('verified');
    if(result.state==='verified')expect(result.amount).toBe('9.999999');
  });
  it('keeps a transaction pending when it is not yet solidified',async()=>{
    setVerificationEnv();
    mockChain({}, {txID:txid});
    expect((await verifyTronUsdtTransfer(txid,recipient)).state).toBe('unconfirmed');
  });
});

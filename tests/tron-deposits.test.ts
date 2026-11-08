import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { decimalToUnits, verifyTronUsdtTransfer } from '@/lib/deposits/tron';

const recipient = 'TEFtmBSumTS3yRjestr3YjK6eMwoa5n4Ha';
const contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const txid = 'a'.repeat(64);
const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
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
function mockChain(receipt: any, body: any={txID:txid}) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok:true, json:async()=>url.endsWith('gettransactionbyid')?body:receipt })));
}
afterEach(()=>{ vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('USDT TRC20 verification',()=>{
  const env={TRONGRID_API_KEY:'test-key',DEPOSIT_USDT_TRC20_ADDRESS:recipient,USDT_TRC20_CONTRACT:contract,MIN_DEPOSIT_USDT:'10'};
  it('converts six-decimal token values exactly',()=>{expect(decimalToUnits('10.000001')).toBe(10000001n);expect(decimalToUnits('10.1')).toBe(10100000n);});
  it('accepts a successful solidified USDT transfer to FIRN',async()=>{
    vi.stubEnv('TRONGRID_API_KEY',env.TRONGRID_API_KEY);vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);vi.stubEnv('USDT_TRC20_CONTRACT',contract);vi.stubEnv('MIN_DEPOSIT_USDT','10');
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log()]});
    const result=await verifyTronUsdtTransfer(txid);expect(result.state).toBe('verified');if(result.state==='verified')expect(result.amount).toBe('25.000000');
  });
  it('rejects a look-alike token contract',async()=>{
    vi.stubEnv('TRONGRID_API_KEY','test-key');vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);vi.stubEnv('USDT_TRC20_CONTRACT',contract);vi.stubEnv('MIN_DEPOSIT_USDT','10');
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8')]});
    expect((await verifyTronUsdtTransfer(txid)).state).toBe('rejected');
  });
  it('rejects a transfer to a different recipient',async()=>{
    vi.stubEnv('TRONGRID_API_KEY','test-key');vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);vi.stubEnv('USDT_TRC20_CONTRACT',contract);vi.stubEnv('MIN_DEPOSIT_USDT','10');
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8')]});
    expect((await verifyTronUsdtTransfer(txid)).state).toBe('rejected');
  });
  it('rejects a transfer below the minimum',async()=>{
    vi.stubEnv('TRONGRID_API_KEY','test-key');vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);vi.stubEnv('USDT_TRC20_CONTRACT',contract);vi.stubEnv('MIN_DEPOSIT_USDT','10');
    mockChain({id:txid,blockNumber:123,blockTimeStamp:1700000000000,receipt:{result:'SUCCESS'},log:[log(contract,recipient,9_999_999n)]});
    expect((await verifyTronUsdtTransfer(txid)).state).toBe('rejected');
  });
  it('keeps a transaction pending when it is not yet solidified',async()=>{
    vi.stubEnv('TRONGRID_API_KEY','test-key');vi.stubEnv('DEPOSIT_USDT_TRC20_ADDRESS',recipient);vi.stubEnv('USDT_TRC20_CONTRACT',contract);vi.stubEnv('MIN_DEPOSIT_USDT','10');
    mockChain({}, {txID:txid});
    expect((await verifyTronUsdtTransfer(txid)).state).toBe('unconfirmed');
  });
});

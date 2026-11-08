import 'server-only';
import { isValidTronAddress } from '@/lib/deposits/tron';

export function areUsdtDepositsEnabled(): boolean {
  return (process.env.USDT_DEPOSITS_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
}

export function getAcceptedDepositAddresses(): string[] {
  return [...new Set((process.env.ACCEPTED_DEPOSIT_ADDRESSES ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean))];
}

export function getActiveDepositAddress(): string | null {
  const address = process.env.DEPOSIT_USDT_TRC20_ADDRESS?.trim() ?? '';
  if (!isValidTronAddress(address)) {
    console.error('USDT deposits unavailable: DEPOSIT_USDT_TRC20_ADDRESS is missing or is not a valid TRON Base58Check address.');
    return null;
  }
  const accepted = getAcceptedDepositAddresses();
  if (!accepted.every(isValidTronAddress) || !accepted.includes(address)) {
    console.error('USDT deposits unavailable: ACCEPTED_DEPOSIT_ADDRESSES is invalid or does not include the active receiving address.');
    return null;
  }
  return address;
}

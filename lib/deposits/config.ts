import 'server-only';
import { isValidTronAddress } from '@/lib/deposits/tron';

// Keep the payment rail closed until each claimant cryptographically proves control of the TRON sender wallet.
// Flip this constant only after the wallet-signature challenge flow and its database migration are deployed and tested.
const SENDER_WALLET_OWNERSHIP_PROOF_IMPLEMENTED = false;

export function areUsdtDepositsEnabled(): boolean {
  return SENDER_WALLET_OWNERSHIP_PROOF_IMPLEMENTED &&
    (process.env.USDT_DEPOSITS_ENABLED ?? 'false').trim().toLowerCase() === 'true';
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
  const configuredAllowlist = getAcceptedDepositAddresses();
  // An explicit allowlist is optional. When omitted, only the current configured
  // receiving address is accepted; historical addresses require explicit listing.
  if (configuredAllowlist.length && (
    !configuredAllowlist.every(isValidTronAddress) || !configuredAllowlist.includes(address)
  )) {
    console.error('USDT deposits unavailable: ACCEPTED_DEPOSIT_ADDRESSES is invalid or does not include the active receiving address.');
    return null;
  }
  return address;
}

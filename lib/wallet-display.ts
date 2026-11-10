/** User-facing labels for wallet ledger methods. Preserve raw ledger values for audit. */
export function formatWalletMethod(method: string | null | undefined): string {
  if (!method) return 'Firn wallet';
  if (method === 'admin_test_credit_julius_thandi_kes_50000') {
    return 'Administrative credit from Julius Thandi';
  }
  return method;
}

# FIRN USDT TRC20 deposits — manual review mode

FIRN accepts USDT on TRON (TRC20) through a shared receiving wallet. Every customer claim is reviewed by an authenticated FIRN administrator before the wallet is credited. The claim endpoint never verifies or credits a transaction automatically.

## Deposit rules

- Asset: official Tether USD (USDT) on TRON (TRC20) only.
- Conversion: `1 USDT = 1 USD`.
- Minimum: **500 USDT (USD 500)**. `MIN_DEPOSIT_USDT` is set to `500`, and both the customer submission API and admin approval API enforce a hard 500-USDT floor even if an environment variable is misconfigured.
- Display conversion: `1 USD = KSh 135`. KES is a display preference only; all account and ledger amounts remain denominated in USD.
- Other deposit methods remain Coming Soon until their real providers are integrated.

## Environment variables

The Vercel project must have these values for Production, Preview, and Development:

| Variable | Purpose |
| --- | --- |
| `DEPOSIT_USDT_TRC20_ADDRESS` | FIRN receiving TRON address |
| `TRONGRID_API_KEY` | Existing TronGrid API key; retained for future automatic verification |
| `USDT_TRC20_CONTRACT` | Official TRON USDT contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` |
| `MIN_DEPOSIT_USDT` | `500` |
| `USDT_DEPOSITS_ENABLED` | `false` in manual-review mode; automated processing stays disabled |

Never commit or share API keys in source code.

## Customer flow

1. The customer opens Wallet → Add money → USDT (TRC20).
2. FIRN displays the configured receiving wallet, QR code, TRC20-only instructions, and the 500-USDT minimum.
3. The customer sends at least 500 USDT on TRON, then submits the transaction ID and claimed amount.
4. FIRN records the claim as `pending_verification`. It does not credit the wallet.

## Administrator review

1. Open `/admin/deposits` while signed in as a FIRN administrator.
2. Open the TronScan link for the pending claim.
3. Confirm the transaction succeeded and is confirmed, the official USDT TRC20 token was transferred to the FIRN receiving wallet, and the transaction has not already been credited.
4. Enter the actual amount received (at least 500 USDT) and approve, or reject with a clear reason.
5. Approval goes through the existing protected, idempotent `review_deposit` / `credit_deposit` database path. Never approve from the claimed amount alone.

## Activation / database

The current production Supabase project already contains the deposit, review-event, rate-limit, wallet-ledger, and protected credit/review functions used by this manual flow. No second Supabase project or recipient-pinning migration is required. Automatic verification and cron crediting must remain disabled until sender-wallet ownership proof is implemented and tested.

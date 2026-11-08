# FIRN USDT TRC20 deposits — operator runbook

## Canonical deposit configuration

- Network: TRON / TRC20
- Asset: Tether USD (USDT)
- FIRN receiving wallet: supplied only through the server-side `DEPOSIT_USDT_TRC20_ADDRESS` environment variable.
- Official USDT TRON contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Minimum: `10` USDT by default (configure `MIN_DEPOSIT_USDT`)

The receiving address is read only from the server-side `DEPOSIT_USDT_TRC20_ADDRESS` variable. Do not hardcode it in client components or publish it as `NEXT_PUBLIC_`.

## Required server environment variables

| Variable | Purpose | Who supplies it |
|---|---|---|
| `DEPOSIT_USDT_TRC20_ADDRESS` | Current receiving wallet (valid TRON Base58Check address) | FIRN operator |
| `ACCEPTED_DEPOSIT_ADDRESSES` | Comma-separated allowlist containing the current wallet and any older wallets with pending deposits | FIRN operator |
| `USDT_DEPOSITS_ENABLED` | Deposit kill switch; `true` or unset enables deposits, `false` disables new submissions | FIRN operator |
| `USDT_TRC20_CONTRACT` | Official contract above | FIRN operator |
| `MIN_DEPOSIT_USDT` | Minimum verified amount, default 10 | FIRN operator |
| `TRONGRID_API_KEY` | Authenticated TronGrid reads | FIRN operator |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB writes and privileged RPC | Supabase project owner |
| `CRON_SECRET` | Bearer token protecting scheduled rechecks | Generate privately; never commit |

Never add service-role keys, TronGrid API keys, or cron secrets to Git, client-side variables, or chat.

## Database setup

Apply `supabase/migrations/20261108150000_secure_usdt_trc20_deposits_admin.sql` to the **development database first**. It adds:
- `profiles.is_admin`, with a trigger preventing self-promotion
- `deposits`, owner/admin read policies, unique TXIDs, and expiry metadata
- `wallet_ledger.deposit_id` unique linkage and six-decimal ledger precision
- `deposit_review_events` for reviewer audit history
- service-role-only rate limiting and idempotent `credit_deposit(uuid)`

Do not apply to production until development migration, security, CI, and end-to-end tests pass and the owner explicitly approves production migration.

After the migration, grant the intended admin manually in the Supabase SQL Editor:

```sql
update public.profiles
set is_admin = true
where id = '<YOUR_AUTH_USER_UUID>';
```

Get the UUID from Supabase Authentication → Users. Do not use an email string in the update. All other users remain `is_admin = false`.

## Runtime behavior

- `POST /api/deposits/usdt-trc20/verify`: authenticated claim submission, per-user rate limit, unique-TXID enforcement, immutable receiving-address snapshot, allowlist enforcement, solidified transaction body and receipt verification, official contract Transfer log decoding, recipient/minimum checks, and crediting the verified six-decimal amount only.
- `POST /api/deposits/usdt-trc20/recheck-own`: authenticated owner-only manual recheck for that user's pending deposit.
- `GET /api/deposits/usdt-trc20/recheck`: CRON_SECRET-protected scheduled retry and 72-hour expiry sweep.
- `/admin/deposits`: admin-only review queue and active receiving-address display with a Tronscan link. Administrators may reject with a reason; manual approval/crediting is disabled. Only automated on-chain verification can credit a deposit.
- `GET /api/deposits`: own-deposit status only.

Vercel Hobby supports daily cron schedules only. The configured cron is daily at 03:00 UTC; users can manually recheck pending claims in the app. If the Vercel plan is upgraded to Pro, a more frequent schedule can be selected after checking plan limits.

## Pre-launch verification checklist

1. Apply migration to development Supabase and verify RLS with normal-user and admin sessions.
2. Configure all required environment variables in Vercel Preview and Production (never expose secrets publicly). `ACCEPTED_DEPOSIT_ADDRESSES` must include `DEPOSIT_USDT_TRC20_ADDRESS` and every older pinned recipient that still needs rechecking.
3. Confirm the configured wallet address and contract match the operator's self-custody wallet and the official TRON USDT contract.
4. Run CI: lint, TypeScript, mocked TronGrid tests, and production build.
5. Test success, look-alike token, wrong recipient, underpayment, duplicate TXID, unconfirmed transaction, timeout, retry, admin approval, rejection, and double-credit attempts.
6. Verify exactly one wallet ledger row per deposit and that its amount equals `verified_amount`, not `claimed_amount`.
7. Only then request explicit approval to apply the migration to production and merge/deploy.

**Do not accept real deposits until all pre-launch checks pass.**

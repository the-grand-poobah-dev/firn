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
| `ACCEPTED_DEPOSIT_ADDRESSES` | Optional comma-separated allowlist for current and historical pinned wallets. If omitted, only the active receiving address is accepted for new claims; historical addresses require an explicit list. | FIRN operator |
| `USDT_DEPOSITS_ENABLED` | Fail-closed kill switch; only explicit `true` enables verification and rechecks | FIRN operator |
| `USDT_TRC20_CONTRACT` | Official contract above | FIRN operator |
| `MIN_DEPOSIT_USDT` | Minimum verified amount, default 10 | FIRN operator |
| `TRONGRID_API_KEY` | Authenticated TronGrid reads | FIRN operator |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB writes and privileged RPC | Supabase project owner |
| `CRON_SECRET` | Bearer token protecting scheduled rechecks | Generate privately; never commit |

Never add service-role keys, TronGrid API keys, or cron secrets to Git, client-side variables, or chat.

## Database setup

Apply these migrations in order to the **development database first**:
1. `supabase/migrations/20261108150000_secure_usdt_trc20_deposits_admin.sql` creates the deposit/admin foundation.
2. `supabase/migrations/20261108193000_pin_usdt_deposit_recipients.sql` pins the receiving address per deposit, enforces the pinned-recipient check before crediting, and disables manual admin crediting.
3. `supabase/migrations/20261108210000_revoke_demo_deposit_credit.sql` revokes client execution of the legacy `deposit_demo` wallet-credit RPC; removes broad browser table grants on deposits/ledger/review events; and limits profile updates to ordinary profile/preferences columns.

The first migration adds:
- `profiles.is_admin`, with a trigger preventing self-promotion
- `deposits`, owner/admin read policies, unique TXIDs, and expiry metadata
- `wallet_ledger.deposit_id` unique linkage and six-decimal ledger precision
- `deposit_review_events` for reviewer audit history
- service-role-only rate limiting and idempotent `credit_deposit(uuid)`

The third migration also prevents signed-in clients from changing `kyc_status`, `referral_code`, `is_admin`, or wallet/deposit records directly. The legacy `deposit_demo` RPC is removed from all API roles.

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
2. Configure `DEPOSIT_USDT_TRC20_ADDRESS`, `TRONGRID_API_KEY`, `USDT_TRC20_CONTRACT`, and `MIN_DEPOSIT_USDT` in Vercel Preview and Production (never expose secrets publicly). `ACCEPTED_DEPOSIT_ADDRESSES` is optional; if supplied, include the active wallet and every older pinned recipient that still needs rechecking.
3. Confirm the configured wallet address and contract match the operator's self-custody wallet and the official TRON USDT contract.
4. Keep `USDT_DEPOSITS_ENABLED=false` until the sender wallet is cryptographically bound to the signed-in FIRN user. The server rejects any configured USDT contract other than the official TRON USDT contract. A public TXID alone is not proof of who sent the funds.
5. Run CI: lint, TypeScript, mocked TronGrid tests, and production build.
6. Test success, look-alike token, wrong recipient, underpayment, duplicate TXID, unconfirmed transaction, timeout, retry, rejected manual approval, rejection, and double-credit attempts.
7. Verify exactly one wallet ledger row per deposit and that its amount equals `verified_amount`, not `claimed_amount`.
8. Only then request explicit approval to apply the migration to production and merge/deploy.

**Do not accept real deposits until all pre-launch checks pass.**


## Admin reconciliation report

- Admin page: `/admin/deposits/reconciliation` (linked from `/admin/deposits`).
- API: `GET /api/admin/deposits/reconciliation`; both the page and API enforce the server-side `profiles.is_admin` check.
- Reads confirmed incoming USDT TRC20 history from TronGrid using `only_confirmed=true`, `only_to=true`, the active receiving address, and the official USDT contract. It follows TronGrid pagination fingerprints.
- Compares the confirmed incoming total with `verified_amount` summed over confirmed Supabase deposits pinned to that same receiving address.
- Lists incoming TXIDs with no deposit row, TXID-level chain/Supabase amount differences, and deposit ledger credits whose TXID or amounts fail a fresh on-chain verification against the pinned receiving address.
- This endpoint is read-only: it uses Supabase SELECT queries and TronGrid read endpoints only. It does not call deposit credit, review, insert, update, or delete operations.
- Safety caps are reported explicitly as an incomplete report rather than a clean reconciliation: up to 25 TronGrid pages (200 events per page), 50,000 deposit rows, 10,000 ledger rows, and 40 ledger TXIDs re-verified per request. The admin page offers successive read-only batches until every returned ledger row has been checked.

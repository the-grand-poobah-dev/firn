# Manual RLS verification (two accounts)

Use two test accounts, User A and User B, in a non-production environment. Create one position per account through the authenticated `create_position` RPC; add fixture accrual, ledger and notification rows. Never use real customer records for this check.

1. Sign in as User A. Read `positions`, `accruals`, `wallet_ledger`, and `notifications`; record only User A-owned rows.
2. Sign in as User B. Confirm each table returns only User B-owned rows and none of User A's IDs.
3. Repeat as User A and confirm User B's IDs are not returned. Attempt to write another user's notification and confirm RLS rejects it.
4. Check `allocations` separately; its SELECT policy follows the owning position's `user_id`.

## SQL policy check performed

Queried `pg_policies` for all four tables. SELECT predicates: `user_id = auth.uid()` for positions, wallet_ledger, and notifications; accruals uses an EXISTS join to positions requiring `p.user_id = auth.uid()`. RLS is enabled on all 9 public tables. This confirms policy definitions; no live two-user fixture exists yet, so no cross-account data probe was possible.

Run under the SQL editor with authenticated role and account UUIDs substituted for `<user-a-uuid>` / `<user-b-uuid>`:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '<user-a-uuid>', true);
select count(*) from public.positions where user_id = '<user-b-uuid>';
select count(*) from public.wallet_ledger where user_id = '<user-b-uuid>';
select count(*) from public.notifications where user_id = '<user-b-uuid>';
select count(*) from public.accruals a join public.positions p on p.id=a.position_id where p.user_id = '<user-b-uuid>';
rollback;
```

Expected counts are zero. Repeat with A/B swapped.

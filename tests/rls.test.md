# Manual RLS verification (two accounts)

Use two test accounts, User A and User B, in a non-production environment. Create a position for each account through the authenticated `create_position` RPC, which will create corresponding allocation, accrual (after the daily job/test fixture), ledger and notification rows. Never use real customer records for this check.

1. Sign in as User A. Read `positions`, `accruals`, `wallet_ledger`, and `notifications`; record only User A-owned rows.
2. Sign in as User B. Confirm each of the same four queries returns only User B-owned rows and none of User A's IDs.
3. Repeat the queries as User A and ensure User B's IDs are not returned. Attempt an insert/update against another user's notifications and ensure RLS rejects it.
4. Test `allocations` separately: its SELECT policy follows the owning position's `user_id`.

## SQL policy check executed

The project was queried for `pg_policies` on all four tables. The active SELECT predicates are `user_id = auth.uid()` for positions, wallet_ledger, and notifications; accruals uses an EXISTS join to positions requiring `p.user_id = auth.uid()`. RLS is enabled on all 9 public tables. This schema/policy inspection is the SQL-equivalent isolation check; no live two-account fixture was created because the project has no user-owned test records yet.

For a session-level check, run under the Supabase SQL editor with authenticated role and each account's UUID substituted for `<user-a-uuid>` / `<user-b-uuid>`:

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

Expected results: all zero. Repeat with A/B swapped. For `accruals`, the policy filters via the parent position.

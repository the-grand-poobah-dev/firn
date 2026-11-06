# RLS verification (two-account fixture)

A temporary two-user fixture was created inside a transaction. User B was assigned to the authenticated database role and queried User A's rows. The transaction was rolled back, so no fixture accounts or rows remain.

Executed query shape (the test used generated UUIDs held in transaction-local settings):

```sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '<user-b-uuid>', true);

SELECT count(*) FROM public.positions
WHERE user_id = '<user-a-uuid>';

SELECT count(*) FROM public.accruals a
JOIN public.positions p ON p.id = a.position_id
WHERE p.user_id = '<user-a-uuid>';

SELECT count(*) FROM public.wallet_ledger
WHERE user_id = '<user-a-uuid>';

SELECT count(*) FROM public.notifications
WHERE user_id = '<user-a-uuid>';
ROLLBACK;
```

Observed results:

| Table | Rows visible to User B for User A |
| --- | ---: |
| positions | 0 |
| accruals | 0 |
| wallet_ledger | 0 |
| notifications | 0 |

The policy definitions were also inspected. RLS is enabled on all four tables. Positions and wallet ledger require `user_id = auth.uid()`; notifications uses the same ownership predicate for all operations; accruals requires an owning position whose `user_id = auth.uid()`.

This verifies row isolation for these four tables in the tested database role context. It does not replace a browser-level two-account acceptance test.

# FIRN release QA — chore/release

This is an evidence-based status report for the release branch. A database SQL test is not presented as an end-to-end browser test.

## Results

| Acceptance item | Status | Evidence / limitation |
| --- | --- | --- |
| Signed-out users cannot reach /home, /wallet, /savings, /analytics | PARTIAL | Middleware guards these routes and page components call `requireUser()`; no browser session test was available. |
| Sign up, verify, onboarding, home end-to-end | NOT RUN | Supabase Auth Site URL and redirect allowlist still require Dashboard configuration; email delivery and browser flow were not exercised. |
| Demo account shows 3 savings and matching numbers | BLOCKED | No persistent demo user exists in Supabase yet; the seeder requires a user-supplied Preview-only `DEMO_PASSWORD`. |
| Deposit $500, lock $500 in Six, 8 allocations sum to $500 | PARTIAL / FAIL | The authenticated database position RPC was tested with a temporary $500 ledger deposit: 8 allocation rows summed to exactly $500.00. The UI deposit page explicitly says payment providers are not connected, so a user-facing deposit was not possible. |
| Under-funded lock rejected clearly | PASS (database) | Authenticated RPC test rejected a $500 lock with `Insufficient wallet balance`. |
| Early exit blocked before day 90 | PASS (database) | Authenticated RPC test returned `Early exit opens after day 90` for a position created today. |
| RLS isolates positions, accruals, ledger, notifications | PASS (database) | Temporary two-user fixture returned 0 visible rows in all four tables; see `tests/rls.test.md`. |
| Interest accrual runs and is idempotent | PASS (database) | Active Supabase cron job 1: `0 0 * * *`, command `select public.accrue_daily()`. Run on 2026-11-06 00:00 UTC succeeded. A fresh test position produced 1 row after first run and still 1 after second run. |
| No console errors on 12 main routes | NOT RUN | No authenticated browser/Playwright session was available. |
| Lighthouse mobile 85+ performance, 95+ accessibility on /home and /properties | NOT RUN | No Lighthouse browser runner was available. |
| 375px, 430px, 1280px without horizontal scroll | NOT RUN | Root-level overflow clipping was added, but viewport testing was not run. |
| Dark/light themes readable with no flash | PARTIAL | Theme preference is applied in a pre-hydration head script; visual browser verification was not run. |
| Every screen shows SIMULATED; no guaranteed-return copy | PARTIAL | A persistent global SIMULATED marker was added. A complete rendered-screen and copy audit was not available. |
| No secrets in repository/history | NOT VERIFIED | `.env.example` contains blank placeholders and the admin client is marked `server-only`. Full historical secret scanning was not available through the connected GitHub API. |
| Service-role key absent from client bundle | PARTIAL | Source keeps the key in `lib/supabase/admin.ts` with `import 'server-only'`; a production bundle inspection could not be run. |

## Database checks

### Eight allocation check

A temporary authenticated user with a $500 ledger deposit created a Firn Six position. The test asserted:
- 8 allocation rows;
- allocation sum exactly 500.00;
- same idempotency key returned the same position;
- early exit was blocked before day 90;
- a second user with no deposit could not lock $500.

Observed output:

```text
allocation_count: 8
allocation_total: 500.00
idempotency: PASS
underfunded_rejection: PASS
early_exit_blocked_before_day_90: PASS
```

The fixture transaction was rolled back.

### Accrual idempotency

```text
first_run_rows: 1
second_run_rows: 1
idempotency: PASS
```

### RLS

See `tests/rls.test.md` for the actual cross-user query pattern and the four zero-row results.

## Release blockers

- Add the actual Supabase service-role key to Vercel Production and Preview as a sensitive server-only variable. The connected Supabase tools do not expose this secret.
- Set `DEMO_PASSWORD` in Preview only, then run `npm run seed:demo` from a trusted local environment.
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` to the support address you own.
- Apply Supabase Auth Site URL and redirect allowlist from `AUTH-SETUP.md`.
- Connect a payment provider before claiming that deposits work.
- Vercel's deployment API currently rejects additional deploys with the Hobby limit `api-deployments-free-per-day` (retry after the limit resets); no new Preview or Production deployment could be created during this QA pass.
- Full browser QA, Lighthouse, viewport checks, complete historical secret scanning, and client-bundle inspection remain outstanding.

Do not treat this branch as production-launch ready until these blockers are resolved and the remaining acceptance checks are run.

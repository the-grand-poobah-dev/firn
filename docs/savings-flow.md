# FIRN savings dashboard runbook

The savings dashboard in this branch adds authenticated position lists, position details, countdowns, maturity scenarios, maturity instructions, and an early-exit confirmation flow.

## Database dependency

Apply `supabase/migrations/0002_roll.sql` to a development Supabase project first. It adds maturity instructions and controlled renewal/withdrawal processing. Verify that ordinary users can update only their own active position's `auto_roll` field; they must not be able to change principal, APY, dates, status, or ownership.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Test day 89 versus day 90 early-exit boundaries, ownership checks, invalid maturity instructions, and repeat requests. Do not apply the migration to production until development verification succeeds and production migration is explicitly approved.

## Customer-facing limitations

Displayed APY values are targets, not guarantees. Early exit forfeits accrued interest and applies the configured fee. The API/database must remain the source of truth for eligibility, amounts, and status transitions.

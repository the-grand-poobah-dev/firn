-- FIRN demo data is created by scripts/seed-demo.ts using the Supabase service role.
-- Set DEMO_PASSWORD in the server/local environment before running:
--   npx --yes tsx scripts/seed-demo.ts
--
-- The script resets only demo@firn.example's profile-related rows, recreates three
-- positions and ten allocations per position, backfills completed days, and proves
-- same-day accrual idempotency by invoking accrue_daily() twice.
--
-- Read-only acceptance checks (run after the seeder):
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@firn.example'
),
demo_positions AS (
  SELECT p.* FROM public.positions p JOIN demo_user u ON u.id = p.user_id
)
SELECT count(*) AS accrual_count
FROM public.accruals a
WHERE a.position_id IN (SELECT id FROM demo_positions);

-- Actual value vs the same daily-compounding formula used by lib/finance.ts growth().
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@firn.example'
)
SELECT
  p.id,
  p.plan,
  p.principal,
  p.apy,
  p.started_on,
  p.matures_on,
  round(p.principal + coalesce(sum(a.amount), 0), 2) AS actual_value,
  round(p.principal * power(1 + p.apy, (current_date - p.started_on)::numeric / 365), 2) AS growth_value,
  round((p.principal + coalesce(sum(a.amount), 0))
    - p.principal * power(1 + p.apy, (current_date - p.started_on)::numeric / 365), 2) AS difference
FROM public.positions p
JOIN demo_user u ON u.id = p.user_id
LEFT JOIN public.accruals a ON a.position_id = p.id AND a.accrual_date <= current_date
GROUP BY p.id
ORDER BY p.started_on;

-- Total interest posted for the demo positions today (UTC).
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@firn.example'
),
demo_positions AS (
  SELECT p.id FROM public.positions p JOIN demo_user u ON u.id = p.user_id
)
SELECT coalesce(sum(a.amount), 0) AS total_earned_today
FROM public.accruals a
WHERE a.position_id IN (SELECT id FROM demo_positions)
  AND a.accrual_date = (now() AT TIME ZONE 'UTC')::date;

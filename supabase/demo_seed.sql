-- FIRN demo seed. Create demo@firn.example first with scripts/seed-demo.ts (service role).
-- This SQL file can then be run in the Supabase SQL editor as a database-owner operation.
-- It resets only that demo user's wallet, notifications, positions, allocations and accruals.
-- Wallet arithmetic: 18,740.50 deposits - 17,500.00 locked = 1,240.50 available.

SET request.jwt.claim.role = 'service_role';

DO $seed$
DECLARE
  v_user_id uuid;
  v_seed record;
  v_plan record;
  v_position_id uuid;
  v_property record;
  v_total_cents bigint;
  v_base_cents bigint;
  v_remainder bigint;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@firn.example';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Create demo@firn.example with scripts/seed-demo.ts before running this seed SQL.';
  END IF;

  DELETE FROM public.wallet_ledger WHERE user_id = v_user_id;
  DELETE FROM public.notifications WHERE user_id = v_user_id;
  DELETE FROM public.positions WHERE user_id = v_user_id;

  INSERT INTO public.profiles (id, full_name, country, kyc_status, risk_level)
  VALUES (v_user_id, 'Julius Thandi', 'Kenya', 'verified', 3)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    country = EXCLUDED.country,
    kyc_status = EXCLUDED.kyc_status,
    risk_level = EXCLUDED.risk_level;

  INSERT INTO public.wallet_ledger (user_id, kind, amount, method, created_at) VALUES
    (v_user_id, 'deposit', 5000.00, 'demo_seed', '2026-06-10T10:00:00Z'),
    (v_user_id, 'deposit', 6000.00, 'demo_seed', '2026-08-29T10:00:00Z'),
    (v_user_id, 'deposit', 7740.50, 'demo_seed', '2026-09-28T10:00:00Z');

  FOR v_seed IN
    SELECT * FROM (VALUES
      ('twelve'::public.plan_code, 10000.00::numeric, DATE '2026-06-12'),
      ('six'::public.plan_code, 5000.00::numeric, DATE '2026-09-03'),
      ('twelve'::public.plan_code, 2500.00::numeric, DATE '2026-10-01')
    ) AS seed(plan_code, principal, started_on)
  LOOP
    SELECT lock_months, target_apy INTO v_plan
    FROM public.plans WHERE code = v_seed.plan_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Missing plan %', v_seed.plan_code;
    END IF;

    INSERT INTO public.positions (
      user_id, plan, principal, apy, started_on, matures_on, status, auto_roll, settled
    ) VALUES (
      v_user_id,
      v_seed.plan_code,
      v_seed.principal,
      v_plan.target_apy,
      v_seed.started_on,
      (v_seed.started_on + make_interval(months => v_plan.lock_months))::date,
      'active',
      'ask',
      false
    )
    RETURNING id INTO v_position_id;

    v_total_cents := round(v_seed.principal * 100)::bigint;
    v_base_cents := v_total_cents / 10;
    v_remainder := mod(v_total_cents, 10);

    FOR v_property IN
      SELECT id, row_number() OVER (ORDER BY sort NULLS LAST, id) AS rn
      FROM public.properties
      WHERE is_active = true
      ORDER BY sort NULLS LAST, id
      LIMIT 10
    LOOP
      INSERT INTO public.allocations (position_id, property_id, amount)
      VALUES (
        v_position_id,
        v_property.id,
        (v_base_cents + CASE WHEN v_property.rn = 1 THEN v_remainder ELSE 0 END)::numeric / 100
      );
    END LOOP;

    INSERT INTO public.wallet_ledger (user_id, kind, amount, method, created_at)
    VALUES (
      v_user_id,
      'lock',
      -v_seed.principal,
      'position',
      (v_seed.started_on::timestamp AT TIME ZONE 'UTC') + interval '5 minutes'
    );

    PERFORM public.backfill_accruals(v_position_id);
  END LOOP;

  INSERT INTO public.notifications (user_id, title, body, read, created_at) VALUES
    (v_user_id, 'Daily interest added', 'Your Firn savings earned interest today.', false, '2026-11-06T00:05:00Z'),
    (v_user_id, 'Marina Crest occupancy report', 'The latest occupancy report for Marina Crest Tower is ready.', false, '2026-11-04T09:00:00Z'),
    (v_user_id, 'Maturity reminder', 'Your Firn Six position is approaching its maturity date.', false, '2026-11-03T09:00:00Z'),
    (v_user_id, 'October statement ready', 'Your October savings statement is ready to review.', false, '2026-11-01T08:00:00Z'),
    (v_user_id, 'New device sign-in', 'A new device signed in to your Firn account.', false, '2026-10-28T16:30:00Z'),
    (v_user_id, 'Villa Cipressi refurbished', 'Villa Cipressi has completed its refurbishment update.', false, '2026-10-24T11:00:00Z');
END;
$seed$;

RESET request.jwt.claim.role;

-- 1. Accrual row count for the demo positions.
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@firn.example'
),
demo_positions AS (
  SELECT p.* FROM public.positions p JOIN demo_user u ON u.id = p.user_id
)
SELECT count(*) AS accrual_count
FROM public.accruals a
WHERE a.position_id IN (SELECT id FROM demo_positions);

-- 2. Actual position values vs lib/finance.ts growth() for elapsed days.
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

-- 3. Total interest posted today (UTC).
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

-- Idempotency proof: accrue once, snapshot the count, then ensure a second run adds nothing.
SELECT public.accrue_daily();
DO $check$
DECLARE
  v_before bigint;
  v_after bigint;
BEGIN
  SELECT count(*) INTO v_before
  FROM public.accruals a
  JOIN public.positions p ON p.id = a.position_id
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = 'demo@firn.example';

  PERFORM public.accrue_daily();

  SELECT count(*) INTO v_after
  FROM public.accruals a
  JOIN public.positions p ON p.id = a.position_id
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = 'demo@firn.example';

  IF v_after <> v_before THEN
    RAISE EXCEPTION 'accrue_daily is not idempotent: count changed from % to %', v_before, v_after;
  END IF;
END;
$check$;

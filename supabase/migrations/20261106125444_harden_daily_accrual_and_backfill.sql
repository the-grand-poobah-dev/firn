-- Daily accruals are UTC-dated and protected by the accruals(position_id, accrual_date) primary key.
CREATE OR REPLACE FUNCTION public.accrue_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
BEGIN
  INSERT INTO public.accruals (position_id, accrual_date, amount, balance_after)
  SELECT
    p.id,
    v_today,
    b.balance * (power(1 + p.apy, 1.0 / 365) - 1),
    b.balance * power(1 + p.apy, 1.0 / 365)
  FROM public.positions p
  CROSS JOIN LATERAL (
    SELECT p.principal + COALESCE((
      SELECT sum(a.amount)
      FROM public.accruals a
      WHERE a.position_id = p.id
    ), 0) AS balance
  ) b
  WHERE p.status = 'active'
    AND p.started_on < v_today
    AND p.matures_on >= v_today
  ON CONFLICT (position_id, accrual_date) DO NOTHING;

  UPDATE public.positions
  SET status = 'matured'
  WHERE status = 'active' AND matures_on <= v_today;

  INSERT INTO public.wallet_ledger (user_id, kind, amount, method)
  SELECT
    p.user_id,
    'unlock',
    p.principal + COALESCE((
      SELECT sum(a.amount) FROM public.accruals a WHERE a.position_id = p.id
    ), 0),
    'maturity'
  FROM public.positions p
  WHERE p.status = 'matured' AND NOT p.settled;

  INSERT INTO public.notifications (user_id, title, body)
  SELECT user_id, 'Savings matured', 'Your principal and interest are back in your wallet.'
  FROM public.positions
  WHERE status = 'matured' AND NOT settled;

  UPDATE public.positions SET settled = true
  WHERE status = 'matured' AND NOT settled;
END;
$$;

-- Historical accrual backfill is callable only with a Supabase service-role JWT.
CREATE OR REPLACE FUNCTION public.backfill_accruals(p_position uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text := COALESCE(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '');
  v_principal numeric;
  v_apy numeric;
  v_started_on date;
  v_matures_on date;
  v_today date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
  v_date date;
  v_balance numeric;
  v_amount numeric;
  v_inserted integer := 0;
BEGIN
  IF v_role <> 'service_role' THEN
    RAISE EXCEPTION 'backfill_accruals is restricted to the service role'
      USING ERRCODE = '42501';
  END IF;

  SELECT principal, apy, started_on, matures_on
  INTO v_principal, v_apy, v_started_on, v_matures_on
  FROM public.positions
  WHERE id = p_position
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position % was not found', p_position
      USING ERRCODE = 'P0002';
  END IF;

  -- The opening date earns no interest; accrue each completed day after it.
  FOR v_date IN
    SELECT d::date
    FROM generate_series(
      v_started_on + 1,
      LEAST(v_today - 1, v_matures_on),
      interval '1 day'
    ) AS d
  LOOP
    SELECT v_principal + COALESCE(sum(a.amount), 0)
    INTO v_balance
    FROM public.accruals a
    WHERE a.position_id = p_position
      AND a.accrual_date < v_date;

    v_amount := v_balance * (power(1 + v_apy, 1.0 / 365) - 1);

    INSERT INTO public.accruals (position_id, accrual_date, amount, balance_after)
    VALUES (p_position, v_date, v_amount, v_balance + v_amount)
    ON CONFLICT (position_id, accrual_date) DO NOTHING;

    IF FOUND THEN
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_accruals(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_accruals(uuid) TO service_role;

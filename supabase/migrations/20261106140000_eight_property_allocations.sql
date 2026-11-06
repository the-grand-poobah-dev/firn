-- Keep the position's property allocation count consistent with the release acceptance test.
CREATE OR REPLACE FUNCTION public.create_position(p_plan public.plan_code, p_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_plan public.plans%rowtype;
  v_id uuid;
  v_property_ids uuid[];
  v_n integer;
  v_each numeric(14,2);
  v_remainder numeric(14,2);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Enter a valid savings amount';
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE code = p_plan;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected savings plan is unavailable';
  END IF;

  IF p_amount < v_plan.min_amount THEN
    RAISE EXCEPTION 'Minimum is %', v_plan.min_amount;
  END IF;

  IF public.wallet_balance() < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  SELECT array_agg(selected.id ORDER BY selected.id)
    INTO v_property_ids
    FROM (
      SELECT id FROM public.properties
      WHERE is_active = true
      ORDER BY random()
      LIMIT 8
    ) AS selected;

  v_n := coalesce(array_length(v_property_ids, 1), 0);
  IF v_n <> 8 THEN
    RAISE EXCEPTION 'At least eight active properties are required';
  END IF;

  INSERT INTO public.positions (
    user_id, plan, principal, apy, matures_on
  ) VALUES (
    auth.uid(), p_plan, p_amount, v_plan.target_apy,
    (current_date + make_interval(months => v_plan.lock_months))::date
  )
  RETURNING id INTO v_id;

  v_each := trunc(p_amount / v_n, 2);
  v_remainder := p_amount - (v_each * v_n);

  INSERT INTO public.allocations (position_id, property_id, amount)
  SELECT v_id, ranked.id,
    v_each + CASE WHEN ranked.row_num = 1 THEN v_remainder ELSE 0 END
  FROM (
    SELECT ids.id, row_number() OVER (ORDER BY ids.id) AS row_num
    FROM unnest(v_property_ids) AS ids(id)
  ) AS ranked;

  INSERT INTO public.wallet_ledger (user_id, kind, amount, method)
  VALUES (auth.uid(), 'lock', -p_amount, p_plan::text);

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_position(public.plan_code, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_position(public.plan_code, numeric) TO authenticated, service_role;

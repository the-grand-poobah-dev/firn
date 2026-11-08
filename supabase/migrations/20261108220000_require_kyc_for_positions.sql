-- Identity verification must be completed by an approved provider before a user
-- can lock funds into a savings position. Browser clients cannot set kyc_status.
create or replace function public.create_position(p_plan public.plan_code, p_amount numeric)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_plan public.plans%rowtype;
  v_id uuid;
  v_property_ids uuid[];
  v_n integer;
  v_each numeric(14,2);
  v_remainder numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and kyc_status = 'verified'
  ) then
    raise exception 'Identity verification is required before starting a savings plan';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter a valid investment amount';
  end if;

  select * into v_plan from public.plans where code = p_plan;
  if not found then
    raise exception 'The selected investment plan is unavailable';
  end if;

  if p_amount < v_plan.min_amount then
    raise exception 'Minimum is %', v_plan.min_amount;
  end if;

  if public.wallet_balance() < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  select array_agg(selected.id order by selected.id)
    into v_property_ids
    from (
      select id from public.properties
      where is_active = true
      order by random()
      limit 10
    ) as selected;

  v_n := coalesce(array_length(v_property_ids, 1), 0);
  if v_n <> 10 then
    raise exception 'At least ten active properties are required';
  end if;

  insert into public.positions (user_id, plan, principal, apy, matures_on)
  values (
    auth.uid(), p_plan, p_amount, v_plan.target_apy,
    (current_date + make_interval(months => v_plan.lock_months))::date
  )
  returning id into v_id;

  v_each := trunc(p_amount / v_n, 2);
  v_remainder := p_amount - (v_each * v_n);

  insert into public.allocations (position_id, property_id, amount)
  select v_id, ranked.id,
    v_each + case when ranked.row_num = 1 then v_remainder else 0 end
  from (
    select ids.id, row_number() over (order by ids.id) as row_num
    from unnest(v_property_ids) as ids(id)
  ) as ranked;

  insert into public.wallet_ledger (user_id, kind, amount, method)
  values (auth.uid(), 'lock', -p_amount, p_plan::text);

  return v_id;
end;
$function$;

revoke all on function public.create_position(public.plan_code, numeric) from public, anon;
grant execute on function public.create_position(public.plan_code, numeric) to authenticated;

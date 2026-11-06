-- Enforce the FIRN 90-day early-exit lock-in.
create or replace function public.early_exit(p_position uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_pos positions%rowtype;
  v_fee numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select *
    into v_pos
    from positions
   where id = p_position
     and user_id = auth.uid()
     and status = 'active'
   for update;

  if not found then
    raise exception 'Savings not found';
  end if;

  if current_date - v_pos.started_on < 90 then
    raise exception 'Early exit opens after day 90';
  end if;

  v_fee := round(v_pos.principal * 0.015, 2);
  update positions
     set status = 'closed_early', settled = true
   where id = p_position;

  insert into wallet_ledger(user_id, kind, amount, method)
  values
    (auth.uid(), 'unlock', v_pos.principal, 'early_exit'),
    (auth.uid(), 'fee', -v_fee, 'early_exit');

  return v_pos.principal - v_fee;
end;
$function$;

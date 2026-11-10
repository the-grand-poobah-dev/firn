-- Allow admin-reviewed USDT deposits from 10 USDT while preserving
-- the separate automated-deposit ownership-proof kill switch.
begin;

alter table public.deposits
  drop constraint if exists deposits_verified_amount_min_500;
alter table public.deposits
  add constraint deposits_verified_amount_min_10
  check (verified_amount is null or verified_amount >= 10);

create or replace function public.credit_deposit(p_deposit_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_deposit public.deposits%rowtype; v_ledger_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service role required'; end if;
  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if not found then raise exception 'Deposit not found'; end if;
  if v_deposit.status <> 'confirmed' or v_deposit.verified_amount is null or v_deposit.verified_amount < 10 then
    raise exception 'Only manually verified confirmed deposits of at least 10 USDT can be credited';
  end if;
  insert into public.wallet_ledger(user_id, kind, amount, method, deposit_id)
    values(v_deposit.user_id, 'deposit', v_deposit.verified_amount, 'usdt_trc20', v_deposit.id)
    on conflict (deposit_id) do nothing returning id into v_ledger_id;
  if v_ledger_id is null then
    select id into v_ledger_id from public.wallet_ledger where deposit_id = v_deposit.id;
  end if;
  update public.deposits set credited_at = coalesce(credited_at, now()), updated_at = now() where id = v_deposit.id;
  return v_ledger_id;
end;
$$;
revoke all on function public.credit_deposit(uuid) from public, anon, authenticated;
grant execute on function public.credit_deposit(uuid) to service_role;

create or replace function public.confirm_and_credit_deposit(
  p_deposit_id uuid, p_verified_amount numeric, p_from_address text, p_to_address text,
  p_block_timestamp timestamptz, p_confirmations integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_deposit public.deposits%rowtype; v_ledger_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service role required'; end if;
  if p_verified_amount is null or p_verified_amount < 10 or p_confirmations < 1 then
    raise exception 'Verified deposit must be at least 10 USDT with a confirmed transaction';
  end if;
  select * into v_deposit from public.deposits where id=p_deposit_id for update;
  if not found or v_deposit.status not in ('pending_verification','needs_review','confirmed') then
    raise exception 'Deposit is not eligible for confirmation';
  end if;
  if v_deposit.status='confirmed' and v_deposit.verified_amount is distinct from p_verified_amount then
    raise exception 'Confirmed deposit amount cannot be changed';
  end if;
  update public.deposits set status='confirmed', verified_amount=p_verified_amount,
    from_address=p_from_address, to_address=p_to_address, block_timestamp=p_block_timestamp,
    confirmations=p_confirmations, failure_reason=null, updated_at=now()
    where id=p_deposit_id;
  v_ledger_id := public.credit_deposit(p_deposit_id);
  return v_ledger_id;
end;
$$;
revoke all on function public.confirm_and_credit_deposit(uuid,numeric,text,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.confirm_and_credit_deposit(uuid,numeric,text,text,timestamptz,integer) to service_role;

create or replace function public.review_deposit(
  p_deposit_id uuid, p_actor_id uuid, p_action text,
  p_amount numeric default null, p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_deposit public.deposits%rowtype; v_ledger_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service role required'; end if;
  if not exists (select 1 from public.profiles where id = p_actor_id and is_admin = true) then
    raise exception 'administrator required';
  end if;
  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if not found or v_deposit.status not in ('pending_verification','needs_review') then
    raise exception 'Deposit is no longer awaiting review';
  end if;
  if p_action = 'approved' then
    if p_amount is null or p_amount < 10 then raise exception 'Approved deposit amount must be at least 10 USDT'; end if;
    update public.deposits set status='confirmed', verified_amount=p_amount,
      reviewed_by=p_actor_id, reviewed_at=now(), failure_reason=null, updated_at=now()
      where id=p_deposit_id;
    insert into public.deposit_review_events(deposit_id,actor_id,action,approved_amount)
      values(p_deposit_id,p_actor_id,'approved',p_amount);
    v_ledger_id := public.credit_deposit(p_deposit_id);
    return v_ledger_id;
  elsif p_action = 'rejected' then
    if p_reason is null or length(trim(p_reason)) < 5 or length(p_reason) > 500 then
      raise exception 'A rejection reason between 5 and 500 characters is required';
    end if;
    update public.deposits set status='rejected', rejection_reason=trim(p_reason),
      failure_reason=trim(p_reason), reviewed_by=p_actor_id, reviewed_at=now(), updated_at=now()
      where id=p_deposit_id;
    insert into public.deposit_review_events(deposit_id,actor_id,action,reason)
      values(p_deposit_id,p_actor_id,'rejected',trim(p_reason));
    return null;
  else
    raise exception 'Unsupported review action';
  end if;
end;
$$;
revoke all on function public.review_deposit(uuid,uuid,text,numeric,text) from public, anon, authenticated;
grant execute on function public.review_deposit(uuid,uuid,text,numeric,text) to service_role;

commit;

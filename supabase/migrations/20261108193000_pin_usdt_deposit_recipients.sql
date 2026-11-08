-- Pin each USDT deposit to the receiving wallet selected when the claim is created.
-- This migration must be applied to a development database first.
begin;

alter table public.deposits
  add column if not exists receiving_address text;

update public.deposits
set receiving_address = to_address
where receiving_address is null;

alter table public.deposits
  alter column receiving_address set not null;

alter table public.deposits
  add constraint deposits_receiving_address_format
  check (receiving_address ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$');

create or replace function public.prevent_deposit_receiving_address_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.receiving_address is distinct from old.receiving_address then
    raise exception 'A deposit receiving address is immutable once created';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_deposit_receiving_address_change on public.deposits;
create trigger prevent_deposit_receiving_address_change
before update of receiving_address on public.deposits
for each row execute function public.prevent_deposit_receiving_address_change();

create or replace function public.credit_deposit(p_deposit_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deposit public.deposits%rowtype;
  v_ledger_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  select * into v_deposit
  from public.deposits
  where id = p_deposit_id
  for update;

  if not found then raise exception 'Deposit not found'; end if;
  if v_deposit.status <> 'confirmed'
     or v_deposit.verified_amount is null
     or v_deposit.verified_amount <= 0
     or v_deposit.confirmations < 1
     or v_deposit.block_timestamp is null
     or v_deposit.from_address is null
     or v_deposit.to_address is distinct from v_deposit.receiving_address then
    raise exception 'Only chain-verified deposits matching their pinned receiving address can be credited';
  end if;

  insert into public.wallet_ledger(user_id, kind, amount, method, deposit_id)
  values(v_deposit.user_id, 'deposit', v_deposit.verified_amount, 'usdt_trc20', v_deposit.id)
  on conflict (deposit_id) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    select id into v_ledger_id
    from public.wallet_ledger
    where deposit_id = v_deposit.id;
  end if;

  update public.deposits
  set credited_at = coalesce(credited_at, now()), updated_at = now()
  where id = v_deposit.id;

  return v_ledger_id;
end;
$$;
revoke all on function public.credit_deposit(uuid) from public, anon, authenticated;
grant execute on function public.credit_deposit(uuid) to service_role;

create or replace function public.confirm_and_credit_deposit(
  p_deposit_id uuid,
  p_verified_amount numeric,
  p_from_address text,
  p_to_address text,
  p_block_timestamp timestamptz,
  p_confirmations integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deposit public.deposits%rowtype;
  v_ledger_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_verified_amount is null or p_verified_amount <= 0
     or p_confirmations < 1
     or p_from_address is null
     or p_block_timestamp is null then
    raise exception 'Invalid verified deposit data';
  end if;

  select * into v_deposit
  from public.deposits
  where id = p_deposit_id
  for update;

  if not found or v_deposit.status not in ('pending_verification','needs_review','confirmed') then
    raise exception 'Deposit is not eligible for confirmation';
  end if;
  if p_to_address is distinct from v_deposit.receiving_address then
    raise exception 'On-chain recipient does not match the deposit receiving address';
  end if;
  if v_deposit.status = 'confirmed'
     and v_deposit.verified_amount is distinct from p_verified_amount then
    raise exception 'Confirmed deposit amount cannot be changed';
  end if;

  update public.deposits
  set status = 'confirmed',
      verified_amount = p_verified_amount,
      from_address = p_from_address,
      to_address = p_to_address,
      block_timestamp = p_block_timestamp,
      confirmations = p_confirmations,
      failure_reason = null,
      updated_at = now()
  where id = p_deposit_id;

  v_ledger_id := public.credit_deposit(p_deposit_id);
  return v_ledger_id;
end;
$$;
revoke all on function public.confirm_and_credit_deposit(uuid,numeric,text,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.confirm_and_credit_deposit(uuid,numeric,text,text,timestamptz,integer) to service_role;

-- Manual review can reject a claim, but can no longer create a wallet credit.
create or replace function public.review_deposit(
  p_deposit_id uuid,
  p_actor_id uuid,
  p_action text,
  p_amount numeric default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deposit public.deposits%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and is_admin = true
  ) then
    raise exception 'administrator required';
  end if;

  select * into v_deposit
  from public.deposits
  where id = p_deposit_id
  for update;

  if not found or v_deposit.status not in ('pending_verification','needs_review') then
    raise exception 'Deposit is no longer awaiting review';
  end if;

  if p_action = 'approved' then
    raise exception 'Manual approval cannot credit deposits; only automated on-chain verification can';
  elsif p_action = 'rejected' then
    if p_reason is null or length(trim(p_reason)) < 5 or length(p_reason) > 500 then
      raise exception 'A rejection reason between 5 and 500 characters is required';
    end if;
    update public.deposits
    set status = 'rejected',
        rejection_reason = trim(p_reason),
        failure_reason = trim(p_reason),
        reviewed_by = p_actor_id,
        reviewed_at = now(),
        updated_at = now()
    where id = p_deposit_id;

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

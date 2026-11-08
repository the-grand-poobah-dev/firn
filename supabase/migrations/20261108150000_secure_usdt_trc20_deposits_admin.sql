-- 20261108150000_secure_usdt_trc20_deposits_admin.sql
-- Apply only after reviewing the migration and confirming the target database.
begin;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Prevent ordinary authenticated users from granting themselves admin privileges.
revoke update (is_admin) on public.profiles from anon, authenticated;

create or replace function public.is_firn_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;
revoke all on function public.is_firn_admin() from public, anon;
grant execute on function public.is_firn_admin() to authenticated, service_role;

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  method text not null default 'usdt_trc20' check (method = 'usdt_trc20'),
  claimed_amount numeric(24,6) not null check (claimed_amount > 0),
  txid text not null unique check (txid ~ '^[0-9a-f]{64}$'),
  verified_amount numeric(24,6),
  from_address text,
  to_address text not null,
  confirmations integer not null default 0 check (confirmations >= 0),
  block_timestamp timestamptz,
  status text not null default 'pending_verification'
    check (status in ('awaiting_payment','pending_verification','confirmed','needs_review','rejected','expired')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  credited_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  constraint deposits_verified_amount_positive check (verified_amount is null or verified_amount > 0)
);

alter table public.wallet_ledger
  alter column amount type numeric(24,6) using amount::numeric(24,6),
  add column if not exists deposit_id uuid unique references public.deposits(id);

create index if not exists deposits_user_created_idx on public.deposits(user_id, created_at desc);
create index if not exists deposits_status_created_idx on public.deposits(status, created_at);
create index if not exists deposits_pending_expiry_idx on public.deposits(expires_at) where status in ('pending_verification','needs_review');

create table if not exists public.deposit_review_events (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.deposits(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('approved','rejected')),
  approved_amount numeric(24,6),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists deposit_review_events_deposit_idx on public.deposit_review_events(deposit_id, created_at desc);

alter table public.deposits enable row level security;
alter table public.deposit_review_events enable row level security;
create policy deposits_owner_or_admin_read on public.deposits
  for select to authenticated
  using (user_id = auth.uid() or public.is_firn_admin());
create policy deposit_review_events_admin_read on public.deposit_review_events
  for select to authenticated
  using (public.is_firn_admin());
-- No client INSERT/UPDATE/DELETE policies: all mutations go through authenticated server routes.
create policy wallet_ledger_admin_read on public.wallet_ledger
  for select to authenticated
  using (public.is_firn_admin());

create table if not exists public.deposit_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
alter table public.deposit_rate_limits enable row level security;
revoke all on public.deposit_rate_limits from anon, authenticated;

create or replace function public.consume_deposit_rate_limit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  delete from public.deposit_rate_limits where attempted_at < now() - interval '1 hour';
  select count(*) into v_count from public.deposit_rate_limits
    where user_id = p_user_id and attempted_at >= now() - interval '1 hour';
  if v_count >= 10 then return false; end if;
  insert into public.deposit_rate_limits(user_id) values (p_user_id);
  return true;
end;
$$;
revoke all on function public.consume_deposit_rate_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_deposit_rate_limit(uuid) to service_role;

create or replace function public.credit_deposit(p_deposit_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_deposit public.deposits%rowtype; v_ledger_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if not found then raise exception 'Deposit not found'; end if;
  if v_deposit.status <> 'confirmed' or v_deposit.verified_amount is null or v_deposit.verified_amount <= 0 then
    raise exception 'Only verified confirmed deposits can be credited';
  end if;
  insert into public.wallet_ledger(user_id, kind, amount, method, deposit_id)
    values(v_deposit.user_id, 'deposit', v_deposit.verified_amount, 'usdt_trc20', v_deposit.id)
    on conflict (deposit_id) do nothing
    returning id into v_ledger_id;
  if v_ledger_id is null then
    select id into v_ledger_id from public.wallet_ledger where deposit_id = v_deposit.id;
  end if;
  update public.deposits set credited_at = coalesce(credited_at, now()), updated_at = now()
    where id = v_deposit.id;
  return v_ledger_id;
end;
$$;
revoke all on function public.credit_deposit(uuid) from public, anon, authenticated;
grant execute on function public.credit_deposit(uuid) to service_role;

-- Review, audit, and (for approvals) credit are one atomic database transaction.
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
as $
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
    if p_amount is null or p_amount <= 0 then raise exception 'A positive approved amount is required'; end if;
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
$;
revoke all on function public.review_deposit(uuid,uuid,text,numeric,text) from public, anon, authenticated;
grant execute on function public.review_deposit(uuid,uuid,text,numeric,text) to service_role;

-- Profile trigger is a second line of defence against self-promotion, including broad future grants.
create or replace function public.prevent_profile_admin_escalation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.is_admin is distinct from old.is_admin
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and session_user <> 'postgres' then
    raise exception 'is_admin can only be changed by a database administrator';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_profile_admin_escalation on public.profiles;
create trigger prevent_profile_admin_escalation before update on public.profiles
for each row execute function public.prevent_profile_admin_escalation();

commit;

-- After applying this migration, grant the intended administrator manually in the Supabase SQL Editor:
-- update public.profiles set is_admin = true where id = '<YOUR_AUTH_USER_UUID>';

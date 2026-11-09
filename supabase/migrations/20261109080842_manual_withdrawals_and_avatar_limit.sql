-- Retain avatar uploads up to 10 MB and add a manual payout request queue.
update storage.buckets set file_size_limit = 10485760 where id = 'avatars';

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('mpesa','bank','usdt_trc20')),
  destination text not null check (length(destination) between 3 and 300),
  early_exit boolean not null default false,
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
create index if not exists withdrawal_requests_status_created_idx on public.withdrawal_requests(status, created_at);
create index if not exists withdrawal_requests_user_created_idx on public.withdrawal_requests(user_id, created_at desc);
alter table public.withdrawal_requests enable row level security;
revoke all on public.withdrawal_requests from anon, authenticated;
grant select on public.withdrawal_requests to authenticated;
create policy withdrawal_requests_owner_read on public.withdrawal_requests for select to authenticated using (user_id = auth.uid());

create or replace function public.request_manual_withdrawal(p_amount numeric,p_method text,p_destination text,p_early_exit boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_pending numeric(14,2); v_balance numeric(14,2); v_id uuid; v_pos public.positions%rowtype;
begin
 if v_user is null then raise exception 'Not signed in'; end if;
 if p_amount is null or p_amount <= 0 or p_amount > 100000000 then raise exception 'Invalid withdrawal amount'; end if;
 if p_method not in ('mpesa','bank','usdt_trc20') then raise exception 'Unsupported payout method'; end if;
 if p_destination is null or length(trim(p_destination)) < 3 or length(p_destination) > 300 then raise exception 'Enter valid payout details'; end if;
 if exists(select 1 from public.positions where user_id=v_user and status='active' and current_date < started_on + 90) and not coalesce(p_early_exit,false) then raise exception 'The 90-day hold is active. Request early exit to proceed'; end if;
 if coalesce(p_early_exit,false) and exists(select 1 from public.positions where user_id=v_user and status='active' and current_date < started_on + 90) then raise exception 'The 90-day hold has not elapsed'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 if coalesce(p_early_exit,false) then
   for v_pos in select * from public.positions where user_id=v_user and status='active' order by id for update loop
     perform public.early_exit(v_pos.id);
   end loop;
 end if;
 select coalesce(sum(amount),0) into v_pending from public.withdrawal_requests where user_id=v_user and status='pending';
 v_balance := public.wallet_balance();
 if p_amount > v_balance-v_pending then raise exception 'Insufficient available wallet balance'; end if;
 insert into public.withdrawal_requests(user_id,amount,method,destination,early_exit) values(v_user,p_amount,p_method,trim(p_destination),coalesce(p_early_exit,false)) returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.request_manual_withdrawal(numeric,text,text,boolean) from public, anon;
grant execute on function public.request_manual_withdrawal(numeric,text,text,boolean) to authenticated;

create or replace function public.complete_manual_withdrawal(p_request_id uuid,p_action text,p_actor_id uuid,p_note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_actor uuid := p_actor_id; v_req public.withdrawal_requests%rowtype;
begin
 if v_actor is null or not exists(select 1 from public.profiles where id=v_actor and is_admin=true) then raise exception 'Administrator access required'; end if;
 if p_action not in ('paid','rejected') then raise exception 'Invalid action'; end if;
 select * into v_req from public.withdrawal_requests where id=p_request_id for update;
 if not found or v_req.status <> 'pending' then raise exception 'Request is no longer pending'; end if;
 if p_action='paid' then
   perform pg_advisory_xact_lock(hashtextextended(v_req.user_id::text,0));
   if (select coalesce(sum(amount),0) from public.wallet_ledger where user_id=v_req.user_id) - (select coalesce(sum(amount),0) from public.withdrawal_requests where user_id=v_req.user_id and status='pending' and id<>p_request_id) < v_req.amount then raise exception 'Insufficient wallet balance at payout confirmation'; end if;
   insert into public.wallet_ledger(user_id,kind,amount,method) values(v_req.user_id,'withdrawal',-v_req.amount,'manual:'||v_req.method);
 end if;
 update public.withdrawal_requests set status=p_action,admin_note=nullif(trim(coalesce(p_note,'')),''),reviewed_at=now(),reviewed_by=v_actor where id=p_request_id;
end; $$;
revoke all on function public.complete_manual_withdrawal(uuid,text,uuid,text) from public, anon, authenticated;
grant execute on function public.complete_manual_withdrawal(uuid,text,uuid,text) to service_role;
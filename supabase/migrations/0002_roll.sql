-- 0002_roll.sql
-- Restrict direct position edits to the user's auto-roll preference.
alter table public.positions drop constraint if exists positions_auto_roll_check;
alter table public.positions add constraint positions_auto_roll_check
  check (auto_roll in ('ask','renew','withdraw','renew_twelve'));

drop policy if exists own_positions_update on public.positions;
create policy own_positions_update on public.positions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Column-level privilege: authenticated clients may update auto_roll only.
revoke update on public.positions from authenticated;
grant update (auto_roll) on public.positions to authenticated;

create or replace function public.positions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- State transitions are performed only by trusted database functions or service role.
  if current_user not in ('service_role','postgres')
     and (to_jsonb(new) - 'auto_roll') is distinct from (to_jsonb(old) - 'auto_roll') then
    raise exception 'Only auto_roll may be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists positions_guard on public.positions;
create trigger positions_guard
before update on public.positions
for each row execute function public.positions_guard();

create or replace function public.accrue_daily()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pos public.positions%rowtype;
  v_plan public.plans%rowtype;
  v_new_plan public.plan_code;
  v_new_id uuid;
  v_principal numeric(14,2);
  v_n integer;
  v_each numeric(14,2);
  v_rem numeric(14,2);
begin
  insert into public.accruals(position_id,accrual_date,amount,balance_after)
  select p.id,current_date,
         b.bal*(power(1+p.apy,1.0/365)-1),
         b.bal*power(1+p.apy,1.0/365)
    from public.positions p
    cross join lateral (
      select p.principal+coalesce((select sum(a.amount) from public.accruals a where a.position_id=p.id),0) bal
    ) b
   where p.status='active' and p.started_on<current_date
  on conflict do nothing;

  update public.positions
     set status='matured'
   where status='active' and matures_on<=current_date;

  -- Renewals roll principal plus all accrued interest into a new position.
  for v_pos in
    select * from public.positions
     where status='matured' and not settled
       and auto_roll in ('renew','renew_twelve')
     for update
  loop
    v_new_plan := case when v_pos.auto_roll='renew_twelve' then 'twelve'::public.plan_code else v_pos.plan end;
    if v_pos.auto_roll='renew_twelve' and v_pos.plan <> 'six' then
      raise exception 'Only Firn Six can switch to Firn Twelve at maturity';
    end if;

    select * into strict v_plan from public.plans where code=v_new_plan;
    v_principal := round(v_pos.principal + coalesce((
      select sum(a.amount) from public.accruals a where a.position_id=v_pos.id
    ),0),2);

    insert into public.positions(user_id,plan,principal,apy,started_on,matures_on,auto_roll)
    values(v_pos.user_id,v_new_plan,v_principal,v_plan.target_apy,current_date,
           current_date + make_interval(months=>v_plan.lock_months),'ask')
    returning id into v_new_id;

    select count(*) into v_n
      from (select id from public.properties where is_active order by random() limit 10) q;
    if v_n <> 10 then
      raise exception 'At least ten active properties are required to renew savings';
    end if;
    v_each := trunc(v_principal/v_n,2);
    v_rem := v_principal-v_each*v_n;
    insert into public.allocations(position_id,property_id,amount)
    select v_new_id,p.id,
           v_each + case when row_number() over(order by p.id)=1 then v_rem else 0 end
      from (select id from public.properties where is_active order by random() limit 10) p;

    update public.positions set settled=true where id=v_pos.id;
    insert into public.notifications(user_id,title,body)
    values(v_pos.user_id,'Savings renewed',
           'Your matured '||case when v_pos.plan='six' then 'Firn Six' else 'Firn Twelve' end||
           ' position and earned interest were rolled into a new '||
           case when v_new_plan='six' then 'Firn Six' else 'Firn Twelve' end||' position.');
  end loop;

  -- Ask and withdraw both return the matured value to the wallet for the user to decide.
  insert into public.wallet_ledger(user_id,kind,amount,method)
  select p.user_id,'unlock',
         p.principal+coalesce((select sum(a.amount) from public.accruals a where a.position_id=p.id),0),
         'maturity'
    from public.positions p
   where p.status='matured' and not p.settled
     and p.auto_roll in ('ask','withdraw');

  insert into public.notifications(user_id,title,body)
  select p.user_id,'Savings matured',
         'Your principal and interest are back in your wallet.'
    from public.positions p
   where p.status='matured' and not p.settled
     and p.auto_roll in ('ask','withdraw');

  update public.positions
     set settled=true
   where status='matured' and not settled
     and auto_roll in ('ask','withdraw');
end;
$$;

revoke execute on function public.accrue_daily() from public,anon,authenticated;

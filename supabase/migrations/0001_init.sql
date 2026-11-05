-- 0001_init.sql
-- Initial FIRN schema. Seeded property data is illustrative and must not be presented as verified asset disclosures.
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create type plan_code as enum ('six','twelve');
create table plans(code plan_code primary key,name text not null,lock_months int not null,target_apy numeric(5,4) not null,low_apy numeric(5,4) not null,high_apy numeric(5,4) not null,min_amount numeric(12,2) not null default 500);
insert into plans values ('six','Firn Six',6,.1050,.0900,.1200,500),('twelve','Firn Twelve',12,.1300,.1000,.1500,500);

create table properties(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,city text not null,country text not null,kind text not null,art text not null,units int not null,target_raise numeric(14,2) not null,raised numeric(14,2) not null default 0,target_return numeric(5,4) not null,occupancy numeric(5,4) not null,valuation numeric(14,2) not null,about text,lat numeric(9,6),lng numeric(9,6),valuation_history jsonb not null default '[]',rent_history jsonb not null default '[]',documents jsonb not null default '[]',sort int default 0,is_active boolean default true);
create table property_updates(id uuid primary key default gen_random_uuid(),property_id uuid references properties on delete cascade,title text not null,body text,posted_on date default current_date);
create table profiles(id uuid primary key references auth.users on delete cascade,full_name text,country text,goals text[],lock_pref text,risk_level int check(risk_level between 1 and 5),kyc_status text not null default 'pending' check(kyc_status in ('pending','in_review','verified')),currency text not null default 'USD',prefs jsonb not null default '{}',referral_code text unique default substr(md5(random()::text),1,8),created_at timestamptz default now());
create table wallet_ledger(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,kind text not null check(kind in ('deposit','withdrawal','lock','unlock','fee')),amount numeric(14,2) not null,method text,created_at timestamptz default now());
create table positions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,plan plan_code not null references plans,principal numeric(14,2) not null check(principal>=500),apy numeric(5,4) not null,started_on date not null default current_date,matures_on date not null,status text not null default 'active' check(status in ('active','matured','closed_early')),auto_roll text not null default 'ask' check(auto_roll in ('ask','renew','withdraw')),settled boolean not null default false,created_at timestamptz default now());
create table allocations(position_id uuid references positions on delete cascade,property_id uuid references properties,amount numeric(14,2) not null,primary key(position_id,property_id));
create table accruals(position_id uuid references positions on delete cascade,accrual_date date not null,amount numeric(14,4) not null,balance_after numeric(14,4) not null,primary key(position_id,accrual_date));
create table notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,title text not null,body text,read boolean default false,created_at timestamptz default now());
create index on positions(user_id,status); create index on wallet_ledger(user_id,created_at desc); create index on accruals(accrual_date); create index on notifications(user_id,created_at desc);

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create function wallet_balance() returns numeric language sql stable security definer set search_path=public as $$ select coalesce(sum(amount),0) from wallet_ledger where user_id=auth.uid() $$;
create function create_position(p_plan plan_code,p_amount numeric) returns uuid language plpgsql security definer set search_path=public as $$
declare v_plan plans%rowtype; v_id uuid; v_n int; v_each numeric(14,2); v_rem numeric(14,2);
begin
if auth.uid() is null then raise exception 'Not signed in'; end if;
select * into v_plan from plans where code=p_plan;
if p_amount<v_plan.min_amount then raise exception 'Minimum is %',v_plan.min_amount; end if;
if wallet_balance()<p_amount then raise exception 'Insufficient wallet balance'; end if;
select count(*) into v_n from (select id from properties where is_active order by random() limit 10) q;
if v_n<>10 then raise exception 'At least ten active properties are required'; end if;
insert into positions(user_id,plan,principal,apy,matures_on) values(auth.uid(),p_plan,p_amount,v_plan.target_apy,current_date+make_interval(months=>v_plan.lock_months)) returning id into v_id;
v_each:=trunc(p_amount/v_n,2); v_rem:=p_amount-v_each*v_n;
insert into allocations(position_id,property_id,amount) select v_id,p.id,v_each+case when row_number() over(order by p.id)=1 then v_rem else 0 end from (select id from properties where is_active order by random() limit 10) p;
insert into wallet_ledger(user_id,kind,amount,method) values(auth.uid(),'lock',-p_amount,p_plan::text); return v_id; end $$;
create function deposit_demo(p_amount numeric,p_method text) returns numeric language plpgsql security definer set search_path=public as $$ begin if auth.uid() is null then raise exception 'Not signed in'; end if; if p_amount<=0 or p_amount>100000 then raise exception 'Amount out of range'; end if; insert into wallet_ledger(user_id,kind,amount,method) values(auth.uid(),'deposit',p_amount,p_method); return wallet_balance(); end $$;
create function withdraw_demo(p_amount numeric) returns numeric language plpgsql security definer set search_path=public as $$ begin if auth.uid() is null then raise exception 'Not signed in'; end if; if p_amount<=0 or p_amount>wallet_balance() then raise exception 'Amount out of range'; end if; insert into wallet_ledger(user_id,kind,amount,method) values(auth.uid(),'withdrawal',-p_amount,'demo'); return wallet_balance(); end $$;
create function early_exit(p_position uuid) returns numeric language plpgsql security definer set search_path=public as $$ declare v_pos positions%rowtype; v_fee numeric(14,2); begin select * into v_pos from positions where id=p_position and user_id=auth.uid() and status='active' for update; if not found then raise exception 'Savings not found'; end if; if current_date-v_pos.started_on<30 then raise exception 'Early exit opens after day 30'; end if; v_fee:=round(v_pos.principal*.015,2); update positions set status='closed_early',settled=true where id=p_position; insert into wallet_ledger(user_id,kind,amount,method) values(auth.uid(),'unlock',v_pos.principal,'early_exit'),(auth.uid(),'fee',-v_fee,'early_exit'); return v_pos.principal-v_fee; end $$;
create function accrue_daily() returns void language plpgsql security definer set search_path=public as $$ begin
insert into accruals(position_id,accrual_date,amount,balance_after) select p.id,current_date,b.bal*(power(1+p.apy,1.0/365)-1),b.bal*power(1+p.apy,1.0/365) from positions p cross join lateral(select p.principal+coalesce((select sum(amount) from accruals a where a.position_id=p.id),0) bal)b where p.status='active' and p.started_on<current_date on conflict do nothing;
update positions set status='matured' where status='active' and matures_on<=current_date;
insert into wallet_ledger(user_id,kind,amount,method) select p.user_id,'unlock',p.principal+coalesce((select sum(amount) from accruals a where a.position_id=p.id),0),'maturity' from positions p where p.status='matured' and not p.settled;
insert into notifications(user_id,title,body) select user_id,'Savings matured','Your principal and interest are back in your wallet.' from positions where status='matured' and not settled;
update positions set settled=true where status='matured' and not settled; end $$;
revoke execute on function create_position(plan_code,numeric),deposit_demo(numeric,text),withdraw_demo(numeric),early_exit(uuid),wallet_balance() from public,anon;
grant execute on function create_position(plan_code,numeric),deposit_demo(numeric,text),withdraw_demo(numeric),early_exit(uuid),wallet_balance() to authenticated;
revoke execute on function accrue_daily() from public,anon,authenticated;
select cron.schedule('firn-daily-accrual','0 0 * * *','select public.accrue_daily()');
create view positions_live with(security_invoker=true) as select p.*,coalesce(a.earned,0) earned,p.principal+coalesce(a.earned,0) value,(p.matures_on-current_date) days_left,(current_date-p.started_on) days_in from positions p left join lateral(select sum(amount) earned from accruals where position_id=p.id)a on true;
create view portfolio_daily with(security_invoker=true) as select p.user_id,a.accrual_date,sum(a.amount) profit,sum(a.balance_after) balance from accruals a join positions p on p.id=a.position_id group by p.user_id,a.accrual_date;

alter table profiles enable row level security; alter table wallet_ledger enable row level security; alter table positions enable row level security; alter table allocations enable row level security; alter table accruals enable row level security; alter table notifications enable row level security; alter table properties enable row level security; alter table property_updates enable row level security; alter table plans enable row level security;
create policy own_profile on profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy own_ledger on wallet_ledger for select using(user_id=auth.uid()); create policy own_positions on positions for select using(user_id=auth.uid());
create policy own_allocations on allocations for select using(exists(select 1 from positions p where p.id=position_id and p.user_id=auth.uid()));
create policy own_accruals on accruals for select using(exists(select 1 from positions p where p.id=position_id and p.user_id=auth.uid()));
create policy own_notifications on notifications for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy read_properties on properties for select to authenticated using(true); create policy read_updates on property_updates for select to authenticated using(true); create policy read_plans on plans for select to authenticated using(true);
insert into storage.buckets(id,name,public) values('properties','properties',true) on conflict do nothing;

-- 8 detailed starter records from the project brief.
insert into properties(slug,name,city,country,kind,art,units,target_raise,raised,target_return,occupancy,valuation,about,lat,lng,sort) values
('marina-crest','Marina Crest Tower','Dubai Marina','UAE','apartments','tower',184,20000000,18400000,.138,.94,41200000,'Waterfront residential tower with rooftop terrace and 184 furnished apartments.',25.0805,55.1403,1),
('villa-cipressi','Villa Cipressi','Chianti, Tuscany','Italy','estate','villa',12,10000000,9100000,.115,.81,12600000,'Restored hill estate let as boutique holiday villas among cypress groves.',43.4650,11.2540,2),
('casa-alboran','Casa Alboran','Marbella','Spain','villas','marbella',22,16000000,14700000,.146,.88,21300000,'Contemporary white villas with private pools, 8 minutes from the beach.',36.5100,-4.8860,3),
('torre-duomo','Torre Duomo Offices','Milan','Italy','offices','office',38,22000000,22000000,.126,.96,36800000,'Grade-A glass office tower with 14 corporate tenants on long leases.',45.4642,9.1900,4),
('palm-bluff','Palm Bluff Residences','Palm Jumeirah, Dubai','UAE','villas','palm',16,30000000,27500000,.150,.91,48900000,'Beachfront villas on the Palm with private jetties and concierge service.',25.1124,55.1390,5),
('alfama-terraces','Alfama Terraces','Lisbon','Portugal','apartments','lisbon',64,9000000,7800000,.132,.92,14100000,'Restored terraced apartments with river views in the old town.',38.7110,-9.1290,6),
('seeblick-lofts','Seeblick Lofts','Zurich','Switzerland','lofts','zurich',40,18000000,16200000,.109,.98,29400000,'Lakeview lofts with timber balconies close to the city centre.',47.3769,8.5417,7),
('cala-blanca','Cala Blanca Estate','Mallorca','Spain','estate','mallorca',9,12000000,11300000,.140,.79,17700000,'Coastal stone estate above a private cove, let weekly in season.',39.4500,3.3500,8);
with loc(i,city,country,lat,lng) as (values (1,'Dubai','UAE',25.2048,55.2708),(2,'Milan','Italy',45.4642,9.1900),(3,'Madrid','Spain',40.4168,-3.7038),(4,'Lisbon','Portugal',38.7223,-9.1393),(5,'Zurich','Switzerland',47.3769,8.5417),(6,'Toronto','Canada',43.6532,-79.3832),(7,'London','Britain',51.5072,-.1276),(8,'Kuwait City','Kuwait',29.3759,47.9774),(9,'Male','Maldives',4.1755,73.5093),(10,'Bangkok','Thailand',13.7563,100.5018),(11,'Singapore','Singapore',1.3521,103.8198),(12,'Jakarta','Indonesia',-6.2088,106.8456),(13,'Shanghai','China',31.2304,121.4737),(14,'Tokyo','Japan',35.6762,139.6503),(15,'Seoul','South Korea',37.5665,126.9780),(16,'Cape Town','South Africa',-33.9249,18.4241),(17,'New York','USA',40.7128,-74.0060)),
k(i,kind,art) as (values (1,'apartments','residential'),(2,'villas','villa'),(3,'offices','office'),(4,'hotel','hotel'),(5,'lofts','loft')),
a(i,name) as (values (1,'Cedar'),(2,'Azure'),(3,'Crown'),(4,'Harbor'),(5,'Summit'),(6,'Lumen'),(7,'Orchid'),(8,'Silver'),(9,'Juniper'),(10,'Cobalt'),(11,'Willow'),(12,'Crescent'),(13,'Sapphire'),(14,'Meadow'),(15,'Atlas'),(16,'Pearl'))
insert into properties(slug,name,city,country,kind,art,units,target_raise,raised,target_return,occupancy,valuation,about,lat,lng,sort)
select 'firn-estate-'||lpad(g.n::text,2,'0'),a.name||' '||l.city||' Property',l.city,l.country,k.kind,k.art,18+(g.n*7%160),5000000+(g.n*137000%22000000),4000000+(g.n*91000%18000000),.105+(g.n%45)/1000.0,.78+(g.n%20)/100.0,9000000+(g.n*713000%60000000),'Illustrative sample property; verify ownership, valuation and rental performance independently.',l.lat,l.lng,g.n
from generate_series(9,88) g(n) join loc l on l.i=((g.n-9)%17)+1 join k on k.i=((g.n-9)%5)+1 join a on a.i=((g.n-9)%16)+1;

-- User profile photos and event-driven account notifications.
-- The avatar bucket is public-read so avatars can render without expiring URLs;
-- uploads and deletes are restricted to the authenticated owner's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own avatars" on storage.objects;
create policy "Users upload their own avatars" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete their own avatars" on storage.objects;
create policy "Users delete their own avatars" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Preserve the existing profile creation trigger and add a durable welcome notice.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (id) do nothing;

  insert into public.notifications (user_id, title, body)
  values (new.id, 'Welcome to FIRN', 'Your FIRN account is ready. Complete your profile and explore your savings dashboard to get started.');
  return new;
end;
$$;

create or replace function public.notify_deposit_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_admin record;
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, body)
    values (new.user_id, 'USDT deposit submitted', 'Your USDT TRC20 transaction claim was received and is waiting for manual FIRN verification. Your wallet is not credited until approval.');

    for v_admin in select id from public.profiles where is_admin = true loop
      insert into public.notifications (user_id, title, body)
      values (v_admin.id, 'Admin: deposit needs review', 'A new USDT TRC20 deposit claim is waiting for manual verification in the admin deposit queue.');
    end loop;
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      insert into public.notifications (user_id, title, body)
      values (new.user_id, 'USDT deposit approved', 'Your deposit was verified and your FIRN wallet was credited with ' || to_char(coalesce(new.verified_amount, new.claimed_amount), 'FM999999999990.00') || ' USDT.');
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, title, body)
      values (new.user_id, 'USDT deposit rejected', 'Your deposit claim was not approved. ' || coalesce(nullif(new.rejection_reason, ''), nullif(new.failure_reason, ''), 'Please contact FIRN support if you need help.'));
    elsif new.status = 'needs_review' then
      insert into public.notifications (user_id, title, body)
      values (new.user_id, 'USDT deposit needs attention', 'Your deposit needs additional manual review. Please check the deposit status in your wallet.');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_deposit_activity on public.deposits;
create trigger notify_deposit_activity
after insert or update of status on public.deposits
for each row execute function public.notify_deposit_activity();

create or replace function public.notify_withdrawal_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_admin record;
begin
  if new.kind = 'withdrawal' then
    insert into public.notifications (user_id, title, body)
    values (new.user_id, 'Withdrawal update', 'A withdrawal ledger entry of ' || to_char(abs(new.amount), 'FM999999999990.00') || ' has been recorded. Check your wallet transactions for details.');
    for v_admin in select id from public.profiles where is_admin = true loop
      insert into public.notifications (user_id, title, body)
      values (v_admin.id, 'Admin: withdrawal activity', 'A withdrawal ledger entry was recorded. Review wallet activity if administrator follow-up is required.');
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_withdrawal_activity on public.wallet_ledger;
create trigger notify_withdrawal_activity
after insert on public.wallet_ledger
for each row execute function public.notify_withdrawal_activity();

create or replace function public.notify_profile_kyc_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.kyc_status is distinct from old.kyc_status then
    insert into public.notifications (user_id, title, body)
    values (new.id, 'Account verification update',
      case new.kyc_status
        when 'verified' then 'Your identity verification has been approved.'
        when 'in_review' then 'Your identity verification is being reviewed.'
        else 'Your identity verification status has changed. Open your account to review the latest status.'
      end);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_profile_kyc_activity on public.profiles;
create trigger notify_profile_kyc_activity
after update of kyc_status on public.profiles
for each row execute function public.notify_profile_kyc_activity();

create or replace function public.notify_position_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.notifications (user_id, title, body)
  values (new.user_id, 'Savings position created', 'Your ' || new.plan::text || ' savings position for $' || to_char(new.principal, 'FM999999999990.00') || ' has been created.');
  return new;
end;
$$;

drop trigger if exists notify_position_activity on public.positions;
create trigger notify_position_activity
after insert on public.positions
for each row execute function public.notify_position_activity();

create or replace function public.notify_accrual_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.positions where id = new.position_id;
  if v_user_id is not null and new.amount > 0 then
    insert into public.notifications (user_id, title, body)
    values (v_user_id, 'Profit accrued', 'A daily profit accrual of $' || to_char(new.amount, 'FM999999999990.00') || ' has been recorded on your savings position.');
  end if;
  return new;
end;
$$;

drop trigger if exists notify_accrual_activity on public.accruals;
create trigger notify_accrual_activity
after insert on public.accruals
for each row execute function public.notify_accrual_activity();

-- Property updates are administrator-authored account news. Respect the user's
-- existing property_updates preference when it has explicitly been disabled.
create or replace function public.notify_property_update_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.notifications (user_id, title, body)
  select p.id, 'Admin: new property update', coalesce(new.title, 'A property update is available') || case when new.body is null then '' else ' — ' || new.body end
  from public.profiles p
  where coalesce(p.prefs->>'property_updates', 'true') <> 'false';
  return new;
end;
$$;

drop trigger if exists notify_property_update_activity on public.property_updates;
create trigger notify_property_update_activity
after insert on public.property_updates
for each row execute function public.notify_property_update_activity();


-- Stream only the user's own notification rows to the notification badge.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

create index if not exists notifications_unread_user_created_idx
on public.notifications (user_id, created_at desc) where read = false;

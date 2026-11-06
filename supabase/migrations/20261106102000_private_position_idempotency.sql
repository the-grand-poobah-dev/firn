-- Keep the SECURITY DEFINER implementation outside the exposed API schema.
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated;
create or replace function private.create_position_idempotent(p_plan public.plan_code,p_amount numeric,p_key text)
returns uuid language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid();v_position uuid;
begin
 if v_user is null then raise exception 'Not signed in';end if;
 if p_key is null or length(p_key)<8 or length(p_key)>128 then raise exception 'Invalid idempotency key';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text||':'||p_key,0));
 select position_id into v_position from public.position_requests where user_id=v_user and idempotency_key=p_key and created_at>=now()-interval '60 seconds';
 if v_position is not null then return v_position;end if;
 v_position:=public.create_position(p_plan,p_amount);
 insert into public.position_requests(user_id,idempotency_key,position_id,created_at) values(v_user,p_key,v_position,now()) on conflict(user_id,idempotency_key) do update set position_id=excluded.position_id,created_at=excluded.created_at;
 delete from public.position_requests where user_id=v_user and created_at<now()-interval '1 day';
 return v_position;
end;$function$;
revoke all on function private.create_position_idempotent(public.plan_code,numeric,text) from public,anon;
grant execute on function private.create_position_idempotent(public.plan_code,numeric,text) to authenticated;
create or replace function public.create_position_idempotent(p_plan public.plan_code,p_amount numeric,p_key text)
returns uuid language sql security invoker set search_path='' as $function$
 select private.create_position_idempotent(p_plan,p_amount,p_key);
$function$;
revoke all on function public.create_position_idempotent(public.plan_code,numeric,text) from public,anon;
grant execute on function public.create_position_idempotent(public.plan_code,numeric,text) to authenticated;

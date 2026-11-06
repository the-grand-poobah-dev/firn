create or replace function public.property_investor_count(p_property uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct pos.user_id)::integer
  from public.allocations as a
  join public.positions as pos on pos.id = a.position_id
  where a.property_id = p_property
    and pos.status = 'active'
    and (select auth.uid()) is not null;
$$;

revoke all on function public.property_investor_count(uuid) from public, anon;
grant execute on function public.property_investor_count(uuid) to authenticated;

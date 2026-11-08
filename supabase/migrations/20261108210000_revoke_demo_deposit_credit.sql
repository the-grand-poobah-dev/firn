-- Disable the legacy client-callable demo deposit RPC.
-- A signed-in user must never be able to create wallet credits without verified funds.
begin;

revoke all on function public.deposit_demo(numeric, text)
  from public, anon, authenticated, service_role;

-- This function is invoked by the auth.users trigger, not by application clients.
-- Remove unnecessary direct RPC execution while preserving trigger execution.
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

commit;

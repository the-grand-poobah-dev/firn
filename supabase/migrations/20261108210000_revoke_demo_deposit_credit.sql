-- Disable the legacy client-callable demo deposit RPC.
-- A signed-in user must never be able to create wallet credits without verified funds.
begin;

revoke all on function public.deposit_demo(numeric, text)
  from public, anon, authenticated, service_role;

-- This function is invoked by the auth.users trigger, not by application clients.
-- Remove unnecessary direct RPC execution while preserving trigger execution.
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

-- Remove Supabase's broad default table grants and expose only the operations
-- required by the browser. RLS remains the row-level boundary.
revoke all on table public.deposits, public.wallet_ledger, public.deposit_review_events
  from anon, authenticated;
grant select on table public.deposits, public.wallet_ledger, public.deposit_review_events
  to authenticated;

-- Profiles are readable by their owner. Users may edit ordinary preferences
-- and profile details, but KYC, referral attribution, admin status, and timestamps
-- remain server/database controlled.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, country, goals, lock_pref, risk_level, currency, prefs)
  on table public.profiles to authenticated;

commit;

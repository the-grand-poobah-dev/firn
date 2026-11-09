-- Trigger functions are invoked by PostgreSQL triggers, not through the Data API.
-- Remove their default PUBLIC execute grants so they cannot be called as RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.notify_deposit_activity() from public, anon, authenticated;
revoke all on function public.notify_withdrawal_activity() from public, anon, authenticated;
revoke all on function public.notify_profile_kyc_activity() from public, anon, authenticated;
revoke all on function public.notify_position_activity() from public, anon, authenticated;
revoke all on function public.notify_accrual_activity() from public, anon, authenticated;
revoke all on function public.notify_property_update_activity() from public, anon, authenticated;

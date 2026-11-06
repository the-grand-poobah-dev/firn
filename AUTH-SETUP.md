# Supabase Auth setup for FIRN

FIRN uses Supabase email + password authentication with confirmation links. **You do not need to edit any email templates.** Leave the built-in Supabase templates at their defaults.

## One-time Supabase dashboard setup

1. Open Authentication → Providers → Email and make sure Email is enabled and **Confirm email** is turned on.
2. Open Authentication → URL Configuration.
3. Set Site URL to:
   `https://firn-the-grand-poobah-dev.vercel.app`
4. Under Additional Redirect URLs, add:
   `https://*-the-grand-poobah-dev.vercel.app/**`
   `http://localhost:3000/**`

The default Supabase **Confirm signup** email already contains a confirmation link. FIRN sends the user back to `/auth/confirm`, exchanges the confirmation code for a session, saves the signup country, and continues onboarding.

## How users sign in

- New users create an account with email and password.
- They click the standard Supabase confirmation link in their inbox.
- They are returned to FIRN and continue onboarding.
- Returning users sign in with email and password.

No custom OTP or Magic Link template is required.

## Vercel

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for Preview and Production. Never expose a service-role key in browser variables.

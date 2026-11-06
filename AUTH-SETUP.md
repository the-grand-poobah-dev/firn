# Supabase Auth setup for FIRN

The app uses Supabase Auth with cookie-backed SSR sessions via `@supabase/ssr`.

## Required dashboard settings

In Supabase Dashboard → Authentication → URL Configuration:

- Enable email confirmations under Authentication → Providers → Email.
- Set Site URL to `https://firn-topaz.vercel.app`.
- Add these Additional Redirect URLs:
  - `https://firn-topaz.vercel.app/**`
  - `https://*.vercel.app/**`
  - `http://localhost:3000/**`

For Vercel Preview deployments, the app uses the request origin as the callback origin. Keep the wildcard redirect pattern enabled.

## Email templates

For Confirm signup, include the six-digit OTP token as `{{ .Token }}` so the user can enter it on `/verify`. The confirmation link should use a token hash and return to `/auth/confirm`, for example:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
<p>Your code: {{ .Token }}</p>
```

For Magic Link / email OTP sign-in, use the same `token_hash` callback pattern and include `{{ .Token }}` for the code-entry experience.

The app supports both the manual six-digit verification flow and the token-hash callback route.

## Vercel environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for Preview and Production. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never prefix it with `NEXT_PUBLIC_`.

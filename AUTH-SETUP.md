# Supabase Auth setup for FIRN

The app uses Supabase Auth with cookie-backed SSR sessions via `@supabase/ssr`. Password login and email OTP login are implemented in the app.

## Required dashboard settings

In the Supabase Dashboard for project `olcsbzwgvgkegtrhpqzu`:

1. Open **Authentication → Sign In / Providers → Email**.
2. Make sure the Email provider is enabled.
3. Turn **Confirm email** on. FIRN's signup screen expects a six-digit confirmation code before onboarding.
4. Open **Authentication → URL Configuration**:
   - Set **Site URL** to `https://firn-the-grand-poobah-dev.vercel.app`.
   - Add `https://*-the-grand-poobah-dev.vercel.app/**` to **Additional Redirect URLs**. This matches FIRN's Vercel preview deployment URLs for this team.
   - Add `http://localhost:3000/**` for local development if needed.

Supabase's Vercel-specific wildcard guidance uses the form `https://*-<team-or-account-slug>.vercel.app/**`. The broader `https://*.vercel.app/**` pattern is not the recommended pattern for these deployment hostnames.

## Email templates

The app accepts six-digit codes on `/verify` and also supports the token-hash callback at `/auth/confirm`. Since the app passes an explicit `emailRedirectTo` callback URL, use `{{ .RedirectTo }}` in custom template links.

**Confirm signup** template:

```html
<h2>Confirm your FIRN account</h2>
<p>Enter this six-digit code in FIRN to verify your email:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">confirm your email using this link</a>.</p>
```

**Magic Link** template (used for email-code sign-in):

```html
<h2>Your FIRN sign-in code</h2>
<p>Enter this six-digit code in FIRN to sign in:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Or <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">sign in using this link</a>.</p>
```

The password sign-in flow does not depend on these OTP templates, but signup verification and email-code sign-in do. Supabase's built-in email sender is rate-limited and best-effort; configure custom SMTP before inviting real users at scale.

## Vercel environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) for Preview and Production. Do not add a service-role or secret key to browser-exposed variables.

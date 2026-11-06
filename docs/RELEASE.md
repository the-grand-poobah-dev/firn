# FIRN release runbook

## Environments

| Variable | Production | Preview | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Required | Supabase project API URL; public project identifier, not a secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Required | Public client key; database access remains governed by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for privileged server tasks | Required for privileged server tasks | Server-only Supabase key that bypasses RLS; never prefix with `NEXT_PUBLIC_` |
| `CRON_SECRET` | Required only for an HTTP cron endpoint | Required only for an HTTP cron endpoint | Bearer secret used to authenticate scheduled HTTP requests. The active daily accrual scheduler is currently Supabase `pg_cron`, so no Vercel cron route is configured. |
| `NEXT_PUBLIC_DEMO` | `0` | `1` | Preview demo-login visibility; server action also rejects production |
| `DEMO_PASSWORD` | Not set | Required for demo sign-in | Server-side password used by the repeatable demo seeder and guarded demo login |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Required | Required | Public support contact displayed in help/contact surfaces |

Set secrets in Vercel Project → Settings → Environment Variables. Do not commit values to this repository or paste them into source files.

## Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://firn-topaz.vercel.app`
- Additional Redirect URLs:
  - `https://*.vercel.app/**`
  - `http://localhost:3000/**`

Use the production URL shown in Vercel Project → Domains if the canonical production domain changes.

## Demo seeder

Set `DEMO_PASSWORD` in local `.env.local` and run:

```bash
npm run seed:demo
```

The script uses the Supabase service-role client on the server/CLI only. It resets the demo user's own demo rows and recreates the demo wallet, positions, allocations, accrual history, and notifications. Never import it into browser code.

## Roll back a Vercel deployment

1. Open Vercel → Project → Deployments.
2. Find the last known-good **Production** deployment.
3. Open its menu and select **Promote to Production** (or use the deployment's Promote action).
4. Verify the production domain and critical routes.
5. If using the Vercel CLI, `vercel rollback` rolls back to the previous production deployment. A rollback disables automatic production assignment until you promote a deployment again.

## Release caveats

This app currently presents a simulated savings experience. Do not accept real customer funds or describe target returns as guaranteed. Confirm payment-provider integration, legal/compliance review, production support ownership, and all QA gates before any real-money launch.

# Firn

Firn is a **simulated savings experience** built with Next.js 14, Supabase and Vercel. It models fixed-term savings positions, daily interest accrual, property allocations and portfolio reporting.

> **SIMULATED:** Targets are not guarantees. Capital can be lost. This is not an offer or solicitation to invest. Real payment-provider deposits and transfers are not enabled.

## Local setup

1. Use Node.js 20+ and npm.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase URL and public anon/publishable key. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
4. Install dependencies with `npm install`.
5. Start with `npm run dev`.
6. Validate with `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.

## Operations

- [Release and rollback runbook](docs/RELEASE.md)
- [Supabase Auth configuration](AUTH-SETUP.md)
- [Release QA results and outstanding gates](docs/QA-RELEASE.md)
- [RLS verification](tests/rls.test.md)

## Demo account

Set `DEMO_PASSWORD` only in a trusted local or Vercel Preview environment and run `npm run seed:demo`. Demo login is disabled in Production. Never run the seeder in browser code.

## Current release limitations

- Payment-provider integrations are not connected; the wallet UI does not accept or transfer real funds.
- Demo data is illustrative and must not be presented as verified property or investment disclosures.
- Production launch requires full browser QA, payment-provider and compliance review, production support ownership, and all release gates to pass.

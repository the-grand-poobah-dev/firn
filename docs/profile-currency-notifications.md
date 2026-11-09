# Profile photos, currency display, and notifications

## Profile photos

Profile photos are stored in the Supabase Storage `avatars` bucket. Objects are public-read for rendering, while authenticated uploads and deletes are restricted to the signed-in user's own `{user_id}/...` folder. The API accepts JPEG, PNG, WebP, or AVIF files up to 3 MB and stores the current public URL and object path in the existing `profiles.prefs` JSON field. No profile table column is required.

## Currency display

- Supported display currencies: USD and KES only.
- Fixed rate: `1 USD = 135 KES`.
- USDT deposits: `1 USDT = 1 USD`.
- Currency preference is saved in `profiles.currency`.
- Conversion is display-only. Wallet ledger entries, deposits, savings principal, and accrual calculations remain USD-denominated.

## Notifications

The notification centre reads the existing `public.notifications` table. The unread badge subscribes to the user's own rows through Supabase Realtime. Database triggers create welcome, deposit submission/review, withdrawal, KYC/account, new savings position, profit accrual, and administrator property-update notifications. Existing row-level security limits users to their own notification rows.

## Required database migration

Before deploying the profile-photo and event-notification features, apply:

`supabase/migrations/20261109053909_profile_avatar_and_notifications.sql`

It creates/configures the `avatars` bucket and owner-only storage policies, extends the existing `handle_new_user` trigger function with a welcome notification, adds event notification triggers, and adds `public.notifications` to the `supabase_realtime` publication. It does not create a new Supabase project or add a new Vercel secret.

Because the linked Supabase project is the production project and there is no separate development project, do not apply this migration without explicit approval to change the existing production database. After applying it, verify avatar upload, own-folder isolation, notification RLS, signup welcome notification, deposit review notices, and the live unread badge before declaring the features active.

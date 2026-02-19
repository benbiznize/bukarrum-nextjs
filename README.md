# Multi-tenant B2B Booking SaaS (MVP)

Next.js app for creative studios: public booking at `/studio/[slug]`, admin dashboard at `/app` with magic-link auth, Supabase (schema, RLS, seed), availability and booking APIs with conflict checks, and Resend confirmation emails.

## Environment

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `RESEND_API_KEY` — Resend API key for confirmation emails (optional; if missing, booking still works but no email is sent and the UI will say so). For production, add and verify a domain and set `RESEND_FROM` (e.g. `booking@yourdomain.com`); the default `onboarding@resend.dev` only delivers to your Resend account email.
- `APP_BASE_URL` — e.g. `http://localhost:3000`

## Runbook

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run SQL in order** in the Supabase SQL Editor:
   - `sql/001_schema.sql`
   - `sql/002_rls.sql`
   - `sql/003_seed.sql`

3. **Create an auth user** in Supabase Dashboard → Authentication → Users (e.g. add a user with your email). Copy the user’s UUID.

4. **Link the user to the demo tenant** in the SQL Editor:
   ```sql
   INSERT INTO tenant_members (tenant_id, user_id, role)
   SELECT id, '<your-user-uuid>', 'owner'
   FROM tenants WHERE slug = 'fotf';
   ```

5. **Set env vars** in `.env.local` (see Environment above).

6. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

7. **Test**
   - Open [http://localhost:3000/studio/fotf](http://localhost:3000/studio/fotf), complete a booking (room → service → date → time → customer details).
   - Open [http://localhost:3000/app](http://localhost:3000/app), sign in with the magic link sent to your email, then use the dashboard to manage Rooms, Services, Availability, and Bookings.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind 4
- Supabase (Postgres, Auth, RLS)
- Resend (email), Zod (validation), date-fns / date-fns-tz (availability)

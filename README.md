# TechFix IT Services

Booking-first IT services website built with Next.js, TypeScript and Supabase.

## V1 features
- Mobile-first responsive UI
- Dark green / yellow / white / black palette — no blue
- Real Pexels service photography; no AI-generated service images
- Service detail pages
- 4-step booking wizard
- Real Supabase booking creation
- Admin login with an HTTP-only session cookie
- Admin booking list and state-based actions
- Booking workflow: PENDING → APPROVED / REJECTED → IN_PROGRESS → COMPLETED
- Status history table and notification table prepared in PostgreSQL
- Confirmation page reads live booking status
- Smooth button/card animations with reduced-motion support

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL, service-role key and admin credentials.
4. Install dependencies with `npm install`.
5. Run `npm run dev`.

### Important security note
`SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed as a `NEXT_PUBLIC_*` variable.
The included admin login is a temporary single-admin V1 guard. For a larger production deployment, replace it with Clerk or another managed identity provider and keep the same booking/state model.

## WhatsApp
The confirmation WhatsApp button is configured for TechFix WhatsApp number `250786513474`.

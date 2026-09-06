# TechFix IT Services

Professional booking-first IT services website built with Next.js, TypeScript and Supabase.

## Product features
- Mobile-first responsive customer experience
- Dark green / yellow / white / black palette — no blue
- Real Pexels service photography; no AI-generated service images
- Service detail pages for laptop repair, Windows installation, crashed PC recovery, printer repair, InkPad resolution and other IT services
- 4-step booking wizard with live availability
- Server-side validation and active-slot conflict protection
- Africa/Kigali timezone-aware future booking validation
- Secure customer tracking with booking number + tracking token
- Customer status timeline: PENDING → APPROVED / REJECTED → IN_PROGRESS → COMPLETED
- Clear rejected-booking customer state without exposing internal admin notes
- Admin dashboard with search, filters, assignment and state-based smart actions
- Technician management API and technician assignment
- Booking audit history in PostgreSQL
- Prefilled TechFix WhatsApp message after booking
- Accessible focus states, responsive layouts and reduced-motion support
- GitHub Actions build verification

## Supabase setup
1. Create a Supabase project.
2. For a new database, open SQL Editor and run `supabase/schema.sql`.
3. For an existing TechFix database, run `supabase/migrations/002_tracking_token_hardening.sql`.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL, service-role key and admin credentials.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

### Important security note
`SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed as a `NEXT_PUBLIC_*` variable.
The included admin login is a temporary single-admin V1 guard. For a larger production deployment, replace it with Clerk or another managed identity provider and keep the same booking/state model.

Customer tracking deliberately does not expose the raw booking record publicly. The tracking endpoint requires the booking number and unique tracking token returned at booking creation. Internal admin notes are excluded from the public tracking response.

## Routes
- `/` — customer home
- `/book` — booking wizard
- `/confirmation` — secure booking confirmation
- `/track` — customer booking tracking
- `/services/[slug]` — service details
- `/admin/login` — admin sign-in
- `/admin` — protected admin dashboard

## Booking workflow
`NEW BOOKING → PENDING → APPROVED / REJECTED → IN PROGRESS → COMPLETED`

The admin dashboard exposes state-appropriate actions so an invalid workflow transition is not presented as a normal action.

## WhatsApp
TechFix WhatsApp is configured as `250786513474`. Booking messages are generated with the booking number, service, date and time.

## Availability
The public booking endpoint exposes the fixed service slots from 09:00 through 17:00. Active bookings (`PENDING`, `APPROVED`, `IN_PROGRESS`) block the selected slot, while `REJECTED` and `COMPLETED` bookings do not.

The database also enforces the active-slot rule, protecting against two customers submitting the same slot at nearly the same time.

## Validation
The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that installs dependencies and runs the production build on pushes and pull requests to `main`.

A successful local/CI build should be verified before production deployment; the repository does not claim a build has passed unless GitHub Actions reports a successful run.

# TechFix IT Services

Professional booking-first IT services website built with Next.js, TypeScript and Supabase.

## Product features
- Mobile-first responsive customer experience
- Dark green / yellow / white / black palette — no blue
- Real Pexels service photography; no AI-generated service images
- Service detail pages for laptop repair, Windows installation, crashed PC recovery, printer repair, InkPad resolution and other IT services
- 4-step booking wizard with live availability
- Server-side validation and active-slot conflict protection
- Secure customer tracking with booking number + tracking token
- Customer status timeline: PENDING → APPROVED / REJECTED → IN_PROGRESS → COMPLETED
- Admin dashboard with search, filters, assignment and state-based smart actions
- Technician management API and technician assignment
- Booking audit history in PostgreSQL
- Prefilled TechFix WhatsApp message after booking
- Accessible focus states, responsive layouts and reduced-motion support
- GitHub Actions build verification

## Supabase setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. If the project already contains an older TechFix schema, the script includes the tracking-token migration for existing bookings.
4. Copy `.env.example` to `.env.local` and fill in the Supabase URL, service-role key and admin credentials.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

### Important security note
`SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed as a `NEXT_PUBLIC_*` variable.
The included admin login is a temporary single-admin V1 guard. For a larger production deployment, replace it with Clerk or another managed identity provider and keep the same booking/state model.

Customer tracking deliberately does not expose the raw booking record publicly. The tracking endpoint requires the booking number and the unique tracking token returned at booking creation.

## Routes
- `/` — customer home
- `/book` — booking wizard
- `/confirmation` — secure booking confirmation
- `/track` — customer booking tracking
- `/services/[slug]` — service details
- `/admin/login` — admin sign-in
- `/admin` — protected admin dashboard

## WhatsApp
TechFix WhatsApp is configured as `250786513474`. Booking messages are generated with the booking number, service, date and time.

## Validation
The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that installs dependencies and runs the production build on pushes and pull requests to `main`.

-- TechFix production migration for an existing database.
-- Run this after the original TechFix schema has been created.

create extension if not exists pgcrypto;

alter table public.bookings
  add column if not exists tracking_token text;

update public.bookings
set tracking_token = encode(gen_random_bytes(18), 'hex')
where tracking_token is null;

alter table public.bookings
  alter column tracking_token set default encode(gen_random_bytes(18), 'hex');

alter table public.bookings
  alter column tracking_token set not null;

create unique index if not exists bookings_tracking_token_idx
  on public.bookings(tracking_token);

create index if not exists bookings_status_date_time_idx
  on public.bookings(status, preferred_date, preferred_time);

-- One active booking per time slot. Rejected and completed bookings do not block future slots.
drop index if exists public.bookings_active_slot_unique;
create unique index bookings_active_slot_unique
  on public.bookings(preferred_date, preferred_time)
  where status in ('PENDING', 'APPROVED', 'IN_PROGRESS');

-- Customer tracking must never expose internal admin notes.
comment on column public.bookings.admin_note is 'Internal admin-only note. Never expose through public customer tracking endpoints.';
comment on column public.bookings.tracking_token is 'Private customer proof used with booking_number for secure tracking.';

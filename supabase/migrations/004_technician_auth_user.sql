-- TECHFIX — Technician Supabase Auth linkage
-- Compatible with the existing technicians table where technicians.id is BIGINT.
-- Safe to run after the technician onboarding migration.

begin;

-- Link a technician record to its Supabase Auth user.
alter table public.technicians
  add column if not exists auth_user_id uuid;

create unique index if not exists technicians_auth_user_unique
on public.technicians(auth_user_id)
where auth_user_id is not null;

-- Track whether the temporary password created by Admin has been changed.
alter table public.technician_applications
  add column if not exists initial_password_set boolean not null default false;

commit;

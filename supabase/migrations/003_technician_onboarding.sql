-- TECHFIX — Technician onboarding, payment proof and technician accounts
-- Legacy-compatible with the live schema: technicians.id is BIGINT.
begin;

create extension if not exists pgcrypto;

create table if not exists public.technician_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  specialty text,
  notes text,
  payment_amount integer not null default 30000,
  payment_method text not null default 'MoMo Pay',
  payment_code text not null default '*182*8*1*935237#',
  payment_proof_path text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  technician_id bigint references public.technicians(id) on delete set null,
  initial_password_set boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technician_applications_status_idx
on public.technician_applications(status, created_at desc);
create unique index if not exists technician_applications_email_pending_unique
on public.technician_applications(lower(email))
where status='PENDING';

alter table public.technicians add column if not exists name text;
alter table public.technicians add column if not exists email text;
alter table public.technicians add column if not exists auth_user_id uuid;
alter table public.technicians add column if not exists password_hash text;
alter table public.technicians add column if not exists password_salt text;
alter table public.technicians add column if not exists last_login_at timestamptz;
update public.technicians set name=full_name where name is null and full_name is not null;

create unique index if not exists technicians_auth_user_unique
on public.technicians(auth_user_id)
where auth_user_id is not null;

insert into storage.buckets (id,name,public)
values ('technician-payment-proofs','technician-payment-proofs',false)
on conflict (id) do nothing;

alter table public.technician_applications enable row level security;

drop policy if exists technician_application_public_insert on public.technician_applications;
create policy technician_application_public_insert
on public.technician_applications for insert
with check (
  status='PENDING'
  and payment_amount=30000
  and payment_method='MoMo Pay'
  and payment_code='*182*8*1*935237#'
);

create or replace function public.set_technician_application_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists technician_applications_updated_at on public.technician_applications;
create trigger technician_applications_updated_at
before update on public.technician_applications
for each row execute function public.set_technician_application_updated_at();

revoke all on function public.set_technician_application_updated_at() from public;

commit;

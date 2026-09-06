create extension if not exists pgcrypto;

create type public.booking_status as enum('PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED');
create type public.user_role as enum('ADMIN','TECHNICIAN');

create table if not exists public.services(
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
  description text not null, active boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.technicians(
  id uuid primary key default gen_random_uuid(), name text not null, phone text, email text,
  active boolean not null default true, created_at timestamptz not null default now()
);

create sequence if not exists public.booking_number_seq start 1001;

create table if not exists public.bookings(
  id uuid primary key default gen_random_uuid(),
  booking_number text unique not null default('TF-'||nextval('public.booking_number_seq')::text),
  tracking_token text unique not null default encode(gen_random_bytes(18),'hex'),
  service_id uuid references public.services(id) on delete restrict,
  service_slug text not null, service_name text not null,
  customer_name text not null, customer_phone text not null,
  preferred_date date not null, preferred_time time not null,
  notes text, status public.booking_status not null default 'PENDING',
  technician_id uuid references public.technicians(id) on delete set null,
  rejection_reason text, admin_note text,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Safe migration for databases that already contain the bookings table.
alter table public.bookings add column if not exists tracking_token text;
update public.bookings set tracking_token=encode(gen_random_bytes(18),'hex') where tracking_token is null;
alter table public.bookings alter column tracking_token set default encode(gen_random_bytes(18),'hex');
alter table public.bookings alter column tracking_token set not null;
create unique index if not exists bookings_tracking_token_idx on public.bookings(tracking_token);

create table if not exists public.booking_status_history(
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status, to_status public.booking_status not null, note text, changed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications(
  id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id) on delete cascade,
  channel text not null, recipient text not null, subject text, message text not null,
  sent_at timestamptz, created_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_date_idx on public.bookings(preferred_date,preferred_time);
create index if not exists history_booking_idx on public.booking_status_history(booking_id,created_at desc);
create index if not exists bookings_technician_idx on public.bookings(technician_id,status);

drop index if exists public.bookings_active_slot_unique;
create unique index bookings_active_slot_unique on public.bookings(preferred_date,preferred_time)
where status in ('PENDING','APPROVED','IN_PROGRESS');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.record_booking_status_change() returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then
    insert into public.booking_status_history(booking_id,from_status,to_status,changed_by) values(new.id,null,new.status,'SYSTEM');
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history(booking_id,from_status,to_status,changed_by,note)
    values(new.id,old.status,new.status,'ADMIN',case when new.status='REJECTED' then new.rejection_reason else null end);
  end if;
  return new;
end; $$;

drop trigger if exists bookings_status_history on public.bookings;
create trigger bookings_status_history after insert or update of status on public.bookings for each row execute function public.record_booking_status_change();

insert into public.services(slug,name,description) values
('laptop-repair','Laptop Repair','Hardware diagnostics, screen, keyboard, charging and motherboard repair.'),
('windows-installation','Windows Installation','Clean Windows installation, drivers, updates and essential setup.'),
('crashed-pc-recovery','Crashed PC Recovery','Recover unstable, slow or crashed computers and get your workflow back.'),
('printer-repair','Printer Repair','Printer troubleshooting, maintenance and hardware repair.'),
('inkpad-resolution','InkPad Resolution','Resolve supported Epson InkPad / waste-ink service errors.'),
('other-it-services','Other IT Services','Custom IT diagnosis, software troubleshooting and device setup.')
on conflict(slug) do update set name=excluded.name,description=excluded.description;

alter table public.services enable row level security;
alter table public.technicians enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.notifications enable row level security;

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select using(active=true);

drop policy if exists bookings_public_insert on public.bookings;
create policy bookings_public_insert on public.bookings for insert with check(status='PENDING' and technician_id is null);

-- Customer tracking uses booking_number + tracking_token. Never expose the raw customer record publicly.
-- Run this schema in Supabase SQL Editor before production deployment.
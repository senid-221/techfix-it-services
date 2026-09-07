-- TECHFIX — Customer technician selection, location matching and technician job fee
-- Non-destructive migration for the existing BIGINT technician schema.

begin;

alter table public.technicians
  add column if not exists province text,
  add column if not exists district text,
  add column if not exists sector text,
  add column if not exists cell text,
  add column if not exists address text,
  add column if not exists google_maps_url text,
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists service_radius_km numeric(6,2) not null default 10,
  add column if not exists specialties text[] not null default '{}';

alter table public.services add column if not exists technician_job_fee integer not null default 2000;
alter table public.services drop constraint if exists services_technician_job_fee_check;
alter table public.services add constraint services_technician_job_fee_check check (technician_job_fee between 2000 and 10000);

alter table public.bookings
  add column if not exists requested_technician_id bigint references public.technicians(id) on delete set null,
  add column if not exists technician_selection_status text not null default 'NONE',
  add column if not exists technician_job_fee integer,
  add column if not exists technician_fee_status text not null default 'NOT_REQUIRED';

alter table public.bookings drop constraint if exists bookings_technician_selection_status_check;
alter table public.bookings add constraint bookings_technician_selection_status_check check (technician_selection_status in ('NONE','PENDING','APPROVED','REJECTED'));
alter table public.bookings drop constraint if exists bookings_technician_fee_status_check;
alter table public.bookings add constraint bookings_technician_fee_status_check check (technician_fee_status in ('NOT_REQUIRED','PENDING_PAYMENT','PROOF_SUBMITTED','PAID','REJECTED'));

create index if not exists technicians_location_idx on public.technicians(active, province, district, sector);
create index if not exists bookings_requested_technician_idx on public.bookings(requested_technician_id, technician_selection_status);

create table if not exists public.technician_job_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  technician_id bigint not null references public.technicians(id) on delete cascade,
  amount integer not null check (amount between 2000 and 10000),
  payment_method text not null default 'MoMo Pay',
  payment_code text not null default '*182*8*1*935237#',
  payment_proof_path text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists technician_job_payments_one_active_per_booking on public.technician_job_payments(booking_id) where status in ('PENDING','APPROVED');
create index if not exists technician_job_payments_status_idx on public.technician_job_payments(status, created_at desc);

insert into public.services (slug,name,description,active,published,category_slug,category_name,category_name_rw,name_rw,description_rw,price_type,currency,booking_methods,technician_job_fee)
select 'inkpad-resolution','InkPad Resolution','Resolve supported Epson InkPad / waste-ink service errors and restore printing.',true,true,'printers-office','Printers & Office Equipment','Printer n’Ibikoresho by’Ibiro','Gukemura InkPad','Gukemura InkPad / waste-ink service errors ku ma printer ashyigikiwe.','QUOTE','RWF',array['CENTER','ON_SITE']::text[],2000
where not exists (select 1 from public.services where slug='inkpad-resolution');

update public.services set category_slug='printers-office', category_name='Printers & Office Equipment', category_name_rw='Printer n’Ibikoresho by’Ibiro', technician_job_fee=greatest(2000, least(coalesce(technician_job_fee,2000),10000)) where slug in ('printer-repair','inkpad-resolution');
update public.services set category_slug='computers-laptops', category_name='Computers & Laptops', category_name_rw='Mudasobwa na Laptop' where slug in ('laptop-repair','crashed-pc-recovery');
update public.services set category_slug='windows-os', category_name='Windows & Operating System', category_name_rw='Windows na Operating System' where slug='windows-installation';

commit;

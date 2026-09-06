begin;

alter table public.technicians add column if not exists auth_user_id uuid;
create unique index if not exists technicians_auth_user_unique on public.technicians(auth_user_id) where auth_user_id is not null;

alter table public.technician_applications add column if not exists initial_password_set boolean not null default false;

commit;

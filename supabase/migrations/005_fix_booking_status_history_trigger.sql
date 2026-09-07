-- Align the booking status audit trigger with the live Supabase schema.
-- Live booking_status_history uses old_status/new_status, not from_status/to_status.
-- Live bookings also stores rejection notes in admin_note.

begin;

create or replace function public.record_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by
    )
    values (
      new.id,
      null,
      new.status,
      'ADMIN'
    );
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      note
    )
    values (
      new.id,
      old.status,
      new.status,
      'ADMIN',
      case when new.status = 'REJECTED' then new.admin_note else null end
    );
  end if;

  return new;
end;
$$;

revoke all on function public.record_booking_status_change() from public;

commit;

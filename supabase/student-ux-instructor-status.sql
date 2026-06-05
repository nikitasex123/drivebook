alter table public.bookings
  add column if not exists status text not null default 'new';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_status_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_status_check
      check (status in ('new', 'confirmed', 'completed', 'cancelled'));
  end if;
end;
$$;

create or replace view public.booked_slots as
select
  id,
  lesson_date,
  lesson_time,
  instructor_id
from public.bookings
where status <> 'cancelled';

create or replace view public.school_directory as
select
  id,
  name,
  slug,
  is_active
from public.schools
where is_active = true;

grant select on public.booked_slots to anon, authenticated;
grant select on public.school_directory to anon, authenticated;

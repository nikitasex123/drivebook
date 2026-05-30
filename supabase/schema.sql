create table if not exists public.instructors (
  id text primary key,
  first_name text not null,
  last_name text not null,
  patronymic text default '',
  phone text default '',
  email text default '',
  login text not null unique,
  password text not null,
  schedule jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  lesson_date date not null,
  lesson_time time not null,
  student_name text not null,
  phone text not null,
  email text default '',
  instructor_id text not null references public.instructors(id) on delete cascade,
  instructor_name text not null,
  comment text default '',
  mailing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists bookings_instructor_date_idx
  on public.bookings (instructor_id, lesson_date, lesson_time);

create index if not exists bookings_date_time_idx
  on public.bookings (lesson_date, lesson_time);

create or replace view public.booked_slots as
select
  id,
  lesson_date,
  lesson_time,
  instructor_id
from public.bookings;

alter table public.instructors enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "MVP public read instructors" on public.instructors;
drop policy if exists "MVP public create instructors" on public.instructors;
drop policy if exists "MVP public update instructors" on public.instructors;
drop policy if exists "MVP public read bookings" on public.bookings;
drop policy if exists "MVP public create bookings" on public.bookings;
drop policy if exists "MVP public update bookings" on public.bookings;
drop policy if exists "MVP public delete bookings" on public.bookings;

create policy "MVP public read instructors"
  on public.instructors for select
  using (true);

create policy "MVP public create instructors"
  on public.instructors for insert
  with check (true);

create policy "MVP public update instructors"
  on public.instructors for update
  using (true)
  with check (true);

create policy "MVP public read bookings"
  on public.bookings for select
  using (true);

create policy "MVP public create bookings"
  on public.bookings for insert
  with check (true);

create policy "MVP public update bookings"
  on public.bookings for update
  using (true)
  with check (true);

create policy "MVP public delete bookings"
  on public.bookings for delete
  using (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists instructors_touch_updated_at on public.instructors;
create trigger instructors_touch_updated_at
before update on public.instructors
for each row execute function public.touch_updated_at();

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

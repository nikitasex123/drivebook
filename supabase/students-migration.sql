create table if not exists public.students (
  id text primary key,
  first_name text not null,
  last_name text not null,
  patronymic text default '',
  phone text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists student_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_student_id_fkey'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_student_id_fkey
      foreign key (student_id)
      references public.students(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists bookings_student_idx
  on public.bookings (student_id, lesson_date, lesson_time);

alter table public.students enable row level security;

drop policy if exists "MVP public read students" on public.students;
drop policy if exists "MVP public create students" on public.students;
drop policy if exists "MVP public update students" on public.students;

create policy "MVP public read students"
  on public.students for select
  using (true);

create policy "MVP public create students"
  on public.students for insert
  with check (true);

create policy "MVP public update students"
  on public.students for update
  using (true)
  with check (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists students_touch_updated_at on public.students;
create trigger students_touch_updated_at
before update on public.students
for each row execute function public.touch_updated_at();

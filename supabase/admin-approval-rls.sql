create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  invite_key text not null unique,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_invite_key_check check (length(trim(invite_key)) >= 8)
);

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

alter table public.instructors
  add column if not exists status text not null default 'pending',
  add column if not exists school_id uuid references public.schools(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructors_status_check'
      and conrelid = 'public.instructors'::regclass
  ) then
    alter table public.instructors
      add constraint instructors_status_check
      check (status in ('pending', 'approved', 'blocked'));
  end if;
end;
$$;

alter table public.bookings
  add column if not exists student_id text,
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

create unique index if not exists bookings_unique_active_slot_idx
  on public.bookings (instructor_id, lesson_date, lesson_time)
  where status <> 'cancelled';

create index if not exists instructors_school_idx
  on public.instructors (school_id, status);

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

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_drivebook_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where id = auth.uid()
  );
$$;

create or replace function public.is_active_school(input_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schools
    where id = input_school_id
      and is_active = true
  );
$$;

create or replace function public.get_school_by_invite_key(input_key text)
returns table (
  id uuid,
  name text,
  slug text,
  invite_key text,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    schools.id,
    schools.name,
    schools.slug,
    schools.invite_key,
    schools.is_active
  from public.schools
  where schools.invite_key = upper(regexp_replace(trim(input_key), '[[:space:]]+', '', 'g'))
    and schools.is_active = true
  limit 1;
$$;

create or replace function public.is_approved_instructor(instructor_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.instructors
    where id = instructor_id
      and status = 'approved'
  );
$$;

alter table public.admins enable row level security;
alter table public.schools enable row level security;
alter table public.instructors enable row level security;
alter table public.students enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "MVP public read instructors" on public.instructors;
drop policy if exists "MVP public create instructors" on public.instructors;
drop policy if exists "MVP public update instructors" on public.instructors;
drop policy if exists "MVP public read students" on public.students;
drop policy if exists "MVP public create students" on public.students;
drop policy if exists "MVP public update students" on public.students;
drop policy if exists "MVP public read bookings" on public.bookings;
drop policy if exists "MVP public create bookings" on public.bookings;
drop policy if exists "MVP public update bookings" on public.bookings;
drop policy if exists "MVP public delete bookings" on public.bookings;

drop policy if exists "Admins can read own admin row" on public.admins;
drop policy if exists "Admins can read schools" on public.schools;
drop policy if exists "Admins can create schools" on public.schools;
drop policy if exists "Admins can update schools" on public.schools;
drop policy if exists "Admins can read instructors" on public.instructors;
drop policy if exists "Users can read approved or own instructor" on public.instructors;
drop policy if exists "Users can request instructor approval" on public.instructors;
drop policy if exists "Approved instructors can update own profile" on public.instructors;
drop policy if exists "Admins can update instructors" on public.instructors;
drop policy if exists "Users can read own student profile" on public.students;
drop policy if exists "Users can create own student profile" on public.students;
drop policy if exists "Users can update own student profile" on public.students;
drop policy if exists "Users can read related bookings" on public.bookings;
drop policy if exists "Students can create own bookings" on public.bookings;
drop policy if exists "Instructors can update own bookings" on public.bookings;
drop policy if exists "Students can update own bookings" on public.bookings;
drop policy if exists "Instructors can delete own bookings" on public.bookings;

create policy "Admins can read own admin row"
  on public.admins for select
  using (id = auth.uid());

create policy "Admins can read schools"
  on public.schools for select
  using (public.is_drivebook_admin());

create policy "Admins can create schools"
  on public.schools for insert
  with check (public.is_drivebook_admin());

create policy "Admins can update schools"
  on public.schools for update
  using (public.is_drivebook_admin())
  with check (public.is_drivebook_admin());

create policy "Users can read approved or own instructor"
  on public.instructors for select
  using (
    status = 'approved'
    or id = auth.uid()::text
    or public.is_drivebook_admin()
  );

create policy "Users can request instructor approval"
  on public.instructors for insert
  with check (
    auth.uid() is not null
    and id = auth.uid()::text
    and status = 'pending'
    and school_id is not null
    and public.is_active_school(school_id)
  );

create policy "Approved instructors can update own profile"
  on public.instructors for update
  using (
    auth.uid() is not null
    and id = auth.uid()::text
    and status = 'approved'
  )
  with check (
    id = auth.uid()::text
    and status = 'approved'
  );

create policy "Admins can update instructors"
  on public.instructors for update
  using (public.is_drivebook_admin())
  with check (public.is_drivebook_admin());

create policy "Users can read own student profile"
  on public.students for select
  using (
    id = auth.uid()::text
    or public.is_drivebook_admin()
  );

create policy "Users can create own student profile"
  on public.students for insert
  with check (
    auth.uid() is not null
    and id = auth.uid()::text
  );

create policy "Users can update own student profile"
  on public.students for update
  using (
    id = auth.uid()::text
    or public.is_drivebook_admin()
  )
  with check (
    id = auth.uid()::text
    or public.is_drivebook_admin()
  );

create policy "Users can read related bookings"
  on public.bookings for select
  using (
    public.is_drivebook_admin()
    or student_id = auth.uid()::text
    or instructor_id = auth.uid()::text
  );

create policy "Students can create own bookings"
  on public.bookings for insert
  with check (
    auth.uid() is not null
    and student_id = auth.uid()::text
    and public.is_approved_instructor(instructor_id)
  );

create policy "Instructors can update own bookings"
  on public.bookings for update
  using (
    public.is_drivebook_admin()
    or instructor_id = auth.uid()::text
  )
  with check (
    public.is_drivebook_admin()
    or instructor_id = auth.uid()::text
  );

create policy "Students can update own bookings"
  on public.bookings for update
  using (
    student_id = auth.uid()::text
  )
  with check (
    student_id = auth.uid()::text
  );

create policy "Instructors can delete own bookings"
  on public.bookings for delete
  using (
    public.is_drivebook_admin()
    or instructor_id = auth.uid()::text
  );

drop trigger if exists instructors_touch_updated_at on public.instructors;
create trigger instructors_touch_updated_at
before update on public.instructors
for each row execute function public.touch_updated_at();

drop trigger if exists schools_touch_updated_at on public.schools;
create trigger schools_touch_updated_at
before update on public.schools
for each row execute function public.touch_updated_at();

drop trigger if exists students_touch_updated_at on public.students;
create trigger students_touch_updated_at
before update on public.students
for each row execute function public.touch_updated_at();

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

grant select, insert, update on public.schools to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select on public.booked_slots to anon, authenticated;
grant select on public.school_directory to anon, authenticated;
grant execute on function public.is_drivebook_admin() to anon, authenticated;
grant execute on function public.is_active_school(uuid) to anon, authenticated;
grant execute on function public.get_school_by_invite_key(text) to anon, authenticated;
grant execute on function public.is_approved_instructor(text) to anon, authenticated;

-- Replace this email with your admin account email, then run the whole file.
-- The account must already exist in Supabase Auth.
insert into public.admins (id, email)
select id, email
from auth.users
where email = 'YOUR_ADMIN_EMAIL_HERE'
on conflict (id) do update
set email = excluded.email;

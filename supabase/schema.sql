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

create table if not exists public.instructors (
  id text primary key,
  first_name text not null,
  last_name text not null,
  patronymic text default '',
  phone text default '',
  email text default '',
  login text not null unique,
  password text not null,
  status text not null default 'pending',
  school_id uuid references public.schools(id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  schedule jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructors_status_check check (status in ('pending', 'approved', 'blocked'))
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

create table if not exists public.bookings (
  id text primary key,
  lesson_date date not null,
  lesson_time time not null,
  student_name text not null,
  phone text not null,
  email text default '',
  student_id text references public.students(id) on delete set null,
  instructor_id text not null references public.instructors(id) on delete cascade,
  instructor_name text not null,
  status text not null default 'new',
  comment text default '',
  mailing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint bookings_status_check check (status in ('new', 'confirmed', 'completed', 'cancelled'))
);

create index if not exists bookings_instructor_date_idx
  on public.bookings (instructor_id, lesson_date, lesson_time);

create index if not exists bookings_date_time_idx
  on public.bookings (lesson_date, lesson_time);

create index if not exists bookings_student_idx
  on public.bookings (student_id, lesson_date, lesson_time);

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
grant select on public.booked_slots to anon, authenticated;
grant select on public.school_directory to anon, authenticated;
grant execute on function public.is_drivebook_admin() to anon, authenticated;
grant execute on function public.is_active_school(uuid) to anon, authenticated;
grant execute on function public.get_school_by_invite_key(text) to anon, authenticated;
grant execute on function public.is_approved_instructor(text) to anon, authenticated;

create extension if not exists pgcrypto;

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

alter table public.instructors
  add column if not exists school_id uuid references public.schools(id) on delete set null;

create index if not exists instructors_school_idx
  on public.instructors (school_id, status);

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

alter table public.schools enable row level security;

drop policy if exists "Admins can read schools" on public.schools;
drop policy if exists "Admins can create schools" on public.schools;
drop policy if exists "Admins can update schools" on public.schools;
drop policy if exists "Users can request instructor approval" on public.instructors;

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

create policy "Users can request instructor approval"
  on public.instructors for insert
  with check (
    auth.uid() is not null
    and id = auth.uid()::text
    and status = 'pending'
    and school_id is not null
    and public.is_active_school(school_id)
  );

drop trigger if exists schools_touch_updated_at on public.schools;
create trigger schools_touch_updated_at
before update on public.schools
for each row execute function public.touch_updated_at();

grant select, insert, update on public.schools to authenticated;
grant execute on function public.is_active_school(uuid) to anon, authenticated;
grant execute on function public.get_school_by_invite_key(text) to anon, authenticated;

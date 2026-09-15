-- 0001_profiles.sql
-- Staff/customer accounts, role enum, and the RLS building blocks every later
-- migration relies on: a shared updated_at trigger and a current_role() helper.

create type role as enum ('admin', 'manager', 'sales', 'technician', 'customer');

-- Reusable updated_at trigger function — used by every table with an updated_at column.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role role not null default 'technician',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per staff/customer account, extends auth.users with role and status.';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created (invite/sign-up).
-- Role/full_name can be seeded via user metadata at invite time; defaults to
-- 'technician' so a forgotten metadata field never silently grants elevated access.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::role, 'technician')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Returns the calling user's role. security definer so it can read profiles
-- even from within another table's RLS policy (which runs as the caller,
-- who may not otherwise have SELECT on profiles for arbitrary rows).
create function public.current_role()
returns role
language sql
stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_self"
  on public.profiles for select
  using (id = auth.uid());

-- Staff need to see each other (technician assignment dropdowns, "created by"
-- attribution, etc.) but never need to see customer portal accounts here.
create policy "profiles_select_staff_directory"
  on public.profiles for select
  using (public.current_role() <> 'customer' and role <> 'customer');

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- A user editing their own row (via profiles_update_self) must not be able to
-- promote themselves or reactivate/deactivate their own account — only an
-- admin (who goes through the same trigger, hence the current_role() escape
-- hatch) can change role or is_active.
create function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() <> 'admin' and
     (new.role <> old.role or new.is_active <> old.is_active) then
    raise exception 'Only administrators can change role or active status';
  end if;
  return new;
end;
$$;

create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();

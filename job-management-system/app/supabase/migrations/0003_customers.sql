-- 0003_customers.sql

create type customer_type as enum ('individual', 'business');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_type customer_type not null default 'individual',
  name text not null,
  company_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  postal_code text,
  notes text,
  auth_user_id uuid references auth.users (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is 'Customers and their contact/site details.';

create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create index customers_name_idx on public.customers using gin (to_tsvector('simple', name || ' ' || coalesce(company_name, '')));

alter table public.customers enable row level security;

-- Full access for staff who run the front-of-house workflow. Technicians get
-- their own narrower policy added in 0004_jobs.sql once the jobs table (which
-- their visibility depends on) exists. Customers get their own policy here
-- since it only depends on customers.auth_user_id, already defined.
create policy "customers_all_admin_manager_sales"
  on public.customers for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

create policy "customers_select_self_portal"
  on public.customers for select
  using (auth_user_id = auth.uid());

-- 0010_fix_rls_recursion.sql
-- customers_select_technician_via_job (0004) queries jobs directly in its
-- USING clause, and jobs_select_customer_own (0004) queries customers
-- directly in its USING clause. Since neither runs inside a
-- SECURITY DEFINER function, both execute as the calling role and are
-- themselves subject to the other table's RLS — so evaluating a plain
-- SELECT on customers (as any role) recurses into jobs' policies, which
-- recurses back into customers' policies, forever: Postgres error 42P17,
-- "infinite recursion detected in policy for relation customers", on every
-- query against either table. Wrapping each cross-table check in a
-- SECURITY DEFINER function (same pattern as current_role() and
-- can_access_entity()) makes the inner lookup bypass RLS entirely, breaking
-- the cycle.

create function public.customer_belongs_to_technician(p_customer_id uuid)
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.jobs
    where jobs.customer_id = p_customer_id
      and jobs.assigned_technician_id = auth.uid()
  );
$$;

drop policy "customers_select_technician_via_job" on public.customers;

create policy "customers_select_technician_via_job"
  on public.customers for select
  using (public.current_role() = 'technician' and public.customer_belongs_to_technician(id));

create function public.portal_customer_ids()
returns setof uuid
language sql
stable security definer set search_path = public
as $$
  select id from public.customers where auth_user_id = auth.uid();
$$;

drop policy "jobs_select_customer_own" on public.jobs;

create policy "jobs_select_customer_own"
  on public.jobs for select
  using (customer_id in (select public.portal_customer_ids()));

-- quotes_select_customer_own / invoices_select_customer_own (0007) have the
-- same raw "customer_id in (select id from customers where ...)" shape.
-- They don't currently form a cycle (customers' policies don't reference
-- quotes/invoices), but they'd become one the moment a future migration
-- added a customers policy that looked at quotes/invoices — switch them to
-- the same safe helper now while it's cheap, rather than waiting for that
-- to happen and re-debugging the same error.
drop policy "quotes_select_customer_own" on public.quotes;

create policy "quotes_select_customer_own"
  on public.quotes for select
  using (customer_id in (select public.portal_customer_ids()));

drop policy "invoices_select_customer_own" on public.invoices;

create policy "invoices_select_customer_own"
  on public.invoices for select
  using (customer_id in (select public.portal_customer_ids()));

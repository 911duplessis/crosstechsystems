-- 0004_jobs.sql
-- The central lifecycle entity: enquiry -> booking -> job -> completion ->
-- archive, all as one record moving through `status`.

create type job_status as enum (
  'new_enquiry',
  'scheduled',
  'inspection_required',
  'quote_pending',
  'quote_sent',
  'approved',
  'work_in_progress',
  'completed',
  'invoice_issued',
  'paid',
  'archived',
  'cancelled'
);

create type job_priority as enum ('low', 'normal', 'high', 'urgent');

create type job_source as enum ('phone', 'whatsapp', 'email', 'walk_in', 'website', 'referral');

-- Job numbers are CTS-<year created>-<sequence>. The sequence is continuous
-- (not reset per year) to keep number generation a single atomic operation
-- with no risk of collisions under concurrent inserts; the year segment is
-- still meaningful because it's the job's actual creation year.
create sequence public.job_number_seq;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text unique,
  customer_id uuid not null references public.customers (id),
  assigned_technician_id uuid references public.profiles (id),
  service_requested text not null,
  service_category text,
  priority job_priority not null default 'normal',
  status job_status not null default 'new_enquiry',
  source job_source not null default 'phone',
  site_address_line1 text,
  site_address_line2 text,
  site_city text,
  site_postal_code text,
  preferred_date date,
  scheduled_date timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.jobs is 'Single lifecycle record from enquiry through archive; see status enum for stages.';

create index jobs_customer_id_idx on public.jobs (customer_id);
create index jobs_assigned_technician_id_idx on public.jobs (assigned_technician_id);
create index jobs_status_idx on public.jobs (status);

create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create function public.generate_job_number()
returns trigger
language plpgsql
as $$
begin
  if new.job_number is null then
    new.job_number := 'CTS-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.job_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger jobs_set_job_number
  before insert on public.jobs
  for each row execute function public.generate_job_number();

-- Immutable timeline of every status a job has passed through, including its
-- creation. This is the "job history" visibility the business needs — a
-- dedicated table rather than folding into audit_logs, since it's read
-- constantly on the job detail page, not just for after-the-fact review.
create table public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  old_status job_status,
  new_status job_status not null,
  note text,
  changed_by uuid not null references public.profiles (id),
  changed_at timestamptz not null default now()
);

create index job_status_history_job_id_idx on public.job_status_history (job_id);

create function public.log_job_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.job_status_history (job_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, coalesce(auth.uid(), new.created_by));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.job_status_history (job_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger jobs_log_status_change
  after insert or update on public.jobs
  for each row execute function public.log_job_status_change();

-- A technician may update jobs assigned to them (status, scheduling, notes)
-- but must not be able to reassign the job elsewhere or repoint it at a
-- different customer — those are dispatch/sales decisions.
create function public.prevent_technician_job_reassignment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_role() = 'technician' and (
    new.assigned_technician_id is distinct from old.assigned_technician_id or
    new.customer_id is distinct from old.customer_id
  ) then
    raise exception 'Technicians cannot reassign jobs or change the linked customer';
  end if;
  return new;
end;
$$;

create trigger jobs_prevent_technician_reassignment
  before update on public.jobs
  for each row execute function public.prevent_technician_job_reassignment();

alter table public.jobs enable row level security;

create policy "jobs_all_admin_manager_sales"
  on public.jobs for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

create policy "jobs_select_technician_own"
  on public.jobs for select
  using (public.current_role() = 'technician' and assigned_technician_id = auth.uid());

create policy "jobs_update_technician_own"
  on public.jobs for update
  using (public.current_role() = 'technician' and assigned_technician_id = auth.uid())
  with check (public.current_role() = 'technician' and assigned_technician_id = auth.uid());

-- Phase 4/5 hook: a customer portal account sees only its own jobs.
create policy "jobs_select_customer_own"
  on public.jobs for select
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

alter table public.job_status_history enable row level security;

create policy "job_status_history_select_staff"
  on public.job_status_history for select
  using (
    public.current_role() in ('admin', 'manager', 'sales') or (
      public.current_role() = 'technician' and
      job_id in (select id from public.jobs where assigned_technician_id = auth.uid())
    )
  );

-- No insert/delete policy: rows are created exclusively by the
-- jobs_log_status_change trigger (security definer). An update policy exists
-- only so the actor who triggered a transition can attach a short note
-- afterwards (e.g. "customer asked to reschedule") — a trigger below
-- restricts that update to the `note` column only, so the transition record
-- itself (who/when/what) stays immutable.
create policy "job_status_history_update_own_note"
  on public.job_status_history for update
  using (changed_by = auth.uid())
  with check (changed_by = auth.uid());

create function public.restrict_job_status_history_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.job_id is distinct from old.job_id or
     new.old_status is distinct from old.old_status or
     new.new_status is distinct from old.new_status or
     new.changed_by is distinct from old.changed_by or
     new.changed_at is distinct from old.changed_at then
    raise exception 'Only the note on a status history entry can be edited';
  end if;
  return new;
end;
$$;

create trigger job_status_history_restrict_update
  before update on public.job_status_history
  for each row execute function public.restrict_job_status_history_update();

-- Deferred from 0003_customers.sql: technicians can see a customer only
-- through a job actually assigned to them.
create policy "customers_select_technician_via_job"
  on public.customers for select
  using (
    public.current_role() = 'technician' and exists (
      select 1 from public.jobs
      where jobs.customer_id = customers.id
        and jobs.assigned_technician_id = auth.uid()
    )
  );

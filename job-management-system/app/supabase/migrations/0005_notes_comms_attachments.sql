-- 0005_notes_comms_attachments.sql
-- Job notes (fault-finding/materials/labour/internal comments), customer
-- communication history, and file attachments (before/after photos,
-- documents) shared across jobs/quotes/invoices/customers.

create type job_note_type as enum (
  'fault_finding',
  'materials_required',
  'labour_estimate',
  'internal_comment',
  'general'
);

create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  note_type job_note_type not null default 'general',
  content text not null,
  time_estimate_hours numeric(5, 2),
  author_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index job_notes_job_id_idx on public.job_notes (job_id);

alter table public.job_notes enable row level security;

create policy "job_notes_all_admin_manager_sales"
  on public.job_notes for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

-- A technician can read/manage notes on any job currently assigned to them
-- (collaborative — not restricted to notes they personally authored), but
-- can only author new notes as themselves.
create policy "job_notes_technician_own_job"
  on public.job_notes for all
  using (
    public.current_role() = 'technician' and
    job_id in (select id from public.jobs where assigned_technician_id = auth.uid())
  )
  with check (
    public.current_role() = 'technician' and
    job_id in (select id from public.jobs where assigned_technician_id = auth.uid()) and
    author_id = auth.uid()
  );

create type comm_channel as enum ('phone', 'whatsapp', 'email', 'in_person', 'sms');
create type comm_direction as enum ('inbound', 'outbound');

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  job_id uuid references public.jobs (id),
  channel comm_channel not null,
  direction comm_direction not null,
  summary text not null,
  logged_by uuid not null references public.profiles (id),
  occurred_at timestamptz not null default now()
);

create index communication_logs_customer_id_idx on public.communication_logs (customer_id);
create index communication_logs_job_id_idx on public.communication_logs (job_id);

alter table public.communication_logs enable row level security;

create policy "communication_logs_all_admin_manager_sales"
  on public.communication_logs for all
  using (public.current_role() in ('admin', 'manager', 'sales'))
  with check (public.current_role() in ('admin', 'manager', 'sales'));

-- Technicians only log/read communications tied to a job assigned to them —
-- general customer-level contact (job_id null) is a sales/office function.
create policy "communication_logs_technician_own_job"
  on public.communication_logs for all
  using (
    public.current_role() = 'technician' and
    job_id in (select id from public.jobs where assigned_technician_id = auth.uid())
  )
  with check (
    public.current_role() = 'technician' and
    job_id in (select id from public.jobs where assigned_technician_id = auth.uid()) and
    logged_by = auth.uid()
  );

create type attachment_entity_type as enum ('job', 'quote', 'invoice', 'customer');

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type attachment_entity_type not null,
  entity_id uuid not null,
  file_path text not null,
  file_type text,
  caption text,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index attachments_entity_idx on public.attachments (entity_type, entity_id);

-- entity_id is polymorphic (not a real FK), so visibility can't be a simple
-- join — this mirrors the read rules of the table each entity_type points
-- at. quote/invoice arrive in Phase 2; until those tables exist nothing can
-- satisfy that branch, so those attachment rows are staff-only by the
-- earlier admin/manager/sales check.
create function public.can_access_entity(p_entity_type attachment_entity_type, p_entity_id uuid)
returns boolean
language plpgsql
stable security definer set search_path = public
as $$
begin
  if public.current_role() in ('admin', 'manager', 'sales') then
    return true;
  end if;

  if p_entity_type = 'job' then
    return exists (
      select 1 from public.jobs
      where id = p_entity_id
        and (
          assigned_technician_id = auth.uid() or
          customer_id in (select id from public.customers where auth_user_id = auth.uid())
        )
    );
  elsif p_entity_type = 'customer' then
    return exists (
      select 1 from public.customers
      where id = p_entity_id
        and (
          auth_user_id = auth.uid() or
          exists (
            select 1 from public.jobs
            where jobs.customer_id = customers.id and jobs.assigned_technician_id = auth.uid()
          )
        )
    );
  else
    return false;
  end if;
end;
$$;

alter table public.attachments enable row level security;

create policy "attachments_select"
  on public.attachments for select
  using (public.can_access_entity(entity_type, entity_id));

create policy "attachments_insert"
  on public.attachments for insert
  with check (public.can_access_entity(entity_type, entity_id) and uploaded_by = auth.uid());

create policy "attachments_delete"
  on public.attachments for delete
  using (public.current_role() in ('admin', 'manager') or uploaded_by = auth.uid());

-- Storage bucket + object-level policies mirroring the same access rule.
-- Object paths are `<entity_type>/<entity_id>/<filename>` so the folder
-- name alone (no extra table lookup) tells us which entity a file belongs
-- to.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'attachments' and
    public.can_access_entity(
      (storage.foldername(name))[1]::attachment_entity_type,
      (storage.foldername(name))[2]::uuid
    )
  );

create policy "attachments_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments' and
    public.can_access_entity(
      (storage.foldername(name))[1]::attachment_entity_type,
      (storage.foldername(name))[2]::uuid
    )
  );

create policy "attachments_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'attachments' and
    (public.current_role() in ('admin', 'manager') or owner = auth.uid())
  );

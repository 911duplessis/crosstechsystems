-- 0002_audit_log.sql
-- Append-only audit trail. Rows are written exclusively by trigger functions
-- (security definer, owned by the migration role) — never by direct client
-- inserts — so the log can't be silently skipped by an application bug.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Immutable audit trail, populated by triggers on sensitive tables. No client insert/update/delete.';

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_user_idx on public.audit_logs (user_id);

alter table public.audit_logs enable row level security;

-- No insert/update/delete policy is defined for any role: the table is only
-- ever written by SECURITY DEFINER trigger functions running as the
-- migration owner, which bypasses RLS. Regular client roles get zero write
-- policies, so direct client writes are refused outright.
create policy "audit_logs_select_admin_manager"
  on public.audit_logs for select
  using (public.current_role() in ('admin', 'manager'));

-- Generic helper a trigger function can call to record one audit row.
create function public.write_audit_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_values jsonb,
  p_new_values jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_values, p_new_values);
end;
$$;

-- Log profile role/active-status changes (the privilege-relevant fields —
-- not every profile edit, to keep the log signal-heavy).
create function public.audit_profile_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role <> old.role or new.is_active <> old.is_active then
    perform public.write_audit_log(
      'user_role_changed',
      'profile',
      new.id,
      jsonb_build_object('role', old.role, 'is_active', old.is_active),
      jsonb_build_object('role', new.role, 'is_active', new.is_active)
    );
  end if;
  return new;
end;
$$;

create trigger audit_profile_changes
  after update on public.profiles
  for each row execute function public.audit_profile_changes();

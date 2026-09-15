-- 0006_job_reassignment_audit.sql
-- job_status_history captures status transitions but not who a job was
-- reassigned to — that's a real operational question ("who moved this job
-- to a different technician, and when") with no record anywhere else, so it
-- goes into the generic audit_logs alongside role changes.

create function public.audit_job_reassignment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.assigned_technician_id is distinct from old.assigned_technician_id then
    perform public.write_audit_log(
      'job_reassigned',
      'job',
      new.id,
      jsonb_build_object('assigned_technician_id', old.assigned_technician_id),
      jsonb_build_object('assigned_technician_id', new.assigned_technician_id)
    );
  end if;
  return new;
end;
$$;

create trigger jobs_audit_reassignment
  after update on public.jobs
  for each row execute function public.audit_job_reassignment();

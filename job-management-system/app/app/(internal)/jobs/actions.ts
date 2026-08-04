"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { newJobSchema, statusChangeSchema } from "@/lib/validation/job";

export interface JobFormState {
  error?: string;
}

export async function createJob(
  _prevState: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const assignedTechnicianRaw = formData.get("assigned_technician_id");
  const parsed = newJobSchema.safeParse({
    customer_id: formData.get("customer_id"),
    assigned_technician_id: assignedTechnicianRaw ? assignedTechnicianRaw : undefined,
    service_requested: formData.get("service_requested"),
    service_category: formData.get("service_category"),
    priority: formData.get("priority"),
    source: formData.get("source"),
    site_address_line1: formData.get("site_address_line1"),
    site_address_line2: formData.get("site_address_line2"),
    site_city: formData.get("site_city"),
    site_postal_code: formData.get("site_postal_code"),
    preferred_date: formData.get("preferred_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { preferred_date, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      preferred_date: preferred_date || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create the job. Please try again." };
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}

export interface StatusChangeState {
  error?: string;
}

export async function changeJobStatus(
  jobId: string,
  _prevState: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const parsed = statusChangeSchema.safeParse({
    status: formData.get("status"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: "Choose a valid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ status: parsed.data.status })
    .eq("id", jobId);

  if (error) {
    return { error: "Could not update the job status." };
  }

  // The status-change note (if any) is attached to the history row the
  // jobs_log_status_change trigger just wrote, not inserted separately.
  // order()+limit() on .update() would filter the *returned* rows, not which
  // rows get written, so the latest row's id is looked up first and updated
  // by id to avoid patching every history row for this job.
  if (parsed.data.note) {
    const { data: latest } = await supabase
      .from("job_status_history")
      .select("id")
      .eq("job_id", jobId)
      .order("changed_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      await supabase
        .from("job_status_history")
        .update({ note: parsed.data.note })
        .eq("id", latest.id);
    }
  }

  revalidatePath(`/jobs/${jobId}`);
  return {};
}

export async function assignTechnician(jobId: string, formData: FormData) {
  const raw = formData.get("technician_id");
  const technicianId = raw && raw !== "unassigned" ? String(raw) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ assigned_technician_id: technicianId })
    .eq("id", jobId);

  if (error) {
    throw new Error("Could not assign technician.");
  }

  revalidatePath(`/jobs/${jobId}`);
}

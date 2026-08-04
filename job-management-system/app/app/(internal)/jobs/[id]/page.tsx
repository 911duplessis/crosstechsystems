import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/jobs/status";
import { priorityBadgeVariant, statusBadgeVariant } from "@/lib/jobs/badge-variants";
import { FULL_JOB_VISIBILITY_ROLES } from "@/lib/auth/roles";
import { StatusForm } from "./status-form";
import { TechnicianForm } from "./technician-form";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (!job || !profile) notFound();

  const [{ data: customer }, { data: history }, { data: technicians }] = await Promise.all([
    supabase.from("customers").select("id, name, company_name, phone, email").eq("id", job.customer_id).single(),
    supabase
      .from("job_status_history")
      .select("id, old_status, new_status, note, changed_by, changed_at")
      .eq("job_id", id)
      .order("changed_at", { ascending: false }),
    FULL_JOB_VISIBILITY_ROLES.includes(profile.role)
      ? supabase.from("profiles").select("id, full_name").eq("role", "technician").eq("is_active", true).order("full_name")
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const changerIds = [...new Set((history ?? []).map((h) => h.changed_by))];
  const { data: changers } = changerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", changerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const changerNames = new Map((changers ?? []).map((c) => [c.id, c.full_name]));

  const canReassign = FULL_JOB_VISIBILITY_ROLES.includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{job.job_number}</h1>
            <Badge variant={priorityBadgeVariant(job.priority)}>
              {JOB_PRIORITY_LABELS[job.priority]}
            </Badge>
            <Badge variant={statusBadgeVariant(job.status)}>{JOB_STATUS_LABELS[job.status]}</Badge>
          </div>
          {customer && (
            <p className="text-muted-foreground">
              <Link href={`/customers/${customer.id}`} className="hover:underline">
                {customer.name}
              </Link>
              {customer.company_name && ` · ${customer.company_name}`}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Service requested
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">
              {job.service_requested}
              {job.service_category && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Category: {job.service_category}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Site address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {job.site_address_line1 ? (
                <>
                  <p>{job.site_address_line1}</p>
                  {job.site_address_line2 && <p>{job.site_address_line2}</p>}
                  <p>{[job.site_city, job.site_postal_code].filter(Boolean).join(", ")}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Same as customer address, or not recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {(history ?? []).map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(entry.new_status)}>
                        {JOB_STATUS_LABELS[entry.new_status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleString()} ·{" "}
                        {changerNames.get(entry.changed_by) ?? "Unknown"}
                      </span>
                    </div>
                    {entry.note && <p className="mt-1 text-muted-foreground">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Update status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusForm jobId={job.id} currentStatus={job.status} />
            </CardContent>
          </Card>

          {canReassign && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Technician
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TechnicianForm
                  jobId={job.id}
                  currentTechnicianId={job.assigned_technician_id}
                  technicians={technicians ?? []}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="capitalize">{job.source.replace("_", " ")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preferred date</span>
                <span>{job.preferred_date ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span>{job.scheduled_date ? new Date(job.scheduled_date).toLocaleString() : "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

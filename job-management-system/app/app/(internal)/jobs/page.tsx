import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/jobs/status";
import { priorityBadgeVariant, statusBadgeVariant } from "@/lib/jobs/badge-variants";
import type { JobStatus } from "@/types/database";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("id, job_number, service_requested, status, priority, customer_id, assigned_technician_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status as JobStatus);
  }

  const { data: jobs } = await query;

  const customerIds = [...new Set((jobs ?? []).map((j) => j.customer_id))];
  const technicianIds = [
    ...new Set((jobs ?? []).map((j) => j.assigned_technician_id).filter((id): id is string => !!id)),
  ];

  const [{ data: customers }, { data: technicians }] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id, name").in("id", customerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    technicianIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", technicianIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));
  const technicianNames = new Map((technicians ?? []).map((t) => [t.id, t.full_name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Button render={<Link href="/jobs/new">New job</Link>} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.length ? (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.job_number}
                    </Link>
                  </TableCell>
                  <TableCell>{customerNames.get(job.customer_id) ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{job.service_requested}</TableCell>
                  <TableCell>
                    {job.assigned_technician_id
                      ? (technicianNames.get(job.assigned_technician_id) ?? "—")
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityBadgeVariant(job.priority)}>
                      {JOB_PRIORITY_LABELS[job.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(job.status)}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No jobs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

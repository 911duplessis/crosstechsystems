import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_STATUS_LABELS } from "@/lib/jobs/status";
import { statusBadgeVariant } from "@/lib/jobs/badge-variants";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();

  if (!customer) notFound();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_number, service_requested, status")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{customer.name}</h1>
            <Badge variant="outline" className="capitalize">
              {customer.customer_type}
            </Badge>
          </div>
          {customer.company_name && (
            <p className="text-muted-foreground">{customer.company_name}</p>
          )}
        </div>
        <Button
          variant="outline"
          render={<Link href={`/customers/${customer.id}/edit`}>Edit</Link>}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{customer.phone ?? "No phone on file"}</p>
            <p>{customer.email ?? "No email on file"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{customer.address_line1 ?? "—"}</p>
            {customer.address_line2 && <p>{customer.address_line2}</p>}
            <p>
              {[customer.city, customer.postal_code].filter(Boolean).join(", ") || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{customer.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Jobs</CardTitle>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/jobs/new?customer_id=${customer.id}`}>New job</Link>}
          />
        </CardHeader>
        <CardContent>
          {jobs?.length ? (
            <ul className="space-y-2 text-sm">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-4">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">
                    <span className="font-medium">{job.job_number}</span>{" "}
                    <span className="text-muted-foreground">{job.service_requested}</span>
                  </Link>
                  <Badge variant={statusBadgeVariant(job.status)} className="shrink-0">
                    {JOB_STATUS_LABELS[job.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No jobs linked yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

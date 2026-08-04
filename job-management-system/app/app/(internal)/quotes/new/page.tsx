import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuote } from "../actions";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  const { job_id } = await searchParams;
  if (!job_id) notFound();

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, job_number, service_requested, customer_id")
    .eq("id", job_id)
    .single();

  if (!job) notFound();

  const { data: customer } = await supabase
    .from("customers")
    .select("name, company_name")
    .eq("id", job.customer_id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New quote</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">For job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="font-medium">{job.job_number}</p>
            <p className="text-muted-foreground">{job.service_requested}</p>
            <p className="mt-2">{customer?.name}{customer?.company_name && ` · ${customer.company_name}`}</p>
          </div>
          <form action={createQuote.bind(null, job.id, job.customer_id)}>
            <Button type="submit">Create quote</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

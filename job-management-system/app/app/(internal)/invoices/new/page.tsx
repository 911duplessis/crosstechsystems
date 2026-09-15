import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { createInvoiceFromQuote, createStandaloneInvoice } from "../actions";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ quote_id?: string; job_id?: string }>;
}) {
  const { quote_id, job_id } = await searchParams;
  const supabase = await createClient();

  if (quote_id) {
    const { data: quote } = await supabase.from("quotes").select("*").eq("id", quote_id).single();
    if (!quote) notFound();
    const { data: customer } = await supabase
      .from("customers")
      .select("name, company_name")
      .eq("id", quote.customer_id)
      .single();

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">New invoice from {quote.quote_number}</h1>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p>{customer?.name}{customer?.company_name && ` · ${customer.company_name}`}</p>
              <p className="mt-2 font-medium">Total: {formatMoney(quote.total)}</p>
            </div>
            <form action={createInvoiceFromQuote.bind(null, quote.id)}>
              <Button type="submit">Create invoice</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (job_id) {
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
        <h1 className="text-2xl font-semibold">New invoice</h1>
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
            <form action={createStandaloneInvoice.bind(null, job.id, job.customer_id)}>
              <Button type="submit">Create invoice</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  notFound();
}

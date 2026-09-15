import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import type { QuoteStatus } from "@/types/database";

const STATUS_VARIANT: Record<QuoteStatus, "default" | "outline" | "secondary" | "destructive"> = {
  draft: "outline",
  sent: "default",
  approved: "secondary",
  rejected: "destructive",
  expired: "destructive",
};

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total, customer_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const customerIds = [...new Set((quotes ?? []).map((q) => q.customer_id))];
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, name").in("id", customerIds)
    : { data: [] as { id: string; name: string }[] };
  const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quotes</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes?.length ? (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <Link href={`/quotes/${quote.id}`} className="font-medium hover:underline">
                      {quote.quote_number}
                    </Link>
                  </TableCell>
                  <TableCell>{customerNames.get(quote.customer_id) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[quote.status]} className="capitalize">
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(quote.total)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No quotes yet — create one from a job.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
import type { InvoiceStatus } from "@/types/database";

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "outline" | "secondary" | "destructive"> = {
  unpaid: "outline",
  partial: "default",
  paid: "secondary",
  overdue: "destructive",
  cancelled: "destructive",
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, balance_due, due_date, customer_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const customerIds = [...new Set((invoices ?? []).map((inv) => inv.customer_id))];
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("id, name").in("id", customerIds)
    : { data: [] as { id: string; name: string }[] };
  const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.length ? (
              invoices.map((invoice) => {
                const overdue =
                  invoice.due_date &&
                  new Date(invoice.due_date) < new Date() &&
                  (invoice.status === "unpaid" || invoice.status === "partial");
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>{customerNames.get(invoice.customer_id) ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize">
                        {invoice.status}
                      </Badge>
                      {overdue && (
                        <Badge variant="destructive" className="ml-1">
                          Overdue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{invoice.due_date ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatMoney(invoice.total)}</TableCell>
                    <TableCell className="text-right">{formatMoney(invoice.balance_due)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import {
  addInvoiceLineItem,
  updateInvoiceLineItem,
  deleteInvoiceLineItem,
  updateInvoiceMeta,
  recordPayment,
  cancelInvoice,
} from "../actions";
import { LineItemRow } from "../../line-items/line-item-row";
import { AddLineItemForm } from "../../line-items/add-line-item-form";
import { InvoiceMetaForm } from "./invoice-meta-form";
import { PaymentForm } from "./payment-form";
import { CancelButton } from "./cancel-button";
import type { InvoiceStatus } from "@/types/database";

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "outline" | "secondary" | "destructive"> = {
  unpaid: "outline",
  partial: "default",
  paid: "secondary",
  overdue: "destructive",
  cancelled: "destructive",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!invoice) notFound();

  const [{ data: job }, { data: customer }, { data: lineItems }, { data: payments }, { data: products }] =
    await Promise.all([
      supabase.from("jobs").select("id, job_number, service_requested").eq("id", invoice.job_id).single(),
      supabase.from("customers").select("id, name, company_name").eq("id", invoice.customer_id).single(),
      supabase
        .from("invoice_line_items")
        .select("id, item_type, description, quantity, unit_price, line_discount_percent, line_total")
        .eq("invoice_id", id)
        .order("sort_order"),
      supabase
        .from("payments")
        .select("id, amount, payment_method, payment_date, reference_number, recorded_by")
        .eq("invoice_id", id)
        .order("payment_date", { ascending: false }),
      supabase
        .from("products")
        .select("id, name, selling_price, unit")
        .eq("is_active", true)
        .order("name"),
    ]);

  const editable = !invoice.quote_id && invoice.status === "unpaid";
  const isOverdue =
    invoice.due_date &&
    new Date(invoice.due_date) < new Date() &&
    (invoice.status === "unpaid" || invoice.status === "partial");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
            <Badge variant={STATUS_VARIANT[invoice.status]} className="capitalize">
              {invoice.status}
            </Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <p className="text-muted-foreground">
            {job && (
              <Link href={`/jobs/${job.id}`} className="hover:underline">
                {job.job_number}
              </Link>
            )}
            {customer && ` · ${customer.name}${customer.company_name ? ` (${customer.company_name})` : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            }
          />
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <CancelButton action={cancelInvoice.bind(null, invoice.id)} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Line items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-0 text-sm">
                {(lineItems ?? []).map((item) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    updateAction={updateInvoiceLineItem.bind(null, invoice.id, item.id)}
                    onDelete={deleteInvoiceLineItem.bind(null, invoice.id, item.id)}
                    readOnly={!editable}
                  />
                ))}
                {!lineItems?.length && (
                  <p className="py-2 text-muted-foreground">No line items yet.</p>
                )}
              </div>
              {editable && (
                <div className="pt-2">
                  <AddLineItemForm action={addInvoiceLineItem.bind(null, invoice.id)} products={products ?? []} />
                </div>
              )}
              {invoice.quote_id && (
                <p className="text-xs text-muted-foreground">
                  Copied from quote at conversion time — edit the quote and re-convert if the
                  work changed.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discount &amp; due date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceMetaForm
                action={updateInvoiceMeta.bind(null, invoice.id)}
                discountType={invoice.discount_type}
                discountValue={invoice.discount_value}
                dueDate={invoice.due_date}
                readOnly={!editable}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.status !== "cancelled" && (
                <PaymentForm action={recordPayment.bind(null, invoice.id)} />
              )}
              <ul className="space-y-2 text-sm">
                {(payments ?? []).map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between rounded-md border p-2">
                    <span className="capitalize">
                      {payment.payment_method} · {payment.payment_date}
                      {payment.reference_number && ` · ${payment.reference_number}`}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-medium">{formatMoney(payment.amount)}</span>
                      <a
                        href={`/api/payments/${payment.id}/receipt`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Receipt
                      </a>
                    </span>
                  </li>
                ))}
                {!payments?.length && (
                  <p className="text-muted-foreground">No payments recorded yet.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              {invoice.discount_type !== "none" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatMoney(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({invoice.tax_rate}%)</span>
                <span>{formatMoney(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatMoney(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Balance due</span>
                <span>{formatMoney(invoice.balance_due)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

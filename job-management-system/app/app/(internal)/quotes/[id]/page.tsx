import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import {
  addQuoteLineItem,
  updateQuoteLineItem,
  deleteQuoteLineItem,
  updateQuoteMeta,
  sendQuote,
  approveQuote,
  rejectQuote,
} from "../actions";
import { LineItemRow } from "../../line-items/line-item-row";
import { AddLineItemForm } from "../../line-items/add-line-item-form";
import { QuoteMetaForm } from "./quote-meta-form";
import { StatusActions } from "./status-actions";
import type { QuoteStatus } from "@/types/database";

const STATUS_VARIANT: Record<QuoteStatus, "default" | "outline" | "secondary" | "destructive"> = {
  draft: "outline",
  sent: "default",
  approved: "secondary",
  rejected: "destructive",
  expired: "destructive",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) notFound();

  const [{ data: job }, { data: customer }, { data: lineItems }, { data: products }] = await Promise.all([
    supabase.from("jobs").select("id, job_number, service_requested").eq("id", quote.job_id).single(),
    supabase.from("customers").select("id, name, company_name").eq("id", quote.customer_id).single(),
    supabase
      .from("quote_line_items")
      .select("id, item_type, description, quantity, unit_price, line_discount_percent, line_total")
      .eq("quote_id", id)
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, name, selling_price, unit")
      .eq("is_active", true)
      .order("name"),
  ]);

  const editable = quote.status === "draft" || quote.status === "sent";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{quote.quote_number}</h1>
            <Badge variant={STATUS_VARIANT[quote.status]} className="capitalize">
              {quote.status}
            </Badge>
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
        <Button
          variant="outline"
          render={
            <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          }
        />
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
                    updateAction={updateQuoteLineItem.bind(null, quote.id, item.id)}
                    onDelete={deleteQuoteLineItem.bind(null, quote.id, item.id)}
                    readOnly={!editable}
                  />
                ))}
                {!lineItems?.length && (
                  <p className="py-2 text-muted-foreground">No line items yet.</p>
                )}
              </div>
              {editable && (
                <div className="pt-2">
                  <AddLineItemForm action={addQuoteLineItem.bind(null, quote.id)} products={products ?? []} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discount, expiry &amp; terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteMetaForm
                action={updateQuoteMeta.bind(null, quote.id)}
                discountType={quote.discount_type}
                discountValue={quote.discount_value}
                expiryDate={quote.expiry_date}
                termsAndConditions={quote.terms_and_conditions}
                readOnly={!editable}
              />
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
                <span>{formatMoney(quote.subtotal)}</span>
              </div>
              {quote.discount_type !== "none" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatMoney(quote.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({quote.tax_rate}%)</span>
                <span>{formatMoney(quote.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatMoney(quote.total)}</span>
              </div>
              {quote.approved_at && (
                <div className="border-t pt-2 text-xs text-muted-foreground">
                  Approved {new Date(quote.approved_at).toLocaleString()}
                  {quote.approved_by_note && <p className="mt-1">{quote.approved_by_note}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusActions
                status={quote.status}
                onSend={sendQuote.bind(null, quote.id, quote.job_id)}
                onReject={rejectQuote.bind(null, quote.id, quote.job_id)}
                approveAction={approveQuote.bind(null, quote.id, quote.job_id)}
              />
              {quote.status === "approved" && (
                <Button
                  size="sm"
                  render={<Link href={`/invoices/new?quote_id=${quote.id}`}>Convert to invoice</Link>}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

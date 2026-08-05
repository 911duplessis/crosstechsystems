import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const [{ data: customer }, { data: lineItems }] = await Promise.all([
    supabase
      .from("customers")
      .select("name, address_line1, address_line2, city, postal_code")
      .eq("id", invoice.customer_id)
      .single(),
    supabase
      .from("invoice_line_items")
      .select("item_type, description, quantity, unit_price, line_total")
      .eq("invoice_id", id)
      .order("sort_order"),
  ]);

  const address = customer
    ? [customer.address_line1, customer.address_line2, [customer.city, customer.postal_code].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(", ")
    : null;

  const buffer = await renderToBuffer(
    InvoiceDocument({
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      customerName: customer?.name ?? "Customer",
      customerAddress: address,
      lineItems: lineItems ?? [],
      subtotal: invoice.subtotal,
      discountType: invoice.discount_type,
      discountAmount: invoice.discount_amount,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      balanceDue: invoice.balance_due,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}

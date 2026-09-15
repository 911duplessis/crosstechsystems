import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuoteDocument } from "@/lib/pdf/quote-document";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).single();
  if (!quote) return new NextResponse("Not found", { status: 404 });

  const [{ data: customer }, { data: lineItems }] = await Promise.all([
    supabase
      .from("customers")
      .select("name, address_line1, address_line2, city, postal_code")
      .eq("id", quote.customer_id)
      .single(),
    supabase
      .from("quote_line_items")
      .select("item_type, description, quantity, unit_price, line_total")
      .eq("quote_id", id)
      .order("sort_order"),
  ]);

  const address = customer
    ? [customer.address_line1, customer.address_line2, [customer.city, customer.postal_code].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(", ")
    : null;

  const buffer = await renderToBuffer(
    QuoteDocument({
      quoteNumber: quote.quote_number,
      issueDate: quote.issue_date,
      expiryDate: quote.expiry_date,
      customerName: customer?.name ?? "Customer",
      customerAddress: address,
      lineItems: lineItems ?? [],
      subtotal: quote.subtotal,
      discountType: quote.discount_type,
      discountAmount: quote.discount_amount,
      taxRate: quote.tax_rate,
      taxAmount: quote.tax_amount,
      total: quote.total,
      termsAndConditions: quote.terms_and_conditions,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quote_number}.pdf"`,
    },
  });
}

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ReceiptDocument } from "@/lib/pdf/receipt-document";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, amount, payment_method, payment_date, reference_number, invoice_id")
    .eq("id", id)
    .single();
  if (!payment) return new NextResponse("Not found", { status: 404 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, customer_id, balance_due")
    .eq("id", payment.invoice_id)
    .single();
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", invoice.customer_id)
    .single();

  const buffer = await renderToBuffer(
    ReceiptDocument({
      invoiceNumber: invoice.invoice_number,
      customerName: customer?.name ?? "Customer",
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      referenceNumber: payment.reference_number,
      balanceDue: invoice.balance_due,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${invoice.invoice_number}.pdf"`,
    },
  });
}

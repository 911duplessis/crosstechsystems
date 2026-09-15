"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lineItemSchema } from "@/lib/validation/quote";
import { invoiceMetaSchema, paymentSchema } from "@/lib/validation/invoice";

export interface ActionState {
  error?: string;
}

export async function createInvoiceFromQuote(quoteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!quote) throw new Error("Quote not found.");

  const { data: quoteLineItems } = await supabase
    .from("quote_line_items")
    .select("item_type, description, quantity, unit_price, line_discount_percent, sort_order")
    .eq("quote_id", quoteId)
    .order("sort_order");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      quote_id: quote.id,
      job_id: quote.job_id,
      customer_id: quote.customer_id,
      discount_type: quote.discount_type,
      discount_value: quote.discount_value,
      tax_rate: quote.tax_rate,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !invoice) throw new Error("Could not create the invoice.");

  if (quoteLineItems?.length) {
    await supabase
      .from("invoice_line_items")
      .insert(quoteLineItems.map((item) => ({ ...item, invoice_id: invoice.id })));
  }

  await supabase
    .from("jobs")
    .update({ status: "invoice_issued" })
    .eq("id", quote.job_id)
    .neq("status", "paid");

  revalidatePath(`/jobs/${quote.job_id}`);
  redirect(`/invoices/${invoice.id}`);
}

export async function createStandaloneInvoice(jobId: string, customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const { data, error } = await supabase
    .from("invoices")
    .insert({ job_id: jobId, customer_id: customerId, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) throw new Error("Could not create the invoice.");

  revalidatePath(`/jobs/${jobId}`);
  redirect(`/invoices/${data.id}`);
}

export async function addInvoiceLineItem(
  invoiceId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = lineItemSchema.safeParse({
    item_type: formData.get("item_type"),
    product_id: formData.get("product_id") || "",
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    line_discount_percent: formData.get("line_discount_percent") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the line item fields." };
  }

  const supabase = await createClient();
  const { product_id, ...rest } = parsed.data;
  const { error } = await supabase
    .from("invoice_line_items")
    .insert({ ...rest, product_id: product_id || null, invoice_id: invoiceId });

  if (error) return { error: "Could not add the line item." };

  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function updateInvoiceLineItem(
  invoiceId: string,
  lineItemId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = lineItemSchema.safeParse({
    item_type: formData.get("item_type"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    line_discount_percent: formData.get("line_discount_percent") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the line item fields." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_line_items")
    .update(parsed.data)
    .eq("id", lineItemId);

  if (error) return { error: "Could not update the line item." };

  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function deleteInvoiceLineItem(invoiceId: string, lineItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoice_line_items").delete().eq("id", lineItemId);
  if (error) throw new Error("Could not remove the line item.");
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function updateInvoiceMeta(
  invoiceId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = invoiceMetaSchema.safeParse({
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value") || 0,
    due_date: formData.get("due_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { due_date, ...rest } = parsed.data;
  const { error } = await supabase
    .from("invoices")
    .update({ ...rest, due_date: due_date || null })
    .eq("id", invoiceId);

  if (error) return { error: "Could not save changes." };

  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function recordPayment(
  invoiceId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    payment_date: formData.get("payment_date"),
    reference_number: formData.get("reference_number"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payment fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("job_id, total, amount_paid")
    .eq("id", invoiceId)
    .single();
  if (fetchError || !invoice) return { error: "Invoice not found." };

  const { error } = await supabase.from("payments").insert({
    ...parsed.data,
    invoice_id: invoiceId,
    recorded_by: user.id,
  });

  if (error) return { error: "Could not record the payment." };

  // Convenience default: if this payment fully settles the invoice, move the
  // job to Paid — staff can still override manually at any time.
  const newAmountPaid = invoice.amount_paid + parsed.data.amount;
  if (newAmountPaid >= invoice.total) {
    await supabase.from("jobs").update({ status: "paid" }).eq("id", invoice.job_id);
    revalidatePath(`/jobs/${invoice.job_id}`);
  }

  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}

export async function cancelInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status: "cancelled" }).eq("id", invoiceId);
  if (error) throw new Error("Could not cancel the invoice.");
  revalidatePath(`/invoices/${invoiceId}`);
}

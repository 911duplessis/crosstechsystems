"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lineItemSchema, quoteMetaSchema, approveQuoteSchema } from "@/lib/validation/quote";

export interface ActionState {
  error?: string;
}

export async function createQuote(jobId: string, customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Please sign in again.");

  const { data, error } = await supabase
    .from("quotes")
    .insert({ job_id: jobId, customer_id: customerId, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) throw new Error("Could not create the quote.");

  redirect(`/quotes/${data.id}`);
}

export async function addQuoteLineItem(
  quoteId: string,
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
    .from("quote_line_items")
    .insert({ ...parsed.data, quote_id: quoteId });

  if (error) return { error: "Could not add the line item." };

  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function updateQuoteLineItem(
  quoteId: string,
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
    .from("quote_line_items")
    .update(parsed.data)
    .eq("id", lineItemId);

  if (error) return { error: "Could not update the line item." };

  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function deleteQuoteLineItem(quoteId: string, lineItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_line_items").delete().eq("id", lineItemId);
  if (error) throw new Error("Could not remove the line item.");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteMeta(
  quoteId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = quoteMetaSchema.safeParse({
    discount_type: formData.get("discount_type"),
    discount_value: formData.get("discount_value") || 0,
    expiry_date: formData.get("expiry_date"),
    terms_and_conditions: formData.get("terms_and_conditions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { expiry_date, ...rest } = parsed.data;
  const { error } = await supabase
    .from("quotes")
    .update({ ...rest, expiry_date: expiry_date || null })
    .eq("id", quoteId);

  if (error) return { error: "Could not save changes." };

  revalidatePath(`/quotes/${quoteId}`);
  return {};
}

export async function sendQuote(quoteId: string, jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status: "sent" }).eq("id", quoteId);
  if (error) throw new Error("Could not mark the quote as sent.");

  // Convenience default only — staff can still move the job to any status
  // manually. Never overrides a job that's already further along.
  await supabase
    .from("jobs")
    .update({ status: "quote_sent" })
    .eq("id", jobId)
    .in("status", ["new_enquiry", "scheduled", "inspection_required", "quote_pending"]);

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/jobs/${jobId}`);
}

export async function approveQuote(
  quoteId: string,
  jobId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = approveQuoteSchema.safeParse({ note: formData.get("note") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Add an approval note." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by_note: parsed.data.note })
    .eq("id", quoteId);

  if (error) return { error: "Could not mark the quote as approved." };

  await supabase
    .from("jobs")
    .update({ status: "approved" })
    .eq("id", jobId)
    .in("status", ["new_enquiry", "scheduled", "inspection_required", "quote_pending", "quote_sent"]);

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

export async function rejectQuote(quoteId: string, jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status: "rejected" }).eq("id", quoteId);
  if (error) throw new Error("Could not mark the quote as rejected.");

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/jobs/${jobId}`);
}

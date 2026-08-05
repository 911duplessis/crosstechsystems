"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supplierSchema } from "@/lib/validation/stock";

export interface SupplierFormState {
  error?: string;
}

function parseSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    contact_name: formData.get("contact_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
}

export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").insert(parsed.data).select("id").single();

  if (error || !data) return { error: "Could not save the supplier." };

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  id: string,
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const parsed = parseSupplierForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update(parsed.data).eq("id", id);

  if (error) return { error: "Could not save the supplier." };

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

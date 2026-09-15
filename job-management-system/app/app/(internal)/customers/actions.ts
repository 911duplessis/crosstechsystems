"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerSchema } from "@/lib/validation/customer";

export interface CustomerFormState {
  error?: string;
}

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    customer_type: formData.get("customer_type"),
    name: formData.get("name"),
    company_name: formData.get("company_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address_line1: formData.get("address_line1"),
    address_line2: formData.get("address_line2"),
    city: formData.get("city"),
    postal_code: formData.get("postal_code"),
    notes: formData.get("notes"),
  });
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not save the customer. Please try again." };
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(parsed.data).eq("id", id);

  if (error) {
    return { error: "Could not save the customer. Please try again." };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

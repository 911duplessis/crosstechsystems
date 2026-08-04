"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productSchema, stockAdjustmentSchema } from "@/lib/validation/stock";

export interface ProductFormState {
  error?: string;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    category_id: formData.get("category_id") || undefined,
    supplier_id: formData.get("supplier_id") || undefined,
    cost_price: formData.get("cost_price") || 0,
    selling_price: formData.get("selling_price") || 0,
    unit: formData.get("unit") || "each",
    min_stock_level: formData.get("min_stock_level") || 0,
  });
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(parsed.data).select("id").single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "A product with that SKU already exists." : "Could not save the product." };
  }

  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);

  if (error) {
    return { error: error.code === "23505" ? "A product with that SKU already exists." : "Could not save the product." };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function setProductActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error("Could not update the product.");
  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
}

export interface AdjustmentFormState {
  error?: string;
}

export async function adjustStock(
  productId: string,
  _prevState: AdjustmentFormState,
  formData: FormData,
): Promise<AdjustmentFormState> {
  const parsed = stockAdjustmentSchema.safeParse({
    movement_type: formData.get("movement_type"),
    quantity_change: formData.get("quantity_change"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the adjustment fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { error } = await supabase.from("stock_movements").insert({
    ...parsed.data,
    reference_type: "manual",
    product_id: productId,
    created_by: user.id,
  });

  if (error) return { error: "Could not record the stock movement." };

  revalidatePath(`/products/${productId}`);
  return {};
}

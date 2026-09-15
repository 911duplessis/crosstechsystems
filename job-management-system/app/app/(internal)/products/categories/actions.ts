"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validation/stock";

export interface CategoryFormState {
  error?: string;
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    parent_category_id: formData.get("parent_category_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").insert(parsed.data);

  if (error) return { error: "Could not save the category." };

  revalidatePath("/products/categories");
  return {};
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  if (error) throw new Error("Could not delete the category — it may still be in use by products.");
  revalidatePath("/products/categories");
}

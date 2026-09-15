import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("product_categories").select("id, name").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        suppliers={suppliers ?? []}
        submitLabel="Create product"
      />
    </div>
  );
}

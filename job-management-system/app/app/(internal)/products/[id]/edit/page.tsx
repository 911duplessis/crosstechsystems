import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../../product-form";
import { updateProduct } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("product_categories").select("id, name").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        action={updateProduct.bind(null, id)}
        product={product}
        categories={categories ?? []}
        suppliers={suppliers ?? []}
        submitLabel="Save changes"
      />
    </div>
  );
}

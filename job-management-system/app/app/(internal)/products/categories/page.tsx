import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-button";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Product categories</h1>
      <CategoryForm />
      <ul className="max-w-md divide-y rounded-md border">
        {(categories ?? []).map((category) => (
          <li key={category.id} className="flex items-center justify-between px-3 py-2 text-sm">
            {category.name}
            <DeleteCategoryButton id={category.id} />
          </li>
        ))}
        {!categories?.length && (
          <li className="px-3 py-2 text-sm text-muted-foreground">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}

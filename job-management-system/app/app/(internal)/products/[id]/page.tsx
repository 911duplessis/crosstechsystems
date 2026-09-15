import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { getCurrentProfile } from "@/lib/auth/session";
import { AdjustmentForm } from "./adjustment-form";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  const [{ data: category }, { data: supplier }, { data: movements }] = await Promise.all([
    product.category_id
      ? supabase.from("product_categories").select("name").eq("id", product.category_id).single()
      : Promise.resolve({ data: null }),
    product.supplier_id
      ? supabase.from("suppliers").select("name").eq("id", product.supplier_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("stock_movements")
      .select("id, movement_type, quantity_change, notes, created_at, created_by")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const low = product.stock_quantity <= product.min_stock_level;
  const canManage = profile?.role === "admin" || profile?.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            {low && <Badge variant="destructive">Low stock</Badge>}
            {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
          </div>
          <p className="text-muted-foreground">
            {product.sku}
            {category?.name && ` · ${category.name}`}
            {supplier?.name && ` · ${supplier.name}`}
          </p>
        </div>
        {canManage && (
          <Button variant="outline" render={<Link href={`/products/${product.id}/edit`}>Edit</Link>} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{product.description}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock movement history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManage && <AdjustmentForm productId={product.id} />}
              <ul className="space-y-2 text-sm">
                {(movements ?? []).map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-md border p-2">
                    <span className="capitalize">
                      {m.movement_type.replace("_", " ")}
                      {m.notes && ` · ${m.notes}`}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </span>
                    <span className={m.quantity_change < 0 ? "text-destructive" : "text-emerald-600"}>
                      {m.quantity_change > 0 ? "+" : ""}
                      {m.quantity_change} {product.unit}
                    </span>
                  </li>
                ))}
                {!movements?.length && (
                  <p className="text-muted-foreground">No stock movements recorded yet.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">On hand</span>
                <span className="font-medium">
                  {product.stock_quantity} {product.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum level</span>
                <span>
                  {product.min_stock_level} {product.unit}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Stock value (cost)</span>
                <span>{formatMoney(product.stock_quantity * product.cost_price)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost price</span>
                <span>{formatMoney(product.cost_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling price</span>
                <span>{formatMoney(product.selling_price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

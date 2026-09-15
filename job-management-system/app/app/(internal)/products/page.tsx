import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low_stock?: string }>;
}) {
  const { q, low_stock } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, sku, name, unit, selling_price, stock_quantity, min_stock_level, is_active")
    .order("name")
    .limit(200);

  if (q) {
    const term = q.replace(/[,()]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data: allProducts } = await query;
  const products = low_stock
    ? (allProducts ?? []).filter((p) => p.stock_quantity <= p.min_stock_level)
    : allProducts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button render={<Link href="/products/new">New product</Link>} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form className="max-w-sm flex-1">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or SKU…"
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
          />
        </form>
        <Link
          href={low_stock ? "/products" : "/products?low_stock=1"}
          className="text-sm hover:underline"
        >
          {low_stock ? "Show all products" : "Show low stock only"}
        </Link>
        <Link href="/products/categories" className="text-sm text-muted-foreground hover:underline">
          Manage categories
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Selling price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.length ? (
              products.map((product) => {
                const low = product.stock_quantity <= product.min_stock_level;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                      <Link href={`/products/${product.id}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.stock_quantity} {product.unit}
                      {low && (
                        <Badge variant="destructive" className="ml-2">
                          Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(product.selling_price)}</TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

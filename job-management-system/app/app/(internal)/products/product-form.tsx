"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/database";
import type { ProductFormState } from "./actions";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface Props {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  submitLabel: string;
}

export function ProductForm({ action, product, categories, suppliers, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={product?.description ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select name="category_id" defaultValue={product?.category_id ?? undefined}>
            <SelectTrigger id="category_id" className="w-full">
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier_id">Supplier</Label>
          <Select name="supplier_id" defaultValue={product?.supplier_id ?? undefined}>
            <SelectTrigger id="supplier_id" className="w-full">
              <SelectValue placeholder="No supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cost_price">Cost price</Label>
          <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0" defaultValue={product?.cost_price ?? 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="selling_price">Selling price</Label>
          <Input id="selling_price" name="selling_price" type="number" step="0.01" min="0" defaultValue={product?.selling_price ?? 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue={product?.unit ?? "each"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="min_stock_level">Minimum stock level (low-stock alert threshold)</Label>
        <Input
          id="min_stock_level"
          name="min_stock_level"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.min_stock_level ?? 0}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionState {
  error?: string;
}

interface ProductOption {
  id: string;
  name: string;
  selling_price: number;
  unit: string;
}

interface Props {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** When provided, an extra "Product" picker autofills description/price. */
  products?: ProductOption[];
}

const initialState: ActionState = {};

export function AddLineItemForm({ action, products }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const unitPriceRef = useRef<HTMLInputElement>(null);
  const productIdRef = useRef<HTMLInputElement>(null);

  function handleProductSelect(productId: string | null) {
    if (productIdRef.current) productIdRef.current.value = productId ?? "";
    if (!productId) return;
    const product = products?.find((p) => p.id === productId);
    if (!product) return;
    if (descriptionRef.current) descriptionRef.current.value = product.name;
    if (unitPriceRef.current) unitPriceRef.current.value = String(product.selling_price);
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className={`grid gap-2 ${products ? "grid-cols-[6rem_10rem_1fr_5rem_6rem_5rem_6rem]" : "grid-cols-[6rem_1fr_5rem_6rem_5rem_6rem]"}`}
    >
      <input ref={productIdRef} type="hidden" name="product_id" />
      <Select name="item_type" defaultValue="product">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="labour">Labour</SelectItem>
          <SelectItem value="product">Product</SelectItem>
        </SelectContent>
      </Select>
      {products && (
        <Select onValueChange={handleProductSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="From stock…" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input ref={descriptionRef} name="description" placeholder="Description" required />
      <Input name="quantity" type="number" step="0.01" min="0.01" defaultValue="1" required />
      <Input ref={unitPriceRef} name="unit_price" type="number" step="0.01" min="0" placeholder="Unit price" required />
      <Input name="line_discount_percent" type="number" step="1" min="0" max="100" placeholder="Disc %" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add line"}
      </Button>
      {state.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

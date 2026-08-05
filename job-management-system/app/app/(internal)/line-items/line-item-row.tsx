"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LineItemType } from "@/types/database";

interface LineItem {
  id: string;
  item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount_percent: number;
  line_total: number;
}

interface ActionState {
  error?: string;
}

interface Props {
  item: LineItem;
  updateAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  onDelete: () => Promise<void>;
  readOnly: boolean;
}

// A <table> can't have a <form> as a direct child of <tr>, and this row
// needs its own independent submit/delete — so the list is a CSS grid of
// divs (see line-items-editor.tsx) rather than a real HTML table.
const GRID_COLS = "grid grid-cols-[6rem_1fr_5rem_6rem_5rem_6rem_8rem] gap-2 items-start";

export function LineItemRow({ item, updateAction, onDelete, readOnly }: Props) {
  const [state, formAction, pending] = useActionState(updateAction, {});
  const [deleting, startDeleteTransition] = useTransition();

  if (readOnly) {
    return (
      <div className={`${GRID_COLS} border-b py-2 text-sm`}>
        <span className="capitalize">{item.item_type}</span>
        <span>{item.description}</span>
        <span className="text-right">{item.quantity}</span>
        <span className="text-right">{item.unit_price.toFixed(2)}</span>
        <span className="text-right">{item.line_discount_percent}%</span>
        <span className="text-right">{item.line_total.toFixed(2)}</span>
        <span />
      </div>
    );
  }

  return (
    <form action={formAction} className={`${GRID_COLS} border-b py-2`}>
      <Select name="item_type" defaultValue={item.item_type}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="labour">Labour</SelectItem>
          <SelectItem value="product">Product</SelectItem>
        </SelectContent>
      </Select>
      <Input name="description" defaultValue={item.description} required />
      <Input name="quantity" type="number" step="0.01" min="0.01" defaultValue={item.quantity} required />
      <Input name="unit_price" type="number" step="0.01" min="0" defaultValue={item.unit_price} required />
      <Input
        name="line_discount_percent"
        type="number"
        step="1"
        min="0"
        max="100"
        defaultValue={item.line_discount_percent}
      />
      <span className="pt-1.5 text-right text-sm">{item.line_total.toFixed(2)}</span>
      <span className="flex gap-1">
        <Button type="submit" size="xs" disabled={pending}>
          {pending ? "…" : "Save"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          disabled={deleting}
          onClick={() => startDeleteTransition(onDelete)}
        >
          Remove
        </Button>
      </span>
      {state.error && <p className="col-span-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

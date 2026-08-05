"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionState } from "../actions";
import type { DiscountType } from "@/types/database";

interface Props {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  discountType: DiscountType;
  discountValue: number;
  dueDate: string | null;
  readOnly: boolean;
}

const initialState: ActionState = {};

export function InvoiceMetaForm({ action, discountType, discountValue, dueDate, readOnly }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (readOnly) {
    return (
      <div className="space-y-1 text-sm">
        <p>Discount: {discountType === "none" ? "None" : `${discountValue} (${discountType})`}</p>
        <p>Due date: {dueDate ?? "—"}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="discount_type">Discount type</Label>
          <Select name="discount_type" defaultValue={discountType}>
            <SelectTrigger id="discount_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="percent">Percent</SelectItem>
              <SelectItem value="fixed">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="discount_value">Discount value</Label>
          <Input id="discount_value" name="discount_value" type="number" step="0.01" min="0" defaultValue={discountValue} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="due_date">Due date</Label>
        <Input id="due_date" name="due_date" type="date" defaultValue={dueDate ?? ""} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

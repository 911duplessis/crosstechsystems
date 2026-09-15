"use client";

import { useActionState, useRef } from "react";
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
import { adjustStock, type AdjustmentFormState } from "../actions";

const initialState: AdjustmentFormState = {};

export function AdjustmentForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(adjustStock.bind(null, productId), initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="movement_type">Type</Label>
          <Select name="movement_type" defaultValue="adjustment">
            <SelectTrigger id="movement_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase_in">Purchase received</SelectItem>
              <SelectItem value="job_usage">Used on a job</SelectItem>
              <SelectItem value="adjustment">Adjustment (count correction)</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="quantity_change">Quantity (+ in / - out)</Label>
          <Input id="quantity_change" name="quantity_change" type="number" step="0.01" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="e.g. PO #1234, or job reference" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Record movement"}
      </Button>
    </form>
  );
}

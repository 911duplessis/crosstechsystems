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
import type { ActionState } from "../actions";
import type { DiscountType } from "@/types/database";

interface Props {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string | null;
  termsAndConditions: string | null;
  readOnly: boolean;
}

const initialState: ActionState = {};

export function QuoteMetaForm({
  action,
  discountType,
  discountValue,
  expiryDate,
  termsAndConditions,
  readOnly,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (readOnly) {
    return (
      <div className="space-y-2 text-sm">
        <p>
          Discount: {discountType === "none" ? "None" : `${discountValue} (${discountType})`}
        </p>
        <p>Expiry: {expiryDate ?? "—"}</p>
        {termsAndConditions && <p className="whitespace-pre-wrap">{termsAndConditions}</p>}
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
        <Label htmlFor="expiry_date">Expiry date</Label>
        <Input id="expiry_date" name="expiry_date" type="date" defaultValue={expiryDate ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="terms_and_conditions">Terms and conditions</Label>
        <Textarea
          id="terms_and_conditions"
          name="terms_and_conditions"
          rows={3}
          defaultValue={termsAndConditions ?? ""}
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

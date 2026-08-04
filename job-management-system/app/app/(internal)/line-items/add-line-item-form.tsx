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

interface Props {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function AddLineItemForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="grid grid-cols-[6rem_1fr_5rem_6rem_5rem_6rem] gap-2"
    >
      <Select name="item_type" defaultValue="product">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="labour">Labour</SelectItem>
          <SelectItem value="product">Product</SelectItem>
        </SelectContent>
      </Select>
      <Input name="description" placeholder="Description" required />
      <Input name="quantity" type="number" step="0.01" min="0.01" defaultValue="1" required />
      <Input name="unit_price" type="number" step="0.01" min="0" placeholder="Unit price" required />
      <Input name="line_discount_percent" type="number" step="1" min="0" max="100" placeholder="Disc %" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add line"}
      </Button>
      {state.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

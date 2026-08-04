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
import type { CustomerFormState } from "./actions";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

interface Props {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  customer?: Customer;
  submitLabel: string;
}

export function CustomerForm({ action, customer, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_type">Type</Label>
          <Select name="customer_type" defaultValue={customer?.customer_type ?? "individual"}>
            <SelectTrigger id="customer_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={customer?.name} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Company name (if business)</Label>
        <Input id="company_name" name="company_name" defaultValue={customer?.company_name ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line1">Address line 1</Label>
        <Input id="address_line1" name="address_line1" defaultValue={customer?.address_line1 ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">Address line 2</Label>
        <Input id="address_line2" name="address_line2" defaultValue={customer?.address_line2 ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={customer?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input id="postal_code" name="postal_code" defaultValue={customer?.postal_code ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

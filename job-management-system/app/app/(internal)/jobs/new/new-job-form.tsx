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
import { createJob, type JobFormState } from "../actions";

interface Option {
  id: string;
  label: string;
}

interface Props {
  customers: Option[];
  technicians: Option[];
  defaultCustomerId?: string;
}

const initialState: JobFormState = {};

export function NewJobForm({ customers, technicians, defaultCustomerId }: Props) {
  const [state, formAction, pending] = useActionState(createJob, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer_id">Customer</Label>
        <Select name="customer_id" defaultValue={defaultCustomerId} required>
          <SelectTrigger id="customer_id" className="w-full">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_requested">Service requested</Label>
        <Textarea id="service_requested" name="service_requested" rows={3} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="service_category">Service category</Label>
          <Input
            id="service_category"
            name="service_category"
            placeholder="e.g. CCTV, Networking, Cabling"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_technician_id">Assign technician (optional)</Label>
          <Select name="assigned_technician_id">
            <SelectTrigger id="assigned_technician_id" className="w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue="normal">
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select name="source" defaultValue="phone">
            <SelectTrigger id="source" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="walk_in">Walk-in</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferred_date">Preferred date</Label>
          <Input id="preferred_date" name="preferred_date" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="site_address_line1">Site address</Label>
        <Input id="site_address_line1" name="site_address_line1" placeholder="Address line 1" />
      </div>
      <Input id="site_address_line2" name="site_address_line2" placeholder="Address line 2" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="site_city" name="site_city" placeholder="City" />
        <Input id="site_postal_code" name="site_postal_code" placeholder="Postal code" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create job"}
      </Button>
    </form>
  );
}

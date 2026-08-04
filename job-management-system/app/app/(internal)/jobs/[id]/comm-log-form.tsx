"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCommunicationLog, type CommLogFormState } from "../actions";

const initialState: CommLogFormState = {};

export function CommLogForm({ jobId, customerId }: { jobId: string; customerId: string }) {
  const [state, formAction, pending] = useActionState(
    addCommunicationLog.bind(null, jobId, customerId),
    initialState,
  );
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="channel">Channel</Label>
          <Select name="channel" defaultValue="phone">
            <SelectTrigger id="channel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="in_person">In person</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="direction">Direction</Label>
          <Select name="direction" defaultValue="outbound">
            <SelectTrigger id="direction" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">Outbound (we contacted them)</SelectItem>
              <SelectItem value="inbound">Inbound (they contacted us)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" rows={2} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Log communication"}
      </Button>
    </form>
  );
}

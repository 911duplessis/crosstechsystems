"use client";

import { useActionState } from "react";
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
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/jobs/status";
import { changeJobStatus, type StatusChangeState } from "../actions";
import type { JobStatus } from "@/types/database";

const initialState: StatusChangeState = {};

export function StatusForm({ jobId, currentStatus }: { jobId: string; currentStatus: JobStatus }) {
  const [state, formAction, pending] = useActionState(
    changeJobStatus.bind(null, jobId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={currentStatus}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="Context for this change…" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}

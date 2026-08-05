"use client";

import { useActionState, useRef } from "react";
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
import { addJobNote, type JobNoteFormState } from "../actions";
import { JOB_NOTE_TYPE_LABELS } from "@/lib/jobs/status";

const initialState: JobNoteFormState = {};

export function NoteForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(addJobNote.bind(null, jobId), initialState);
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
          <Label htmlFor="note_type">Type</Label>
          <Select name="note_type" defaultValue="general">
            <SelectTrigger id="note_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(JOB_NOTE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="time_estimate_hours">Time estimate (hours, optional)</Label>
          <Input id="time_estimate_hours" name="time_estimate_hours" type="number" step="0.5" min="0" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="content">Note</Label>
        <Textarea id="content" name="content" rows={2} required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}

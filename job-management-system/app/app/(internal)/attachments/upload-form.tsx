"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AttachmentFormState } from "./actions";

const initialState: AttachmentFormState = {};

export function UploadForm({
  action,
}: {
  action: (state: AttachmentFormState, formData: FormData) => Promise<AttachmentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex-1 min-w-48 space-y-1">
        <Input name="file" type="file" required />
      </div>
      <div className="flex-1 min-w-32 space-y-1">
        <Input name="caption" placeholder="Caption (optional)" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

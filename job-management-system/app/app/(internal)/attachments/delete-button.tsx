"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteAttachment } from "./actions";

export function DeleteAttachmentButton({
  attachmentId,
  filePath,
  revalidatePathValue,
}: {
  attachmentId: string;
  filePath: string;
  revalidatePathValue: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remove this attachment?")) return;
        startTransition(() => {
          deleteAttachment(attachmentId, filePath, revalidatePathValue);
        });
      }}
    >
      Remove
    </Button>
  );
}

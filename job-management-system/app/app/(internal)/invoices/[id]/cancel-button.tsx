"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CancelButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this invoice? This can't be undone.")) return;
        startTransition(action);
      }}
    >
      {pending ? "Cancelling…" : "Cancel invoice"}
    </Button>
  );
}

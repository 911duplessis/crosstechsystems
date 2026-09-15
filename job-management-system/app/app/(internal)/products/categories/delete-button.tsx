"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this category?")) return;
        startTransition(() => deleteCategory(id));
      }}
    >
      Delete
    </Button>
  );
}

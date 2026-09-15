"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ActionState } from "../actions";
import type { QuoteStatus } from "@/types/database";

interface Props {
  status: QuoteStatus;
  onSend: () => Promise<void>;
  onReject: () => Promise<void>;
  approveAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

export function StatusActions({ status, onSend, onReject, approveAction }: Props) {
  const [sending, startSend] = useTransition();
  const [rejecting, startReject] = useTransition();
  const [approving, startApprove] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveError, setApproveError] = useState<string | undefined>();

  if (status === "approved" || status === "rejected") {
    return null;
  }

  function submitApproval(formData: FormData) {
    startApprove(async () => {
      const result = await approveAction({}, formData);
      if (result.error) {
        setApproveError(result.error);
      } else {
        setApproveError(undefined);
        setApproveOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <Button size="sm" disabled={sending} onClick={() => startSend(onSend)}>
          {sending ? "Sending…" : "Mark as sent"}
        </Button>
      )}

      {(status === "draft" || status === "sent") && (
        <>
          <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)}>
            Record approval
          </Button>
          <Button size="sm" variant="ghost" disabled={rejecting} onClick={() => startReject(onReject)}>
            {rejecting ? "…" : "Mark as rejected"}
          </Button>
        </>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record customer approval</DialogTitle>
          </DialogHeader>
          <form action={submitApproval} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="note">How did the customer approve?</Label>
              <Textarea
                id="note"
                name="note"
                rows={2}
                placeholder="e.g. Verbal approval via call, confirmed by WhatsApp on…"
                required
              />
            </div>
            {approveError && <p className="text-sm text-destructive">{approveError}</p>}
            <DialogFooter>
              <Button type="submit" disabled={approving}>
                {approving ? "Saving…" : "Confirm approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

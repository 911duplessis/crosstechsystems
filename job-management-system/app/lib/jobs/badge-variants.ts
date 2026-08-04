import type { JobPriority, JobStatus } from "@/types/database";

export function priorityBadgeVariant(
  priority: JobPriority,
): "default" | "outline" | "secondary" | "destructive" {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

export function statusBadgeVariant(
  status: JobStatus,
): "default" | "outline" | "secondary" | "destructive" {
  if (status === "cancelled") return "destructive";
  if (status === "paid" || status === "archived") return "secondary";
  if (status === "completed" || status === "invoice_issued") return "default";
  return "outline";
}

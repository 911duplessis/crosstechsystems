import type { JobStatus } from "@/types/database";

export const JOB_STATUSES: JobStatus[] = [
  "new_enquiry",
  "scheduled",
  "inspection_required",
  "quote_pending",
  "quote_sent",
  "approved",
  "work_in_progress",
  "completed",
  "invoice_issued",
  "paid",
  "archived",
  "cancelled",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new_enquiry: "New enquiry",
  scheduled: "Scheduled",
  inspection_required: "Inspection required",
  quote_pending: "Quote pending",
  quote_sent: "Quote sent",
  approved: "Approved",
  work_in_progress: "Work in progress",
  completed: "Completed",
  invoice_issued: "Invoice issued",
  paid: "Paid",
  archived: "Archived",
  cancelled: "Cancelled",
};

export const OPEN_STATUSES: JobStatus[] = [
  "new_enquiry",
  "scheduled",
  "inspection_required",
  "quote_pending",
  "quote_sent",
  "approved",
  "work_in_progress",
];

export function isOpenStatus(status: JobStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export const JOB_PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
} as const;

export const JOB_NOTE_TYPE_LABELS = {
  general: "General",
  fault_finding: "Fault finding",
  materials_required: "Materials required",
  labour_estimate: "Labour estimate",
  internal_comment: "Internal comment",
} as const;

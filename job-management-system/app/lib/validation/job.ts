import { z } from "zod";

export const jobStatusValues = [
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
] as const;

export const newJobSchema = z.object({
  customer_id: z.string().uuid("Choose a customer"),
  assigned_technician_id: z.string().uuid().optional(),
  service_requested: z.string().trim().min(1, "Describe the service requested"),
  service_category: z.string().trim().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  source: z.enum(["phone", "whatsapp", "email", "walk_in", "website", "referral"]),
  site_address_line1: z.string().trim().optional(),
  site_address_line2: z.string().trim().optional(),
  site_city: z.string().trim().optional(),
  site_postal_code: z.string().trim().optional(),
  preferred_date: z.string().trim().optional(),
});

export type NewJobInput = z.infer<typeof newJobSchema>;

export const statusChangeSchema = z.object({
  status: z.enum(jobStatusValues),
  note: z.string().trim().optional(),
});

export const jobNoteSchema = z.object({
  note_type: z.enum([
    "fault_finding",
    "materials_required",
    "labour_estimate",
    "internal_comment",
    "general",
  ]),
  content: z.string().trim().min(1, "Note content is required"),
  time_estimate_hours: z
    .union([z.string().trim().length(0), z.coerce.number().min(0).max(999)])
    .optional(),
});

export const communicationLogSchema = z.object({
  channel: z.enum(["phone", "whatsapp", "email", "in_person", "sms"]),
  direction: z.enum(["inbound", "outbound"]),
  summary: z.string().trim().min(1, "Summary is required"),
});

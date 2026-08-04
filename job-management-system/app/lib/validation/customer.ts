import { z } from "zod";

export const customerSchema = z.object({
  customer_type: z.enum(["individual", "business"]),
  name: z.string().trim().min(1, "Name is required"),
  company_name: z.string().trim().optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  phone: z.string().trim().optional(),
  address_line1: z.string().trim().optional(),
  address_line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

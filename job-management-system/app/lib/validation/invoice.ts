import { z } from "zod";

export const invoiceMetaSchema = z.object({
  discount_type: z.enum(["none", "percent", "fixed"]),
  discount_value: z.coerce.number().min(0).default(0),
  due_date: z.string().trim().optional(),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_method: z.enum(["cash", "eft", "card", "other"]),
  payment_date: z.string().trim().min(1, "Payment date is required"),
  reference_number: z.string().trim().optional(),
});

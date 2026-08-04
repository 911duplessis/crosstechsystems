import { z } from "zod";

export const lineItemSchema = z.object({
  item_type: z.enum(["labour", "product"]),
  product_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_price: z.coerce.number().min(0, "Unit price can't be negative"),
  line_discount_percent: z.coerce.number().min(0).max(100).default(0),
});

export const quoteMetaSchema = z.object({
  discount_type: z.enum(["none", "percent", "fixed"]),
  discount_value: z.coerce.number().min(0).default(0),
  expiry_date: z.string().trim().optional(),
  terms_and_conditions: z.string().trim().optional(),
});

export const approveQuoteSchema = z.object({
  note: z.string().trim().min(1, "Add a short note on how the customer approved"),
});

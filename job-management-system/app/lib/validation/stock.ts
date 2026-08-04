import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  parent_category_id: z.string().uuid().optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  category_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  cost_price: z.coerce.number().min(0).default(0),
  selling_price: z.coerce.number().min(0).default(0),
  unit: z.string().trim().min(1).default("each"),
  min_stock_level: z.coerce.number().min(0).default(0),
});

export const stockAdjustmentSchema = z.object({
  movement_type: z.enum(["purchase_in", "job_usage", "adjustment", "return"]),
  quantity_change: z.coerce.number().refine((n) => n !== 0, "Quantity can't be zero"),
  notes: z.string().trim().optional(),
});

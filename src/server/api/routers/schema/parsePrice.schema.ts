import { z } from "zod";

export const ParsePriceSchema = z
  .string()
  .min(1, { message: "Price is required" })
  .transform((value) => value.replace(",", "."))
  .transform((value) => Number.parseFloat(value))
  .refine((value) => Number.isFinite(value), { message: "Price must be a valid number" })
  .refine((value) => value >= 0, { message: "Price must be non-negative" })
  .transform((value) => value.toFixed(2));

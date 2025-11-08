import { z } from "zod";

export const ParseQuantitySchema = z
  .string()
  .min(1, { message: "Quantity is required" })
  .transform((value) => Number.parseInt(value, 10))
  .refine((value) => Number.isInteger(value), { message: "Quantity must be an integer" })
  .refine((value) => value >= 0, { message: "Quantity must be non-negative" });
import { z } from "zod"

export const productFormSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(256, { message: "Name must be less than 256 characters" }),
  description: z.string().max(256, { message: "Description must be less than 256 characters" }),
  price: z
    .string()
    .min(1, { message: "Price is required" })
    .refine(
      (value) => {
        const normalized = value.replace(",", ".")
        const num = Number.parseFloat(normalized)
        return Number.isFinite(num) && num >= 0
      },
      { message: "Price must be a valid non-negative number" },
    ),
  quantity: z
    .string()
    .min(1, { message: "Quantity is required" })
    .refine(
      (value) => {
        const num = Number.parseInt(value, 10)
        return Number.isInteger(num) && num >= 0
      },
      { message: "Quantity must be a valid non-negative integer" },
    ),
})
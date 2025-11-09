import { z } from "zod";

export const UpdateOrderSchema = z.object({
  id: z.number().int().positive().min(1, { message: "ID must be greater than 0" }),
  orderDate: z.coerce.date().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
});
import z from "zod";

export const ListOrderSchema = z.object({
  cursor: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().min(1).max(100).default(10),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
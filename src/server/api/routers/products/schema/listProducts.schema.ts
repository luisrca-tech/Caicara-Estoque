import { z } from "zod";

export const ListProductsSchema = z.object({
  cursor: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().min(1).max(100).default(10),
  search: z.string().optional(),
});
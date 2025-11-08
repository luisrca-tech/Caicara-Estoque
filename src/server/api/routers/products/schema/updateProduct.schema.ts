import { CreateProductSchema } from "./createProduct.schema";
import { z } from "zod";

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z
    .number()
    .int()
    .positive()
    .min(1, { message: "ID must be greater than 0" }),
});
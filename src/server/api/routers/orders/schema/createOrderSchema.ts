import z from "zod";
import { ParsePriceSchema } from "../../schema/parsePrice.schema";
import { ParseQuantitySchema } from "../../schema/parseQuantity.schema";

export const CreateOrderSchema = z.object({
  orderDate: z.coerce.date(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  items: z.array(z.object({
    productId: z.number().int().positive().min(1, { message: "Product ID must be greater than 0" }),
    quantity: ParseQuantitySchema,
    price: ParsePriceSchema,
  })),
});
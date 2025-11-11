import type { z } from "zod";
import type { CreateOrderSchema } from "~/server/api/routers/orders/schema/createOrderSchema";

export type OrderFormValues = z.infer<typeof CreateOrderSchema>;
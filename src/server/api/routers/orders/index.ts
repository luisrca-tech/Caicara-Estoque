import { orders } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import { CreateOrderSchema } from "./schema/createOrderSchema";
import { UpdateOrderSchema } from "./schema/updateOrderSchema";
import { orderItems } from "~/server/db/schema/ordersItems";
import { formatToBrazilianDate } from "~/utils/formatToBrazilianDate";

export const ordersRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(orders).orderBy(desc(orders.createdAt));

    return rows.map((row) => ({
      ...row,
      orderDate: formatToBrazilianDate(row.orderDate),
    }));
  }),

  create: publicProcedure.input(CreateOrderSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.transaction(async (tx) => {
      const totalPrice = input.items.reduce((acc, item) => acc + item.quantity * Number(item.price), 0);
      const orderDate = input.orderDate.toISOString().slice(0, 10);
      const [order] = await tx.insert(orders).values({
        orderDate,
        totalPrice: totalPrice.toFixed(2),
        status: input.status ?? "pending",
      }).returning();

      if (!order) {
        throw new Error("Failed to create order");
      }

      await tx.insert(orderItems).values(input.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })));

      return {
        ...order,
        orderDate: formatToBrazilianDate(orderDate),
      };
    });
  }),

  update: publicProcedure.input(UpdateOrderSchema).mutation(async ({ ctx, input }) => {
    const { id, orderDate, status } = input;
    const payload: Partial<typeof orders.$inferInsert> = {};

    if (orderDate) {
      payload.orderDate = orderDate.toISOString().slice(0, 10);
    }

    if (status) {
      payload.status = status;
    }

    const [updated] = await ctx.db
      .update(orders)
      .set(payload)
      .where(eq(orders.id, id))
      .returning();

    if (!updated) {
      throw new Error("Order not found");
    }

    return {
      ...updated,
      orderDate: formatToBrazilianDate(updated.orderDate),
    };
  }),

  delete: publicProcedure.input(z.object({ id: z.number().int().positive().min(1, { message: "ID must be greater than 0" }) })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(orders).where(eq(orders.id, input.id));
  }),
});
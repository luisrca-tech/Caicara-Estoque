import { orders } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { and, asc, count, desc, eq, gt, gte, lte } from "drizzle-orm";
import z from "zod";
import { CreateOrderSchema } from "./schema/createOrderSchema";
import { UpdateOrderSchema } from "./schema/updateOrderSchema";
import { orderItems } from "~/server/db/schema/ordersItems";
import { formatToBrazilianDate } from "~/utils/formatToBrazilianDate";
import { ListOrderSchema } from "./schema/listOrder.schema";

export const ordersRouter = createTRPCRouter({
  list: publicProcedure.input(ListOrderSchema).query(async ({ ctx, input }) => {
    const dateClauses = [];
    if (input.dateFrom) {
      dateClauses.push(gte(orders.orderDate, input.dateFrom.toISOString().slice(0, 10)));
    }
    if (input.dateTo) {
      dateClauses.push(lte(orders.orderDate, input.dateTo.toISOString().slice(0, 10)));
    }
    const whereClause = dateClauses.length > 0 ? and(...dateClauses) : undefined;

    if (input.cursor !== undefined) {
      const items = await ctx.db.select().from(orders).where(whereClause ? and(whereClause, gt(orders.id, input.cursor)) : gt(orders.id, input.cursor)).orderBy(input.order === "asc" ? asc(orders.id) : desc(orders.id)).limit(input.limit + 1);
      const hasMore = items.length > input.limit;
      const actualItems = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore && actualItems.length > 0 ? actualItems[actualItems.length - 1]?.id ?? null : null;

      return {
        items: actualItems.map((item) => ({
          ...item,
          orderDate: formatToBrazilianDate(item.orderDate),
        })),
        pagination: {
          nextCursor,
          hasMore,
        },
      };
    }

    if (input.page !== undefined) {
      const offset = (input.page - 1) * input.limit;

      const [items, totalResult] = await Promise.all([
        ctx.db.select().from(orders).where(whereClause).orderBy(input.order === "asc" ? asc(orders.id) : desc(orders.id)).limit(input.limit).offset(offset),
        ctx.db.select({ count: count() }).from(orders).where(whereClause),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / input.limit);

      return {
        items: items.map((item) => ({
          ...item,
          orderDate: formatToBrazilianDate(item.orderDate),
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
          hasMore: input.page < totalPages,
        },
      };
    }

    const allItems = await ctx.db.select().from(orders).where(whereClause).orderBy(input.order === "asc" ? asc(orders.id) : desc(orders.id));
    return {
      items: allItems.map((item) => ({
        ...item,
        orderDate: formatToBrazilianDate(item.orderDate),
      })),
      pagination: {},
    };
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

    const rawOrderDate = updated.orderDate as unknown;

    return {
      ...updated,
      orderDate: formatToBrazilianDate(
        rawOrderDate instanceof Date
          ? rawOrderDate.toISOString().slice(0, 10)
          : String(rawOrderDate),
      ),
    };
  }),

  delete: publicProcedure.input(z.object({ id: z.number().int().positive().min(1, { message: "ID must be greater than 0" }) })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(orders).where(eq(orders.id, input.id));
  }),
});
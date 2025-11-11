import { orders } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { and, asc, count, desc, eq, gt, gte, lte } from "drizzle-orm";
import z from "zod";
import { CreateOrderSchema } from "./schema/createOrderSchema";
import { UpdateOrderSchema } from "./schema/updateOrderSchema";
import { orderItems } from "~/server/db/schema/ordersItems";
import { formatToBrazilianDate } from "~/utils/formatToBrazilianDate";
import { ListOrderSchema } from "./schema/listOrder.schema";
import { products } from "~/server/db/schema/products";

export const ordersRouter = createTRPCRouter({
  list: publicProcedure.input(ListOrderSchema).query(async ({ ctx, input }) => {
    const toBrazilianDate = (value: unknown) => {
      const iso =
        value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
      return formatToBrazilianDate(iso);
    };

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
          orderDate: toBrazilianDate(item.orderDate),
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
          orderDate: toBrazilianDate(item.orderDate),
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
        orderDate: toBrazilianDate(item.orderDate),
      })),
      pagination: {},
    };
  }),
  
  create: publicProcedure.input(CreateOrderSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.transaction(async (tx) => {
      const totalPrice = (input.items ?? []).reduce((acc, item) => acc + item.quantity * Number(item.price), 0);
      const orderDate = input.orderDate.toISOString().slice(0, 10);
      const [order] = await tx.insert(orders).values({
        orderDate,
        totalPrice: totalPrice.toFixed(2),
        status: input.status ?? "pending",
      }).returning();

      if (!order) {
        throw new Error("Failed to create order");
      }

      if ((input.items ?? []).length > 0) {
        await tx.insert(orderItems).values(input.items!.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })));
      }

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

  getById: publicProcedure.input(z.object({ id: z.number().int().positive().min(1, { message: "ID must be greater than 0" }) })).query(async ({ ctx, input }) => {
    const [order] = await ctx.db.select().from(orders).where(eq(orders.id, input.id));

    if (!order) {
      throw new Error("Order not found");
    }

    const items = await ctx.db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          quantity: products.quantity,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, input.id));

    const rawOrderDate = order.orderDate as unknown;

    return {
      ...order,
      orderDate: formatToBrazilianDate(
        rawOrderDate instanceof Date
          ? rawOrderDate.toISOString().slice(0, 10)
          : String(rawOrderDate),
      ),
      items,
    };
  }),

  addItem: publicProcedure
    .input(
      z.object({
        orderId: z.number().int().positive().min(1, { message: "Order ID must be greater than 0" }),
        productId: z.number().int().positive().min(1, { message: "Product ID must be greater than 0" }),
        quantity: z.number().int().positive().min(1, { message: "Quantity must be greater than 0" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [product] = await tx.select().from(products).where(eq(products.id, input.productId));

        if (!product) {
          throw new Error("Product not found");
        }

        const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId));

        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status !== "pending") {
          throw new Error("Cannot add items to a completed or cancelled order");
        }

        const itemPrice = Number(product.price);
        const [newItem] = await tx
          .insert(orderItems)
          .values({
            orderId: input.orderId,
            productId: input.productId,
            quantity: input.quantity,
            price: itemPrice.toFixed(2),
          })
          .returning();

        const existingItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));

        const totalPrice = existingItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

        await tx.update(orders).set({ totalPrice: totalPrice.toFixed(2) }).where(eq(orders.id, input.orderId));

        return newItem;
      });
    }),

  removeItem: publicProcedure
    .input(
      z.object({
        orderId: z.number().int().positive().min(1, { message: "Order ID must be greater than 0" }),
        itemId: z.number().int().positive().min(1, { message: "Item ID must be greater than 0" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId));

        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status !== "pending") {
          throw new Error("Cannot remove items from a completed or cancelled order");
        }

        await tx.delete(orderItems).where(eq(orderItems.id, input.itemId));

        const remainingItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));

        const totalPrice = remainingItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

        await tx.update(orders).set({ totalPrice: totalPrice.toFixed(2) }).where(eq(orders.id, input.orderId));

        return { success: true };
      });
    }),

  completeOrder: publicProcedure
    .input(z.object({ orderId: z.number().int().positive().min(1, { message: "Order ID must be greater than 0" }) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, input.orderId));

        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status !== "pending") {
          throw new Error("Order is already completed or cancelled");
        }

        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));

        if (items.length === 0) {
          throw new Error("Cannot complete an order with no items");
        }

        for (const item of items) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const newQuantity = product.quantity + item.quantity;

          await tx.update(products).set({ quantity: newQuantity }).where(eq(products.id, item.productId));
        }

        await tx.update(orders).set({ status: "completed" }).where(eq(orders.id, input.orderId));

        return { success: true };
      });
    }),
});
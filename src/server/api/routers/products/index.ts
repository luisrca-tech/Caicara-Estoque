import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { orderItems, orders, products } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { CreateProductSchema } from "./schema/createProduct.schema";
import { ListProductsSchema } from "./schema/listProducts.schema";
import { UpdateProductSchema } from "./schema/updateProduct.schema";

export const productsRouter = createTRPCRouter({
  listAll: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select()
      .from(products)
      .where(eq(products.isDisabled, false))
      .orderBy(desc(products.createdAt));
    return items;
  }),

  list: publicProcedure
    .input(ListProductsSchema)
    .query(async ({ ctx, input }) => {
      const searchPattern = input.search?.trim()
        ? `%${input.search.trim()}%`
        : null;

      const searchCondition = searchPattern
        ? or(
            ilike(products.name, searchPattern),
            ilike(products.description, searchPattern)
          )
        : undefined;

      if (input.cursor !== undefined) {
        const whereConditions = searchCondition
          ? and(
              searchCondition,
              eq(products.isDisabled, false),
              gt(products.id, input.cursor)
            )
          : and(eq(products.isDisabled, false), gt(products.id, input.cursor));

        const items = await ctx.db
          .select()
          .from(products)
          .where(whereConditions)
          .orderBy(asc(products.id))
          .limit(input.limit + 1);

        const hasMore = items.length > input.limit;
        const actualItems = hasMore ? items.slice(0, -1) : items;
        const nextCursor =
          hasMore && actualItems.length > 0
            ? actualItems[actualItems.length - 1]?.id ?? null
            : null;

        return {
          items: actualItems,
          pagination: {
            nextCursor,
            hasMore,
          },
        };
      }

      if (input.page !== undefined) {
        const offset = (input.page - 1) * input.limit;

        const whereCondition = searchCondition
          ? and(searchCondition, eq(products.isDisabled, false))
          : eq(products.isDisabled, false);

        const [items, totalResult] = await Promise.all([
          ctx.db
            .select()
            .from(products)
            .where(whereCondition)
            .orderBy(desc(products.createdAt))
            .limit(input.limit)
            .offset(offset),
          ctx.db
            .select({ count: count() })
            .from(products)
            .where(whereCondition),
        ]);

        const total = totalResult[0]?.count ?? 0;
        const totalPages = Math.ceil(total / input.limit);

        return {
          items,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
            hasMore: input.page < totalPages,
          },
        };
      }

      const whereCondition = searchCondition
        ? and(searchCondition, eq(products.isDisabled, false))
        : eq(products.isDisabled, false);

      const allItems = await ctx.db
        .select()
        .from(products)
        .where(whereCondition)
        .orderBy(desc(products.createdAt));

      return {
        items: allItems,
        pagination: {},
      };
    }),

  create: publicProcedure
    .input(CreateProductSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(products).values(input);
    }),

  update: publicProcedure
    .input(UpdateProductSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(products)
        .set(input)
        .where(eq(products.id, input.id));
    }),

  getOrderItemsCount: publicProcedure
    .input(
      z.object({
        id: z
          .number()
          .int()
          .positive()
          .min(1, { message: "ID must be greater than 0" }),
      })
    )
    .query(async ({ ctx, input }) => {
      const distinctOrders = await ctx.db
        .selectDistinct({ orderId: orderItems.orderId })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(orderItems.productId, input.id),
            eq(orders.status, "pending"),
            eq(products.isDisabled, false)
          )
        );

      return { count: distinctOrders.length };
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z
          .number()
          .int()
          .positive()
          .min(1, { message: "ID must be greater than 0" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const [product] = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, input.id));

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Produto não encontrado",
          });
        }

        const affectedOrderItems = await tx
          .select({
            orderId: orderItems.orderId,
            orderStatus: orders.status,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(eq(orderItems.productId, input.id));

        const pendingOrCancelledOrderIds = affectedOrderItems
          .filter(
            (item) =>
              item.orderStatus === "pending" || item.orderStatus === "cancelled"
          )
          .map((item) => item.orderId);

        const uniquePendingOrCancelledOrderIds = [
          ...new Set(pendingOrCancelledOrderIds),
        ];

        if (uniquePendingOrCancelledOrderIds.length > 0) {
          await tx
            .delete(orderItems)
            .where(
              and(
                eq(orderItems.productId, input.id),
                inArray(orderItems.orderId, uniquePendingOrCancelledOrderIds)
              )
            );

          for (const orderId of uniquePendingOrCancelledOrderIds) {
            const remainingItems = await tx
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, orderId));

            const totalPrice = remainingItems.reduce(
              (acc, item) => acc + Number(item.price) * item.quantity,
              0
            );

            await tx
              .update(orders)
              .set({ totalPrice: totalPrice.toFixed(2) })
              .where(eq(orders.id, orderId));
          }
        }

        await tx
          .update(products)
          .set({ isDisabled: true })
          .where(eq(products.id, input.id));

        return { success: true };
      });
    }),

  restore: publicProcedure
    .input(
      z.object({
        id: z
          .number()
          .int()
          .positive()
          .min(1, { message: "ID must be greater than 0" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, input.id));

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado",
        });
      }

      await ctx.db
        .update(products)
        .set({ isDisabled: false })
        .where(eq(products.id, input.id));

      return { success: true };
    }),

  listDisabled: publicProcedure
    .input(ListProductsSchema)
    .query(async ({ ctx, input }) => {
      const searchPattern = input.search?.trim()
        ? `%${input.search.trim()}%`
        : null;

      const searchCondition = searchPattern
        ? or(
            ilike(products.name, searchPattern),
            ilike(products.description, searchPattern)
          )
        : undefined;

      if (input.cursor !== undefined) {
        const whereConditions = searchCondition
          ? and(
              searchCondition,
              eq(products.isDisabled, true),
              gt(products.id, input.cursor)
            )
          : and(eq(products.isDisabled, true), gt(products.id, input.cursor));

        const items = await ctx.db
          .select()
          .from(products)
          .where(whereConditions)
          .orderBy(asc(products.id))
          .limit(input.limit + 1);

        const hasMore = items.length > input.limit;
        const actualItems = hasMore ? items.slice(0, -1) : items;
        const nextCursor =
          hasMore && actualItems.length > 0
            ? actualItems[actualItems.length - 1]?.id ?? null
            : null;

        return {
          items: actualItems,
          pagination: {
            nextCursor,
            hasMore,
          },
        };
      }

      if (input.page !== undefined) {
        const offset = (input.page - 1) * input.limit;

        const whereCondition = searchCondition
          ? and(searchCondition, eq(products.isDisabled, true))
          : eq(products.isDisabled, true);

        const [items, totalResult] = await Promise.all([
          ctx.db
            .select()
            .from(products)
            .where(whereCondition)
            .orderBy(desc(products.createdAt))
            .limit(input.limit)
            .offset(offset),
          ctx.db
            .select({ count: count() })
            .from(products)
            .where(whereCondition),
        ]);

        const total = totalResult[0]?.count ?? 0;
        const totalPages = Math.ceil(total / input.limit);

        return {
          items,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
            hasMore: input.page < totalPages,
          },
        };
      }

      const whereCondition = searchCondition
        ? and(searchCondition, eq(products.isDisabled, true))
        : eq(products.isDisabled, true);

      const allItems = await ctx.db
        .select()
        .from(products)
        .where(whereCondition)
        .orderBy(desc(products.createdAt));

      return {
        items: allItems,
        pagination: {},
      };
    }),

  adjustQuantity: publicProcedure
    .input(
      z.object({
        id: z
          .number()
          .int()
          .positive()
          .min(1, { message: "ID must be greater than 0" }),
        delta: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [currentProduct] = await ctx.db
        .select({ quantity: products.quantity })
        .from(products)
        .where(eq(products.id, input.id));

      if (!currentProduct) {
        throw new Error("Product not found");
      }

      const newQuantity = Math.max(0, currentProduct.quantity + input.delta);

      const [updatedProduct] = await ctx.db
        .update(products)
        .set({ quantity: newQuantity })
        .where(eq(products.id, input.id))
        .returning({ id: products.id, quantity: products.quantity });

      if (!updatedProduct) {
        throw new Error("Failed to update product quantity");
      }

      return updatedProduct;
    }),
});

import { and, asc, count, desc, eq, gt, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { products } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { CreateProductSchema } from "./schema/createProduct.schema";
import { ListProductsSchema } from "./schema/listProducts.schema";
import { UpdateProductSchema } from "./schema/updateProduct.schema";

export const productsRouter = createTRPCRouter({
  listAll: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select()
      .from(products)
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
          ? and(searchCondition, gt(products.id, input.cursor))
          : gt(products.id, input.cursor);

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

        const [items, totalResult] = await Promise.all([
          ctx.db
            .select()
            .from(products)
            .where(searchCondition)
            .orderBy(desc(products.createdAt))
            .limit(input.limit)
            .offset(offset),
          ctx.db
            .select({ count: count() })
            .from(products)
            .where(searchCondition),
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

      const allItems = await ctx.db
        .select()
        .from(products)
        .where(searchCondition)
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
      return await ctx.db.delete(products).where(eq(products.id, input.id));
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

      return await ctx.db
        .update(products)
        .set({ quantity: newQuantity })
        .where(eq(products.id, input.id));
    }),
});

import { products } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { CreateProductSchema } from "./schema/createProduct.schema";
import { UpdateProductSchema } from "./schema/updateProduct.schema";

export const productsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(products).orderBy(desc(products.createdAt));
  }),

  create: publicProcedure.input(CreateProductSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.insert(products).values(input);
  }),

  update: publicProcedure.input(UpdateProductSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.update(products).set(input).where(eq(products.id, input.id));
  }),

  delete: publicProcedure.input(z.object({
    id: z.number().int().positive().min(1, { message: "ID must be greater than 0" }),
  })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(products).where(eq(products.id, input.id));
  }),
});
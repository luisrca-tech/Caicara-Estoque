import { products } from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { desc } from "drizzle-orm";
import { CreateProductSchema } from "./schema/createProduct.schema";

export const productsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(products).orderBy(desc(products.createdAt));
  }),

  create: publicProcedure.input(CreateProductSchema).mutation(async ({ ctx, input }) => {
    return await ctx.db.insert(products).values(input);
  }),
});
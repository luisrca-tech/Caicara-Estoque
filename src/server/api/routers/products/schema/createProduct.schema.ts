import { z } from "zod";
import { ParsePriceSchema } from "../../schema/parsePrice.schema";
import { ParseQuantitySchema } from "../../schema/parseQuantity.schema";

export const CreateProductSchema = z.object({
	name: z
		.string()
		.min(1, { message: "Name is required" })
		.max(256, { message: "Name must be less than 256 characters" }),
	description: z
		.string()
		.max(256, { message: "Description must be less than 256 characters" })
		.nullable()
		.default(null),
	price: ParsePriceSchema,
	quantity: ParseQuantitySchema,
});
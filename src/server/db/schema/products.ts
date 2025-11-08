import { createTable } from "../table";

export const products = createTable("product", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 256 }).notNull(),
	description: d.varchar({ length: 256 }),
	price: d.numeric({ precision: 10, scale: 2 }).notNull(),
	quantity: d.integer().notNull(),
	createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

import { relations } from "drizzle-orm";
import { createTable } from "../table";
import { orderItems } from "./ordersItems";

export const orders = createTable("order", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	orderDate: d.date().notNull(),
	totalPrice: d.numeric({ precision: 10, scale: 2 }).notNull(),
	status: d.varchar({ length: 32 }).notNull().default("pending"),
	createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
	orderItems: many(orderItems),
}));
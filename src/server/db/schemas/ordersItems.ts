import { relations } from "drizzle-orm";
import { createTable } from "../schema";
import { products } from "./products";
import { orders } from "./orders";

export const orderItems = createTable("order_item", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	orderId: d
		.integer()
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: d.integer().notNull().references(() => products.id),
	quantity: d.integer().notNull(),
	price: d.numeric({ precision: 10, scale: 2 }).notNull(),
	createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));
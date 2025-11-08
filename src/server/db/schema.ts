// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `caicara-stock_${name}`);

export const products = createTable("product", (d) => ({
	id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
	name: d.varchar({ length: 256 }),
	createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));
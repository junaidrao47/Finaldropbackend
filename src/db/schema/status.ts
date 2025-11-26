import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Status Lookup Table
 * Referenced by Organizations, Users, Carriers for their status
 */
export const status = pgTable('status', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  category: varchar('category', { length: 50 }), // 'organization', 'user', 'carrier', 'package', etc.
  color: varchar('color', { length: 20 }), // For UI display
  icon: varchar('icon', { length: 100 }),
  sortOrder: varchar('sort_order', { length: 10 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StatusSelect = typeof status.$inferSelect;
export type StatusInsert = typeof status.$inferInsert;

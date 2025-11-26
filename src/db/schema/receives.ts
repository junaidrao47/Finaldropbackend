import { pgTable, serial, timestamp, jsonb, varchar, integer } from 'drizzle-orm/pg-core';

export const receives = pgTable('receives', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id'),
  userId: integer('user_id'),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ReceiveSelect = typeof receives.$inferSelect;
export type ReceiveInsert = typeof receives.$inferInsert;

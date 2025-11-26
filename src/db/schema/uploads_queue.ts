import { pgTable, serial, timestamp, jsonb, varchar, integer } from 'drizzle-orm/pg-core';

export const uploadsQueue = pgTable('uploads_queue', {
  id: serial('id').primaryKey(),
  receiveId: integer('receive_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UploadsQueueSelect = typeof uploadsQueue.$inferSelect;
export type UploadsQueueInsert = typeof uploadsQueue.$inferInsert;

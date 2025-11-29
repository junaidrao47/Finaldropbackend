import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

/**
 * Support Chat Sessions table for customer support conversations
 */
export const supportSessions = pgTable('support_sessions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  assignedAgentId: integer('assigned_agent_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  subject: varchar('subject', { length: 255 }).default('New Inquiry'),
  inquiryType: varchar('inquiry_type', { length: 50 }).default('general').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  isEscalated: boolean('is_escalated').default(false).notNull(),
  relatedPackageId: integer('related_package_id'),
  lastMessageAt: timestamp('last_message_at'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Support Messages table for individual messages in a support session
 */
export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => supportSessions.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text').notNull(),
  senderType: varchar('sender_type', { length: 50 }).default('user').notNull(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'set null' }),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  attachmentName: varchar('attachment_name', { length: 255 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SupportSessionSelect = typeof supportSessions.$inferSelect;
export type SupportSessionInsert = typeof supportSessions.$inferInsert;
export type SupportMessageSelect = typeof supportMessages.$inferSelect;
export type SupportMessageInsert = typeof supportMessages.$inferInsert;

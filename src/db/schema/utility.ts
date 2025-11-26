import { pgTable, uuid, varchar, text, boolean, date, integer, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.new';
import { users } from './users.new';

/**
 * OTP_Codes Table
 * One-time passwords for verification
 */
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  reason: varchar('reason', { length: 100 }), // login, password_reset, email_verification, etc.
  code: varchar('code', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isUsed: boolean('is_used').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OtpCodesSelect = typeof otpCodes.$inferSelect;
export type OtpCodesInsert = typeof otpCodes.$inferInsert;

/**
 * Chat_Messages Table
 * Messages between users
 */
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  receiverId: uuid('receiver_id').notNull().references(() => users.id),
  message: text('message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id), // Same as senderId
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ChatMessagesSelect = typeof chatMessages.$inferSelect;
export type ChatMessagesInsert = typeof chatMessages.$inferInsert;

/**
 * Subscriptions_Plan Table
 * Available subscription plans
 */
export const subscriptionsPlan = pgTable('subscriptions_plan', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  features: jsonb('features').$type<Record<string, any>>(), // Flexible feature list
  planType: varchar('plan_type', { length: 50 }), // Monthly, Semester, Yearly, On Demand
  transactionRange: varchar('transaction_range', { length: 100 }),
  howManyOrganizations: integer('how_many_organizations'),
  howManyWarehouses: integer('how_many_warehouses'),
  price: decimal('price', { precision: 10, scale: 2 }),
  onSale: boolean('on_sale').default(false).notNull(),
  salesIcon: varchar('sales_icon', { length: 100 }),
  showWas: decimal('show_was', { precision: 10, scale: 2 }), // Original price
  startsOn: date('starts_on'),
  expiresOn: date('expires_on'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SubscriptionsPlanSelect = typeof subscriptionsPlan.$inferSelect;
export type SubscriptionsPlanInsert = typeof subscriptionsPlan.$inferInsert;

/**
 * Subscriptions Table
 * Organization subscriptions to plans
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  planId: uuid('plan_id').notNull().references(() => subscriptionsPlan.id),
  startedOn: date('started_on'),
  expiresOn: date('expires_on'),
  status: varchar('status', { length: 50 }), // Active, Expired, Canceled, etc.
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SubscriptionsSelect = typeof subscriptions.$inferSelect;
export type SubscriptionsInsert = typeof subscriptions.$inferInsert;

/**
 * Audit_Logs Table
 * System-wide audit trail for all actions
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id), // Optional
  userId: uuid('user_id').references(() => users.id), // The actor
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityId: uuid('entity_id'), // The UUID of the record affected
  entityName: varchar('entity_name', { length: 100 }), // The table name of the record affected
  memo: text('memo'), // Context or details of the action
  oldValues: jsonb('old_values').$type<Record<string, any>>(), // Previous values
  newValues: jsonb('new_values').$type<Record<string, any>>(), // New values
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'),
  createdBy: uuid('created_by').references(() => users.id), // Same as userId
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLogsSelect = typeof auditLogs.$inferSelect;
export type AuditLogsInsert = typeof auditLogs.$inferInsert;

import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from './users.new';
import { organizations } from './organizations.new';
import { carriers } from './carriers';

/**
 * Contacts Table
 * Store contact information for Sender/Carrier/Recipient
 */
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'Sender', 'Carrier', 'Recipient'
  contactNumber: varchar('contact_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  alternatePhone: varchar('alternate_phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ContactSelect = typeof contacts.$inferSelect;
export type ContactInsert = typeof contacts.$inferInsert;

/**
 * Blacklist Table
 * Blacklisted Carriers/Senders/Recipients
 */
export const blacklist = pgTable('blacklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  type: varchar('type', { length: 50 }).notNull(), // 'Carrier', 'Sender', 'Recipient'
  entityId: uuid('entity_id'), // Reference to carrier, user, or external entity
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active', 'archived'
  blacklistedAt: timestamp('blacklisted_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional auto-expiry
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type BlacklistSelect = typeof blacklist.$inferSelect;
export type BlacklistInsert = typeof blacklist.$inferInsert;

/**
 * Warning Messages Table
 * Warning messages for Sender/Carrier/Recipient
 */
export const warningMessages = pgTable('warning_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  type: varchar('type', { length: 50 }).notNull(), // 'Sender', 'Carrier', 'Recipient'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  severity: varchar('severity', { length: 50 }).default('warning').notNull(), // 'info', 'warning', 'critical'
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active', 'archived'
  displayOrder: integer('display_order').default(0),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WarningMessageSelect = typeof warningMessages.$inferSelect;
export type WarningMessageInsert = typeof warningMessages.$inferInsert;

/**
 * Refuse Package Settings Table
 * Settings for automatically refusing packages
 */
export const refusePackageSettings = pgTable('refuse_package_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  settingName: varchar('setting_name', { length: 255 }).notNull(),
  settingType: varchar('setting_type', { length: 50 }).notNull(), // 'carrier', 'sender', 'size', 'weight', 'condition'
  conditions: jsonb('conditions').notNull(), // JSON conditions for matching
  action: varchar('action', { length: 50 }).default('refuse').notNull(), // 'refuse', 'flag', 'notify'
  notifyEmail: varchar('notify_email', { length: 255 }),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  priority: integer('priority').default(0),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type RefusePackageSettingSelect = typeof refusePackageSettings.$inferSelect;
export type RefusePackageSettingInsert = typeof refusePackageSettings.$inferInsert;

/**
 * Linked Devices Table (extension of trusted devices)
 * Extended device management with more metadata
 */
export const linkedDevices = pgTable('linked_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  deviceName: varchar('device_name', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }), // 'mobile', 'tablet', 'desktop', 'scanner'
  deviceModel: varchar('device_model', { length: 255 }),
  osName: varchar('os_name', { length: 100 }),
  osVersion: varchar('os_version', { length: 50 }),
  appVersion: varchar('app_version', { length: 50 }),
  deviceFingerprint: varchar('device_fingerprint', { length: 500 }),
  pushToken: text('push_token'),
  lastIpAddress: varchar('last_ip_address', { length: 50 }),
  lastLocation: varchar('last_location', { length: 255 }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  isTrusted: boolean('is_trusted').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type LinkedDeviceSelect = typeof linkedDevices.$inferSelect;
export type LinkedDeviceInsert = typeof linkedDevices.$inferInsert;

/**
 * Support Tickets Table
 * Help & Support tickets
 */
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'technical', 'billing', 'feature_request', 'other'
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 50 }).default('medium').notNull(), // 'low', 'medium', 'high', 'urgent'
  status: varchar('status', { length: 50 }).default('open').notNull(), // 'open', 'in_progress', 'resolved', 'closed'
  assignedTo: uuid('assigned_to').references(() => users.id),
  attachments: jsonb('attachments'), // Array of file URLs
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SupportTicketSelect = typeof supportTickets.$inferSelect;
export type SupportTicketInsert = typeof supportTickets.$inferInsert;

/**
 * Support Ticket Messages Table
 * Messages within a support ticket thread
 */
export const supportTicketMessages = pgTable('support_ticket_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  isInternal: boolean('is_internal').default(false).notNull(), // Internal notes not visible to user
  attachments: jsonb('attachments'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SupportTicketMessageSelect = typeof supportTicketMessages.$inferSelect;
export type SupportTicketMessageInsert = typeof supportTicketMessages.$inferInsert;

/**
 * App Ratings Table
 * User ratings and feedback
 */
export const appRatings = pgTable('app_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  rating: integer('rating').notNull(), // 1-5 stars
  feedback: text('feedback'),
  platform: varchar('platform', { length: 50 }), // 'ios', 'android', 'web'
  appVersion: varchar('app_version', { length: 50 }),
  wouldRecommend: boolean('would_recommend'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AppRatingSelect = typeof appRatings.$inferSelect;
export type AppRatingInsert = typeof appRatings.$inferInsert;

/**
 * Reports Table
 * Saved/Generated reports
 */
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  reportType: varchar('report_type', { length: 100 }).notNull(), // 'packages', 'carriers', 'performance', 'activity', 'custom'
  parameters: jsonb('parameters'), // Report filter parameters
  schedule: jsonb('schedule'), // Scheduling config (frequency, time, recipients)
  lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
  fileUrl: text('file_url'), // Generated report file
  isScheduled: boolean('is_scheduled').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ReportSelect = typeof reports.$inferSelect;
export type ReportInsert = typeof reports.$inferInsert;

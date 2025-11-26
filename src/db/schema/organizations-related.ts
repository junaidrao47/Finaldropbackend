import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.new';
import { users } from './users.new';

/**
 * Organizations_Uploaded_Files Table
 * Files uploaded for an organization
 */
export const organizationsUploadedFiles = pgTable('organizations_uploaded_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  fileTitle: varchar('file_title', { length: 255 }),
  file: text('file'), // File path or URL
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationsUploadedFilesSelect = typeof organizationsUploadedFiles.$inferSelect;
export type OrganizationsUploadedFilesInsert = typeof organizationsUploadedFiles.$inferInsert;

/**
 * Organizations_Address Table
 * Multiple addresses per organization (Mailing, Billing, Shipping)
 */
export const organizationsAddress = pgTable('organizations_address', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  addressType: varchar('address_type', { length: 50 }), // Mailing, Billing, Shipping
  differentRecipient: boolean('different_recipient').default(false).notNull(),
  attentionTo: varchar('attention_to', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  country: varchar('country', { length: 100 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  additionalInformation: text('additional_information'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationsAddressSelect = typeof organizationsAddress.$inferSelect;
export type OrganizationsAddressInsert = typeof organizationsAddress.$inferInsert;

/**
 * Organizations_Remarks Table
 * Notes and remarks about an organization
 */
export const organizationsRemarks = pgTable('organizations_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  message: text('message'),
  status: varchar('status', { length: 50 }), // Active, Suspended, Blacklisted
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationsRemarksSelect = typeof organizationsRemarks.$inferSelect;
export type OrganizationsRemarksInsert = typeof organizationsRemarks.$inferInsert;

import { pgTable, uuid, varchar, text, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { carriers } from './carriers';
import { users } from './users.new';
import { organizationsWarehousesLocations } from './warehouses';

/**
 * Carriers_Uploaded_Files Table
 * Files uploaded for carriers
 */
export const carriersUploadedFiles = pgTable('carriers_uploaded_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull().references(() => carriers.id),
  fileTitle: varchar('file_title', { length: 255 }),
  file: text('file'), // File path or URL
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CarriersUploadedFilesSelect = typeof carriersUploadedFiles.$inferSelect;
export type CarriersUploadedFilesInsert = typeof carriersUploadedFiles.$inferInsert;

/**
 * Carriers_Address Table
 * Multiple addresses per carrier (Mailing, Billing, Shipping)
 */
export const carriersAddress = pgTable('carriers_address', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull().references(() => carriers.id),
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

export type CarriersAddressSelect = typeof carriersAddress.$inferSelect;
export type CarriersAddressInsert = typeof carriersAddress.$inferInsert;

/**
 * Carriers_Remarks Table
 * Notes and remarks about carriers
 */
export const carriersRemarks = pgTable('carriers_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull().references(() => carriers.id),
  message: text('message'),
  status: varchar('status', { length: 50 }), // Created, Waiting, In Progress, etc.
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CarriersRemarksSelect = typeof carriersRemarks.$inferSelect;
export type CarriersRemarksInsert = typeof carriersRemarks.$inferInsert;

/**
 * Carriers_API_Handshake Table
 * API credentials and tokens for carrier integrations
 */
export const carriersApiHandshake = pgTable('carriers_api_handshake', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull().references(() => carriers.id),
  name: varchar('name', { length: 255 }),
  token: text('token'),
  privateKey: text('private_key'),
  isActive: boolean('is_active').default(true).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CarriersApiHandshakeSelect = typeof carriersApiHandshake.$inferSelect;
export type CarriersApiHandshakeInsert = typeof carriersApiHandshake.$inferInsert;

/**
 * Carriers_Upcoming_Packages Table
 * Packages expected to be delivered by carriers
 */
export const carriersUpcomingPackages = pgTable('carriers_upcoming_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  carrierId: uuid('carrier_id').notNull().references(() => carriers.id),
  warehouseId: uuid('warehouse_id').references(() => organizationsWarehousesLocations.id),
  senderName: varchar('sender_name', { length: 255 }),
  recipientName: varchar('recipient_name', { length: 255 }),
  recipientId: varchar('recipient_id', { length: 100 }),
  attentionTo: varchar('attention_to', { length: 255 }),
  purchaseOrderNumber: varchar('purchase_order_number', { length: 100 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  zone: varchar('zone', { length: 50 }),
  isle: varchar('isle', { length: 50 }),
  shelf: varchar('shelf', { length: 50 }),
  bin: varchar('bin', { length: 50 }),
  memo: text('memo'),
  expectedDeliveryDate: date('expected_delivery_date'),
  signatureRequiredOnDeliver: boolean('signature_required_on_deliver').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CarriersUpcomingPackagesSelect = typeof carriersUpcomingPackages.$inferSelect;
export type CarriersUpcomingPackagesInsert = typeof carriersUpcomingPackages.$inferInsert;

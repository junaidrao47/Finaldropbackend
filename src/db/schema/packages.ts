import { pgTable, uuid, varchar, text, boolean, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.new';
import { users } from './users.new';
import { organizationsWarehousesLocations } from './warehouses';

/**
 * Packages Table
 * Core package/shipment tracking entity
 */
export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  warehouseId: uuid('warehouse_id').references(() => organizationsWarehousesLocations.id),
  senderName: varchar('sender_name', { length: 255 }),
  recipientName: varchar('recipient_name', { length: 255 }),
  recipientId: varchar('recipient_id', { length: 100 }), // User/Client ID string
  attentionTo: varchar('attention_to', { length: 255 }),
  purchaseOrderNumber: varchar('purchase_order_number', { length: 100 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  fromAddress: text('from_address'), // Denormalized address or FK
  toAddress: text('to_address'), // Denormalized address or FK
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  zone: varchar('zone', { length: 50 }), // Current location detail
  isle: varchar('isle', { length: 50 }), // Current location detail
  shelf: varchar('shelf', { length: 50 }), // Current location detail
  bin: varchar('bin', { length: 50 }), // Current location detail
  memo: text('memo'),
  keepPackageForHowLong: integer('keep_package_for_how_long'), // Duration in days
  expectedDeliveryDate: date('expected_delivery_date'),
  signatureRequiredOnDeliver: boolean('signature_required_on_deliver').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  status: varchar('status', { length: 50 }), // Received, Available, Delivered, etc.
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PackageSelect = typeof packages.$inferSelect;
export type PackageInsert = typeof packages.$inferInsert;

/**
 * Packages_Remarks_Types Table
 * Types of remarks that can be added to packages
 */
export const packagesRemarksTypes = pgTable('packages_remarks_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  remarkType: varchar('remark_type', { length: 50 }), // Date, TimeStamp, Text, BigInt, Currency
  icon: varchar('icon', { length: 100 }),
  name: varchar('name', { length: 100 }),
  message: varchar('message', { length: 255 }),
  memo: text('memo'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PackagesRemarksTypesSelect = typeof packagesRemarksTypes.$inferSelect;
export type PackagesRemarksTypesInsert = typeof packagesRemarksTypes.$inferInsert;

/**
 * Packages_Remarks Table
 * Notes and status updates for packages
 */
export const packagesRemarks = pgTable('packages_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => packages.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  message: text('message'),
  status: varchar('status', { length: 50 }), // Received, Available, Delivered, etc.
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PackagesRemarksSelect = typeof packagesRemarks.$inferSelect;
export type PackagesRemarksInsert = typeof packagesRemarks.$inferInsert;

/**
 * Packages_Uploaded_Files Table
 * Files associated with packages (labels, images, signatures)
 */
export const packagesUploadedFiles = pgTable('packages_uploaded_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => packages.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  uploadType: varchar('upload_type', { length: 50 }), // Shipping Label, Package Image, Signature Image
  fileTitle: varchar('file_title', { length: 255 }),
  file: text('file'), // File path or URL
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PackagesUploadedFilesSelect = typeof packagesUploadedFiles.$inferSelect;
export type PackagesUploadedFilesInsert = typeof packagesUploadedFiles.$inferInsert;

/**
 * Packages_Transfers Table
 * Transfer records for packages moving between warehouses/organizations
 */
export const packagesTransfers = pgTable('packages_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => packages.id),
  fromOrganizationId: uuid('from_organization_id').references(() => organizations.id),
  fromWarehouseId: uuid('from_warehouse_id').references(() => organizationsWarehousesLocations.id),
  toOrganizationId: uuid('to_organization_id').references(() => organizations.id),
  toWarehouseId: uuid('to_warehouse_id').references(() => organizationsWarehousesLocations.id),
  memo: text('memo'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PackagesTransfersSelect = typeof packagesTransfers.$inferSelect;
export type PackagesTransfersInsert = typeof packagesTransfers.$inferInsert;

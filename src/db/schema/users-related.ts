import { pgTable, uuid, varchar, text, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.new';
import { organizations } from './organizations.new';

/**
 * Users_Trusted_Devices Table
 * Devices that users have registered as trusted for login
 */
export const usersTrustedDevices = pgTable('users_trusted_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  deviceSignature: varchar('device_signature', { length: 500 }),
  passkey: text('passkey'),
  location: varchar('location', { length: 255 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersTrustedDevicesSelect = typeof usersTrustedDevices.$inferSelect;
export type UsersTrustedDevicesInsert = typeof usersTrustedDevices.$inferInsert;

/**
 * Users_Authorized_People Table
 * People authorized to act on behalf of a user
 */
export const usersAuthorizedPeople = pgTable('users_authorized_people', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  fullName: varchar('full_name', { length: 255 }),
  dateOfBirth: date('date_of_birth'),
  email: varchar('email', { length: 255 }),
  photoId: varchar('photo_id', { length: 500 }), // File path or URL
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersAuthorizedPeopleSelect = typeof usersAuthorizedPeople.$inferSelect;
export type UsersAuthorizedPeopleInsert = typeof usersAuthorizedPeople.$inferInsert;

/**
 * Users_Remarks Table
 * Notes and remarks about a user
 */
export const usersRemarks = pgTable('users_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  message: text('message'),
  status: varchar('status', { length: 50 }), // Active, Pending, Suspended, Blacklisted
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersRemarksSelect = typeof usersRemarks.$inferSelect;
export type UsersRemarksInsert = typeof usersRemarks.$inferInsert;

/**
 * Users_Address Table
 * Multiple addresses per user (Mailing, Billing, Shipping)
 */
export const usersAddress = pgTable('users_address', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
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

export type UsersAddressSelect = typeof usersAddress.$inferSelect;
export type UsersAddressInsert = typeof usersAddress.$inferInsert;

/**
 * Users_Uploaded_Files Table
 * Files uploaded by or for a user
 */
export const usersUploadedFiles = pgTable('users_uploaded_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id), // Optional link
  userId: uuid('user_id').notNull().references(() => users.id),
  fileTitle: varchar('file_title', { length: 255 }),
  file: text('file'), // File path or URL
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersUploadedFilesSelect = typeof usersUploadedFiles.$inferSelect;
export type UsersUploadedFilesInsert = typeof usersUploadedFiles.$inferInsert;

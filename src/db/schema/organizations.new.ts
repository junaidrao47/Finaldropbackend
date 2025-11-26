import { pgTable, uuid, varchar, text, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { status } from './status';

/**
 * Organizations Table
 * Core entity for business organizations in the system
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileImage: varchar('profile_image', { length: 500 }),
  isBusiness: boolean('is_business').default(false).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  businessName: varchar('business_name', { length: 255 }),
  legalName: varchar('legal_name', { length: 255 }),
  dateOfBirthBusinessSince: date('date_of_birth_business_since'),
  federalTaxId: varchar('federal_tax_id', { length: 50 }),
  stateTaxId: varchar('state_tax_id', { length: 50 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  mobileNumber: varchar('mobile_number', { length: 30 }),
  differentWhatsAppNumber: boolean('different_whatsapp_number').default(false).notNull(),
  whatsAppNumber: varchar('whatsapp_number', { length: 30 }),
  email: varchar('email', { length: 255 }),
  differentBillingEmail: boolean('different_billing_email').default(false).notNull(),
  billingEmail: varchar('billing_email', { length: 255 }),
  additionalInformation: text('additional_information'),
  statusId: uuid('status_id').references(() => status.id),
  accountHolderId: uuid('account_holder_id'), // FK to users.id (defined later to avoid circular)
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationSelect = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;

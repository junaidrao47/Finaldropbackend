import { uuid, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * UUID7 generator for primary keys
 * UUID7 is time-sortable and includes timestamp information
 * Using default uuid_generate_v7() requires pgcrypto extension or custom function
 * For now, we use gen_random_uuid() as fallback - replace with uuid_generate_v7() when extension is installed
 */
export const uuid7PrimaryKey = () => uuid('id').primaryKey().defaultRandom();

/**
 * Common audit fields for all tables
 */
export const auditFields = {
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/**
 * Audit fields without isDeleted (for tables that don't need soft delete)
 */
export const auditFieldsNoDelete = {
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/**
 * Minimal audit fields (create only)
 */
export const createOnlyAuditFields = {
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
};

/**
 * Lock field for protected records
 */
export const lockField = {
  isLocked: boolean('is_locked').default(false).notNull(),
};

/**
 * Active field for soft enable/disable
 */
export const activeField = {
  isActive: boolean('is_active').default(true).notNull(),
};

import { pgTable, serial, varchar, timestamp, boolean, integer, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const trustedDevices = pgTable('trusted_devices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }).notNull(),
  deviceName: varchar('device_name', { length: 100 }),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TrustedDeviceSelect = typeof trustedDevices.$inferSelect;
export type TrustedDeviceInsert = typeof trustedDevices.$inferInsert;

import { pgTable, serial, varchar, timestamp, boolean, integer, text } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { roles } from './roles';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }),
  countryCode: varchar('country_code', { length: 5 }),
  displayName: varchar('display_name', { length: 255 }),
  profileImage: varchar('profile_image', { length: 500 }),
  
  // Social auth fields
  googleId: varchar('google_id', { length: 255 }).unique(),
  facebookId: varchar('facebook_id', { length: 255 }).unique(),
  appleId: varchar('apple_id', { length: 255 }).unique(),
  
  // Organization & Role
  organizationId: integer('organization_id').references(() => organizations.id),
  roleId: integer('role_id').references(() => roles.id),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  
  // Timestamps
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
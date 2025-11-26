// Temporary stub: the repository mixes ORMs (TypeORM/Drizzle).
// Replace with a proper Drizzle schema in a follow-up task when the
// project's ORM choice and package versions are finalized.

// Export a neutral symbol so other modules can import this file
// without causing TypeScript/Drizzle API type errors during the build.
import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { roles } from './roles';

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
  roleId: integer('role_id').notNull().references(() => roles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MembershipSelect = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
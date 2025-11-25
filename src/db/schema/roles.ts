import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Keep this small and compatible with the version of drizzle-orm in use.
// Some Drizzle builder APIs differ between versions; avoid optional
// chain helper methods here to reduce typing mismatches during build.
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
});
import { defineConfig } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export default defineConfig({
  schema: {
    users: pgTable('users', {
      id: serial('id').primaryKey(),
      username: varchar('username', { length: 255 }).notNull(),
      password: text('password').notNull(),
      email: varchar('email', { length: 255 }).notNull().unique(),
      createdAt: text('created_at').notNull(),
      updatedAt: text('updated_at').notNull(),
    }),
    organizations: pgTable('organizations', {
      id: serial('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      createdAt: text('created_at').notNull(),
      updatedAt: text('updated_at').notNull(),
    }),
    roles: pgTable('roles', {
      id: serial('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      createdAt: text('created_at').notNull(),
      updatedAt: text('updated_at').notNull(),
    }),
    memberships: pgTable('memberships', {
      id: serial('id').primaryKey(),
      userId: serial('user_id').notNull(),
      organizationId: serial('organization_id').notNull(),
      roleId: serial('role_id').notNull(),
      createdAt: text('created_at').notNull(),
      updatedAt: text('updated_at').notNull(),
    }),
  },
  db: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  },
});
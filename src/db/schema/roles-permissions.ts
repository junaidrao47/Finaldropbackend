import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.new';
import { users } from './users.new';
import { organizationsWarehousesLocations } from './warehouses';

/**
 * Users_Roles Table
 * Role definitions with explicit permission fields
 */
export const usersRoles = pgTable('users_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id), // If role is org-specific
  icon: varchar('icon', { length: 100 }),
  name: varchar('name', { length: 100 }).notNull(),
  
  // Receive permissions
  canViewReceive: boolean('can_view_receive').default(false).notNull(),
  canUpdateReceive: boolean('can_update_receive').default(false).notNull(),
  canDeleteReceive: boolean('can_delete_receive').default(false).notNull(),
  canRestoreReceive: boolean('can_restore_receive').default(false).notNull(),
  
  // Deliver permissions
  canViewDeliver: boolean('can_view_deliver').default(false).notNull(),
  canUpdateDeliver: boolean('can_update_deliver').default(false).notNull(),
  canDeleteDeliver: boolean('can_delete_deliver').default(false).notNull(),
  canRestoreDeliver: boolean('can_restore_deliver').default(false).notNull(),
  
  // Return permissions
  canViewReturn: boolean('can_view_return').default(false).notNull(),
  canUpdateReturn: boolean('can_update_return').default(false).notNull(),
  canDeleteReturn: boolean('can_delete_return').default(false).notNull(),
  canRestoreReturn: boolean('can_restore_return').default(false).notNull(),
  
  // Transfer permissions
  canViewTransfer: boolean('can_view_transfer').default(false).notNull(),
  canUpdateTransfer: boolean('can_update_transfer').default(false).notNull(),
  canDeleteTransfer: boolean('can_delete_transfer').default(false).notNull(),
  canRestoreTransfer: boolean('can_restore_transfer').default(false).notNull(),
  
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersRolesSelect = typeof usersRoles.$inferSelect;
export type UsersRolesInsert = typeof usersRoles.$inferInsert;

/**
 * Users_Permissions Table
 * User-specific permission overrides within organization context
 */
export const usersPermissions = pgTable('users_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  roleId: uuid('role_id').notNull().references(() => usersRoles.id),
  
  // Override permissions (null means inherit from role)
  canViewReceive: boolean('can_view_receive'),
  canUpdateReceive: boolean('can_update_receive'),
  canDeleteReceive: boolean('can_delete_receive'),
  canRestoreReceive: boolean('can_restore_receive'),
  
  canViewDeliver: boolean('can_view_deliver'),
  canUpdateDeliver: boolean('can_update_deliver'),
  canDeleteDeliver: boolean('can_delete_deliver'),
  canRestoreDeliver: boolean('can_restore_deliver'),
  
  canViewReturn: boolean('can_view_return'),
  canUpdateReturn: boolean('can_update_return'),
  canDeleteReturn: boolean('can_delete_return'),
  canRestoreReturn: boolean('can_restore_return'),
  
  canViewTransfer: boolean('can_view_transfer'),
  canUpdateTransfer: boolean('can_update_transfer'),
  canDeleteTransfer: boolean('can_delete_transfer'),
  canRestoreTransfer: boolean('can_restore_transfer'),
  
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersPermissionsSelect = typeof usersPermissions.$inferSelect;
export type UsersPermissionsInsert = typeof usersPermissions.$inferInsert;

/**
 * Users_Organizations_Access Table
 * Links users to organizations with specific roles
 */
export const usersOrganizationsAccess = pgTable('users_organizations_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  roleId: uuid('role_id').notNull().references(() => usersRoles.id),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersOrganizationsAccessSelect = typeof usersOrganizationsAccess.$inferSelect;
export type UsersOrganizationsAccessInsert = typeof usersOrganizationsAccess.$inferInsert;

/**
 * Users_Organizations_Warehouses_Access Table
 * Links users to specific warehouses within organizations
 */
export const usersOrganizationsWarehousesAccess = pgTable('users_organizations_warehouses_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => organizationsWarehousesLocations.id),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UsersOrganizationsWarehousesAccessSelect = typeof usersOrganizationsWarehousesAccess.$inferSelect;
export type UsersOrganizationsWarehousesAccessInsert = typeof usersOrganizationsWarehousesAccess.$inferInsert;

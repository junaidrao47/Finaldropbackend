import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

/**
 * Role Templates (SEC-001)
 * Pre-defined roles with default permissions
 */
export const ROLE_TEMPLATES = {
  OWNER: {
    name: 'Owner',
    icon: 'crown',
    permissions: {
      canViewReceive: true,
      canUpdateReceive: true,
      canDeleteReceive: true,
      canRestoreReceive: true,
      canViewDeliver: true,
      canUpdateDeliver: true,
      canDeleteDeliver: true,
      canRestoreDeliver: true,
      canViewReturn: true,
      canUpdateReturn: true,
      canDeleteReturn: true,
      canRestoreReturn: true,
      canViewTransfer: true,
      canUpdateTransfer: true,
      canDeleteTransfer: true,
      canRestoreTransfer: true,
    },
  },
  ADMIN: {
    name: 'Admin',
    icon: 'shield',
    permissions: {
      canViewReceive: true,
      canUpdateReceive: true,
      canDeleteReceive: true,
      canRestoreReceive: false,
      canViewDeliver: true,
      canUpdateDeliver: true,
      canDeleteDeliver: true,
      canRestoreDeliver: false,
      canViewReturn: true,
      canUpdateReturn: true,
      canDeleteReturn: true,
      canRestoreReturn: false,
      canViewTransfer: true,
      canUpdateTransfer: true,
      canDeleteTransfer: true,
      canRestoreTransfer: false,
    },
  },
  AGENT: {
    name: 'Agent',
    icon: 'user',
    permissions: {
      canViewReceive: true,
      canUpdateReceive: true,
      canDeleteReceive: false,
      canRestoreReceive: false,
      canViewDeliver: true,
      canUpdateDeliver: true,
      canDeleteDeliver: false,
      canRestoreDeliver: false,
      canViewReturn: true,
      canUpdateReturn: true,
      canDeleteReturn: false,
      canRestoreReturn: false,
      canViewTransfer: true,
      canUpdateTransfer: true,
      canDeleteTransfer: false,
      canRestoreTransfer: false,
    },
  },
  CUSTOMER: {
    name: 'Customer',
    icon: 'user-circle',
    permissions: {
      canViewReceive: true,
      canUpdateReceive: false,
      canDeleteReceive: false,
      canRestoreReceive: false,
      canViewDeliver: true,
      canUpdateDeliver: false,
      canDeleteDeliver: false,
      canRestoreDeliver: false,
      canViewReturn: true,
      canUpdateReturn: false,
      canDeleteReturn: false,
      canRestoreReturn: false,
      canViewTransfer: false,
      canUpdateTransfer: false,
      canDeleteTransfer: false,
      canRestoreTransfer: false,
    },
  },
  VIEWER: {
    name: 'Viewer',
    icon: 'eye',
    permissions: {
      canViewReceive: true,
      canUpdateReceive: false,
      canDeleteReceive: false,
      canRestoreReceive: false,
      canViewDeliver: true,
      canUpdateDeliver: false,
      canDeleteDeliver: false,
      canRestoreDeliver: false,
      canViewReturn: true,
      canUpdateReturn: false,
      canDeleteReturn: false,
      canRestoreReturn: false,
      canViewTransfer: true,
      canUpdateTransfer: false,
      canDeleteTransfer: false,
      canRestoreTransfer: false,
    },
  },
};

export type PermissionKey = 
  | 'canViewReceive' | 'canUpdateReceive' | 'canDeleteReceive' | 'canRestoreReceive'
  | 'canViewDeliver' | 'canUpdateDeliver' | 'canDeleteDeliver' | 'canRestoreDeliver'
  | 'canViewReturn' | 'canUpdateReturn' | 'canDeleteReturn' | 'canRestoreReturn'
  | 'canViewTransfer' | 'canUpdateTransfer' | 'canDeleteTransfer' | 'canRestoreTransfer';

export interface UserPermissions {
  roleId: string;
  roleName: string;
  organizationId: string;
  permissions: Record<PermissionKey, boolean>;
  warehouseAccess: string[]; // List of warehouse IDs user can access
}

@Injectable()
export class PermissionsService {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get available role templates
   */
  getRoleTemplates() {
    return Object.entries(ROLE_TEMPLATES).map(([key, value]) => ({
      templateKey: key,
      ...value,
    }));
  }

  /**
   * Create a role from template
   */
  async createRoleFromTemplate(
    templateKey: keyof typeof ROLE_TEMPLATES,
    organizationId: string,
    userId: string,
    customName?: string,
  ): Promise<{ roleId: string }> {
    const template = ROLE_TEMPLATES[templateKey];
    if (!template) {
      throw new NotFoundException(`Role template ${templateKey} not found`);
    }

    const [role] = await this.db
      .insert(schema.usersRoles)
      .values({
        organizationId,
        name: customName || template.name,
        icon: template.icon,
        ...template.permissions,
        createdBy: userId,
      })
      .returning({ id: schema.usersRoles.id });

    return { roleId: role.id };
  }

  /**
   * Create a custom role
   */
  async createCustomRole(
    name: string,
    organizationId: string,
    permissions: Partial<Record<PermissionKey, boolean>>,
    userId: string,
    icon?: string,
  ): Promise<{ roleId: string }> {
    const [role] = await this.db
      .insert(schema.usersRoles)
      .values({
        organizationId,
        name,
        icon: icon || 'user',
        canViewReceive: permissions.canViewReceive || false,
        canUpdateReceive: permissions.canUpdateReceive || false,
        canDeleteReceive: permissions.canDeleteReceive || false,
        canRestoreReceive: permissions.canRestoreReceive || false,
        canViewDeliver: permissions.canViewDeliver || false,
        canUpdateDeliver: permissions.canUpdateDeliver || false,
        canDeleteDeliver: permissions.canDeleteDeliver || false,
        canRestoreDeliver: permissions.canRestoreDeliver || false,
        canViewReturn: permissions.canViewReturn || false,
        canUpdateReturn: permissions.canUpdateReturn || false,
        canDeleteReturn: permissions.canDeleteReturn || false,
        canRestoreReturn: permissions.canRestoreReturn || false,
        canViewTransfer: permissions.canViewTransfer || false,
        canUpdateTransfer: permissions.canUpdateTransfer || false,
        canDeleteTransfer: permissions.canDeleteTransfer || false,
        canRestoreTransfer: permissions.canRestoreTransfer || false,
        createdBy: userId,
      })
      .returning({ id: schema.usersRoles.id });

    return { roleId: role.id };
  }

  /**
   * Get roles for an organization
   */
  async getOrganizationRoles(organizationId: string) {
    return this.db
      .select()
      .from(schema.usersRoles)
      .where(
        and(
          eq(schema.usersRoles.organizationId, organizationId),
          eq(schema.usersRoles.isDeleted, false),
        ),
      );
  }

  /**
   * Assign user to organization with role (SEC-002)
   */
  async assignUserToOrganization(
    userId: string,
    organizationId: string,
    roleId: string,
    assignedBy: string,
  ): Promise<{ accessId: string }> {
    // Check if already assigned
    const existing = await this.db
      .select()
      .from(schema.usersOrganizationsAccess)
      .where(
        and(
          eq(schema.usersOrganizationsAccess.userId, userId),
          eq(schema.usersOrganizationsAccess.organizationId, organizationId),
          eq(schema.usersOrganizationsAccess.isDeleted, false),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing access
      await this.db
        .update(schema.usersOrganizationsAccess)
        .set({
          roleId,
          updatedBy: assignedBy,
          updatedAt: new Date(),
        })
        .where(eq(schema.usersOrganizationsAccess.id, existing[0].id));
      return { accessId: existing[0].id };
    }

    const [access] = await this.db
      .insert(schema.usersOrganizationsAccess)
      .values({
        userId,
        organizationId,
        roleId,
        createdBy: assignedBy,
      })
      .returning({ id: schema.usersOrganizationsAccess.id });

    return { accessId: access.id };
  }

  /**
   * Assign user to warehouse (SEC-003)
   */
  async assignUserToWarehouse(
    userId: string,
    organizationId: string,
    warehouseId: string,
    assignedBy: string,
  ): Promise<{ accessId: string }> {
    // Check if already assigned
    const existing = await this.db
      .select()
      .from(schema.usersOrganizationsWarehousesAccess)
      .where(
        and(
          eq(schema.usersOrganizationsWarehousesAccess.userId, userId),
          eq(schema.usersOrganizationsWarehousesAccess.warehouseId, warehouseId),
          eq(schema.usersOrganizationsWarehousesAccess.isDeleted, false),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { accessId: existing[0].id };
    }

    const [access] = await this.db
      .insert(schema.usersOrganizationsWarehousesAccess)
      .values({
        userId,
        organizationId,
        warehouseId,
        createdBy: assignedBy,
      })
      .returning({ id: schema.usersOrganizationsWarehousesAccess.id });

    return { accessId: access.id };
  }

  /**
   * Remove user from warehouse
   */
  async removeUserFromWarehouse(
    userId: string,
    warehouseId: string,
    removedBy: string,
  ): Promise<void> {
    await this.db
      .update(schema.usersOrganizationsWarehousesAccess)
      .set({
        isDeleted: true,
        updatedBy: removedBy,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.usersOrganizationsWarehousesAccess.userId, userId),
          eq(schema.usersOrganizationsWarehousesAccess.warehouseId, warehouseId),
        ),
      );
  }

  /**
   * Get user's permissions for an organization
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<UserPermissions | null> {
    // Get user's organization access with role
    const [access] = await this.db
      .select({
        accessId: schema.usersOrganizationsAccess.id,
        roleId: schema.usersOrganizationsAccess.roleId,
        role: schema.usersRoles,
      })
      .from(schema.usersOrganizationsAccess)
      .leftJoin(schema.usersRoles, eq(schema.usersOrganizationsAccess.roleId, schema.usersRoles.id))
      .where(
        and(
          eq(schema.usersOrganizationsAccess.userId, userId),
          eq(schema.usersOrganizationsAccess.organizationId, organizationId),
          eq(schema.usersOrganizationsAccess.isDeleted, false),
        ),
      );

    if (!access || !access.role) {
      return null;
    }

    // Get user's warehouse access
    const warehouseAccess = await this.db
      .select({ warehouseId: schema.usersOrganizationsWarehousesAccess.warehouseId })
      .from(schema.usersOrganizationsWarehousesAccess)
      .where(
        and(
          eq(schema.usersOrganizationsWarehousesAccess.userId, userId),
          eq(schema.usersOrganizationsWarehousesAccess.organizationId, organizationId),
          eq(schema.usersOrganizationsWarehousesAccess.isDeleted, false),
        ),
      );

    // Check for user-specific permission overrides
    const [overrides] = await this.db
      .select()
      .from(schema.usersPermissions)
      .where(
        and(
          eq(schema.usersPermissions.userId, userId),
          eq(schema.usersPermissions.organizationId, organizationId),
        ),
      );

    // Merge role permissions with overrides
    const role = access.role;
    const permissions: Record<PermissionKey, boolean> = {
      canViewReceive: overrides?.canViewReceive ?? role.canViewReceive,
      canUpdateReceive: overrides?.canUpdateReceive ?? role.canUpdateReceive,
      canDeleteReceive: overrides?.canDeleteReceive ?? role.canDeleteReceive,
      canRestoreReceive: overrides?.canRestoreReceive ?? role.canRestoreReceive,
      canViewDeliver: overrides?.canViewDeliver ?? role.canViewDeliver,
      canUpdateDeliver: overrides?.canUpdateDeliver ?? role.canUpdateDeliver,
      canDeleteDeliver: overrides?.canDeleteDeliver ?? role.canDeleteDeliver,
      canRestoreDeliver: overrides?.canRestoreDeliver ?? role.canRestoreDeliver,
      canViewReturn: overrides?.canViewReturn ?? role.canViewReturn,
      canUpdateReturn: overrides?.canUpdateReturn ?? role.canUpdateReturn,
      canDeleteReturn: overrides?.canDeleteReturn ?? role.canDeleteReturn,
      canRestoreReturn: overrides?.canRestoreReturn ?? role.canRestoreReturn,
      canViewTransfer: overrides?.canViewTransfer ?? role.canViewTransfer,
      canUpdateTransfer: overrides?.canUpdateTransfer ?? role.canUpdateTransfer,
      canDeleteTransfer: overrides?.canDeleteTransfer ?? role.canDeleteTransfer,
      canRestoreTransfer: overrides?.canRestoreTransfer ?? role.canRestoreTransfer,
    };

    return {
      roleId: access.roleId,
      roleName: role.name,
      organizationId,
      permissions,
      warehouseAccess: warehouseAccess.map((w) => w.warehouseId),
    };
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    organizationId: string,
    permission: PermissionKey,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    if (!userPermissions) {
      return false;
    }
    return userPermissions.permissions[permission] || false;
  }

  /**
   * Check if user has access to warehouse
   */
  async hasWarehouseAccess(
    userId: string,
    organizationId: string,
    warehouseId: string,
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    if (!userPermissions) {
      return false;
    }
    // If user has no specific warehouse access, they have access to all (for admins/owners)
    if (userPermissions.warehouseAccess.length === 0) {
      return true;
    }
    return userPermissions.warehouseAccess.includes(warehouseId);
  }

  /**
   * Get all organizations a user has access to (for company switching SEC-004)
   */
  async getUserOrganizations(userId: string) {
    return this.db
      .select({
        accessId: schema.usersOrganizationsAccess.id,
        organizationId: schema.usersOrganizationsAccess.organizationId,
        roleId: schema.usersOrganizationsAccess.roleId,
        roleName: schema.usersRoles.name,
        organization: schema.organizations,
      })
      .from(schema.usersOrganizationsAccess)
      .leftJoin(schema.usersRoles, eq(schema.usersOrganizationsAccess.roleId, schema.usersRoles.id))
      .leftJoin(schema.organizations, eq(schema.usersOrganizationsAccess.organizationId, schema.organizations.id))
      .where(
        and(
          eq(schema.usersOrganizationsAccess.userId, userId),
          eq(schema.usersOrganizationsAccess.isDeleted, false),
        ),
      );
  }

  /**
   * Set user-specific permission overrides
   */
  async setUserPermissionOverrides(
    userId: string,
    organizationId: string,
    roleId: string,
    overrides: Partial<Record<PermissionKey, boolean>>,
    setBy: string,
  ): Promise<void> {
    // Check if overrides exist
    const [existing] = await this.db
      .select()
      .from(schema.usersPermissions)
      .where(
        and(
          eq(schema.usersPermissions.userId, userId),
          eq(schema.usersPermissions.organizationId, organizationId),
        ),
      );

    if (existing) {
      await this.db
        .update(schema.usersPermissions)
        .set({
          ...overrides,
          updatedBy: setBy,
          updatedAt: new Date(),
        })
        .where(eq(schema.usersPermissions.id, existing.id));
    } else {
      await this.db.insert(schema.usersPermissions).values({
        userId,
        organizationId,
        roleId,
        ...overrides,
        createdBy: setBy,
      });
    }
  }
}

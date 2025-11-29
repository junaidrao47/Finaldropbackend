import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PermissionsService, ROLE_TEMPLATES, PermissionKey } from './permissions.service';
import { AuthGuard } from '../common/guards/auth.guard';

// DTOs
class CreateRoleFromTemplateDto {
  templateKey: keyof typeof ROLE_TEMPLATES;
  organizationId: string;
  customName?: string;
}

class CreateCustomRoleDto {
  name: string;
  organizationId: string;
  icon?: string;
  permissions: Partial<Record<PermissionKey, boolean>>;
}

class AssignUserToOrganizationDto {
  userId: string;
  organizationId: string;
  roleId: string;
}

class AssignUserToWarehouseDto {
  userId: string;
  organizationId: string;
  warehouseId: string;
}

class SetPermissionOverridesDto {
  userId: string;
  organizationId: string;
  roleId: string;
  overrides: Partial<Record<PermissionKey, boolean>>;
}

@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Get available role templates (SEC-001)
   * GET /permissions/templates
   */
  @Get('templates')
  getRoleTemplates() {
    return this.permissionsService.getRoleTemplates();
  }

  /**
   * Create role from template
   * POST /permissions/roles/from-template
   */
  @Post('roles/from-template')
  async createRoleFromTemplate(
    @Body() dto: CreateRoleFromTemplateDto,
    @Request() req: any,
  ) {
    return this.permissionsService.createRoleFromTemplate(
      dto.templateKey,
      dto.organizationId,
      req.user.id,
      dto.customName,
    );
  }

  /**
   * Create custom role
   * POST /permissions/roles
   */
  @Post('roles')
  async createCustomRole(@Body() dto: CreateCustomRoleDto, @Request() req: any) {
    return this.permissionsService.createCustomRole(
      dto.name,
      dto.organizationId,
      dto.permissions,
      req.user.id,
      dto.icon,
    );
  }

  /**
   * Get roles for an organization
   * GET /permissions/organizations/:orgId/roles
   */
  @Get('organizations/:orgId/roles')
  async getOrganizationRoles(@Param('orgId') orgId: string) {
    return this.permissionsService.getOrganizationRoles(orgId);
  }

  /**
   * Assign user to organization with role (SEC-002)
   * POST /permissions/organizations/assign
   */
  @Post('organizations/assign')
  async assignUserToOrganization(
    @Body() dto: AssignUserToOrganizationDto,
    @Request() req: any,
  ) {
    return this.permissionsService.assignUserToOrganization(
      dto.userId,
      dto.organizationId,
      dto.roleId,
      req.user.id,
    );
  }

  /**
   * Assign user to warehouse (SEC-003)
   * POST /permissions/warehouses/assign
   */
  @Post('warehouses/assign')
  async assignUserToWarehouse(
    @Body() dto: AssignUserToWarehouseDto,
    @Request() req: any,
  ) {
    return this.permissionsService.assignUserToWarehouse(
      dto.userId,
      dto.organizationId,
      dto.warehouseId,
      req.user.id,
    );
  }

  /**
   * Remove user from warehouse
   * DELETE /permissions/warehouses/:warehouseId/users/:userId
   */
  @Delete('warehouses/:warehouseId/users/:userId')
  async removeUserFromWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    await this.permissionsService.removeUserFromWarehouse(userId, warehouseId, req.user.id);
    return { success: true, message: 'User removed from warehouse' };
  }

  /**
   * Get user's permissions for an organization
   * GET /permissions/users/:userId/organizations/:orgId
   */
  @Get('users/:userId/organizations/:orgId')
  async getUserPermissions(
    @Param('userId') userId: string,
    @Param('orgId') orgId: string,
  ) {
    return this.permissionsService.getUserPermissions(userId, orgId);
  }

  /**
   * Check if user has specific permission
   * GET /permissions/check
   */
  @Get('check')
  async checkPermission(
    @Query('userId') userId: string,
    @Query('organizationId') organizationId: string,
    @Query('permission') permission: PermissionKey,
  ) {
    const hasPermission = await this.permissionsService.hasPermission(
      userId,
      organizationId,
      permission,
    );
    return { hasPermission };
  }

  /**
   * Get all organizations a user has access to (SEC-004)
   * GET /permissions/users/:userId/organizations
   */
  @Get('users/:userId/organizations')
  async getUserOrganizations(@Param('userId') userId: string) {
    return this.permissionsService.getUserOrganizations(userId);
  }

  /**
   * Get current user's organizations (for company switching)
   * GET /permissions/my-organizations
   */
  @Get('my-organizations')
  async getMyOrganizations(@Request() req: any) {
    return this.permissionsService.getUserOrganizations(req.user.id);
  }

  /**
   * Set user-specific permission overrides
   * PUT /permissions/users/overrides
   */
  @Put('users/overrides')
  async setPermissionOverrides(
    @Body() dto: SetPermissionOverridesDto,
    @Request() req: any,
  ) {
    await this.permissionsService.setUserPermissionOverrides(
      dto.userId,
      dto.organizationId,
      dto.roleId,
      dto.overrides,
      req.user.id,
    );
    return { success: true, message: 'Permission overrides set' };
  }
}

import { IsString, IsBoolean, IsOptional, IsUUID, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Create Role DTO
 */
export class CreateRoleDto {
  @IsString()
  @MaxLength(100)
  roleName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @IsOptional()
  @IsUUID()
  templateRoleId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;
}

/**
 * Update Role DTO
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

/**
 * Permission DTO
 */
export class CreatePermissionDto {
  @IsString()
  @MaxLength(100)
  permissionName: string;

  @IsString()
  @MaxLength(100)
  permissionCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string; // Dashboard, Organizations, Users, Packages, etc.

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Role Permission Assignment DTO
 */
export class AssignRolePermissionsDto {
  @IsUUID()
  roleId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

/**
 * User Role Assignment DTO
 */
export class AssignUserRoleDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  roleId: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string; // For org-specific role assignment
}

/**
 * Organization Access DTO
 * For restricting user access to specific organizations
 */
export class CreateOrganizationAccessDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accessLevel?: string; // Full, ReadOnly, Limited

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Warehouse Access DTO
 * For restricting user access to specific warehouses
 */
export class CreateWarehouseAccessDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accessLevel?: string; // Full, ReadOnly, Limited

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Bulk Access Assignment DTO
 */
export class BulkAccessAssignmentDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  organizationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  warehouseIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accessLevel?: string;
}

/**
 * Permission Check DTO
 */
export class CheckPermissionDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MaxLength(100)
  permissionCode: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

/**
 * Role Template DTO
 * Pre-defined role templates that can be cloned
 */
export class RoleTemplateDto {
  @IsString()
  @MaxLength(100)
  templateName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}

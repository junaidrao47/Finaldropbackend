import { IsString, IsBoolean, IsOptional, IsUUID, IsNumber, MaxLength, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Create Warehouse DTO
 */
export class CreateWarehouseDto {
  @IsString()
  @MaxLength(255)
  warehouseName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  warehouseCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @IsOptional()
  @IsNumber()
  capacityLimit?: number;

  @IsOptional()
  @IsString()
  operatingHours?: string; // JSON string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  statusId?: string;
}

/**
 * Update Warehouse DTO
 */
export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

/**
 * Warehouse Default Options DTO
 */
export class CreateWarehouseDefaultOptionsDto {
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  optionKey?: string;

  @IsOptional()
  @IsString()
  optionValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

/**
 * Storage Layout DTO
 */
export class CreateStorageLayoutDto {
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  zone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  aisle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shelf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationCode?: string; // Generated from zone/aisle/rack/shelf/bin

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsNumber()
  currentOccupancy?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  storageType?: string; // General, Cold, Hazmat, Fragile

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Update Storage Layout DTO
 */
export class UpdateStorageLayoutDto extends PartialType(CreateStorageLayoutDto) {}

/**
 * Warehouse Filter DTO
 */
export class WarehouseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  IsDateString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Create Carrier DTO
 */
export class CreateCarrierDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;

  @IsOptional()
  @IsBoolean()
  isBusiness?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirthBusinessSince?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  federalTaxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  stateTaxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobileNumber?: string;

  @IsOptional()
  @IsBoolean()
  differentWhatsAppNumber?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsAppNumber?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsBoolean()
  differentBillingEmail?: boolean;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  billingEmail?: string;

  @IsOptional()
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsUUID()
  accountHolderId?: string;
}

/**
 * Update Carrier DTO
 */
export class UpdateCarrierDto extends PartialType(CreateCarrierDto) {
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

/**
 * Carrier Filter DTO
 */
export class CarrierFilterDto {
  @IsOptional()
  @IsBoolean()
  isBusiness?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Carrier Response DTO
 */
export interface CarrierResponseDto {
  id: string;
  profileImage?: string;
  isBusiness: boolean;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  legalName?: string;
  dateOfBirthBusinessSince?: Date;
  federalTaxId?: string;
  stateTaxId?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  differentWhatsAppNumber: boolean;
  whatsAppNumber?: string;
  email?: string;
  differentBillingEmail: boolean;
  billingEmail?: string;
  additionalInformation?: string;
  statusId?: string;
  accountHolderId?: string;
  isDeleted: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

/**
 * Carrier Stats DTO
 */
export interface CarrierStatsDto {
  total: number;
  businesses: number;
  individuals: number;
}

/**
 * Carrier Dropdown Option
 */
export interface CarrierOption {
  id: string;
  name: string;
}

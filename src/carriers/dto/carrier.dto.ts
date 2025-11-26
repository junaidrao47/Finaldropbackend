import { IsString, IsBoolean, IsOptional, IsEmail, IsUUID, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Create Carrier DTO
 */
export class CreateCarrierDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;

  @IsString()
  @MaxLength(255)
  carrierName: string;

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
  @IsString()
  additionalInformation?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;
}

/**
 * Update Carrier DTO
 */
export class UpdateCarrierDto extends PartialType(CreateCarrierDto) {}

/**
 * Carrier Address DTO
 */
export class CreateCarrierAddressDto {
  @IsUUID()
  carrierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  addressType?: string;

  @IsOptional()
  @IsBoolean()
  differentRecipient?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attentionTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

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
  additionalInformation?: string;

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
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Carrier Remark DTO
 */
export class CreateCarrierRemarkDto {
  @IsUUID()
  carrierId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

/**
 * Carrier File DTO
 */
export class CreateCarrierFileDto {
  @IsUUID()
  carrierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileTitle?: string;

  @IsOptional()
  @IsString()
  file?: string;
}

/**
 * Carrier API Handshake DTO
 */
export class CreateCarrierApiHandshakeDto {
  @IsUUID()
  carrierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apiName?: string;

  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  authType?: string;

  @IsOptional()
  @IsString()
  additionalConfig?: string; // JSON string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsString, IsBoolean, IsOptional, IsEmail, IsUUID, IsDateString, MaxLength } from 'class-validator';

/**
 * Create Organization DTO
 * Used when creating a new organization
 */
export class CreateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;

  @IsBoolean()
  isBusiness: boolean;

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
}

/**
 * Update Organization DTO
 */
export class UpdateOrganizationDto extends CreateOrganizationDto {}

/**
 * Organization Address DTO
 */
export class CreateOrganizationAddressDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  addressType?: string; // Mailing, Billing, Shipping

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
 * Organization Remark DTO
 */
export class CreateOrganizationRemarkDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string; // Active, Suspended, Blacklisted
}

/**
 * Organization File Upload DTO
 */
export class CreateOrganizationFileDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileTitle?: string;

  @IsOptional()
  @IsString()
  file?: string; // File path or URL
}

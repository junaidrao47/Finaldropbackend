import { IsString, IsBoolean, IsOptional, IsEmail, IsUUID, MaxLength, IsNumber, IsDateString } from 'class-validator';

/**
 * Create User DTO
 * Used when creating a new user (by admin or during registration)
 */
export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MaxLength(255)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

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

  @IsEmail()
  @MaxLength(255)
  email: string;

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

  // Auth fields
  @IsString()
  @MaxLength(255)
  password: string;
}

/**
 * Update User DTO - excludes password
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImage?: string;

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
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

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
 * User Address DTO
 */
export class CreateUserAddressDto {
  @IsUUID()
  userId: string;

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
 * User Remark DTO
 */
export class CreateUserRemarkDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string; // Active, Suspended, Blacklisted
}

/**
 * User File Upload DTO
 */
export class CreateUserFileDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileTitle?: string;

  @IsOptional()
  @IsString()
  file?: string; // File path or URL
}

/**
 * Trusted Device DTO
 */
export class CreateTrustedDeviceDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @IsString()
  @MaxLength(500)
  deviceFingerprint: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ipAddress?: string;

  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;

  @IsOptional()
  @IsDateString()
  lastUsedAt?: string;
}

/**
 * Authorized Person DTO
 */
export class CreateAuthorizedPersonDto {
  @IsUUID()
  userId: string;

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
  relationship?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoIdFile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobileNumber?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsBoolean()
  allowReceivePackage?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyViaEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyViaSms?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyViaWhatsApp?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

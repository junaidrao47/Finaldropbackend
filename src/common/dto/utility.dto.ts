import { IsString, IsBoolean, IsOptional, IsEmail, IsUUID, IsNumber, MaxLength, IsDateString, IsEnum } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';

/**
 * OTP Code Types
 */
export enum OtpPurpose {
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  DEVICE_TRUST = 'device_trust',
  TRANSACTION_APPROVAL = 'transaction_approval',
}

/**
 * Send OTP DTO
 */
export class SendOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deliveryMethod?: string; // email, sms, whatsapp

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;
}

/**
 * Verify OTP DTO
 */
export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MaxLength(10)
  code: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}

/**
 * Chat Message Types
 */
export enum ChatMessageType {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

/**
 * Send Chat Message DTO
 */
export class SendChatMessageDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string; // Will be created if not provided

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string; // JSON context for AI (current page, user info, etc.)
}

/**
 * Chat Message Response DTO
 */
export class ChatMessageResponseDto {
  sessionId: string;
  messageId: string;
  response: string;
  timestamp: Date;
  suggestedActions?: string[];
}

/**
 * Chat Session Filter DTO
 */
export class ChatSessionFilterDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Subscription Types
 */
export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * Create Subscription DTO
 */
export class CreateSubscriptionDto {
  @IsUUID()
  organizationId: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  monthlyPackageLimit?: number;

  @IsOptional()
  @IsNumber()
  monthlyUserLimit?: number;

  @IsOptional()
  @IsNumber()
  storageLimit?: number; // in GB

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

/**
 * Update Subscription DTO
 */
export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}

/**
 * Audit Log Filter DTO
 */
export class AuditLogFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string; // User, Organization, Package, etc.

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string; // CREATE, UPDATE, DELETE, VIEW

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * Status DTO
 */
export class CreateStatusDto {
  @IsString()
  @MaxLength(100)
  statusName: string;

  @IsString()
  @MaxLength(50)
  statusCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  statusType?: string; // User, Organization, Package, Carrier, etc.

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string; // For UI display

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Update Status DTO
 */
export class UpdateStatusDto extends PartialType(CreateStatusDto) {}

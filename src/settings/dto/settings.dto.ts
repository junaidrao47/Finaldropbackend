import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
  IsEmail,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * Theme preferences
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Date format preferences
 */
export enum DateFormat {
  US = 'MM/DD/YYYY',
  EU = 'DD/MM/YYYY',
  ISO = 'YYYY-MM-DD',
}

/**
 * Time format preferences
 */
export enum TimeFormat {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h',
}

/**
 * Language options
 */
export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  ZH = 'zh',
  AR = 'ar',
}

/**
 * Notification channels
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

/**
 * User Preferences DTO
 */
export class UserPreferencesDto {
  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(DateFormat)
  dateFormat?: DateFormat;

  @IsOptional()
  @IsEnum(TimeFormat)
  timeFormat?: TimeFormat;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsBoolean()
  showAnimations?: boolean;

  @IsOptional()
  @IsNumber()
  defaultPageSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  defaultCurrency?: string;
}

/**
 * Notification Settings DTO
 */
export class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  // Specific notification types
  @IsOptional()
  @IsBoolean()
  packageReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  packageDelivered?: boolean;

  @IsOptional()
  @IsBoolean()
  packageReturned?: boolean;

  @IsOptional()
  @IsBoolean()
  newMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  systemAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  promotionalEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyDigest?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quietHoursStart?: string; // HH:MM format

  @IsOptional()
  @IsString()
  @MaxLength(5)
  quietHoursEnd?: string; // HH:MM format
}

/**
 * Security Settings DTO
 */
export class SecuritySettingsDto {
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  twoFactorMethod?: string; // 'app', 'sms', 'email'

  @IsOptional()
  @IsBoolean()
  loginAlerts?: boolean;

  @IsOptional()
  @IsNumber()
  sessionTimeoutMinutes?: number;

  @IsOptional()
  @IsBoolean()
  rememberDevices?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trustedIps?: string[];
}

/**
 * Organization Settings DTO
 */
export class OrganizationSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  businessPhone?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  defaultCurrency?: string;

  @IsOptional()
  @IsEnum(DateFormat)
  defaultDateFormat?: DateFormat;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultTimezone?: string;

  // Operational settings
  @IsOptional()
  @IsBoolean()
  autoAssignAgent?: boolean;

  @IsOptional()
  @IsBoolean()
  requireSignature?: boolean;

  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;

  @IsOptional()
  @IsNumber()
  defaultRetentionDays?: number;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, { start: string; end: string; closed?: boolean }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[]; // ISO date strings
}

/**
 * Update Organization Settings DTO
 */
export class UpdateOrganizationSettingsDto extends PartialType(OrganizationSettingsDto) {}

/**
 * Warehouse Settings DTO
 */
export class WarehouseSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, { start: string; end: string; closed?: boolean }>;

  @IsOptional()
  @IsBoolean()
  acceptsReturns?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsPickups?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  allowedCarrierIds?: number[];
}

/**
 * Update Warehouse Settings DTO
 */
export class UpdateWarehouseSettingsDto extends PartialType(WarehouseSettingsDto) {}

/**
 * Label Settings DTO - For OCR and label printing
 */
export class LabelSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultLabelSize?: string; // '4x6', '2x1', etc.

  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultPrinter?: string;

  @IsOptional()
  @IsBoolean()
  autoPrint?: boolean;

  @IsOptional()
  @IsBoolean()
  includeReturnLabel?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcodeFormat?: string; // 'QR', 'CODE128', 'CODE39', etc.

  @IsOptional()
  @IsBoolean()
  ocrEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ocrProvider?: string; // 'google', 'aws', 'azure', 'tesseract'
}

/**
 * API Settings DTO - For integrations
 */
export class ApiSettingsDto {
  @IsOptional()
  @IsBoolean()
  apiEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  rateLimitPerMinute?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  webhookUrls?: string[];

  @IsOptional()
  @IsBoolean()
  webhooksEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  webhookEvents?: string[]; // 'package.received', 'package.delivered', etc.
}

/**
 * Settings Response DTOs
 */
export interface UserSettingsResponseDto {
  userId: number;
  preferences: UserPreferencesDto;
  notifications: NotificationSettingsDto;
  security: SecuritySettingsDto;
  updatedAt: Date;
}

export interface OrganizationSettingsResponseDto {
  organizationId: number;
  settings: OrganizationSettingsDto;
  labelSettings: LabelSettingsDto;
  apiSettings: ApiSettingsDto;
  updatedAt: Date;
}

export interface WarehouseSettingsResponseDto {
  warehouseId: number;
  settings: WarehouseSettingsDto;
  updatedAt: Date;
}

/**
 * Settings Category Filter
 */
export enum SettingsCategory {
  PREFERENCES = 'preferences',
  NOTIFICATIONS = 'notifications',
  SECURITY = 'security',
  ORGANIZATION = 'organization',
  WAREHOUSE = 'warehouse',
  LABEL = 'label',
  API = 'api',
}

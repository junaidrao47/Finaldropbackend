import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsObject,
  IsUUID,
  MaxLength,
  MinLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// ==================== Enums ====================

export enum ContactType {
  SENDER = 'Sender',
  CARRIER = 'Carrier',
  RECIPIENT = 'Recipient',
}

export enum BlacklistType {
  CARRIER = 'Carrier',
  SENDER = 'Sender',
  RECIPIENT = 'Recipient',
}

export enum BlacklistStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum WarningSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum WarningStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum RefuseAction {
  REFUSE = 'refuse',
  FLAG = 'flag',
  NOTIFY = 'notify',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  SCANNER = 'scanner',
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  FEATURE_REQUEST = 'feature_request',
  ACCOUNT = 'account',
  OTHER = 'other',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ReportType {
  PACKAGES = 'packages',
  CARRIERS = 'carriers',
  PERFORMANCE = 'performance',
  ACTIVITY = 'activity',
  CUSTOM = 'custom',
}

// ==================== Contacts DTOs ====================

export class CreateContactDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(ContactType)
  type: ContactType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}

export class ContactFilterDto {
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class ContactResponseDto {
  id: string;
  name: string;
  type: ContactType;
  contactNumber?: string;
  email?: string;
  alternatePhone?: string;
  company?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Blacklist DTOs ====================

export class AddToBlacklistDto {
  @IsEnum(BlacklistType)
  type: BlacklistType;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string
}

export class UpdateBlacklistDto extends PartialType(AddToBlacklistDto) {
  @IsOptional()
  @IsEnum(BlacklistStatus)
  status?: BlacklistStatus;
}

export class BlacklistFilterDto {
  @IsOptional()
  @IsEnum(BlacklistType)
  type?: BlacklistType;

  @IsOptional()
  @IsEnum(BlacklistStatus)
  status?: BlacklistStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class BlacklistResponseDto {
  id: string;
  type: BlacklistType;
  entityId?: string;
  name: string;
  email?: string;
  phone?: string;
  reason?: string;
  status: BlacklistStatus;
  blacklistedAt: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  createdBy?: string;
  createdAt: Date;
}

// ==================== Warning Messages DTOs ====================

export class CreateWarningMessageDto {
  @IsEnum(ContactType) // Reuse ContactType: Sender, Carrier, Recipient
  type: ContactType;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(WarningSeverity)
  severity?: WarningSeverity;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdateWarningMessageDto extends PartialType(CreateWarningMessageDto) {
  @IsOptional()
  @IsEnum(WarningStatus)
  status?: WarningStatus;
}

export class WarningMessageFilterDto {
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @IsOptional()
  @IsEnum(WarningStatus)
  status?: WarningStatus;

  @IsOptional()
  @IsEnum(WarningSeverity)
  severity?: WarningSeverity;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class WarningMessageResponseDto {
  id: string;
  type: ContactType;
  title: string;
  message: string;
  severity: WarningSeverity;
  status: WarningStatus;
  displayOrder: number;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Refuse Package Settings DTOs ====================

export class RefuseConditionDto {
  @IsString()
  field: string; // e.g., 'carrier', 'weight', 'size', 'sender_email'

  @IsString()
  operator: string; // 'equals', 'contains', 'greater_than', 'less_than', 'in'

  @IsString()
  value: string; // The value to compare against
}

export class CreateRefusePackageSettingDto {
  @IsString()
  @MaxLength(255)
  settingName: string;

  @IsString()
  @MaxLength(50)
  settingType: string; // 'carrier', 'sender', 'size', 'weight', 'condition'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefuseConditionDto)
  conditions: RefuseConditionDto[];

  @IsOptional()
  @IsEnum(RefuseAction)
  action?: RefuseAction;

  @IsOptional()
  @IsEmail()
  notifyEmail?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateRefusePackageSettingDto extends PartialType(CreateRefusePackageSettingDto) {}

export class RefusePackageSettingResponseDto {
  id: string;
  settingName: string;
  settingType: string;
  conditions: RefuseConditionDto[];
  action: RefuseAction;
  notifyEmail?: string;
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Linked Devices DTOs ====================

export class LinkedDeviceFilterDto {
  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class UpdateLinkedDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}

export class LinkedDeviceResponseDto {
  id: string;
  deviceName?: string;
  deviceType?: string;
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
  appVersion?: string;
  lastIpAddress?: string;
  lastLocation?: string;
  lastActiveAt?: Date;
  isActive: boolean;
  isTrusted: boolean;
  createdAt: Date;
}

// ==================== Support Tickets DTOs ====================

export class CreateSupportTicketDto {
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]; // File URLs
}

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

export class SupportTicketFilterDto {
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class AddTicketMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class SupportTicketResponseDto {
  id: string;
  ticketNumber: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  attachments?: string[];
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  messages?: TicketMessageResponseDto[];
}

export class TicketMessageResponseDto {
  id: string;
  senderId: string;
  senderName?: string;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: Date;
}

// ==================== App Rating DTOs ====================

export class CreateAppRatingDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

export class AppRatingResponseDto {
  id: string;
  rating: number;
  feedback?: string;
  platform?: string;
  appVersion?: string;
  wouldRecommend?: boolean;
  createdAt: Date;
}

export class AppRatingStatsDto {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recommendRate: number;
}

// ==================== Reports DTOs ====================

export class CreateReportDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    recipients: string[]; // Email addresses
  };

  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;
}

export class UpdateReportDto extends PartialType(CreateReportDto) {}

export class ReportFilterDto {
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @IsOptional()
  @IsBoolean()
  isScheduled?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class GenerateReportDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  format?: 'pdf' | 'csv' | 'xlsx';
}

export class ReportResponseDto {
  id: string;
  name: string;
  reportType: ReportType;
  parameters?: Record<string, any>;
  schedule?: Record<string, any>;
  isScheduled: boolean;
  lastGeneratedAt?: Date;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Pagination Response ====================

export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Receive Status - matches Kanban columns in design
 */
export enum ReceiveStatus {
  PENDING = 'Pending',
  RECEIVED = 'Received',
  TRANSFERRED = 'Transferred',
  FLAGGED = 'Flagged',
  UNASSIGNED = 'Unassigned',
  CANCELLED = 'Cancelled',
  AVAILABLE = 'Available',
  IN_STORAGE = 'In Storage',
}

/**
 * View Mode for receives listing
 */
export enum ViewMode {
  KANBAN = 'kanban',
  LIST = 'list',
  GRID = 'grid',
}

/**
 * Period filter for receives
 */
export enum ReceivePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  SEMESTER = 'semester',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Filter DTO for receives listing
 */
export class ReceivesFilterDto {
  @IsOptional()
  @IsEnum(ReceivePeriod)
  period?: ReceivePeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsEnum(ReceiveStatus)
  status?: ReceiveStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(ReceiveStatus, { each: true })
  statuses?: ReceiveStatus[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ViewMode)
  viewMode?: ViewMode = ViewMode.KANBAN;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * Package dimensions DTO
 */
export class DimensionsDto {
  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  unit?: string = 'cm';
}

/**
 * Create Receive DTO - for receiving a new package
 */
export class CreateReceiveDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsString()
  senderName: string;

  @IsString()
  recipientName: string;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsString()
  attentionTo?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  isle?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsInt()
  keepPackageForHowLong?: number;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsBoolean()
  signatureRequiredOnDeliver?: boolean;

  @IsOptional()
  @IsEnum(ReceiveStatus)
  status?: ReceiveStatus = ReceiveStatus.RECEIVED;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[]; // File URLs from Cloudinary
}

/**
 * Update Receive Status DTO
 */
export class UpdateReceiveStatusDto {
  @IsEnum(ReceiveStatus)
  status: ReceiveStatus;

  @IsOptional()
  @IsString()
  memo?: string;
}

/**
 * Bulk Update Receives Status DTO
 */
export class BulkUpdateStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsEnum(ReceiveStatus)
  status: ReceiveStatus;

  @IsOptional()
  @IsString()
  memo?: string;
}

/**
 * Move Package (Kanban drag-drop) DTO
 */
export class MovePackageDto {
  @IsUUID()
  packageId: string;

  @IsEnum(ReceiveStatus)
  fromStatus: ReceiveStatus;

  @IsEnum(ReceiveStatus)
  toStatus: ReceiveStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

/**
 * Flag Package DTO
 */
export class FlagPackageDto {
  @IsUUID()
  packageId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Approve Package DTO - from design "Approve" button
 */
export class ApprovePackageDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  assignToWarehouseId?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  isle?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;
}

/**
 * Cancel Package DTO - from design "Cancel" button
 */
export class CancelPackageDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  notifyRecipient?: boolean = true;
}

/**
 * Update Package DTO - for editing package details
 */
export class UpdateReceiveDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsString()
  attentionTo?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  isle?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsInt()
  keepPackageForHowLong?: number;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsBoolean()
  signatureRequiredOnDeliver?: boolean;
}

/**
 * Add Remark DTO
 */
export class AddRemarkDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(ReceiveStatus)
  status?: ReceiveStatus;
}

/**
 * Search Packages DTO
 */
export class SearchPackagesDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ReceiveStatus, { each: true })
  statuses?: ReceiveStatus[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

// ==================== Response DTOs ====================

/**
 * Receive Card Item - matches design card
 */
export interface ReceiveCardItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  recipientName: string;
  recipientAvatar?: string;
  date: Date;
  trackingNumber: string;
  invoiceNumber: string;
  location: string;
  dimensions: string; // "50x30x100 cm"
  memo: string;
  transactionId: string;
  status: ReceiveStatus;
  isFlagged: boolean;
  flagReason?: string;
  hasAttachment: boolean;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Kanban Column
 */
export interface KanbanColumn {
  id: string;
  status: ReceiveStatus;
  title: string;
  color: string;
  count: number;
  items: ReceiveCardItem[];
}

/**
 * Kanban Board Response
 */
export interface ReceivesKanbanResponse {
  date: Date;
  dateFormatted: string;
  columns: KanbanColumn[];
  totalCount: number;
  period: string;
}

/**
 * Receives List Response
 */
export interface ReceivesListResponse {
  items: ReceiveCardItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Receive Detail Response - full package info
 */
export interface ReceiveDetailResponse {
  id: string;
  organizationId: string;
  warehouseId: string | null;
  senderName: string;
  recipientName: string;
  recipientId: string | null;
  attentionTo: string | null;
  trackingNumber: string | null;
  invoiceNumber: string | null;
  purchaseOrderNumber: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  email: string | null;
  phoneNumber: string | null;
  location: {
    zone: string | null;
    isle: string | null;
    shelf: string | null;
    bin: string | null;
    formatted: string;
  };
  dimensions: {
    length: number | null;
    width: number | null;
    height: number | null;
    formatted: string;
  } | null;
  memo: string | null;
  keepPackageForHowLong: number | null;
  expectedDeliveryDate: Date | null;
  signatureRequiredOnDeliver: boolean;
  status: ReceiveStatus;
  isFlagged: boolean;
  flagReason: string | null;
  files: {
    id: string;
    type: string;
    title: string;
    url: string;
  }[];
  remarks: {
    id: string;
    message: string;
    status: string;
    createdAt: Date;
    createdBy: string;
  }[];
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Receive Stats Response
 */
export interface ReceiveStatsResponse {
  total: number;
  received: number;
  transferred: number;
  flagged: number;
  unassigned: number;
  cancelled: number;
  available: number;
  pending: number;
  todayReceived: number;
  weekReceived: number;
}

/**
 * Package Activity Item - for "View Activity" button
 */
export interface PackageActivityItem {
  id: string;
  action: string;
  description: string;
  previousStatus?: string;
  newStatus?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Package Activity Response
 */
export interface PackageActivityResponse {
  packageId: string;
  trackingNumber: string;
  activities: PackageActivityItem[];
  total: number;
}

/**
 * Bulk Operation Result
 */
export interface BulkOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: {
    packageId: string;
    success: boolean;
    error?: string;
  }[];
}

/**
 * Export Packages DTO
 */
export class ExportPackagesDto {
  @IsOptional()
  @IsEnum(ReceivePeriod)
  period?: ReceivePeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ReceiveStatus, { each: true })
  statuses?: ReceiveStatus[];

  @IsOptional()
  @IsString()
  format?: 'csv' | 'xlsx' | 'pdf' = 'csv';
}

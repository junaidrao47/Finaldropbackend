import { IsString, IsBoolean, IsOptional, IsUUID, IsNumber, MaxLength, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Package DTO
 * Main package/shipment record
 */
export class CreatePackageDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionType?: string; // Receive, Deliver, Return

  @IsOptional()
  @IsString()
  @MaxLength(50)
  transactionStatus?: string; // Pending, Processing, Completed, etc.

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  senderPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  recipientPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  recipientAddress?: string;

  @IsOptional()
  @IsNumber()
  numberOfPackages?: number;

  @IsOptional()
  @IsNumber()
  declaredValue?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  weightUnit?: string; // lbs, kg

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contentDescription?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsBoolean()
  requiresSignature?: boolean;

  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageLocation?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;
}

/**
 * Update Package DTO
 */
export class UpdatePackageDto extends CreatePackageDto {}

/**
 * Package Remark DTO
 */
export class CreatePackageRemarkDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsUUID()
  packageRemarksTypeId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

/**
 * Package File DTO
 */
export class CreatePackageFileDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileTitle?: string;

  @IsOptional()
  @IsString()
  file?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fileType?: string; // Photo, POD, Signature, Label
}

/**
 * Package Transfer DTO
 * For logging package movements between warehouses/locations
 */
export class CreatePackageTransferDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  toLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  transferType?: string; // Internal, External, Pickup, Delivery

  @IsOptional()
  @IsString()
  @MaxLength(50)
  transferStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Carrier Upcoming Package DTO
 * For carrier-reported expected packages
 */
export class CreateCarrierUpcomingPackageDto {
  @IsUUID()
  carrierId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string; // Expected, Received, Cancelled

  @IsOptional()
  @IsString()
  rawData?: string; // JSON from carrier API
}

/**
 * Scan Package DTO
 * Used when scanning a package at receive/deliver
 */
export class ScanPackageDto {
  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  scanType?: string; // Receive, Deliver, Transfer
}

/**
 * Bulk Package Action DTO
 */
export class BulkPackageActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsString()
  @MaxLength(50)
  action: string; // updateStatus, transfer, delete

  @IsOptional()
  @IsString()
  @MaxLength(50)
  newStatus?: string;

  @IsOptional()
  @IsUUID()
  targetWarehouseId?: string;
}

/**
 * Package Search/Filter DTO
 */
export class PackageFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  transactionType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  transactionStatus?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

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

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string; // asc, desc
}

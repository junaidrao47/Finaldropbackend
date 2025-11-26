import { IsString, IsBoolean, IsOptional, IsUUID, IsNumber, MaxLength, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Transaction Types
 */
export enum TransactionType {
  RECEIVE = 'receive',
  DELIVER = 'deliver',
  RETURN = 'return',
}

/**
 * Transaction Status (for Kanban board)
 */
export enum TransactionStatus {
  // Receive statuses
  PENDING_RECEIPT = 'pending_receipt',
  RECEIVED = 'received',
  IN_STORAGE = 'in_storage',
  READY_FOR_PICKUP = 'ready_for_pickup',
  
  // Deliver statuses
  PENDING_DELIVERY = 'pending_delivery',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  
  // Return statuses
  RETURN_REQUESTED = 'return_requested',
  RETURN_IN_TRANSIT = 'return_in_transit',
  RETURN_RECEIVED = 'return_received',
  RETURN_PROCESSED = 'return_processed',
  
  // Common
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

/**
 * Receive Package Flow DTO (AGNT-001)
 * Step 1: Initial scan/entry
 */
export class ReceivePackageDto {
  @IsString()
  @MaxLength(100)
  trackingNumber: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  carrierName?: string; // If carrier not in system

  @IsOptional()
  @IsUUID()
  organizationId?: string;

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
  @IsNumber()
  numberOfPackages?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  weightUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
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
  @IsNumber()
  declaredValue?: number;

  // Warehouse assignment
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  storageLocation?: string;
}

/**
 * Receive Package - Assign Storage DTO
 * Step 2: Assign to storage location
 */
export class AssignStorageDto {
  @IsUUID()
  packageId: string;

  @IsUUID()
  warehouseId: string;

  @IsString()
  @MaxLength(100)
  storageLocation: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Receive Package - Add Photo DTO
 */
export class AddPackagePhotoDto {
  @IsUUID()
  packageId: string;

  @IsString()
  photoData: string; // Base64 or file path

  @IsOptional()
  @IsString()
  @MaxLength(50)
  photoType?: string; // arrival, condition, label, contents
}

/**
 * Receive Package - Complete Receipt DTO
 */
export class CompleteReceiptDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  agentSignature?: string; // Base64 signature

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  notifyRecipient?: boolean;
}

/**
 * Delivery Flow DTO (AGNT-003)
 * Step 1: Prepare for delivery
 */
export class PrepareDeliveryDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  recipientPhone?: string;

  @IsOptional()
  @IsDateString()
  scheduledDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deliveryTimeWindow?: string; // e.g., "9AM-12PM"

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}

/**
 * Start Delivery DTO
 */
export class StartDeliveryDto {
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  driverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleInfo?: string;
}

/**
 * Complete Delivery DTO (POD)
 */
export class CompleteDeliveryDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  recipientSignature?: string; // Base64 signature

  @IsOptional()
  @IsString()
  @MaxLength(100)
  receivedByName?: string;

  @IsOptional()
  @IsString()
  proofOfDeliveryPhoto?: string; // Base64

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deliveryLocation?: string; // Front door, mailroom, etc.

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  notifySender?: boolean;
}

/**
 * Delivery Failed DTO
 */
export class DeliveryFailedDto {
  @IsUUID()
  packageId: string;

  @IsString()
  @MaxLength(100)
  failureReason: string;

  @IsOptional()
  @IsString()
  photo?: string; // Base64 photo evidence

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  reschedule?: boolean;

  @IsOptional()
  @IsDateString()
  rescheduledDate?: string;
}

/**
 * Return Flow DTO (AGNT-005)
 */
export class InitiateReturnDto {
  @IsUUID()
  packageId: string;

  @IsString()
  @MaxLength(255)
  returnReason: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  returnAddress?: string;

  @IsOptional()
  @IsUUID()
  returnCarrierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  returnTrackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  requiresPickup?: boolean;
}

/**
 * Process Return DTO
 */
export class ProcessReturnDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string; // Good, Damaged, Opened

  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @IsOptional()
  @IsString()
  photo?: string; // Base64

  @IsOptional()
  @IsBoolean()
  refundApproved?: boolean;
}

/**
 * Update Transaction Status DTO
 */
export class UpdateTransactionStatusDto {
  @IsUUID()
  packageId: string;

  @IsEnum(TransactionStatus)
  newStatus: TransactionStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  notifyCustomer?: boolean;
}

/**
 * Bulk Status Update DTO
 */
export class BulkStatusUpdateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds: string[];

  @IsEnum(TransactionStatus)
  newStatus: TransactionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Package Timeline Entry Response
 */
export interface PackageTimelineEntry {
  id: string;
  action: string;
  status: string;
  description: string;
  location?: string;
  performedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Package Details Response
 */
export interface PackageDetailsResponse {
  package: {
    id: string;
    trackingNumber: string;
    transactionType: string;
    transactionStatus: string;
    carrier: { id: string; name: string } | null;
    organization: { id: string; name: string } | null;
    warehouse: { id: string; name: string; location: string } | null;
    senderName: string;
    recipientName: string;
    weight: number;
    dimensions: string;
    declaredValue: number;
    createdAt: Date;
    updatedAt: Date;
  };
  timeline: PackageTimelineEntry[];
  photos: { id: string; url: string; type: string; uploadedAt: Date }[];
  remarks: { id: string; message: string; createdBy: string; createdAt: Date }[];
}

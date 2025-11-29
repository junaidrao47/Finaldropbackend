import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Signature Capture DTO
 */
export class SignatureCaptureDto {
  @IsString()
  signatureBase64: string; // Base64 encoded signature image

  @IsString()
  signerName: string;

  @IsOptional()
  @IsString()
  signerRelationship?: string; // e.g., "Recipient", "Agent", "Neighbor"

  @IsOptional()
  @IsDateString()
  signedAt?: string;
}

/**
 * Photo Capture DTO
 */
export class PhotoCaptureDto {
  @IsString()
  photoBase64: string; // Base64 encoded photo

  @IsOptional()
  @IsString()
  photoType?: string; // 'delivery', 'package', 'damage', 'location'

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;
}

/**
 * GPS Location DTO
 */
export class GpsLocationDto {
  @IsString()
  latitude: string;

  @IsString()
  longitude: string;

  @IsOptional()
  @IsString()
  accuracy?: string;

  @IsOptional()
  @IsString()
  address?: string; // Reverse geocoded address
}

/**
 * Create POD DTO - Full proof of delivery record
 */
export class CreatePodDto {
  @IsUUID()
  packageId: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  deliveryType?: string; // 'direct', 'left_at_door', 'neighbor', 'mailroom', 'locker'

  @IsOptional()
  @ValidateNested()
  @Type(() => SignatureCaptureDto)
  signature?: SignatureCaptureDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoCaptureDto)
  photos?: PhotoCaptureDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsLocationDto)
  location?: GpsLocationDto;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  deliveredTo?: string; // Actual person who received

  @IsOptional()
  @IsBoolean()
  isContactless?: boolean;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;
}

/**
 * Update POD DTO
 */
export class UpdatePodDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  deliveryType?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

/**
 * POD Filter DTO
 */
export class PodFilterDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsBoolean()
  hasSignature?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPhoto?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

/**
 * POD Response DTO
 */
export class PodResponseDto {
  id: string;
  packageId: string;
  organizationId: string;
  deliveryType?: string;
  hasSignature: boolean;
  hasPhotos: boolean;
  hasLocation: boolean;
  recipientName?: string;
  deliveredTo?: string;
  isContactless: boolean;
  isVerified: boolean;
  deliveredAt: Date;
  createdAt: Date;
  signatureUrl?: string;
  photoUrls?: string[];
  locationAddress?: string;
  notes?: string;
}

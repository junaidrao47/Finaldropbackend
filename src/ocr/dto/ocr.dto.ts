import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

/**
 * OCR Scan Request DTO
 */
export class OcrScanRequestDto {
  @IsString()
  imageBase64: string; // Base64 encoded image

  @IsOptional()
  @IsString()
  imageUrl?: string; // Alternative: URL to image

  @IsOptional()
  @IsString()
  carrierHint?: string; // Optional hint about carrier (UPS, FedEx, USPS, etc.)

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

/**
 * OCR Scan Result DTO
 */
export class OcrScanResultDto {
  success: boolean;
  confidence: number;

  // Extracted fields
  trackingNumber?: string;
  carrier?: string;
  senderName?: string;
  senderAddress?: string;
  recipientName?: string;
  recipientAddress?: string;
  weight?: string;
  dimensions?: string;
  serviceType?: string;
  barcode?: string;

  // Raw OCR data
  rawText?: string;
  extractedFields?: Record<string, string>;

  // Error info
  error?: string;
}

/**
 * Barcode Scan Request DTO
 */
export class BarcodeScanRequestDto {
  @IsString()
  barcodeData: string; // Barcode value from scanner

  @IsOptional()
  @IsString()
  barcodeType?: string; // CODE128, QR, etc.

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

/**
 * Barcode Lookup Result DTO
 */
export class BarcodeLookupResultDto {
  success: boolean;
  found: boolean;
  trackingNumber?: string;
  carrier?: string;
  packageId?: string;
  packageStatus?: string;
  error?: string;
}

/**
 * Carrier Detection Result
 */
export class CarrierDetectionResultDto {
  detected: boolean;
  carrier?: string;
  confidence: number;
  pattern?: string;
}

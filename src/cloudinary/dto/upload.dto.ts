import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsNumber, Min, Max } from 'class-validator';

/**
 * Cloudinary folder paths for organized file storage
 */
export enum CloudinaryFolder {
  PACKAGES = 'finaldrop/packages',
  PACKAGE_IMAGES = 'finaldrop/packages/images',
  SHIPPING_LABELS = 'finaldrop/packages/labels',
  POD_SIGNATURES = 'finaldrop/pod/signatures',
  POD_PHOTOS = 'finaldrop/pod/photos',
  USER_AVATARS = 'finaldrop/users/avatars',
  ORG_LOGOS = 'finaldrop/organizations/logos',
  DRIVER_IDS = 'finaldrop/drivers/identification',
  DOCUMENTS = 'finaldrop/documents',
  GENERAL = 'finaldrop/general',
}

/**
 * Upload types for categorization
 */
export enum UploadType {
  PACKAGE_IMAGE = 'package_image',
  SHIPPING_LABEL = 'shipping_label',
  SIGNATURE = 'signature',
  POD_PHOTO = 'pod_photo',
  USER_AVATAR = 'user_avatar',
  ORG_LOGO = 'org_logo',
  DRIVER_ID = 'driver_id',
  DOCUMENT = 'document',
  OTHER = 'other',
}

/**
 * DTO for single file upload
 */
export class UploadFileDto {
  @IsOptional()
  @IsEnum(CloudinaryFolder)
  folder?: CloudinaryFolder;

  @IsOptional()
  @IsEnum(UploadType)
  uploadType?: UploadType;

  @IsOptional()
  @IsString()
  publicId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * DTO for image transformation options
 */
export class ImageTransformDto {
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(4096)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(4096)
  height?: number;

  @IsOptional()
  @IsString()
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';

  @IsOptional()
  @IsString()
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @IsOptional()
  @IsString()
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
}

/**
 * DTO for deleting a file
 */
export class DeleteFileDto {
  @IsString()
  publicId!: string;

  @IsOptional()
  @IsString()
  resourceType?: 'image' | 'video' | 'raw';
}

/**
 * DTO for bulk delete
 */
export class BulkDeleteDto {
  @IsArray()
  @IsString({ each: true })
  publicIds!: string[];

  @IsOptional()
  @IsString()
  resourceType?: 'image' | 'video' | 'raw';
}

/**
 * Response DTO for uploaded file
 */
export class UploadResponseDto {
  publicId!: string;
  url!: string;
  secureUrl!: string;
  format!: string;
  width?: number;
  height?: number;
  bytes!: number;
  resourceType!: string;
  createdAt!: Date;
  folder?: string;
  originalFilename?: string;
  thumbnailUrl?: string;
}

/**
 * DTO for generating a signed upload URL
 */
export class SignedUploadDto {
  @IsOptional()
  @IsEnum(CloudinaryFolder)
  folder?: CloudinaryFolder;

  @IsOptional()
  @IsEnum(UploadType)
  uploadType?: UploadType;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  expiresIn?: number; // seconds, default 1 hour

  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(52428800) // 50MB max
  maxFileSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFormats?: string[];
}

import { Injectable, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-var-requires */
const cloudinaryLib = require('cloudinary');
const cloudinary = cloudinaryLib.v2;
import * as streamifier from 'streamifier';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
  CloudinaryFolder,
  UploadType,
  UploadFileDto,
  ImageTransformDto,
  UploadResponseDto,
  SignedUploadDto,
} from './dto/upload.dto';

// Type definitions for Cloudinary responses
interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
  created_at: string;
  folder?: string;
  original_filename?: string;
}

interface CloudinaryError {
  message: string;
}

/**
 * Service for handling file uploads to Cloudinary
 */
@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==================== Core Upload Methods ====================

  /**
   * Upload a file buffer to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadFileDto = {},
  ): Promise<UploadResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    const folder = options.folder || CloudinaryFolder.GENERAL;
    const uploadType = options.uploadType || UploadType.OTHER;

    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, any> = {
        folder,
        resource_type: 'auto',
        tags: [uploadType, ...(options.tags || [])],
        context: {
          upload_type: uploadType,
          organization_id: options.organizationId,
          package_id: options.packageId,
          user_id: options.userId,
          description: options.description,
        },
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: CloudinaryError | undefined, result: CloudinaryUploadResult | undefined) => {
          if (error) {
            reject(new InternalServerErrorException(`Upload failed: ${error.message}`));
          } else if (result) {
            resolve(this.mapToResponse(result));
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: UploadFileDto = {},
  ): Promise<UploadResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload a base64 encoded file (useful for signatures)
   */
  async uploadBase64(
    base64Data: string,
    options: UploadFileDto = {},
  ): Promise<UploadResponseDto> {
    const folder = options.folder || CloudinaryFolder.GENERAL;
    const uploadType = options.uploadType || UploadType.OTHER;

    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'auto',
        tags: [uploadType, ...(options.tags || [])],
        context: {
          upload_type: uploadType,
          organization_id: options.organizationId,
          package_id: options.packageId,
          user_id: options.userId,
        },
      });

      return this.mapToResponse(result);
    } catch (error: any) {
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload from URL
   */
  async uploadFromUrl(
    url: string,
    options: UploadFileDto = {},
  ): Promise<UploadResponseDto> {
    const folder = options.folder || CloudinaryFolder.GENERAL;
    const uploadType = options.uploadType || UploadType.OTHER;

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: 'auto',
        tags: [uploadType, ...(options.tags || [])],
        context: {
          upload_type: uploadType,
          organization_id: options.organizationId,
        },
      });

      return this.mapToResponse(result);
    } catch (error: any) {
      throw new InternalServerErrorException(`Upload from URL failed: ${error.message}`);
    }
  }

  // ==================== Specialized Upload Methods ====================

  /**
   * Upload a package image
   */
  async uploadPackageImage(
    file: Express.Multer.File,
    packageId: string,
    organizationId: string,
    description?: string,
  ): Promise<UploadResponseDto> {
    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.PACKAGE_IMAGES,
      uploadType: UploadType.PACKAGE_IMAGE,
      packageId,
      organizationId,
      description,
      tags: ['package', 'image'],
    });

    // Save to database
    await this.saveUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.PACKAGE_IMAGE,
      organizationId,
      packageId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  /**
   * Upload a shipping label
   */
  async uploadShippingLabel(
    file: Express.Multer.File,
    packageId: string,
    organizationId: string,
  ): Promise<UploadResponseDto> {
    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.SHIPPING_LABELS,
      uploadType: UploadType.SHIPPING_LABEL,
      packageId,
      organizationId,
      tags: ['shipping', 'label'],
    });

    // Save to database
    await this.saveUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.SHIPPING_LABEL,
      organizationId,
      packageId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  /**
   * Upload a POD signature (usually base64)
   */
  async uploadSignature(
    signatureData: string, // base64 data URL
    packageId: string,
    organizationId: string,
    recipientName?: string,
  ): Promise<UploadResponseDto> {
    const response = await this.uploadBase64(signatureData, {
      folder: CloudinaryFolder.POD_SIGNATURES,
      uploadType: UploadType.SIGNATURE,
      packageId,
      organizationId,
      description: recipientName ? `Signature by ${recipientName}` : undefined,
      tags: ['pod', 'signature'],
    });

    // Save to database
    await this.saveUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.SIGNATURE,
      organizationId,
      packageId,
      filename: 'signature.png',
      mimeType: 'image/png',
      size: response.bytes,
    });

    return response;
  }

  /**
   * Upload POD delivery photo
   */
  async uploadPodPhoto(
    file: Express.Multer.File,
    packageId: string,
    organizationId: string,
    description?: string,
  ): Promise<UploadResponseDto> {
    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.POD_PHOTOS,
      uploadType: UploadType.POD_PHOTO,
      packageId,
      organizationId,
      description,
      tags: ['pod', 'delivery', 'photo'],
    });

    // Save to database
    await this.saveUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.POD_PHOTO,
      organizationId,
      packageId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  /**
   * Upload user avatar/profile picture
   */
  async uploadUserAvatar(
    file: Express.Multer.File,
    userId: string,
    organizationId?: string,
  ): Promise<UploadResponseDto> {
    // Delete previous avatar if exists
    await this.deleteUserAvatar(userId);

    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.USER_AVATARS,
      uploadType: UploadType.USER_AVATAR,
      userId,
      organizationId,
      publicId: `avatar_${userId}`,
      tags: ['user', 'avatar', 'profile'],
    });

    // Save to database
    await this.saveUserUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.USER_AVATAR,
      userId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  /**
   * Upload organization logo
   */
  async uploadOrganizationLogo(
    file: Express.Multer.File,
    organizationId: string,
  ): Promise<UploadResponseDto> {
    // Delete previous logo if exists
    await this.deleteOrganizationLogo(organizationId);

    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.ORG_LOGOS,
      uploadType: UploadType.ORG_LOGO,
      organizationId,
      publicId: `logo_${organizationId}`,
      tags: ['organization', 'logo', 'brand'],
    });

    // Save to database
    await this.saveOrgUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.ORG_LOGO,
      organizationId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  /**
   * Upload driver identification image
   */
  async uploadDriverId(
    file: Express.Multer.File,
    packageId: string,
    organizationId: string,
    driverName?: string,
  ): Promise<UploadResponseDto> {
    const response = await this.uploadFile(file, {
      folder: CloudinaryFolder.DRIVER_IDS,
      uploadType: UploadType.DRIVER_ID,
      packageId,
      organizationId,
      description: driverName ? `Driver: ${driverName}` : undefined,
      tags: ['driver', 'identification'],
    });

    // Save to database
    await this.saveUploadRecord({
      publicId: response.publicId,
      url: response.secureUrl,
      uploadType: UploadType.DRIVER_ID,
      organizationId,
      packageId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return response;
  }

  // ==================== Delete Methods ====================

  /**
   * Delete a file by public ID
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === 'ok';
    } catch (error: any) {
      throw new InternalServerErrorException(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(publicIds: string[], resourceType: string = 'image'): Promise<any> {
    try {
      return await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });
    } catch (error: any) {
      throw new InternalServerErrorException(`Bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Delete user avatar
   */
  async deleteUserAvatar(userId: string): Promise<boolean> {
    const publicId = `${CloudinaryFolder.USER_AVATARS}/avatar_${userId}`;
    try {
      await this.deleteFile(publicId);
      return true;
    } catch {
      return false; // Avatar might not exist
    }
  }

  /**
   * Delete organization logo
   */
  async deleteOrganizationLogo(organizationId: string): Promise<boolean> {
    const publicId = `${CloudinaryFolder.ORG_LOGOS}/logo_${organizationId}`;
    try {
      await this.deleteFile(publicId);
      return true;
    } catch {
      return false; // Logo might not exist
    }
  }

  // ==================== URL Generation ====================

  /**
   * Generate optimized URL with transformations
   */
  generateOptimizedUrl(publicId: string, transform: ImageTransformDto = {}): string {
    const transformations: Record<string, any> = {
      fetch_format: transform.format || 'auto',
      quality: transform.quality || 'auto',
    };

    if (transform.width) transformations.width = transform.width;
    if (transform.height) transformations.height = transform.height;
    if (transform.crop) transformations.crop = transform.crop;
    if (transform.gravity) transformations.gravity = transform.gravity;

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [transformations],
    });
  }

  /**
   * Generate thumbnail URL
   */
  generateThumbnailUrl(publicId: string, size: number = 150): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: size,
          height: size,
          crop: 'fill',
          gravity: 'auto',
          fetch_format: 'auto',
          quality: 'auto',
        },
      ],
    });
  }

  /**
   * Generate signed upload parameters for direct browser upload
   */
  generateSignedUploadParams(options: SignedUploadDto = {}): Record<string, any> {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = options.folder || CloudinaryFolder.GENERAL;
    const expiresAt = timestamp + (options.expiresIn || 3600);

    const params = {
      timestamp,
      folder,
      upload_preset: undefined as string | undefined,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      ...params,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      expires_at: expiresAt,
    };
  }

  // ==================== Database Records ====================

  /**
   * Save upload record to organizations_uploaded_files table
   */
  private async saveUploadRecord(data: {
    publicId: string;
    url: string;
    uploadType: string;
    organizationId: string;
    packageId?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  }): Promise<void> {
    try {
      await this.db.insert(schema.organizationsUploadedFiles).values({
        organizationId: data.organizationId,
        fileTitle: `${data.uploadType}: ${data.filename || 'unknown'}`,
        file: data.url,
      });
    } catch (error) {
      // Log error but don't fail the upload
      console.error('Failed to save upload record:', error);
    }
  }

  /**
   * Save user upload record
   */
  private async saveUserUploadRecord(data: {
    publicId: string;
    url: string;
    uploadType: string;
    userId: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  }): Promise<void> {
    try {
      await this.db.insert(schema.usersUploadedFiles).values({
        userId: data.userId,
        fileTitle: `${data.uploadType}: ${data.filename || 'unknown'}`,
        file: data.url,
      });
    } catch (error) {
      console.error('Failed to save user upload record:', error);
    }
  }

  /**
   * Save organization upload record
   */
  private async saveOrgUploadRecord(data: {
    publicId: string;
    url: string;
    uploadType: string;
    organizationId: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  }): Promise<void> {
    try {
      await this.db.insert(schema.organizationsUploadedFiles).values({
        organizationId: data.organizationId,
        fileTitle: `${data.uploadType}: ${data.filename || 'unknown'}`,
        file: data.url,
      });
    } catch (error) {
      console.error('Failed to save org upload record:', error);
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Map Cloudinary response to our DTO
   */
  private mapToResponse(result: CloudinaryUploadResult): UploadResponseDto {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
      createdAt: new Date(result.created_at),
      folder: result.folder,
      originalFilename: result.original_filename,
      thumbnailUrl: this.generateThumbnailUrl(result.public_id),
    };
  }

  /**
   * Get files by package ID
   */
  async getFilesByPackage(packageId: string, organizationId: string): Promise<any[]> {
    return this.db
      .select()
      .from(schema.organizationsUploadedFiles)
      .where(eq(schema.organizationsUploadedFiles.organizationId, organizationId));
  }

  /**
   * Get files by user ID
   */
  async getFilesByUser(userId: string): Promise<any[]> {
    return this.db
      .select()
      .from(schema.usersUploadedFiles)
      .where(eq(schema.usersUploadedFiles.userId, userId));
  }
}

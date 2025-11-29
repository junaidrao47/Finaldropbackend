import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreatePodDto,
  UpdatePodDto,
  PodFilterDto,
} from './dto/pod.dto';

// POD delivery types
export const DeliveryType = {
  DIRECT: 'direct',
  LEFT_AT_DOOR: 'left_at_door',
  NEIGHBOR: 'neighbor',
  MAILROOM: 'mailroom',
  LOCKER: 'locker',
  OFFICE: 'office',
  REFUSED: 'refused',
  RETURNED: 'returned',
} as const;

@Injectable()
export class PodService {
  private readonly logger = new Logger(PodService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Create a new POD record
   */
  async create(dto: CreatePodDto, createdBy?: string): Promise<any> {
    this.logger.log(`Creating POD for package ${dto.packageId}`);

    // Store signature if provided
    let signatureFileId: string | null = null;
    if (dto.signature) {
      const signatureFile = await this.storeFile(
        dto.packageId,
        dto.organizationId,
        'Signature Image',
        dto.signature.signatureBase64,
        `signature_${dto.packageId}`,
        createdBy,
      );
      signatureFileId = signatureFile?.id || null;
    }

    // Store photos if provided
    const photoFileIds: string[] = [];
    if (dto.photos && dto.photos.length > 0) {
      for (const photo of dto.photos) {
        const photoFile = await this.storeFile(
          dto.packageId,
          dto.organizationId,
          'Package Image',
          photo.photoBase64,
          `photo_${dto.packageId}_${Date.now()}`,
          createdBy,
        );
        if (photoFile) {
          photoFileIds.push(photoFile.id);
        }
      }
    }

    // Create POD remark with all details
    const podData = {
      packageId: dto.packageId,
      organizationId: dto.organizationId,
      deliveryType: dto.deliveryType || DeliveryType.DIRECT,
      recipientName: dto.recipientName,
      deliveredTo: dto.deliveredTo,
      isContactless: dto.isContactless || false,
      hasSignature: !!signatureFileId,
      hasPhotos: photoFileIds.length > 0,
      signatureFileId,
      photoFileIds,
      location: dto.location,
      notes: dto.notes,
      deliveredAt: dto.deliveredAt || new Date().toISOString(),
    };

    // Add POD remark to package
    const [remark] = await this.db
      .insert(schema.packagesRemarks)
      .values({
        packageId: dto.packageId,
        organizationId: dto.organizationId,
        message: `POD captured - ${dto.deliveryType || 'direct delivery'}`,
        status: 'Delivered',
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    // Update package status to delivered
    await this.db
      .update(schema.packages)
      .set({
        status: 'Delivered',
        updatedBy: createdBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    return {
      id: remark.id,
      ...podData,
      createdAt: remark.createdAt,
    };
  }

  /**
   * Store file (signature or photo) as package uploaded file
   */
  private async storeFile(
    packageId: string,
    organizationId: string,
    uploadType: string,
    base64Data: string,
    fileTitle: string,
    createdBy?: string,
  ) {
    try {
      const [file] = await this.db
        .insert(schema.packagesUploadedFiles)
        .values({
          packageId,
          organizationId,
          uploadType,
          fileTitle,
          file: base64Data, // In production, upload to S3/GCS and store URL
          createdBy,
          updatedBy: createdBy,
        })
        .returning();

      return file;
    } catch (error: any) {
      this.logger.error(`Failed to store file: ${error.message}`);
      return null;
    }
  }

  /**
   * Get POD by package ID
   */
  async getByPackageId(packageId: string): Promise<any> {
    // Get package files (signatures and photos)
    const files = await this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(
        and(
          eq(schema.packagesUploadedFiles.packageId, packageId),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesUploadedFiles.createdAt));

    // Get package remarks for delivery info
    const remarks = await this.db
      .select()
      .from(schema.packagesRemarks)
      .where(
        and(
          eq(schema.packagesRemarks.packageId, packageId),
          eq(schema.packagesRemarks.status, 'Delivered'),
          eq(schema.packagesRemarks.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesRemarks.createdAt))
      .limit(1);

    const signatures = files.filter(f => f.uploadType === 'Signature Image');
    const photos = files.filter(f => f.uploadType === 'Package Image');

    return {
      packageId,
      hasSignature: signatures.length > 0,
      hasPhotos: photos.length > 0,
      signatures,
      photos,
      deliveryInfo: remarks[0] || null,
    };
  }

  /**
   * Get POD files for a package
   */
  async getFiles(packageId: string, fileType?: string): Promise<any[]> {
    const conditions = [
      eq(schema.packagesUploadedFiles.packageId, packageId),
      eq(schema.packagesUploadedFiles.isDeleted, false),
    ];

    if (fileType) {
      conditions.push(eq(schema.packagesUploadedFiles.uploadType, fileType));
    }

    return this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(and(...conditions))
      .orderBy(desc(schema.packagesUploadedFiles.createdAt));
  }

  /**
   * List PODs with filters
   */
  async findAll(filter: PodFilterDto): Promise<any> {
    const conditions = [
      eq(schema.packagesRemarks.status, 'Delivered'),
      eq(schema.packagesRemarks.isDeleted, false),
    ];

    if (filter.organizationId) {
      conditions.push(eq(schema.packagesRemarks.organizationId, filter.organizationId));
    }

    if (filter.packageId) {
      conditions.push(eq(schema.packagesRemarks.packageId, filter.packageId));
    }

    if (filter.dateFrom) {
      conditions.push(gte(schema.packagesRemarks.createdAt, new Date(filter.dateFrom)));
    }

    if (filter.dateTo) {
      conditions.push(lte(schema.packagesRemarks.createdAt, new Date(filter.dateTo)));
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packagesRemarks)
      .where(and(...conditions));

    const results = await this.db
      .select()
      .from(schema.packagesRemarks)
      .where(and(...conditions))
      .orderBy(desc(schema.packagesRemarks.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: totalResult?.count || 0,
        totalPages: Math.ceil((totalResult?.count || 0) / limit),
      },
    };
  }

  /**
   * Add additional photo to existing POD
   */
  async addPhoto(
    packageId: string,
    organizationId: string,
    photoBase64: string,
    description?: string,
    createdBy?: string,
  ) {
    return this.storeFile(
      packageId,
      organizationId,
      'Package Image',
      photoBase64,
      description || `Additional photo - ${new Date().toISOString()}`,
      createdBy,
    );
  }

  /**
   * Get delivery stats for organization
   */
  async getStats(organizationId: string, dateFrom?: string, dateTo?: string) {
    const baseConditions = [
      eq(schema.packages.organizationId, organizationId),
      eq(schema.packages.isDeleted, false),
    ];

    // Total delivered
    const [totalDelivered] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          ...baseConditions,
          eq(schema.packages.status, 'Delivered'),
        ),
      );

    // Signature required and captured
    const [withSignature] = await this.db
      .select({ count: count() })
      .from(schema.packagesUploadedFiles)
      .innerJoin(
        schema.packages,
        eq(schema.packagesUploadedFiles.packageId, schema.packages.id),
      )
      .where(
        and(
          eq(schema.packages.organizationId, organizationId),
          eq(schema.packagesUploadedFiles.uploadType, 'Signature Image'),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      );

    // With photos
    const [withPhotos] = await this.db
      .select({ count: count() })
      .from(schema.packagesUploadedFiles)
      .innerJoin(
        schema.packages,
        eq(schema.packagesUploadedFiles.packageId, schema.packages.id),
      )
      .where(
        and(
          eq(schema.packages.organizationId, organizationId),
          eq(schema.packagesUploadedFiles.uploadType, 'Package Image'),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      );

    return {
      totalDelivered: totalDelivered?.count || 0,
      withSignature: withSignature?.count || 0,
      withPhotos: withPhotos?.count || 0,
    };
  }

  /**
   * Verify POD (admin action)
   */
  async verify(remarkId: string, verifiedBy: string) {
    const [updated] = await this.db
      .update(schema.packagesRemarks)
      .set({
        isLocked: true, // Lock remark to prevent further changes
        updatedBy: verifiedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packagesRemarks.id, remarkId))
      .returning();

    return updated;
  }

  /**
   * Delete POD file
   */
  async deleteFile(fileId: string, deletedBy?: string) {
    await this.db
      .update(schema.packagesUploadedFiles)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packagesUploadedFiles.id, fileId));
  }
}

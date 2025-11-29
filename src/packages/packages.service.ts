import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, or, ilike, desc, asc, isNull, sql, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import type { PackageFilterDto, CreatePackageDto, CreatePackageRemarkDto, CreatePackageFileDto, CreatePackageTransferDto } from './dto/package.dto';

// Package status constants
export const PackageStatus = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
  AVAILABLE: 'Available',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
} as const;

// Upload type constants
export const UploadType = {
  SHIPPING_LABEL: 'Shipping Label',
  PACKAGE_IMAGE: 'Package Image',
  SIGNATURE_IMAGE: 'Signature Image',
  POD: 'Proof of Delivery',
  OTHER: 'Other',
} as const;

@Injectable()
export class PackagesService {
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==================== Package CRUD ====================

  /**
   * Create a new package
   */
  async create(dto: CreatePackageDto, createdBy?: string) {
    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        organizationId: dto.organizationId!,
        warehouseId: dto.warehouseId,
        senderName: dto.senderName,
        recipientName: dto.recipientName,
        trackingNumber: dto.trackingNumber,
        phoneNumber: dto.recipientPhone,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        signatureRequiredOnDeliver: dto.requiresSignature ?? false,
        status: dto.transactionStatus || PackageStatus.PENDING,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return newPackage;
  }

  /**
   * Find package by ID
   */
  async findById(id: string) {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(and(eq(schema.packages.id, id), eq(schema.packages.isDeleted, false)));

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return pkg;
  }

  /**
   * Find package by tracking number
   */
  async findByTrackingNumber(trackingNumber: string, organizationId: string) {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(
        and(
          eq(schema.packages.trackingNumber, trackingNumber),
          eq(schema.packages.organizationId, organizationId),
          eq(schema.packages.isDeleted, false),
        ),
      );

    return pkg;
  }

  /**
   * List schema.packages with filters
   */
  async findAll(filter: PackageFilterDto) {
    const conditions = [eq(schema.packages.isDeleted, false)];

    if (filter.organizationId) {
      conditions.push(eq(schema.packages.organizationId, filter.organizationId));
    }

    if (filter.warehouseId) {
      conditions.push(eq(schema.packages.warehouseId, filter.warehouseId));
    }

    if (filter.transactionStatus) {
      conditions.push(eq(schema.packages.status, filter.transactionStatus));
    }

    if (filter.search) {
      conditions.push(
        or(
          ilike(schema.packages.trackingNumber, `%${filter.search}%`),
          ilike(schema.packages.senderName, `%${filter.search}%`),
          ilike(schema.packages.recipientName, `%${filter.search}%`),
        )!,
      );
    }

    if (filter.dateFrom) {
      conditions.push(sql`${schema.packages.createdAt} >= ${filter.dateFrom}::timestamp`);
    }

    if (filter.dateTo) {
      conditions.push(sql`${schema.packages.createdAt} <= ${filter.dateTo}::timestamp`);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    // Determine sort order
    const orderBy = filter.sortOrder === 'asc' ? asc : desc;
    const sortColumn = filter.sortBy === 'trackingNumber' ? schema.packages.trackingNumber
      : filter.sortBy === 'status' ? schema.packages.status
      : filter.sortBy === 'recipientName' ? schema.packages.recipientName
      : schema.packages.createdAt;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(...conditions));

    const results = await this.db
      .select()
      .from(schema.packages)
      .where(and(...conditions))
      .orderBy(orderBy(sortColumn))
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
   * Update package
   */
  async update(id: string, dto: Partial<CreatePackageDto>, updatedBy?: string) {
    // Verify package exists
    await this.findById(id);

    const [updated] = await this.db
      .update(schema.packages)
      .set({
        ...dto,
        signatureRequiredOnDeliver: dto.requiresSignature,
        phoneNumber: dto.recipientPhone,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, id))
      .returning();

    return updated;
  }

  /**
   * Update package status
   */
  async updateStatus(id: string, status: string, updatedBy?: string) {
    const [updated] = await this.db
      .update(schema.packages)
      .set({
        status,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete package
   */
  async remove(id: string, deletedBy?: string) {
    await this.findById(id);

    await this.db
      .update(schema.packages)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, id));
  }

  /**
   * Restore soft-deleted package
   */
  async restore(id: string, restoredBy?: string) {
    const [restored] = await this.db
      .update(schema.packages)
      .set({
        isDeleted: false,
        updatedBy: restoredBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, id))
      .returning();

    return restored;
  }

  /**
   * Get schema.packages stats for dashboard
   */
  async getStats(organizationId: string, warehouseId?: string) {
    const baseConditions = [
      eq(schema.packages.organizationId, organizationId),
      eq(schema.packages.isDeleted, false),
    ];

    if (warehouseId) {
      baseConditions.push(eq(schema.packages.warehouseId, warehouseId));
    }

    // Get counts by status
    const statusCounts = await this.db
      .select({
        status: schema.packages.status,
        count: count(),
      })
      .from(schema.packages)
      .where(and(...baseConditions))
      .groupBy(schema.packages.status);

    // Total schema.packages
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(...baseConditions));

    // Today's schema.packages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          ...baseConditions,
          sql`${schema.packages.createdAt} >= ${today.toISOString()}::timestamp`,
        ),
      );

    // Pending schema.packages
    const [pendingResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          ...baseConditions,
          eq(schema.packages.status, PackageStatus.PENDING),
        ),
      );

    // Delivered schema.packages (this week)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [deliveredResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          ...baseConditions,
          eq(schema.packages.status, PackageStatus.DELIVERED),
          sql`${schema.packages.updatedAt} >= ${weekAgo.toISOString()}::timestamp`,
        ),
      );

    return {
      total: totalResult?.count || 0,
      today: todayResult?.count || 0,
      pending: pendingResult?.count || 0,
      deliveredThisWeek: deliveredResult?.count || 0,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status || 'unknown'] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Bulk update status
   */
  async bulkUpdateStatus(packageIds: string[], status: string, updatedBy?: string) {
    await this.db
      .update(schema.packages)
      .set({
        status,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(sql`${schema.packages.id} = ANY(${packageIds}::uuid[])`);

    return { updated: packageIds.length };
  }

  /**
   * Bulk delete schema.packages
   */
  async bulkDelete(packageIds: string[], deletedBy?: string) {
    await this.db
      .update(schema.packages)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(sql`${schema.packages.id} = ANY(${packageIds}::uuid[])`);

    return { deleted: packageIds.length };
  }

  // ==================== Package Remarks ====================

  /**
   * Create a remark for a package
   */
  async createRemark(dto: CreatePackageRemarkDto, organizationId: string, createdBy?: string) {
    // Verify package exists
    await this.findById(dto.packageId);

    const [remark] = await this.db
      .insert(schema.packagesRemarks)
      .values({
        packageId: dto.packageId,
        organizationId,
        message: dto.message,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return remark;
  }

  /**
   * Get remarks for a package
   */
  async getRemarks(packageId: string) {
    return this.db
      .select()
      .from(schema.packagesRemarks)
      .where(
        and(
          eq(schema.packagesRemarks.packageId, packageId),
          eq(schema.packagesRemarks.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesRemarks.createdAt));
  }

  /**
   * Delete remark
   */
  async deleteRemark(remarkId: string, deletedBy?: string) {
    await this.db
      .update(schema.packagesRemarks)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packagesRemarks.id, remarkId));
  }

  // ==================== Package Files ====================

  /**
   * Upload file for package
   */
  async createFile(dto: CreatePackageFileDto, organizationId: string, createdBy?: string) {
    // Verify package exists
    await this.findById(dto.packageId);

    const [file] = await this.db
      .insert(schema.packagesUploadedFiles)
      .values({
        packageId: dto.packageId,
        organizationId,
        uploadType: dto.fileType,
        fileTitle: dto.fileTitle,
        file: dto.file,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return file;
  }

  /**
   * Get files for a package
   */
  async getFiles(packageId: string) {
    return this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(
        and(
          eq(schema.packagesUploadedFiles.packageId, packageId),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesUploadedFiles.createdAt));
  }

  /**
   * Get files by type
   */
  async getFilesByType(packageId: string, uploadType: string) {
    return this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(
        and(
          eq(schema.packagesUploadedFiles.packageId, packageId),
          eq(schema.packagesUploadedFiles.uploadType, uploadType),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesUploadedFiles.createdAt));
  }

  /**
   * Delete file
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

  // ==================== Package Transfers ====================

  /**
   * Create transfer record
   */
  async createTransfer(dto: CreatePackageTransferDto, createdBy?: string) {
    // Verify package exists
    await this.findById(dto.packageId);

    const [transfer] = await this.db
      .insert(schema.packagesTransfers)
      .values({
        packageId: dto.packageId,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        memo: dto.notes,
        createdBy,
      })
      .returning();

    // Update package warehouse if toWarehouseId provided
    if (dto.toWarehouseId) {
      await this.db
        .update(schema.packages)
        .set({
          warehouseId: dto.toWarehouseId,
          status: PackageStatus.IN_TRANSIT,
          updatedBy: createdBy,
          updatedAt: new Date(),
        })
        .where(eq(schema.packages.id, dto.packageId));
    }

    return transfer;
  }

  /**
   * Get transfer history for a package
   */
  async getTransferHistory(packageId: string) {
    return this.db
      .select()
      .from(schema.packagesTransfers)
      .where(eq(schema.packagesTransfers.packageId, packageId))
      .orderBy(desc(schema.packagesTransfers.createdAt));
  }

  // ==================== Remark Types ====================

  /**
   * Get all remark types
   */
  async getRemarkTypes() {
    return this.db.select().from(schema.packagesRemarksTypes);
  }

  /**
   * Create remark type
   */
  async createRemarkType(data: {
    remarkType?: string;
    icon?: string;
    name?: string;
    message?: string;
    memo?: string;
  }, createdBy?: string) {
    const [remarkType] = await this.db
      .insert(schema.packagesRemarksTypes)
      .values({
        ...data,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return remarkType;
  }

  // ==================== Search & Scan ====================

  /**
   * Search schema.packages across multiple fields
   */
  async search(query: string, organizationId: string, limit = 20) {
    return this.db
      .select()
      .from(schema.packages)
      .where(
        and(
          eq(schema.packages.organizationId, organizationId),
          eq(schema.packages.isDeleted, false),
          or(
            ilike(schema.packages.trackingNumber, `%${query}%`),
            ilike(schema.packages.senderName, `%${query}%`),
            ilike(schema.packages.recipientName, `%${query}%`),
            ilike(schema.packages.phoneNumber, `%${query}%`),
            ilike(schema.packages.email, `%${query}%`),
          ),
        ),
      )
      .orderBy(desc(schema.packages.createdAt))
      .limit(limit);
  }

  /**
   * Scan package by tracking number (receive flow)
   */
  async scanForReceive(trackingNumber: string, organizationId: string, warehouseId?: string) {
    // Check if package already exists
    let pkg = await this.findByTrackingNumber(trackingNumber, organizationId);

    if (pkg) {
      // Package exists - return it with existing status
      return {
        exists: true,
        package: pkg,
        message: `Package already in system with status: ${pkg.status}`,
      };
    }

    // Package doesn't exist - return null (frontend will prompt for new package creation)
    return {
      exists: false,
      package: null,
      trackingNumber,
      warehouseId,
      message: 'Package not found. Ready for new package entry.',
    };
  }

  /**
   * Scan package by tracking number (deliver flow)
   */
  async scanForDeliver(trackingNumber: string, organizationId: string) {
    const pkg = await this.findByTrackingNumber(trackingNumber, organizationId);

    if (!pkg) {
      throw new NotFoundException(`Package with tracking number ${trackingNumber} not found`);
    }

    if (pkg.status === PackageStatus.DELIVERED) {
      return {
        canDeliver: false,
        package: pkg,
        message: 'Package already delivered',
      };
    }

    return {
      canDeliver: true,
      package: pkg,
      message: 'Package ready for delivery',
    };
  }

  /**
   * Get recent schema.packages
   */
  async getRecent(organizationId: string, limit = 10) {
    return this.db
      .select()
      .from(schema.packages)
      .where(
        and(
          eq(schema.packages.organizationId, organizationId),
          eq(schema.packages.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packages.createdAt))
      .limit(limit);
  }

  /**
   * Update package storage location
   */
  async updateStorageLocation(
    id: string,
    location: { zone?: string; isle?: string; shelf?: string; bin?: string },
    updatedBy?: string,
  ) {
    const [updated] = await this.db
      .update(schema.packages)
      .set({
        zone: location.zone,
        isle: location.isle,
        shelf: location.shelf,
        bin: location.bin,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, id))
      .returning();

    return updated;
  }
}

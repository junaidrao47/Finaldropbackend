import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, sql, and, desc, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  ReceivePackageDto,
  AssignStorageDto,
  AddPackagePhotoDto,
  CompleteReceiptDto,
  PrepareDeliveryDto,
  StartDeliveryDto,
  CompleteDeliveryDto,
  DeliveryFailedDto,
  InitiateReturnDto,
  ProcessReturnDto,
  UpdateTransactionStatusDto,
  BulkStatusUpdateDto,
  PackageDetailsResponse,
  PackageTimelineEntry,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ================== RECEIVE FLOW (AGNT-001, AGNT-002) ==================

  /**
   * Step 1: Receive a new package - scan or manual entry
   */
  async receivePackage(dto: ReceivePackageDto, userId: string): Promise<{ id: string; trackingNumber: string }> {
    // Check if tracking number already exists
    if (dto.trackingNumber) {
      const existing = await this.db
        .select()
        .from(schema.packages)
        .where(eq(schema.packages.trackingNumber, dto.trackingNumber))
        .limit(1);

      if (existing.length > 0) {
        throw new BadRequestException(`Package with tracking number ${dto.trackingNumber} already exists`);
      }
    }

    // Create the package record
    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        organizationId: dto.organizationId!,
        warehouseId: dto.warehouseId,
        trackingNumber: dto.trackingNumber,
        senderName: dto.senderName,
        recipientName: dto.recipientName,
        phoneNumber: dto.recipientPhone,
        memo: dto.specialInstructions,
        signatureRequiredOnDeliver: dto.requiresSignature || false,
        status: 'Received',
        createdBy: userId,
      })
      .returning({ id: schema.packages.id, trackingNumber: schema.packages.trackingNumber });

    // Log the receipt
    await this.logPackageActivity(newPackage.id, 'RECEIVE', 'Package received', userId, {
      trackingNumber: dto.trackingNumber,
      senderName: dto.senderName,
    });

    return {
      id: newPackage.id,
      trackingNumber: newPackage.trackingNumber || '',
    };
  }

  /**
   * Step 2: Assign storage location
   */
  async assignStorage(dto: AssignStorageDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Parse storage location into zone/isle/shelf/bin
    const locationParts = dto.storageLocation.split('-');
    
    await this.db
      .update(schema.packages)
      .set({
        warehouseId: dto.warehouseId,
        zone: locationParts[0] || dto.storageLocation,
        isle: locationParts[1],
        shelf: locationParts[2],
        bin: locationParts[3],
        status: 'In Storage',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    await this.logPackageActivity(dto.packageId, 'STORAGE_ASSIGNED', `Assigned to location: ${dto.storageLocation}`, userId, {
      warehouseId: dto.warehouseId,
      storageLocation: dto.storageLocation,
    });
  }

  /**
   * Step 3: Add package photo
   */
  async addPackagePhoto(dto: AddPackagePhotoDto, userId: string): Promise<{ fileId: string }> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const [file] = await this.db
      .insert(schema.packagesUploadedFiles)
      .values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: dto.photoType || 'Package Image',
        fileTitle: `Package photo - ${dto.photoType || 'general'}`,
        file: dto.photoData,
        createdBy: userId,
      })
      .returning({ id: schema.packagesUploadedFiles.id });

    await this.logPackageActivity(dto.packageId, 'PHOTO_ADDED', `Photo added: ${dto.photoType || 'general'}`, userId);

    return { fileId: file.id };
  }

  /**
   * Step 4: Complete receipt
   */
  async completeReceipt(dto: CompleteReceiptDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // If agent signature provided, save it
    if (dto.agentSignature) {
      await this.db.insert(schema.packagesUploadedFiles).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: 'Signature Image',
        fileTitle: 'Agent signature on receipt',
        file: dto.agentSignature,
        createdBy: userId,
      });
    }

    // Update package status to Available
    await this.db
      .update(schema.packages)
      .set({
        status: 'Available',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    // Add remark if notes provided
    if (dto.notes) {
      await this.db.insert(schema.packagesRemarks).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        message: dto.notes,
        status: 'Available',
        createdBy: userId,
      });
    }

    await this.logPackageActivity(dto.packageId, 'RECEIPT_COMPLETED', 'Package receipt completed', userId, {
      hasSignature: !!dto.agentSignature,
      notifyRecipient: dto.notifyRecipient,
    });

    // TODO: If notifyRecipient is true, queue notification
  }

  // ================== DELIVER FLOW (AGNT-003, AGNT-004) ==================

  /**
   * Prepare package for delivery
   */
  async prepareDelivery(dto: PrepareDeliveryDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    await this.db
      .update(schema.packages)
      .set({
        recipientName: dto.recipientName || pkg.recipientName,
        phoneNumber: dto.recipientPhone || pkg.phoneNumber,
        toAddress: dto.deliveryAddress || pkg.toAddress,
        expectedDeliveryDate: dto.scheduledDeliveryDate ? new Date(dto.scheduledDeliveryDate).toISOString().split('T')[0] : pkg.expectedDeliveryDate,
        memo: dto.deliveryInstructions || pkg.memo,
        status: 'Ready for Delivery',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    await this.logPackageActivity(dto.packageId, 'PREPARED_FOR_DELIVERY', 'Package prepared for delivery', userId, {
      scheduledDate: dto.scheduledDeliveryDate,
      deliveryAddress: dto.deliveryAddress,
    });
  }

  /**
   * Start delivery - mark packages as out for delivery
   */
  async startDelivery(dto: StartDeliveryDto, userId: string): Promise<{ batchId: string }> {
    const batchId = `BATCH-${Date.now()}`;

    for (const packageId of dto.packageIds) {
      await this.db
        .update(schema.packages)
        .set({
          status: 'Out for Delivery',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.packages.id, packageId));

      await this.logPackageActivity(packageId, 'OUT_FOR_DELIVERY', `Started delivery - Batch: ${batchId}`, userId, {
        batchId,
        driverName: dto.driverName,
        vehicleInfo: dto.vehicleInfo,
      });
    }

    return { batchId };
  }

  /**
   * Complete delivery with POD
   */
  async completeDelivery(dto: CompleteDeliveryDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Save signature if provided
    if (dto.recipientSignature) {
      await this.db.insert(schema.packagesUploadedFiles).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: 'Signature Image',
        fileTitle: `Delivery signature - ${dto.receivedByName || 'Unknown'}`,
        file: dto.recipientSignature,
        createdBy: userId,
      });
    }

    // Save POD photo if provided
    if (dto.proofOfDeliveryPhoto) {
      await this.db.insert(schema.packagesUploadedFiles).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: 'Package Image',
        fileTitle: `Proof of delivery - ${dto.deliveryLocation || 'Unknown location'}`,
        file: dto.proofOfDeliveryPhoto,
        createdBy: userId,
      });
    }

    // Update package status
    await this.db
      .update(schema.packages)
      .set({
        status: 'Delivered',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    // Add delivery remark
    await this.db.insert(schema.packagesRemarks).values({
      packageId: dto.packageId,
      organizationId: pkg.organizationId,
      message: `Delivered to ${dto.receivedByName || 'recipient'} at ${dto.deliveryLocation || 'address'}. ${dto.notes || ''}`,
      status: 'Delivered',
      createdBy: userId,
    });

    await this.logPackageActivity(dto.packageId, 'DELIVERED', 'Package delivered successfully', userId, {
      receivedBy: dto.receivedByName,
      deliveryLocation: dto.deliveryLocation,
      hasSignature: !!dto.recipientSignature,
      hasPODPhoto: !!dto.proofOfDeliveryPhoto,
    });
  }

  /**
   * Mark delivery as failed
   */
  async deliveryFailed(dto: DeliveryFailedDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Save failure photo if provided
    if (dto.photo) {
      await this.db.insert(schema.packagesUploadedFiles).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: 'Package Image',
        fileTitle: `Delivery failed - ${dto.failureReason}`,
        file: dto.photo,
        createdBy: userId,
      });
    }

    // Update status
    const newStatus = dto.reschedule ? 'Ready for Delivery' : 'Delivery Failed';
    
    await this.db
      .update(schema.packages)
      .set({
        status: newStatus,
        expectedDeliveryDate: dto.rescheduledDate 
          ? new Date(dto.rescheduledDate).toISOString().split('T')[0] 
          : pkg.expectedDeliveryDate,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    await this.db.insert(schema.packagesRemarks).values({
      packageId: dto.packageId,
      organizationId: pkg.organizationId,
      message: `Delivery failed: ${dto.failureReason}. ${dto.notes || ''}${dto.reschedule ? ` Rescheduled to ${dto.rescheduledDate}` : ''}`,
      status: newStatus,
      createdBy: userId,
    });

    await this.logPackageActivity(dto.packageId, 'DELIVERY_FAILED', `Delivery failed: ${dto.failureReason}`, userId, {
      reason: dto.failureReason,
      reschedule: dto.reschedule,
      rescheduledDate: dto.rescheduledDate,
    });
  }

  // ================== RETURN FLOW (AGNT-005) ==================

  /**
   * Initiate a return
   */
  async initiateReturn(dto: InitiateReturnDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    await this.db
      .update(schema.packages)
      .set({
        status: 'Return Requested',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    await this.db.insert(schema.packagesRemarks).values({
      packageId: dto.packageId,
      organizationId: pkg.organizationId,
      message: `Return initiated: ${dto.returnReason}. ${dto.notes || ''}`,
      status: 'Return Requested',
      createdBy: userId,
    });

    await this.logPackageActivity(dto.packageId, 'RETURN_INITIATED', `Return initiated: ${dto.returnReason}`, userId, {
      returnReason: dto.returnReason,
      returnAddress: dto.returnAddress,
      returnTrackingNumber: dto.returnTrackingNumber,
    });
  }

  /**
   * Process a return
   */
  async processReturn(dto: ProcessReturnDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Save condition photo if provided
    if (dto.photo) {
      await this.db.insert(schema.packagesUploadedFiles).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        uploadType: 'Package Image',
        fileTitle: `Return condition - ${dto.condition || 'Unknown'}`,
        file: dto.photo,
        createdBy: userId,
      });
    }

    await this.db
      .update(schema.packages)
      .set({
        status: 'Return Processed',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    await this.db.insert(schema.packagesRemarks).values({
      packageId: dto.packageId,
      organizationId: pkg.organizationId,
      message: `Return processed. Condition: ${dto.condition || 'Not specified'}. ${dto.conditionNotes || ''}${dto.refundApproved ? ' Refund approved.' : ''}`,
      status: 'Return Processed',
      createdBy: userId,
    });

    await this.logPackageActivity(dto.packageId, 'RETURN_PROCESSED', 'Return processed', userId, {
      condition: dto.condition,
      refundApproved: dto.refundApproved,
    });
  }

  // ================== COMMON OPERATIONS ==================

  /**
   * Update package status
   */
  async updateStatus(dto: UpdateTransactionStatusDto, userId: string): Promise<void> {
    const pkg = await this.getPackageById(dto.packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const oldStatus = pkg.status;

    await this.db
      .update(schema.packages)
      .set({
        status: dto.newStatus,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    if (dto.notes) {
      await this.db.insert(schema.packagesRemarks).values({
        packageId: dto.packageId,
        organizationId: pkg.organizationId,
        message: dto.notes,
        status: dto.newStatus,
        createdBy: userId,
      });
    }

    await this.logPackageActivity(dto.packageId, 'STATUS_UPDATE', `Status changed from ${oldStatus} to ${dto.newStatus}`, userId, {
      oldStatus,
      newStatus: dto.newStatus,
    });
  }

  /**
   * Bulk status update
   */
  async bulkStatusUpdate(dto: BulkStatusUpdateDto, userId: string): Promise<{ updated: number }> {
    let updated = 0;

    for (const packageId of dto.packageIds) {
      try {
        await this.updateStatus({
          packageId,
          newStatus: dto.newStatus,
          notes: dto.notes,
        }, userId);
        updated++;
      } catch {
        // Continue with other packages
      }
    }

    return { updated };
  }

  /**
   * Get package details with timeline
   */
  async getPackageDetails(packageId: string): Promise<PackageDetailsResponse> {
    const pkg = await this.getPackageById(packageId);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Get warehouse info
    let warehouse = null;
    if (pkg.warehouseId) {
      const [wh] = await this.db
        .select()
        .from(schema.organizationsWarehousesLocations)
        .where(eq(schema.organizationsWarehousesLocations.id, pkg.warehouseId));
      if (wh) {
        warehouse = { id: wh.id, name: wh.name || '', location: `${pkg.zone || ''}-${pkg.isle || ''}-${pkg.shelf || ''}-${pkg.bin || ''}` };
      }
    }

    // Get organization info
    const [org] = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, pkg.organizationId));

    // Get timeline from audit logs
    const timeline = await this.db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        memo: schema.auditLogs.memo,
        userId: schema.auditLogs.userId,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
        timestamp: schema.auditLogs.createdAt,
        newValues: schema.auditLogs.newValues,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(eq(schema.auditLogs.entityId, packageId))
      .orderBy(desc(schema.auditLogs.createdAt));

    // Get photos
    const photos = await this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(eq(schema.packagesUploadedFiles.packageId, packageId))
      .orderBy(desc(schema.packagesUploadedFiles.createdAt));

    // Get remarks
    const remarks = await this.db
      .select({
        id: schema.packagesRemarks.id,
        message: schema.packagesRemarks.message,
        createdBy: schema.packagesRemarks.createdBy,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
        createdAt: schema.packagesRemarks.createdAt,
      })
      .from(schema.packagesRemarks)
      .leftJoin(schema.users, eq(schema.packagesRemarks.createdBy, schema.users.id))
      .where(eq(schema.packagesRemarks.packageId, packageId))
      .orderBy(desc(schema.packagesRemarks.createdAt));

    return {
      package: {
        id: pkg.id,
        trackingNumber: pkg.trackingNumber || '',
        transactionType: 'receive', // Determine from context
        transactionStatus: pkg.status || '',
        carrier: null, // Would need carrierId on packages
        organization: org ? { id: org.id, name: org.businessName || `${org.firstName} ${org.lastName}` } : null,
        warehouse,
        senderName: pkg.senderName || '',
        recipientName: pkg.recipientName || '',
        weight: 0, // Add to schema if needed
        dimensions: '', // Add to schema if needed
        declaredValue: 0, // Add to schema if needed
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
      },
      timeline: timeline.map((t) => ({
        id: t.id,
        action: t.action,
        status: (t.newValues as any)?.status || '',
        description: t.memo || t.action,
        location: (t.newValues as any)?.storageLocation,
        performedBy: `${t.userFirstName || ''} ${t.userLastName || ''}`.trim() || 'System',
        timestamp: t.timestamp,
        metadata: t.newValues as Record<string, any>,
      })),
      photos: photos.map((p) => ({
        id: p.id,
        url: p.file || '',
        type: p.uploadType || 'Unknown',
        uploadedAt: p.createdAt,
      })),
      remarks: remarks.map((r) => ({
        id: r.id,
        message: r.message || '',
        createdBy: `${r.userFirstName || ''} ${r.userLastName || ''}`.trim() || 'System',
        createdAt: r.createdAt,
      })),
    };
  }

  // ================== HELPER METHODS ==================

  private async getPackageById(id: string) {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, id));
    return pkg;
  }

  private async logPackageActivity(
    packageId: string,
    action: string,
    memo: string,
    userId: string,
    newValues?: Record<string, any>,
  ): Promise<void> {
    const pkg = await this.getPackageById(packageId);
    
    await this.db.insert(schema.auditLogs).values({
      organizationId: pkg?.organizationId,
      userId,
      action,
      entityId: packageId,
      entityName: 'packages',
      memo,
      newValues: newValues || {},
      createdBy: userId,
    });
  }
}

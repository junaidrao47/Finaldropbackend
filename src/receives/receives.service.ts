import { Injectable, Logger, ForbiddenException, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { eq, and, gte, lte, or, like, count, desc, asc, sql, ilike } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { QueueService, QUEUE_NAMES, JOB_TYPES } from '../queue/queue.service';
import {
  ReceivesFilterDto,
  CreateReceiveDto,
  UpdateReceiveStatusDto,
  BulkUpdateStatusDto,
  MovePackageDto,
  FlagPackageDto,
  ApprovePackageDto,
  CancelPackageDto,
  UpdateReceiveDto,
  AddRemarkDto,
  SearchPackagesDto,
  ReceiveStatus,
  ReceivePeriod,
  ReceivesKanbanResponse,
  ReceivesListResponse,
  ReceiveCardItem,
  KanbanColumn,
  ReceiveDetailResponse,
  ReceiveStatsResponse,
  PackageActivityResponse,
  PackageActivityItem,
  BulkOperationResult,
} from './dto';

@Injectable()
export class ReceivesService {
  private readonly logger = new Logger(ReceivesService.name);

  // Kanban column configuration matching the design
  private readonly kanbanColumns = [
    { status: ReceiveStatus.TRANSFERRED, title: 'Transferred', color: '#3B82F6' },
    { status: ReceiveStatus.FLAGGED, title: 'Flagged', color: '#F59E0B' },
    { status: ReceiveStatus.UNASSIGNED, title: 'Unassigned', color: '#6B7280' },
    { status: ReceiveStatus.CANCELLED, title: 'Cancelled', color: '#EF4444' },
  ];

  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Get receives as Kanban board - matches design layout
   */
  async getKanbanBoard(filter: ReceivesFilterDto, userId: string): Promise<ReceivesKanbanResponse> {
    const { dateFrom, dateTo, period } = this.getDateRange(filter);

    const columns: KanbanColumn[] = [];

    for (const col of this.kanbanColumns) {
      const items = await this.getPackagesByStatus(col.status, dateFrom, dateTo, filter);
      columns.push({
        id: col.status.toLowerCase().replace(' ', '-'),
        status: col.status,
        title: col.title,
        color: col.color,
        count: items.length,
        items,
      });
    }

    const totalCount = columns.reduce((sum, col) => sum + col.count, 0);

    return {
      date: dateFrom,
      dateFormatted: this.formatDate(dateFrom),
      columns,
      totalCount,
      period,
    };
  }

  /**
   * Get receives as list with pagination
   */
  async getReceivesList(filter: ReceivesFilterDto, userId: string): Promise<ReceivesListResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const whereConditions = this.buildWhereConditions(dateFrom, dateTo, filter);

    // Get total count
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(...whereConditions));

    const total = totalResult?.count || 0;

    // Get packages
    const orderBy = filter.sortOrder === 'asc' 
      ? asc(schema.packages.createdAt) 
      : desc(schema.packages.createdAt);

    const packages = await this.db
      .select({
        id: schema.packages.id,
        senderName: schema.packages.senderName,
        recipientName: schema.packages.recipientName,
        trackingNumber: schema.packages.trackingNumber,
        invoiceNumber: schema.packages.invoiceNumber,
        status: schema.packages.status,
        memo: schema.packages.memo,
        zone: schema.packages.zone,
        isle: schema.packages.isle,
        shelf: schema.packages.shelf,
        bin: schema.packages.bin,
        createdAt: schema.packages.createdAt,
        createdById: schema.packages.createdBy,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
      })
      .from(schema.packages)
      .leftJoin(schema.users, eq(schema.packages.createdBy, schema.users.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const items = packages.map((p) => this.mapToCardItem(p));

    return {
      items,
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create new receive/package
   */
  async createReceive(dto: CreateReceiveDto, userId: string): Promise<ReceiveDetailResponse> {
    // Insert the package
    const [newPackage] = await this.db
      .insert(schema.packages)
      .values({
        organizationId: dto.organizationId,
        warehouseId: dto.warehouseId || null,
        senderName: dto.senderName,
        recipientName: dto.recipientName,
        recipientId: dto.recipientId || null,
        attentionTo: dto.attentionTo || null,
        trackingNumber: dto.trackingNumber || null,
        invoiceNumber: dto.invoiceNumber || null,
        purchaseOrderNumber: dto.purchaseOrderNumber || null,
        fromAddress: dto.fromAddress || null,
        toAddress: dto.toAddress || null,
        email: dto.email || null,
        phoneNumber: dto.phoneNumber || null,
        zone: dto.zone || null,
        isle: dto.isle || null,
        shelf: dto.shelf || null,
        bin: dto.bin || null,
        memo: dto.memo || null,
        keepPackageForHowLong: dto.keepPackageForHowLong || null,
        expectedDeliveryDate: dto.expectedDeliveryDate || null,
        signatureRequiredOnDeliver: dto.signatureRequiredOnDeliver || false,
        status: dto.status || ReceiveStatus.RECEIVED,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Queue async processing for notifications, etc.
    await this.queueService.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.PROCESS_RECEIVE,
      {
        packageId: newPackage.id,
        organizationId: dto.organizationId,
        warehouseId: dto.warehouseId,
        userId,
        trackingNumber: dto.trackingNumber,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );

    // Queue notification
    await this.queueService.addJob(
      QUEUE_NAMES.NOTIFICATIONS,
      JOB_TYPES.SEND_PACKAGE_RECEIVED,
      {
        packageId: newPackage.id,
        recipientEmail: dto.email,
        recipientPhone: dto.phoneNumber,
        trackingNumber: dto.trackingNumber,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    this.logger.log(`Created receive package: ${newPackage.id}`);

    return this.getReceiveDetail(newPackage.id);
  }

  /**
   * Get single receive detail
   */
  async getReceiveDetail(packageId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select({
        id: schema.packages.id,
        organizationId: schema.packages.organizationId,
        warehouseId: schema.packages.warehouseId,
        senderName: schema.packages.senderName,
        recipientName: schema.packages.recipientName,
        recipientId: schema.packages.recipientId,
        attentionTo: schema.packages.attentionTo,
        trackingNumber: schema.packages.trackingNumber,
        invoiceNumber: schema.packages.invoiceNumber,
        purchaseOrderNumber: schema.packages.purchaseOrderNumber,
        fromAddress: schema.packages.fromAddress,
        toAddress: schema.packages.toAddress,
        email: schema.packages.email,
        phoneNumber: schema.packages.phoneNumber,
        zone: schema.packages.zone,
        isle: schema.packages.isle,
        shelf: schema.packages.shelf,
        bin: schema.packages.bin,
        memo: schema.packages.memo,
        keepPackageForHowLong: schema.packages.keepPackageForHowLong,
        expectedDeliveryDate: schema.packages.expectedDeliveryDate,
        signatureRequiredOnDeliver: schema.packages.signatureRequiredOnDeliver,
        status: schema.packages.status,
        createdBy: schema.packages.createdBy,
        createdAt: schema.packages.createdAt,
        updatedAt: schema.packages.updatedAt,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
      })
      .from(schema.packages)
      .leftJoin(schema.users, eq(schema.packages.createdBy, schema.users.id))
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Get attached files
    const files = await this.db
      .select()
      .from(schema.packagesUploadedFiles)
      .where(
        and(
          eq(schema.packagesUploadedFiles.packageId, packageId),
          eq(schema.packagesUploadedFiles.isDeleted, false),
        ),
      );

    // Get remarks
    const remarks = await this.db
      .select({
        id: schema.packagesRemarks.id,
        message: schema.packagesRemarks.message,
        status: schema.packagesRemarks.status,
        createdAt: schema.packagesRemarks.createdAt,
        createdBy: schema.packagesRemarks.createdBy,
      })
      .from(schema.packagesRemarks)
      .where(
        and(
          eq(schema.packagesRemarks.packageId, packageId),
          eq(schema.packagesRemarks.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesRemarks.createdAt));

    const location = this.formatLocation(pkg.zone, pkg.isle, pkg.shelf, pkg.bin);
    const isFlagged = pkg.status === ReceiveStatus.FLAGGED;

    return {
      id: pkg.id,
      organizationId: pkg.organizationId,
      warehouseId: pkg.warehouseId,
      senderName: pkg.senderName || '',
      recipientName: pkg.recipientName || '',
      recipientId: pkg.recipientId,
      attentionTo: pkg.attentionTo,
      trackingNumber: pkg.trackingNumber,
      invoiceNumber: pkg.invoiceNumber,
      purchaseOrderNumber: pkg.purchaseOrderNumber,
      fromAddress: pkg.fromAddress,
      toAddress: pkg.toAddress,
      email: pkg.email,
      phoneNumber: pkg.phoneNumber,
      location: {
        zone: pkg.zone,
        isle: pkg.isle,
        shelf: pkg.shelf,
        bin: pkg.bin,
        formatted: location,
      },
      dimensions: null, // Would need to add dimensions to schema
      memo: pkg.memo,
      keepPackageForHowLong: pkg.keepPackageForHowLong,
      expectedDeliveryDate: pkg.expectedDeliveryDate ? new Date(pkg.expectedDeliveryDate) : null,
      signatureRequiredOnDeliver: pkg.signatureRequiredOnDeliver,
      status: pkg.status as ReceiveStatus,
      isFlagged,
      flagReason: isFlagged ? pkg.memo : null,
      files: files.map((f) => ({
        id: f.id,
        type: f.uploadType || 'unknown',
        title: f.fileTitle || 'Untitled',
        url: f.file || '',
      })),
      remarks: remarks.map((r) => ({
        id: r.id,
        message: r.message || '',
        status: r.status || '',
        createdAt: r.createdAt || new Date(),
        createdBy: r.createdBy || '',
      })),
      createdBy: pkg.createdBy
        ? {
            id: pkg.createdBy,
            firstName: pkg.creatorFirstName || '',
            lastName: pkg.creatorLastName || '',
            avatar: null,
          }
        : null,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }

  /**
   * Update receive status
   */
  async updateStatus(packageId: string, dto: UpdateReceiveStatusDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const previousStatus = pkg.status;

    // Update package status
    await this.db
      .update(schema.packages)
      .set({
        status: dto.status,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, packageId));

    // Add status change remark
    if (dto.memo || previousStatus !== dto.status) {
      await this.db.insert(schema.packagesRemarks).values({
        packageId,
        organizationId: pkg.organizationId,
        message: dto.memo || `Status changed from ${previousStatus} to ${dto.status}`,
        status: dto.status,
        createdBy: userId,
      });
    }

    // Queue status update job for notifications
    await this.queueService.addJob(
      QUEUE_NAMES.PACKAGE_PROCESSING,
      JOB_TYPES.BULK_STATUS_UPDATE,
      {
        packageIds: [packageId],
        status: dto.status,
        previousStatus,
        userId,
      },
      { attempts: 2 },
    );

    this.logger.log(`Updated package ${packageId} status: ${previousStatus} -> ${dto.status}`);

    return this.getReceiveDetail(packageId);
  }

  /**
   * Bulk update statuses
   */
  async bulkUpdateStatus(dto: BulkUpdateStatusDto, userId: string): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const packageId of dto.packageIds) {
      try {
        await this.updateStatus(packageId, { status: dto.status, memo: dto.memo }, userId);
        updated++;
      } catch (error) {
        failed.push(packageId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to update package ${packageId}: ${errorMessage}`);
      }
    }

    // Queue bulk notification
    if (updated > 0) {
      await this.queueService.addJob(
        QUEUE_NAMES.NOTIFICATIONS,
        JOB_TYPES.SEND_BULK_EMAIL,
        {
          packageIds: dto.packageIds.filter((id) => !failed.includes(id)),
          status: dto.status,
          userId,
        },
        { attempts: 2 },
      );
    }

    return { updated, failed };
  }

  /**
   * Move package (Kanban drag-drop)
   */
  async movePackage(dto: MovePackageDto, userId: string): Promise<ReceiveCardItem> {
    await this.updateStatus(dto.packageId, { status: dto.toStatus }, userId);
    
    const detail = await this.getReceiveDetail(dto.packageId);
    return this.mapDetailToCard(detail);
  }

  /**
   * Flag a package
   */
  async flagPackage(dto: FlagPackageDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, dto.packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Update status to flagged and add reason in memo
    await this.db
      .update(schema.packages)
      .set({
        status: ReceiveStatus.FLAGGED,
        memo: `${pkg.memo ? pkg.memo + '\n' : ''}[FLAGGED] ${dto.reason}${dto.notes ? ': ' + dto.notes : ''}`,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, dto.packageId));

    // Add flag remark
    await this.db.insert(schema.packagesRemarks).values({
      packageId: dto.packageId,
      organizationId: pkg.organizationId,
      message: `Package flagged: ${dto.reason}${dto.notes ? ' - ' + dto.notes : ''}`,
      status: ReceiveStatus.FLAGGED,
      createdBy: userId,
    });

    this.logger.log(`Flagged package ${dto.packageId}: ${dto.reason}`);

    return this.getReceiveDetail(dto.packageId);
  }

  /**
   * Get receive statistics
   */
  async getStats(filter: ReceivesFilterDto): Promise<ReceiveStatsResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const baseWhere = and(
      eq(schema.packages.isDeleted, false),
      filter.organizationId ? eq(schema.packages.organizationId, filter.organizationId) : sql`1=1`,
      filter.warehouseId ? eq(schema.packages.warehouseId, filter.warehouseId) : sql`1=1`,
    );

    // Total count
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(baseWhere);

    // Status counts
    const statusCounts = await Promise.all([
      this.countByStatus(ReceiveStatus.RECEIVED, baseWhere),
      this.countByStatus(ReceiveStatus.TRANSFERRED, baseWhere),
      this.countByStatus(ReceiveStatus.FLAGGED, baseWhere),
      this.countByStatus(ReceiveStatus.UNASSIGNED, baseWhere),
      this.countByStatus(ReceiveStatus.CANCELLED, baseWhere),
      this.countByStatus(ReceiveStatus.AVAILABLE, baseWhere),
      this.countByStatus(ReceiveStatus.PENDING, baseWhere),
    ]);

    // Today received
    const [todayResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          baseWhere,
          gte(schema.packages.createdAt, today),
          eq(schema.packages.status, ReceiveStatus.RECEIVED),
        ),
      );

    // Week received
    const [weekResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          baseWhere,
          gte(schema.packages.createdAt, weekAgo),
          eq(schema.packages.status, ReceiveStatus.RECEIVED),
        ),
      );

    return {
      total: totalResult?.count || 0,
      received: statusCounts[0],
      transferred: statusCounts[1],
      flagged: statusCounts[2],
      unassigned: statusCounts[3],
      cancelled: statusCounts[4],
      available: statusCounts[5],
      pending: statusCounts[6],
      todayReceived: todayResult?.count || 0,
      weekReceived: weekResult?.count || 0,
    };
  }

  // ==================== New Action Methods (from Design) ====================

  /**
   * Approve package - "Approve" button action from design
   * Moves package to Available status and assigns location
   */
  async approvePackage(packageId: string, dto: ApprovePackageDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Validate status transition
    const allowedStatuses = [ReceiveStatus.RECEIVED, ReceiveStatus.UNASSIGNED, ReceiveStatus.PENDING];
    if (!allowedStatuses.includes(pkg.status as ReceiveStatus)) {
      throw new BadRequestException(
        `Cannot approve package with status "${pkg.status}". Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    // Update package to Available
    await this.db
      .update(schema.packages)
      .set({
        status: ReceiveStatus.AVAILABLE,
        warehouseId: dto.assignToWarehouseId || pkg.warehouseId,
        zone: dto.zone || pkg.zone,
        isle: dto.isle || pkg.isle,
        shelf: dto.shelf || pkg.shelf,
        bin: dto.bin || pkg.bin,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, packageId));

    // Add approval remark
    await this.db.insert(schema.packagesRemarks).values({
      packageId,
      organizationId: pkg.organizationId,
      message: `Package approved${dto.notes ? ': ' + dto.notes : ''}`,
      status: ReceiveStatus.AVAILABLE,
      createdBy: userId,
    });

    // Queue notification for package available
    await this.queueService.addJob(
      QUEUE_NAMES.NOTIFICATIONS,
      JOB_TYPES.SEND_PACKAGE_AVAILABLE,
      {
        packageId,
        organizationId: pkg.organizationId,
        recipientEmail: pkg.email,
        recipientPhone: pkg.phoneNumber,
      },
      { attempts: 3 },
    );

    this.logger.log(`Approved package ${packageId}`);
    return this.getReceiveDetail(packageId);
  }

  /**
   * Cancel package - "Cancel" button action from design
   */
  async cancelPackage(packageId: string, dto: CancelPackageDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Don't allow cancelling already delivered packages
    if (pkg.status === 'Delivered') {
      throw new BadRequestException('Cannot cancel a delivered package');
    }

    const previousStatus = pkg.status;

    // Update status to cancelled
    await this.db
      .update(schema.packages)
      .set({
        status: ReceiveStatus.CANCELLED,
        memo: `${pkg.memo ? pkg.memo + '\n' : ''}[CANCELLED] ${dto.reason}${dto.notes ? ': ' + dto.notes : ''}`,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, packageId));

    // Add cancellation remark
    await this.db.insert(schema.packagesRemarks).values({
      packageId,
      organizationId: pkg.organizationId,
      message: `Package cancelled: ${dto.reason}${dto.notes ? ' - ' + dto.notes : ''}`,
      status: ReceiveStatus.CANCELLED,
      createdBy: userId,
    });

    // Queue notification if requested
    if (dto.notifyRecipient && (pkg.email || pkg.phoneNumber)) {
      await this.queueService.addJob(
        QUEUE_NAMES.NOTIFICATIONS,
        JOB_TYPES.SEND_DELIVERY_NOTIFICATION,
        {
          packageId,
          type: 'cancellation',
          reason: dto.reason,
          recipientEmail: pkg.email,
          recipientPhone: pkg.phoneNumber,
        },
        { attempts: 2 },
      );
    }

    this.logger.log(`Cancelled package ${packageId}: ${dto.reason}`);
    return this.getReceiveDetail(packageId);
  }

  /**
   * Get package activity history - "View Activity" button from design
   */
  async getPackageActivity(packageId: string): Promise<PackageActivityResponse> {
    const [pkg] = await this.db
      .select({
        id: schema.packages.id,
        trackingNumber: schema.packages.trackingNumber,
      })
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Get remarks as activity
    const remarks = await this.db
      .select({
        id: schema.packagesRemarks.id,
        message: schema.packagesRemarks.message,
        status: schema.packagesRemarks.status,
        createdAt: schema.packagesRemarks.createdAt,
        createdById: schema.packagesRemarks.createdBy,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
      })
      .from(schema.packagesRemarks)
      .leftJoin(schema.users, eq(schema.packagesRemarks.createdBy, schema.users.id))
      .where(
        and(
          eq(schema.packagesRemarks.packageId, packageId),
          eq(schema.packagesRemarks.isDeleted, false),
        ),
      )
      .orderBy(desc(schema.packagesRemarks.createdAt));

    // Get audit logs for this package
    let auditLogs: any[] = [];
    try {
      auditLogs = await this.db
        .select({
          id: schema.auditLogs.id,
          action: schema.auditLogs.action,
          oldValues: schema.auditLogs.oldValues,
          newValues: schema.auditLogs.newValues,
          memo: schema.auditLogs.memo,
          createdAt: schema.auditLogs.createdAt,
          userId: schema.auditLogs.userId,
          userFirstName: schema.users.firstName,
          userLastName: schema.users.lastName,
        })
        .from(schema.auditLogs)
        .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
        .where(
          and(
            eq(schema.auditLogs.entityName, 'packages'),
            eq(schema.auditLogs.entityId, packageId),
          ),
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(50);
    } catch {
      // Audit logs table might not exist
    }

    const activities: PackageActivityItem[] = [
      // Map remarks
      ...remarks.map((r) => ({
        id: r.id,
        action: 'remark',
        description: r.message || 'Remark added',
        newStatus: r.status || undefined,
        userId: r.createdById || '',
        userName: `${r.userFirstName || ''} ${r.userLastName || ''}`.trim() || 'System',
        timestamp: r.createdAt || new Date(),
      })),
      // Map audit logs
      ...auditLogs.map((a) => {
        const oldVals = a.oldValues as Record<string, any> | null;
        const newVals = a.newValues as Record<string, any> | null;
        return {
          id: a.id,
          action: a.action || 'update',
          description: a.memo || `Package ${a.action}`,
          previousStatus: oldVals?.status,
          newStatus: newVals?.status,
          userId: a.userId || '',
          userName: `${a.userFirstName || ''} ${a.userLastName || ''}`.trim() || 'System',
          timestamp: a.createdAt || new Date(),
          metadata: newVals || undefined,
        };
      }),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      packageId,
      trackingNumber: pkg.trackingNumber || '',
      activities,
      total: activities.length,
    };
  }

  /**
   * Update package details
   */
  async updatePackage(packageId: string, dto: UpdateReceiveDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.senderName !== undefined) updateData.senderName = dto.senderName;
    if (dto.recipientName !== undefined) updateData.recipientName = dto.recipientName;
    if (dto.recipientId !== undefined) updateData.recipientId = dto.recipientId;
    if (dto.attentionTo !== undefined) updateData.attentionTo = dto.attentionTo;
    if (dto.trackingNumber !== undefined) updateData.trackingNumber = dto.trackingNumber;
    if (dto.invoiceNumber !== undefined) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.purchaseOrderNumber !== undefined) updateData.purchaseOrderNumber = dto.purchaseOrderNumber;
    if (dto.fromAddress !== undefined) updateData.fromAddress = dto.fromAddress;
    if (dto.toAddress !== undefined) updateData.toAddress = dto.toAddress;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.zone !== undefined) updateData.zone = dto.zone;
    if (dto.isle !== undefined) updateData.isle = dto.isle;
    if (dto.shelf !== undefined) updateData.shelf = dto.shelf;
    if (dto.bin !== undefined) updateData.bin = dto.bin;
    if (dto.memo !== undefined) updateData.memo = dto.memo;
    if (dto.keepPackageForHowLong !== undefined) updateData.keepPackageForHowLong = dto.keepPackageForHowLong;
    if (dto.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = dto.expectedDeliveryDate;
    if (dto.signatureRequiredOnDeliver !== undefined) updateData.signatureRequiredOnDeliver = dto.signatureRequiredOnDeliver;

    await this.db
      .update(schema.packages)
      .set(updateData)
      .where(eq(schema.packages.id, packageId));

    // Add update remark
    await this.db.insert(schema.packagesRemarks).values({
      packageId,
      organizationId: pkg.organizationId,
      message: 'Package details updated',
      status: pkg.status,
      createdBy: userId,
    });

    this.logger.log(`Updated package ${packageId}`);
    return this.getReceiveDetail(packageId);
  }

  /**
   * Add remark to package
   */
  async addRemark(packageId: string, dto: AddRemarkDto, userId: string): Promise<ReceiveDetailResponse> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    await this.db.insert(schema.packagesRemarks).values({
      packageId,
      organizationId: pkg.organizationId,
      message: dto.message,
      status: dto.status || pkg.status,
      createdBy: userId,
    });

    return this.getReceiveDetail(packageId);
  }

  /**
   * Search packages with autocomplete support
   */
  async searchPackages(dto: SearchPackagesDto): Promise<ReceiveCardItem[]> {
    const whereConditions = [
      eq(schema.packages.isDeleted, false),
      or(
        ilike(schema.packages.trackingNumber, `%${dto.query}%`),
        ilike(schema.packages.senderName, `%${dto.query}%`),
        ilike(schema.packages.recipientName, `%${dto.query}%`),
        ilike(schema.packages.invoiceNumber, `%${dto.query}%`),
      ),
    ];

    if (dto.organizationId) {
      whereConditions.push(eq(schema.packages.organizationId, dto.organizationId) as any);
    }

    if (dto.statuses && dto.statuses.length > 0) {
      whereConditions.push(
        or(...dto.statuses.map((s) => eq(schema.packages.status, s))) as any,
      );
    }

    const packages = await this.db
      .select({
        id: schema.packages.id,
        senderName: schema.packages.senderName,
        recipientName: schema.packages.recipientName,
        trackingNumber: schema.packages.trackingNumber,
        invoiceNumber: schema.packages.invoiceNumber,
        status: schema.packages.status,
        memo: schema.packages.memo,
        zone: schema.packages.zone,
        isle: schema.packages.isle,
        shelf: schema.packages.shelf,
        bin: schema.packages.bin,
        createdAt: schema.packages.createdAt,
        createdById: schema.packages.createdBy,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
      })
      .from(schema.packages)
      .leftJoin(schema.users, eq(schema.packages.createdBy, schema.users.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.packages.createdAt))
      .limit(dto.limit || 10);

    return packages.map((p) => this.mapToCardItem(p));
  }

  /**
   * Delete package (soft delete)
   */
  async deletePackage(packageId: string, userId: string): Promise<{ success: boolean }> {
    const [pkg] = await this.db
      .select()
      .from(schema.packages)
      .where(eq(schema.packages.id, packageId));

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    await this.db
      .update(schema.packages)
      .set({
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.packages.id, packageId));

    this.logger.log(`Deleted package ${packageId}`);
    return { success: true };
  }

  /**
   * Bulk approve packages
   */
  async bulkApprove(packageIds: string[], userId: string): Promise<BulkOperationResult> {
    const results: BulkOperationResult['results'] = [];

    for (const packageId of packageIds) {
      try {
        await this.approvePackage(packageId, {}, userId);
        results.push({ packageId, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ packageId, success: false, error: errorMessage });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return {
      success: succeeded === packageIds.length,
      total: packageIds.length,
      succeeded,
      failed: packageIds.length - succeeded,
      results,
    };
  }

  /**
   * Bulk cancel packages
   */
  async bulkCancel(packageIds: string[], reason: string, userId: string): Promise<BulkOperationResult> {
    const results: BulkOperationResult['results'] = [];

    for (const packageId of packageIds) {
      try {
        await this.cancelPackage(packageId, { reason, notifyRecipient: false }, userId);
        results.push({ packageId, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ packageId, success: false, error: errorMessage });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return {
      success: succeeded === packageIds.length,
      total: packageIds.length,
      succeeded,
      failed: packageIds.length - succeeded,
      results,
    };
  }

  // ==================== Helper Methods ====================

  private async countByStatus(status: ReceiveStatus, baseWhere: any): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, status)));
    return result?.count || 0;
  }

  private async getPackagesByStatus(
    status: ReceiveStatus,
    dateFrom: Date,
    dateTo: Date,
    filter: ReceivesFilterDto,
  ): Promise<ReceiveCardItem[]> {
    const whereConditions = [
      eq(schema.packages.status, status),
      eq(schema.packages.isDeleted, false),
      gte(schema.packages.createdAt, dateFrom),
      lte(schema.packages.createdAt, dateTo),
    ];

    if (filter.organizationId) {
      whereConditions.push(eq(schema.packages.organizationId, filter.organizationId));
    }
    if (filter.warehouseId) {
      whereConditions.push(eq(schema.packages.warehouseId, filter.warehouseId));
    }
    if (filter.search) {
      whereConditions.push(
        or(
          like(schema.packages.trackingNumber, `%${filter.search}%`),
          like(schema.packages.senderName, `%${filter.search}%`),
          like(schema.packages.recipientName, `%${filter.search}%`),
          like(schema.packages.invoiceNumber, `%${filter.search}%`),
        ) as any,
      );
    }

    const packages = await this.db
      .select({
        id: schema.packages.id,
        senderName: schema.packages.senderName,
        recipientName: schema.packages.recipientName,
        trackingNumber: schema.packages.trackingNumber,
        invoiceNumber: schema.packages.invoiceNumber,
        status: schema.packages.status,
        memo: schema.packages.memo,
        zone: schema.packages.zone,
        isle: schema.packages.isle,
        shelf: schema.packages.shelf,
        bin: schema.packages.bin,
        createdAt: schema.packages.createdAt,
        createdById: schema.packages.createdBy,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
      })
      .from(schema.packages)
      .leftJoin(schema.users, eq(schema.packages.createdBy, schema.users.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.packages.createdAt))
      .limit(50);

    return packages.map((p) => this.mapToCardItem(p));
  }

  private mapToCardItem(p: any): ReceiveCardItem {
    const location = this.formatLocation(p.zone, p.isle, p.shelf, p.bin);
    
    return {
      id: p.id,
      senderName: p.senderName || 'Unknown',
      recipientName: p.recipientName || 'Unknown',
      date: p.createdAt || new Date(),
      trackingNumber: p.trackingNumber || '',
      invoiceNumber: p.invoiceNumber || '',
      location,
      dimensions: '50x30x100 cm', // Would come from schema if available
      memo: p.memo || '',
      transactionId: p.id.substring(0, 8).toUpperCase(),
      status: p.status as ReceiveStatus,
      isFlagged: p.status === ReceiveStatus.FLAGGED,
      hasAttachment: false, // Would need to check files
      createdBy: {
        id: p.createdById || '',
        name: `${p.creatorFirstName || ''} ${p.creatorLastName || ''}`.trim() || 'Unknown',
      },
    };
  }

  private mapDetailToCard(detail: ReceiveDetailResponse): ReceiveCardItem {
    return {
      id: detail.id,
      senderName: detail.senderName,
      recipientName: detail.recipientName,
      date: detail.createdAt,
      trackingNumber: detail.trackingNumber || '',
      invoiceNumber: detail.invoiceNumber || '',
      location: detail.location.formatted,
      dimensions: detail.dimensions?.formatted || '',
      memo: detail.memo || '',
      transactionId: detail.id.substring(0, 8).toUpperCase(),
      status: detail.status,
      isFlagged: detail.isFlagged,
      hasAttachment: detail.files.length > 0,
      createdBy: detail.createdBy
        ? {
            id: detail.createdBy.id,
            name: `${detail.createdBy.firstName} ${detail.createdBy.lastName}`.trim(),
            avatar: detail.createdBy.avatar || undefined,
          }
        : { id: '', name: 'Unknown' },
    };
  }

  private formatLocation(zone?: string | null, isle?: string | null, shelf?: string | null, bin?: string | null): string {
    const parts = [zone, isle, shelf, bin].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unassigned';
  }

  private buildWhereConditions(dateFrom: Date, dateTo: Date, filter: ReceivesFilterDto): any[] {
    const conditions = [
      eq(schema.packages.isDeleted, false),
      gte(schema.packages.createdAt, dateFrom),
      lte(schema.packages.createdAt, dateTo),
    ];

    if (filter.organizationId) {
      conditions.push(eq(schema.packages.organizationId, filter.organizationId));
    }
    if (filter.warehouseId) {
      conditions.push(eq(schema.packages.warehouseId, filter.warehouseId));
    }
    if (filter.status) {
      conditions.push(eq(schema.packages.status, filter.status));
    }
    if (filter.statuses && filter.statuses.length > 0) {
      conditions.push(
        or(...filter.statuses.map((s) => eq(schema.packages.status, s))) as any,
      );
    }
    if (filter.search) {
      conditions.push(
        or(
          like(schema.packages.trackingNumber, `%${filter.search}%`),
          like(schema.packages.senderName, `%${filter.search}%`),
          like(schema.packages.recipientName, `%${filter.search}%`),
          like(schema.packages.invoiceNumber, `%${filter.search}%`),
        ) as any,
      );
    }

    return conditions;
  }

  private getDateRange(filter: ReceivesFilterDto): { dateFrom: Date; dateTo: Date; period: string } {
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;
    const period = filter.period || ReceivePeriod.WEEK;

    if (filter.dateFrom && filter.dateTo) {
      return {
        dateFrom: new Date(filter.dateFrom),
        dateTo: new Date(filter.dateTo),
        period: 'custom',
      };
    }

    switch (period) {
      case ReceivePeriod.TODAY:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case ReceivePeriod.WEEK:
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case ReceivePeriod.MONTH:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case ReceivePeriod.QUARTER:
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        dateFrom = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      case ReceivePeriod.SEMESTER:
        const semesterMonth = now.getMonth() < 6 ? 0 : 6;
        dateFrom = new Date(now.getFullYear(), semesterMonth, 1);
        break;
      case ReceivePeriod.THIS_YEAR:
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      case ReceivePeriod.LAST_YEAR:
        dateFrom = new Date(now.getFullYear() - 1, 0, 1);
        dateTo = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
    }

    return { dateFrom, dateTo, period };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

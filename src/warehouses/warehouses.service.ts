import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, ilike, count, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

export interface CreateWarehouseDto {
  organizationId: string;
  name?: string;
  profileImage?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  differentWhatsAppNumber?: boolean;
  whatsAppNumber?: string;
  email?: string;
  additionalInformation?: string;
  defaultOptions?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  isDeleted?: boolean;
  isLocked?: boolean;
}

export interface WarehouseFilterDto {
  organizationId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDefaultOptionsDto {
  warehouseId: string;
  organizationId: string;
  defaultOptionsName?: string;
  // Signature requests
  requestForDeliverySignature?: boolean;
  requestForReturnSignature?: boolean;
  requestForTransferSignature?: boolean;
  // Package image uploads
  requestToUploadPackageImageReceive?: boolean;
  requestToUploadPackageImageDeliver?: boolean;
  requestToUploadPackageImageReturn?: boolean;
  requestToUploadPackageImageTransfer?: boolean;
  // Shipping label uploads
  requestToUploadShippingLabelReceive?: boolean;
  requestToUploadShippingLabelReturn?: boolean;
  requestToUploadShippingLabelTransfer?: boolean;
  // Tracking number requests
  requestForTrackingNumberReceive?: boolean;
  requestForTrackingNumberReturn?: boolean;
  requestForTrackingNumberTransfer?: boolean;
  // Additional options
  requestForMemoReceive?: boolean;
  requestForMemoDeliver?: boolean;
  requestForMemoReturn?: boolean;
  requestForMemoTransfer?: boolean;
  setAsReadyToPickupWhenReceivePackage?: boolean;
  keepPackageForHowLong?: number;
}

export interface CreateStorageLayoutDto {
  warehouseId: string;
  profileImage?: string;
  zone?: string;
  isle?: string;
  shelf?: string;
  bin?: string;
  additionalInformation?: string;
  isActive?: boolean;
}

export interface UpdateStorageLayoutDto extends Partial<CreateStorageLayoutDto> {
  isDeleted?: boolean;
  isLocked?: boolean;
}

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ==================== Warehouse CRUD ====================

  /**
   * Create a new warehouse
   */
  async create(dto: CreateWarehouseDto, createdBy: string): Promise<any> {
    this.logger.log(`Creating warehouse: ${dto.name}`);

    const [warehouse] = await this.db
      .insert(schema.organizationsWarehousesLocations)
      .values({
        organizationId: dto.organizationId,
        name: dto.name || null,
        profileImage: dto.profileImage || null,
        phoneNumber: dto.phoneNumber || null,
        mobileNumber: dto.mobileNumber || null,
        differentWhatsAppNumber: dto.differentWhatsAppNumber ?? false,
        whatsAppNumber: dto.whatsAppNumber || null,
        email: dto.email || null,
        additionalInformation: dto.additionalInformation || null,
        defaultOptions: dto.defaultOptions ?? false,
        isActive: dto.isActive ?? true,
        isDeleted: false,
        isLocked: false,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return warehouse;
  }

  /**
   * Find warehouse by ID
   */
  async findById(id: string): Promise<any> {
    const [warehouse] = await this.db
      .select()
      .from(schema.organizationsWarehousesLocations)
      .where(
        and(
          eq(schema.organizationsWarehousesLocations.id, id),
          eq(schema.organizationsWarehousesLocations.isDeleted, false),
        ),
      )
      .limit(1);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  /**
   * List warehouses with filters
   */
  async findAll(filter: WarehouseFilterDto): Promise<{ data: any[]; total: number }> {
    const conditions: any[] = [
      eq(schema.organizationsWarehousesLocations.isDeleted, filter.isDeleted ?? false),
    ];

    if (filter.organizationId) {
      conditions.push(eq(schema.organizationsWarehousesLocations.organizationId, filter.organizationId));
    }
    if (filter.isActive !== undefined) {
      conditions.push(eq(schema.organizationsWarehousesLocations.isActive, filter.isActive));
    }
    if (filter.search) {
      conditions.push(
        or(
          ilike(schema.organizationsWarehousesLocations.name, `%${filter.search}%`),
          ilike(schema.organizationsWarehousesLocations.email, `%${filter.search}%`),
        ),
      );
    }

    const whereClause = and(...conditions);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.organizationsWarehousesLocations)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(schema.organizationsWarehousesLocations)
      .where(whereClause)
      .orderBy(desc(schema.organizationsWarehousesLocations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total: totalResult?.count || 0,
    };
  }

  /**
   * Update warehouse
   */
  async update(id: string, dto: UpdateWarehouseDto, updatedBy: string): Promise<any> {
    this.logger.log(`Updating warehouse ${id}`);

    const warehouse = await this.findById(id);

    if (warehouse.isLocked) {
      throw new BadRequestException('Warehouse is locked and cannot be updated');
    }

    const updateData: Record<string, any> = { updatedBy };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.profileImage !== undefined) updateData.profileImage = dto.profileImage;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.mobileNumber !== undefined) updateData.mobileNumber = dto.mobileNumber;
    if (dto.differentWhatsAppNumber !== undefined) updateData.differentWhatsAppNumber = dto.differentWhatsAppNumber;
    if (dto.whatsAppNumber !== undefined) updateData.whatsAppNumber = dto.whatsAppNumber;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.additionalInformation !== undefined) updateData.additionalInformation = dto.additionalInformation;
    if (dto.defaultOptions !== undefined) updateData.defaultOptions = dto.defaultOptions;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isDeleted !== undefined) updateData.isDeleted = dto.isDeleted;
    if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;

    const [updated] = await this.db
      .update(schema.organizationsWarehousesLocations)
      .set(updateData)
      .where(eq(schema.organizationsWarehousesLocations.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete warehouse
   */
  async remove(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`Soft deleting warehouse ${id}`);

    const warehouse = await this.findById(id);

    if (warehouse.isLocked) {
      throw new BadRequestException('Warehouse is locked and cannot be deleted');
    }

    await this.db
      .update(schema.organizationsWarehousesLocations)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
      })
      .where(eq(schema.organizationsWarehousesLocations.id, id));
  }

  /**
   * Restore soft-deleted warehouse
   */
  async restore(id: string, restoredBy: string): Promise<any> {
    this.logger.log(`Restoring warehouse ${id}`);

    const [warehouse] = await this.db
      .select()
      .from(schema.organizationsWarehousesLocations)
      .where(eq(schema.organizationsWarehousesLocations.id, id))
      .limit(1);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    const [restored] = await this.db
      .update(schema.organizationsWarehousesLocations)
      .set({
        isDeleted: false,
        updatedBy: restoredBy,
      })
      .where(eq(schema.organizationsWarehousesLocations.id, id))
      .returning();

    return restored;
  }

  /**
   * Lock/unlock warehouse
   */
  async toggleLock(id: string, locked: boolean, updatedBy: string): Promise<any> {
    this.logger.log(`${locked ? 'Locking' : 'Unlocking'} warehouse ${id}`);

    await this.findById(id);

    const [updated] = await this.db
      .update(schema.organizationsWarehousesLocations)
      .set({
        isLocked: locked,
        updatedBy,
      })
      .where(eq(schema.organizationsWarehousesLocations.id, id))
      .returning();

    return updated;
  }

  /**
   * Activate/deactivate warehouse
   */
  async setActive(id: string, active: boolean, updatedBy: string): Promise<any> {
    return this.update(id, { isActive: active }, updatedBy);
  }

  /**
   * Get warehouses for dropdown
   */
  async getActiveWarehouses(organizationId: string): Promise<{ id: string; name: string }[]> {
    const warehouses = await this.db
      .select({
        id: schema.organizationsWarehousesLocations.id,
        name: schema.organizationsWarehousesLocations.name,
      })
      .from(schema.organizationsWarehousesLocations)
      .where(
        and(
          eq(schema.organizationsWarehousesLocations.organizationId, organizationId),
          eq(schema.organizationsWarehousesLocations.isActive, true),
          eq(schema.organizationsWarehousesLocations.isDeleted, false),
        ),
      )
      .orderBy(schema.organizationsWarehousesLocations.name);

    return warehouses.map((w) => ({
      id: w.id,
      name: w.name || 'Unnamed Warehouse',
    }));
  }

  /**
   * Get warehouse stats
   */
  async getStats(organizationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    locked: number;
  }> {
    const baseCondition = and(
      eq(schema.organizationsWarehousesLocations.organizationId, organizationId),
      eq(schema.organizationsWarehousesLocations.isDeleted, false),
    );

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.organizationsWarehousesLocations)
      .where(baseCondition);

    const [activeResult] = await this.db
      .select({ count: count() })
      .from(schema.organizationsWarehousesLocations)
      .where(and(baseCondition, eq(schema.organizationsWarehousesLocations.isActive, true)));

    const [lockedResult] = await this.db
      .select({ count: count() })
      .from(schema.organizationsWarehousesLocations)
      .where(and(baseCondition, eq(schema.organizationsWarehousesLocations.isLocked, true)));

    const total = totalResult?.count || 0;
    const active = activeResult?.count || 0;
    const locked = lockedResult?.count || 0;

    return {
      total,
      active,
      inactive: total - active,
      locked,
    };
  }

  // ==================== Default Options CRUD ====================

  /**
   * Create default options for a warehouse
   */
  async createDefaultOptions(dto: CreateDefaultOptionsDto, createdBy: string): Promise<any> {
    this.logger.log(`Creating default options for warehouse ${dto.warehouseId}`);

    const [options] = await this.db
      .insert(schema.warehousesDefaultOptions)
      .values({
        warehouseId: dto.warehouseId,
        organizationId: dto.organizationId,
        defaultOptionsName: dto.defaultOptionsName || null,
        requestForDeliverySignature: dto.requestForDeliverySignature ?? false,
        requestForReturnSignature: dto.requestForReturnSignature ?? false,
        requestForTransferSignature: dto.requestForTransferSignature ?? false,
        requestToUploadPackageImageReceive: dto.requestToUploadPackageImageReceive ?? false,
        requestToUploadPackageImageDeliver: dto.requestToUploadPackageImageDeliver ?? false,
        requestToUploadPackageImageReturn: dto.requestToUploadPackageImageReturn ?? false,
        requestToUploadPackageImageTransfer: dto.requestToUploadPackageImageTransfer ?? false,
        requestToUploadShippingLabelReceive: dto.requestToUploadShippingLabelReceive ?? false,
        requestToUploadShippingLabelReturn: dto.requestToUploadShippingLabelReturn ?? false,
        requestToUploadShippingLabelTransfer: dto.requestToUploadShippingLabelTransfer ?? false,
        requestForTrackingNumberReceive: dto.requestForTrackingNumberReceive ?? false,
        requestForTrackingNumberReturn: dto.requestForTrackingNumberReturn ?? false,
        requestForTrackingNumberTransfer: dto.requestForTrackingNumberTransfer ?? false,
        requestForMemoReceive: dto.requestForMemoReceive ?? false,
        requestForMemoDeliver: dto.requestForMemoDeliver ?? false,
        requestForMemoReturn: dto.requestForMemoReturn ?? false,
        requestForMemoTransfer: dto.requestForMemoTransfer ?? false,
        setAsReadyToPickupWhenReceivePackage: dto.setAsReadyToPickupWhenReceivePackage ?? false,
        keepPackageForHowLong: dto.keepPackageForHowLong || null,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return options;
  }

  /**
   * Get default options for a warehouse
   */
  async getDefaultOptions(warehouseId: string): Promise<any> {
    const [options] = await this.db
      .select()
      .from(schema.warehousesDefaultOptions)
      .where(eq(schema.warehousesDefaultOptions.warehouseId, warehouseId))
      .limit(1);

    return options;
  }

  /**
   * Update default options
   */
  async updateDefaultOptions(
    warehouseId: string,
    dto: Partial<CreateDefaultOptionsDto>,
    updatedBy: string,
  ): Promise<any> {
    this.logger.log(`Updating default options for warehouse ${warehouseId}`);

    const [updated] = await this.db
      .update(schema.warehousesDefaultOptions)
      .set({
        ...dto,
        updatedBy,
      })
      .where(eq(schema.warehousesDefaultOptions.warehouseId, warehouseId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Default options for warehouse ${warehouseId} not found`);
    }

    return updated;
  }

  // ==================== Storage Layout CRUD ====================

  /**
   * Create storage layout
   */
  async createStorageLayout(dto: CreateStorageLayoutDto, createdBy: string): Promise<any> {
    this.logger.log(`Creating storage layout for warehouse ${dto.warehouseId}`);

    const [layout] = await this.db
      .insert(schema.warehousesStoragesLayouts)
      .values({
        warehouseId: dto.warehouseId,
        profileImage: dto.profileImage || null,
        zone: dto.zone || null,
        isle: dto.isle || null,
        shelf: dto.shelf || null,
        bin: dto.bin || null,
        additionalInformation: dto.additionalInformation || null,
        isActive: dto.isActive ?? true,
        isDeleted: false,
        isLocked: false,
        createdBy,
        updatedBy: createdBy,
      })
      .returning();

    return layout;
  }

  /**
   * Get storage layout by ID
   */
  async getStorageLayoutById(id: string): Promise<any> {
    const [layout] = await this.db
      .select()
      .from(schema.warehousesStoragesLayouts)
      .where(
        and(
          eq(schema.warehousesStoragesLayouts.id, id),
          eq(schema.warehousesStoragesLayouts.isDeleted, false),
        ),
      )
      .limit(1);

    if (!layout) {
      throw new NotFoundException(`Storage layout with ID ${id} not found`);
    }

    return layout;
  }

  /**
   * List storage layouts for a warehouse
   */
  async getStorageLayouts(
    warehouseId: string,
    filter?: { isActive?: boolean; zone?: string },
  ): Promise<any[]> {
    const conditions: any[] = [
      eq(schema.warehousesStoragesLayouts.warehouseId, warehouseId),
      eq(schema.warehousesStoragesLayouts.isDeleted, false),
    ];

    if (filter?.isActive !== undefined) {
      conditions.push(eq(schema.warehousesStoragesLayouts.isActive, filter.isActive));
    }
    if (filter?.zone) {
      conditions.push(eq(schema.warehousesStoragesLayouts.zone, filter.zone));
    }

    const layouts = await this.db
      .select()
      .from(schema.warehousesStoragesLayouts)
      .where(and(...conditions))
      .orderBy(
        schema.warehousesStoragesLayouts.zone,
        schema.warehousesStoragesLayouts.isle,
        schema.warehousesStoragesLayouts.shelf,
        schema.warehousesStoragesLayouts.bin,
      );

    return layouts;
  }

  /**
   * Update storage layout
   */
  async updateStorageLayout(id: string, dto: UpdateStorageLayoutDto, updatedBy: string): Promise<any> {
    this.logger.log(`Updating storage layout ${id}`);

    const layout = await this.getStorageLayoutById(id);

    if (layout.isLocked) {
      throw new BadRequestException('Storage layout is locked and cannot be updated');
    }

    const updateData: Record<string, any> = { updatedBy };

    if (dto.profileImage !== undefined) updateData.profileImage = dto.profileImage;
    if (dto.zone !== undefined) updateData.zone = dto.zone;
    if (dto.isle !== undefined) updateData.isle = dto.isle;
    if (dto.shelf !== undefined) updateData.shelf = dto.shelf;
    if (dto.bin !== undefined) updateData.bin = dto.bin;
    if (dto.additionalInformation !== undefined) updateData.additionalInformation = dto.additionalInformation;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isDeleted !== undefined) updateData.isDeleted = dto.isDeleted;
    if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;

    const [updated] = await this.db
      .update(schema.warehousesStoragesLayouts)
      .set(updateData)
      .where(eq(schema.warehousesStoragesLayouts.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft delete storage layout
   */
  async removeStorageLayout(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`Soft deleting storage layout ${id}`);

    const layout = await this.getStorageLayoutById(id);

    if (layout.isLocked) {
      throw new BadRequestException('Storage layout is locked and cannot be deleted');
    }

    await this.db
      .update(schema.warehousesStoragesLayouts)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
      })
      .where(eq(schema.warehousesStoragesLayouts.id, id));
  }

  /**
   * Get location code from layout
   */
  getLocationCode(layout: any): string {
    const parts = [layout.zone, layout.isle, layout.shelf, layout.bin].filter(Boolean);
    return parts.join('-') || 'N/A';
  }

  /**
   * Get storage layout stats for a warehouse
   */
  async getStorageLayoutStats(warehouseId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    zones: string[];
  }> {
    const baseCondition = and(
      eq(schema.warehousesStoragesLayouts.warehouseId, warehouseId),
      eq(schema.warehousesStoragesLayouts.isDeleted, false),
    );

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.warehousesStoragesLayouts)
      .where(baseCondition);

    const [activeResult] = await this.db
      .select({ count: count() })
      .from(schema.warehousesStoragesLayouts)
      .where(and(baseCondition, eq(schema.warehousesStoragesLayouts.isActive, true)));

    const zones = await this.db
      .selectDistinct({ zone: schema.warehousesStoragesLayouts.zone })
      .from(schema.warehousesStoragesLayouts)
      .where(baseCondition);

    const total = totalResult?.count || 0;
    const active = activeResult?.count || 0;

    return {
      total,
      active,
      inactive: total - active,
      zones: zones.map((z) => z.zone).filter(Boolean) as string[],
    };
  }
}

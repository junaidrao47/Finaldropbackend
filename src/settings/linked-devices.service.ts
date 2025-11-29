import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  LinkedDeviceFilterDto,
  UpdateLinkedDeviceDto,
  LinkedDeviceResponseDto,
  DeviceType,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class LinkedDevicesService {
  private readonly logger = new Logger(LinkedDevicesService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get user's linked devices with filters
   */
  async getLinkedDevices(
    userId: string,
    filters: LinkedDeviceFilterDto,
  ): Promise<PaginatedResponseDto<LinkedDeviceResponseDto>> {
    const { deviceType, isActive, isTrusted, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions = [
        eq(schema.linkedDevices.userId, userId),
        eq(schema.linkedDevices.isDeleted, false),
      ];

      if (deviceType) {
        conditions.push(eq(schema.linkedDevices.deviceType, deviceType));
      }

      if (isActive !== undefined) {
        conditions.push(eq(schema.linkedDevices.isActive, isActive));
      }

      if (isTrusted !== undefined) {
        conditions.push(eq(schema.linkedDevices.isTrusted, isTrusted));
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.linkedDevices)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.linkedDevices)
        .where(and(...conditions))
        .orderBy(desc(schema.linkedDevices.lastActiveAt))
        .limit(limit)
        .offset(offset);

      return {
        data: data.map(this.mapToResponse),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching linked devices: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single device by ID
   */
  async getDevice(id: string, userId: string): Promise<LinkedDeviceResponseDto> {
    const [device] = await this.db
      .select()
      .from(schema.linkedDevices)
      .where(
        and(
          eq(schema.linkedDevices.id, id),
          eq(schema.linkedDevices.userId, userId),
          eq(schema.linkedDevices.isDeleted, false),
        ),
      );

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return this.mapToResponse(device);
  }

  /**
   * Register new device
   */
  async registerDevice(
    userId: string,
    deviceData: {
      deviceName?: string;
      deviceType?: string;
      deviceModel?: string;
      osName?: string;
      osVersion?: string;
      appVersion?: string;
      deviceFingerprint: string;
      pushToken?: string;
      ipAddress?: string;
      location?: string;
    },
    organizationId?: string,
  ): Promise<LinkedDeviceResponseDto> {
    try {
      // Check if device already exists
      const [existing] = await this.db
        .select()
        .from(schema.linkedDevices)
        .where(
          and(
            eq(schema.linkedDevices.userId, userId),
            eq(schema.linkedDevices.deviceFingerprint, deviceData.deviceFingerprint),
            eq(schema.linkedDevices.isDeleted, false),
          ),
        );

      if (existing) {
        // Update existing device with new activity
        const [updated] = await this.db
          .update(schema.linkedDevices)
          .set({
            lastIpAddress: deviceData.ipAddress,
            lastLocation: deviceData.location,
            lastActiveAt: new Date(),
            appVersion: deviceData.appVersion,
            pushToken: deviceData.pushToken,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(schema.linkedDevices.id, existing.id))
          .returning();

        return this.mapToResponse(updated);
      }

      // Create new device
      const [created] = await this.db
        .insert(schema.linkedDevices)
        .values({
          userId,
          organizationId,
          deviceName: deviceData.deviceName,
          deviceType: deviceData.deviceType,
          deviceModel: deviceData.deviceModel,
          osName: deviceData.osName,
          osVersion: deviceData.osVersion,
          appVersion: deviceData.appVersion,
          deviceFingerprint: deviceData.deviceFingerprint,
          pushToken: deviceData.pushToken,
          lastIpAddress: deviceData.ipAddress,
          lastLocation: deviceData.location,
          lastActiveAt: new Date(),
          isActive: true,
          isTrusted: false,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Registered new device ${created.id} for user ${userId}`);
      return this.mapToResponse(created);
    } catch (error) {
      this.logger.error(`Error registering device: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update device (name, trust status)
   */
  async updateDevice(
    id: string,
    userId: string,
    dto: UpdateLinkedDeviceDto,
  ): Promise<LinkedDeviceResponseDto> {
    await this.getDevice(id, userId);

    const [updated] = await this.db
      .update(schema.linkedDevices)
      .set({
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.linkedDevices.id, id),
          eq(schema.linkedDevices.userId, userId),
        ),
      )
      .returning();

    this.logger.log(`Updated device ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Trust/untrust device
   */
  async toggleDeviceTrust(id: string, userId: string): Promise<LinkedDeviceResponseDto> {
    const device = await this.getDevice(id, userId);

    const [updated] = await this.db
      .update(schema.linkedDevices)
      .set({
        isTrusted: !device.isTrusted,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.linkedDevices.id, id),
          eq(schema.linkedDevices.userId, userId),
        ),
      )
      .returning();

    return this.mapToResponse(updated);
  }

  /**
   * Revoke device (soft delete)
   */
  async revokeDevice(id: string, userId: string): Promise<void> {
    await this.getDevice(id, userId);

    await this.db
      .update(schema.linkedDevices)
      .set({
        isActive: false,
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.linkedDevices.id, id),
          eq(schema.linkedDevices.userId, userId),
        ),
      );

    this.logger.log(`Revoked device ${id}`);
  }

  /**
   * Revoke all devices except current
   */
  async revokeAllDevicesExcept(
    userId: string,
    currentDeviceFingerprint: string,
  ): Promise<{ revokedCount: number }> {
    const result = await this.db
      .update(schema.linkedDevices)
      .set({
        isActive: false,
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.linkedDevices.userId, userId),
          eq(schema.linkedDevices.isDeleted, false),
        ),
      )
      .returning();

    // Keep current device
    if (currentDeviceFingerprint) {
      const [current] = await this.db
        .select()
        .from(schema.linkedDevices)
        .where(eq(schema.linkedDevices.deviceFingerprint, currentDeviceFingerprint));

      if (current) {
        await this.db
          .update(schema.linkedDevices)
          .set({
            isActive: true,
            isDeleted: false,
          })
          .where(eq(schema.linkedDevices.id, current.id));
      }
    }

    const revokedCount = result.length - (currentDeviceFingerprint ? 1 : 0);
    this.logger.log(`Revoked ${revokedCount} devices for user ${userId}`);
    return { revokedCount: Math.max(0, revokedCount) };
  }

  /**
   * Get device stats
   */
  async getDeviceStats(userId: string): Promise<{
    total: number;
    active: number;
    trusted: number;
    byType: Record<string, number>;
  }> {
    const baseCondition = and(
      eq(schema.linkedDevices.userId, userId),
      eq(schema.linkedDevices.isDeleted, false),
    );

    const [totalCount] = await this.db
      .select({ count: count() })
      .from(schema.linkedDevices)
      .where(baseCondition);

    const [activeCount] = await this.db
      .select({ count: count() })
      .from(schema.linkedDevices)
      .where(and(baseCondition, eq(schema.linkedDevices.isActive, true)));

    const [trustedCount] = await this.db
      .select({ count: count() })
      .from(schema.linkedDevices)
      .where(and(baseCondition, eq(schema.linkedDevices.isTrusted, true)));

    // Get by type
    const byType: Record<string, number> = {};
    for (const type of Object.values(DeviceType)) {
      const [typeCount] = await this.db
        .select({ count: count() })
        .from(schema.linkedDevices)
        .where(and(baseCondition, eq(schema.linkedDevices.deviceType, type)));
      byType[type] = Number(typeCount?.count || 0);
    }

    return {
      total: Number(totalCount?.count || 0),
      active: Number(activeCount?.count || 0),
      trusted: Number(trustedCount?.count || 0),
      byType,
    };
  }

  /**
   * Update device activity (called on each request)
   */
  async updateDeviceActivity(
    deviceFingerprint: string,
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.db
      .update(schema.linkedDevices)
      .set({
        lastActiveAt: new Date(),
        lastIpAddress: ipAddress,
      })
      .where(
        and(
          eq(schema.linkedDevices.userId, userId),
          eq(schema.linkedDevices.deviceFingerprint, deviceFingerprint),
        ),
      );
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(record: schema.LinkedDeviceSelect): LinkedDeviceResponseDto {
    return {
      id: record.id,
      deviceName: record.deviceName ?? undefined,
      deviceType: record.deviceType ?? undefined,
      deviceModel: record.deviceModel ?? undefined,
      osName: record.osName ?? undefined,
      osVersion: record.osVersion ?? undefined,
      appVersion: record.appVersion ?? undefined,
      lastIpAddress: record.lastIpAddress ?? undefined,
      lastLocation: record.lastLocation ?? undefined,
      lastActiveAt: record.lastActiveAt ?? undefined,
      isActive: record.isActive,
      isTrusted: record.isTrusted,
      createdAt: record.createdAt,
    };
  }
}

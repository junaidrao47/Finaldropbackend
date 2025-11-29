import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, or, ilike, desc, asc, count, isNull, isNotNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  AddToBlacklistDto,
  UpdateBlacklistDto,
  BlacklistFilterDto,
  BlacklistResponseDto,
  BlacklistType,
  BlacklistStatus,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class BlacklistSettingsService {
  private readonly logger = new Logger(BlacklistSettingsService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get blacklist entries with filters
   */
  async getBlacklist(
    organizationId: string,
    filters: BlacklistFilterDto,
  ): Promise<PaginatedResponseDto<BlacklistResponseDto>> {
    const { type, status = BlacklistStatus.ACTIVE, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions = [
        eq(schema.blacklist.organizationId, organizationId),
        eq(schema.blacklist.isDeleted, false),
        eq(schema.blacklist.status, status),
      ];

      if (type) {
        conditions.push(eq(schema.blacklist.type, type));
      }

      if (search) {
        const searchCondition = or(
          ilike(schema.blacklist.name, `%${search}%`),
          ilike(schema.blacklist.email ?? '', `%${search}%`),
          ilike(schema.blacklist.phone ?? '', `%${search}%`),
          ilike(schema.blacklist.reason ?? '', `%${search}%`),
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.blacklist)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.blacklist)
        .where(and(...conditions))
        .orderBy(desc(schema.blacklist.blacklistedAt))
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
      this.logger.error(`Error fetching blacklist: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single blacklist entry by ID
   */
  async getBlacklistEntry(id: string, organizationId: string): Promise<BlacklistResponseDto> {
    const [entry] = await this.db
      .select()
      .from(schema.blacklist)
      .where(
        and(
          eq(schema.blacklist.id, id),
          eq(schema.blacklist.organizationId, organizationId),
          eq(schema.blacklist.isDeleted, false),
        ),
      );

    if (!entry) {
      throw new NotFoundException(`Blacklist entry with ID ${id} not found`);
    }

    return this.mapToResponse(entry);
  }

  /**
   * Add to blacklist
   */
  async addToBlacklist(
    organizationId: string,
    dto: AddToBlacklistDto,
    userId: string,
  ): Promise<BlacklistResponseDto> {
    try {
      // Check if already blacklisted (active)
      const existing = await this.db
        .select()
        .from(schema.blacklist)
        .where(
          and(
            eq(schema.blacklist.organizationId, organizationId),
            eq(schema.blacklist.type, dto.type),
            eq(schema.blacklist.status, 'active'),
            eq(schema.blacklist.isDeleted, false),
            or(
              dto.email ? eq(schema.blacklist.email, dto.email) : undefined,
              dto.phone ? eq(schema.blacklist.phone, dto.phone) : undefined,
            ),
          ),
        );

      if (existing.length > 0) {
        throw new BadRequestException('This entity is already blacklisted');
      }

      const [created] = await this.db
        .insert(schema.blacklist)
        .values({
          organizationId,
          type: dto.type,
          entityId: dto.entityId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          reason: dto.reason,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Added ${dto.name} to blacklist for organization ${organizationId}`);
      return this.mapToResponse(created);
    } catch (error) {
      this.logger.error(`Error adding to blacklist: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update blacklist entry
   */
  async updateBlacklistEntry(
    id: string,
    organizationId: string,
    dto: UpdateBlacklistDto,
    userId: string,
  ): Promise<BlacklistResponseDto> {
    await this.getBlacklistEntry(id, organizationId);

    const updateData: any = {
      ...dto,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.expiresAt) {
      updateData.expiresAt = new Date(dto.expiresAt);
    }

    const [updated] = await this.db
      .update(schema.blacklist)
      .set(updateData)
      .where(
        and(
          eq(schema.blacklist.id, id),
          eq(schema.blacklist.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Updated blacklist entry ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Archive blacklist entry
   */
  async archiveBlacklistEntry(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<BlacklistResponseDto> {
    await this.getBlacklistEntry(id, organizationId);

    const [updated] = await this.db
      .update(schema.blacklist)
      .set({
        status: 'archived',
        archivedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.blacklist.id, id),
          eq(schema.blacklist.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Archived blacklist entry ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Restore archived blacklist entry
   */
  async restoreBlacklistEntry(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<BlacklistResponseDto> {
    await this.getBlacklistEntry(id, organizationId);

    const [updated] = await this.db
      .update(schema.blacklist)
      .set({
        status: 'active',
        archivedAt: null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.blacklist.id, id),
          eq(schema.blacklist.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Restored blacklist entry ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Remove from blacklist (soft delete)
   */
  async removeFromBlacklist(id: string, organizationId: string, userId: string): Promise<void> {
    await this.getBlacklistEntry(id, organizationId);

    await this.db
      .update(schema.blacklist)
      .set({
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.blacklist.id, id),
          eq(schema.blacklist.organizationId, organizationId),
        ),
      );

    this.logger.log(`Removed blacklist entry ${id}`);
  }

  /**
   * Check if an entity is blacklisted
   */
  async isBlacklisted(
    organizationId: string,
    type: BlacklistType,
    identifier: { email?: string; phone?: string; entityId?: string },
  ): Promise<boolean> {
    const conditions = [
      eq(schema.blacklist.organizationId, organizationId),
      eq(schema.blacklist.type, type),
      eq(schema.blacklist.status, 'active'),
      eq(schema.blacklist.isDeleted, false),
    ];

    const identifierConditions: any[] = [];
    if (identifier.email) {
      identifierConditions.push(eq(schema.blacklist.email, identifier.email));
    }
    if (identifier.phone) {
      identifierConditions.push(eq(schema.blacklist.phone, identifier.phone));
    }
    if (identifier.entityId) {
      identifierConditions.push(eq(schema.blacklist.entityId, identifier.entityId));
    }

    if (identifierConditions.length === 0) {
      return false;
    }

    const [result] = await this.db
      .select({ count: count() })
      .from(schema.blacklist)
      .where(and(...conditions, or(...identifierConditions)));

    return Number(result?.count || 0) > 0;
  }

  /**
   * Get blacklist stats
   */
  async getBlacklistStats(organizationId: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byType: Record<string, number>;
  }> {
    const baseCondition = and(
      eq(schema.blacklist.organizationId, organizationId),
      eq(schema.blacklist.isDeleted, false),
    );

    // Get total counts
    const [activeCount] = await this.db
      .select({ count: count() })
      .from(schema.blacklist)
      .where(and(baseCondition, eq(schema.blacklist.status, 'active')));

    const [archivedCount] = await this.db
      .select({ count: count() })
      .from(schema.blacklist)
      .where(and(baseCondition, eq(schema.blacklist.status, 'archived')));

    const active = Number(activeCount?.count || 0);
    const archived = Number(archivedCount?.count || 0);

    // Get by type
    const byType: Record<string, number> = {};
    for (const type of Object.values(BlacklistType)) {
      const [typeCount] = await this.db
        .select({ count: count() })
        .from(schema.blacklist)
        .where(
          and(
            baseCondition,
            eq(schema.blacklist.type, type),
            eq(schema.blacklist.status, 'active'),
          ),
        );
      byType[type] = Number(typeCount?.count || 0);
    }

    return {
      total: active + archived,
      active,
      archived,
      byType,
    };
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(record: schema.BlacklistSelect): BlacklistResponseDto {
    return {
      id: record.id,
      type: record.type as BlacklistType,
      entityId: record.entityId ?? undefined,
      name: record.name,
      email: record.email ?? undefined,
      phone: record.phone ?? undefined,
      reason: record.reason ?? undefined,
      status: record.status as BlacklistStatus,
      blacklistedAt: record.blacklistedAt,
      archivedAt: record.archivedAt ?? undefined,
      expiresAt: record.expiresAt ?? undefined,
      createdBy: record.createdBy ?? undefined,
      createdAt: record.createdAt,
    };
  }
}

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateWarningMessageDto,
  UpdateWarningMessageDto,
  WarningMessageFilterDto,
  WarningMessageResponseDto,
  ContactType,
  WarningSeverity,
  WarningStatus,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class WarningMessagesService {
  private readonly logger = new Logger(WarningMessagesService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get warning messages with filters
   */
  async getWarningMessages(
    organizationId: string,
    filters: WarningMessageFilterDto,
  ): Promise<PaginatedResponseDto<WarningMessageResponseDto>> {
    const { type, status = WarningStatus.ACTIVE, severity, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions = [
        eq(schema.warningMessages.organizationId, organizationId),
        eq(schema.warningMessages.isDeleted, false),
        eq(schema.warningMessages.status, status),
      ];

      if (type) {
        conditions.push(eq(schema.warningMessages.type, type));
      }

      if (severity) {
        conditions.push(eq(schema.warningMessages.severity, severity));
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.warningMessages)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.warningMessages)
        .where(and(...conditions))
        .orderBy(asc(schema.warningMessages.displayOrder), desc(schema.warningMessages.createdAt))
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
      this.logger.error(`Error fetching warning messages: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single warning message by ID
   */
  async getWarningMessage(id: string, organizationId: string): Promise<WarningMessageResponseDto> {
    const [message] = await this.db
      .select()
      .from(schema.warningMessages)
      .where(
        and(
          eq(schema.warningMessages.id, id),
          eq(schema.warningMessages.organizationId, organizationId),
          eq(schema.warningMessages.isDeleted, false),
        ),
      );

    if (!message) {
      throw new NotFoundException(`Warning message with ID ${id} not found`);
    }

    return this.mapToResponse(message);
  }

  /**
   * Get active warning messages by type (for display in UI)
   */
  async getActiveWarningsForType(organizationId: string, type: ContactType): Promise<WarningMessageResponseDto[]> {
    const data = await this.db
      .select()
      .from(schema.warningMessages)
      .where(
        and(
          eq(schema.warningMessages.organizationId, organizationId),
          eq(schema.warningMessages.type, type),
          eq(schema.warningMessages.status, 'active'),
          eq(schema.warningMessages.isDeleted, false),
        ),
      )
      .orderBy(asc(schema.warningMessages.displayOrder));

    return data.map(this.mapToResponse);
  }

  /**
   * Create warning message
   */
  async createWarningMessage(
    organizationId: string,
    dto: CreateWarningMessageDto,
    userId: string,
  ): Promise<WarningMessageResponseDto> {
    try {
      // Get max display order for the type
      const [maxOrder] = await this.db
        .select({ maxOrder: schema.warningMessages.displayOrder })
        .from(schema.warningMessages)
        .where(
          and(
            eq(schema.warningMessages.organizationId, organizationId),
            eq(schema.warningMessages.type, dto.type),
          ),
        )
        .orderBy(desc(schema.warningMessages.displayOrder))
        .limit(1);

      const displayOrder = dto.displayOrder ?? ((maxOrder?.maxOrder ?? 0) + 1);

      const [created] = await this.db
        .insert(schema.warningMessages)
        .values({
          organizationId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          severity: dto.severity ?? WarningSeverity.WARNING,
          displayOrder,
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Created warning message ${created.id} for organization ${organizationId}`);
      return this.mapToResponse(created);
    } catch (error) {
      this.logger.error(`Error creating warning message: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update warning message
   */
  async updateWarningMessage(
    id: string,
    organizationId: string,
    dto: UpdateWarningMessageDto,
    userId: string,
  ): Promise<WarningMessageResponseDto> {
    await this.getWarningMessage(id, organizationId);

    const [updated] = await this.db
      .update(schema.warningMessages)
      .set({
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.warningMessages.id, id),
          eq(schema.warningMessages.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Updated warning message ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Archive warning message
   */
  async archiveWarningMessage(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<WarningMessageResponseDto> {
    await this.getWarningMessage(id, organizationId);

    const [updated] = await this.db
      .update(schema.warningMessages)
      .set({
        status: 'archived',
        archivedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.warningMessages.id, id),
          eq(schema.warningMessages.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Archived warning message ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Restore archived warning message
   */
  async restoreWarningMessage(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<WarningMessageResponseDto> {
    await this.getWarningMessage(id, organizationId);

    const [updated] = await this.db
      .update(schema.warningMessages)
      .set({
        status: 'active',
        archivedAt: null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.warningMessages.id, id),
          eq(schema.warningMessages.organizationId, organizationId),
        ),
      )
      .returning();

    this.logger.log(`Restored warning message ${id}`);
    return this.mapToResponse(updated);
  }

  /**
   * Delete warning message (soft delete)
   */
  async deleteWarningMessage(id: string, organizationId: string, userId: string): Promise<void> {
    await this.getWarningMessage(id, organizationId);

    await this.db
      .update(schema.warningMessages)
      .set({
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.warningMessages.id, id),
          eq(schema.warningMessages.organizationId, organizationId),
        ),
      );

    this.logger.log(`Deleted warning message ${id}`);
  }

  /**
   * Reorder warning messages
   */
  async reorderWarningMessages(
    organizationId: string,
    orderedIds: string[],
    userId: string,
  ): Promise<void> {
    try {
      // Update display order for each message
      for (let i = 0; i < orderedIds.length; i++) {
        await this.db
          .update(schema.warningMessages)
          .set({
            displayOrder: i + 1,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.warningMessages.id, orderedIds[i]),
              eq(schema.warningMessages.organizationId, organizationId),
            ),
          );
      }

      this.logger.log(`Reordered ${orderedIds.length} warning messages`);
    } catch (error) {
      this.logger.error(`Error reordering warning messages: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get warning message stats
   */
  async getWarningMessageStats(organizationId: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const baseCondition = and(
      eq(schema.warningMessages.organizationId, organizationId),
      eq(schema.warningMessages.isDeleted, false),
    );

    const [activeCount] = await this.db
      .select({ count: count() })
      .from(schema.warningMessages)
      .where(and(baseCondition, eq(schema.warningMessages.status, 'active')));

    const [archivedCount] = await this.db
      .select({ count: count() })
      .from(schema.warningMessages)
      .where(and(baseCondition, eq(schema.warningMessages.status, 'archived')));

    const active = Number(activeCount?.count || 0);
    const archived = Number(archivedCount?.count || 0);

    // Get by type
    const byType: Record<string, number> = {};
    for (const type of Object.values(ContactType)) {
      const [typeCount] = await this.db
        .select({ count: count() })
        .from(schema.warningMessages)
        .where(
          and(
            baseCondition,
            eq(schema.warningMessages.type, type),
            eq(schema.warningMessages.status, 'active'),
          ),
        );
      byType[type] = Number(typeCount?.count || 0);
    }

    // Get by severity
    const bySeverity: Record<string, number> = {};
    for (const severity of Object.values(WarningSeverity)) {
      const [severityCount] = await this.db
        .select({ count: count() })
        .from(schema.warningMessages)
        .where(
          and(
            baseCondition,
            eq(schema.warningMessages.severity, severity),
            eq(schema.warningMessages.status, 'active'),
          ),
        );
      bySeverity[severity] = Number(severityCount?.count || 0);
    }

    return {
      total: active + archived,
      active,
      archived,
      byType,
      bySeverity,
    };
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(record: schema.WarningMessageSelect): WarningMessageResponseDto {
    return {
      id: record.id,
      type: record.type as ContactType,
      title: record.title,
      message: record.message,
      severity: record.severity as WarningSeverity,
      status: record.status as WarningStatus,
      displayOrder: record.displayOrder ?? 0,
      archivedAt: record.archivedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, count, between, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportFilterDto,
  GenerateReportDto,
  ReportResponseDto,
  ReportType,
  PaginatedResponseDto,
} from './dto/settings-extended.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get saved reports with filters
   */
  async getReports(
    organizationId: string,
    filters: ReportFilterDto,
  ): Promise<PaginatedResponseDto<ReportResponseDto>> {
    const { reportType, isScheduled, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    try {
      const conditions = [
        eq(schema.reports.organizationId, organizationId),
        eq(schema.reports.isDeleted, false),
      ];

      if (reportType) {
        conditions.push(eq(schema.reports.reportType, reportType));
      }

      if (isScheduled !== undefined) {
        conditions.push(eq(schema.reports.isScheduled, isScheduled));
      }

      // Get total count
      const [countResult] = await this.db
        .select({ count: count() })
        .from(schema.reports)
        .where(and(...conditions));

      const total = Number(countResult?.count || 0);

      // Get paginated data
      const data = await this.db
        .select()
        .from(schema.reports)
        .where(and(...conditions))
        .orderBy(desc(schema.reports.createdAt))
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
      this.logger.error(`Error fetching reports: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get single report by ID
   */
  async getReport(id: string, organizationId: string): Promise<ReportResponseDto> {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(
        and(
          eq(schema.reports.id, id),
          eq(schema.reports.organizationId, organizationId),
          eq(schema.reports.isDeleted, false),
        ),
      );

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return this.mapToResponse(report);
  }

  /**
   * Create saved report
   */
  async createReport(
    organizationId: string,
    dto: CreateReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    try {
      const [created] = await this.db
        .insert(schema.reports)
        .values({
          organizationId,
          name: dto.name,
          reportType: dto.reportType,
          parameters: dto.parameters ? JSON.stringify(dto.parameters) : null,
          schedule: dto.schedule ? JSON.stringify(dto.schedule) : null,
          isScheduled: dto.isScheduled ?? false,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      this.logger.log(`Created report ${created.id} for organization ${organizationId}`);
      return this.mapToResponse(created);
    } catch (error) {
      this.logger.error(`Error creating report: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update report
   */
  async updateReport(
    id: string,
    organizationId: string,
    dto: UpdateReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    await this.getReport(id, organizationId);

    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.reportType) updateData.reportType = dto.reportType;
    if (dto.parameters) updateData.parameters = JSON.stringify(dto.parameters);
    if (dto.schedule) updateData.schedule = JSON.stringify(dto.schedule);
    if (dto.isScheduled !== undefined) updateData.isScheduled = dto.isScheduled;

    const [updated] = await this.db
      .update(schema.reports)
      .set(updateData)
      .where(
        and(
          eq(schema.reports.id, id),
          eq(schema.reports.organizationId, organizationId),
        ),
      )
      .returning();

    return this.mapToResponse(updated);
  }

  /**
   * Delete report (soft delete)
   */
  async deleteReport(id: string, organizationId: string, userId: string): Promise<void> {
    await this.getReport(id, organizationId);

    await this.db
      .update(schema.reports)
      .set({
        isDeleted: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.reports.id, id),
          eq(schema.reports.organizationId, organizationId),
        ),
      );

    this.logger.log(`Deleted report ${id}`);
  }

  /**
   * Generate report data (returns data for download/export)
   */
  async generateReportData(
    reportId: string,
    organizationId: string,
    options: GenerateReportDto,
    userId: string,
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    format: string;
    data: any[];
    summary: Record<string, any>;
  }> {
    const report = await this.getReport(reportId, organizationId);
    const { startDate, endDate, format = 'json' } = options;

    // Merge report parameters with generation options
    const params = {
      ...report.parameters,
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
    };

    let data: any[] = [];
    let summary: Record<string, any> = {};

    // Generate report based on type
    switch (report.reportType) {
      case ReportType.PACKAGES:
        ({ data, summary } = await this.generatePackagesReport(organizationId, params));
        break;
      case ReportType.CARRIERS:
        ({ data, summary } = await this.generateCarriersReport(organizationId, params));
        break;
      case ReportType.PERFORMANCE:
        ({ data, summary } = await this.generatePerformanceReport(organizationId, params));
        break;
      case ReportType.ACTIVITY:
        ({ data, summary } = await this.generateActivityReport(organizationId, params));
        break;
      default:
        throw new Error(`Unsupported report type: ${report.reportType}`);
    }

    // Update last generated timestamp
    await this.db
      .update(schema.reports)
      .set({
        lastGeneratedAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));

    return {
      reportId,
      generatedAt: new Date(),
      format,
      data,
      summary,
    };
  }

  /**
   * Generate packages report
   */
  private async generatePackagesReport(
    organizationId: string,
    params: Record<string, any>,
  ): Promise<{ data: any[]; summary: Record<string, any> }> {
    // This would query actual packages data
    // Placeholder implementation
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    return {
      data: [],
      summary: {
        totalPackages: 0,
        received: 0,
        delivered: 0,
        returned: 0,
        pending: 0,
        periodStart: startDate,
        periodEnd: endDate,
      },
    };
  }

  /**
   * Generate carriers report
   */
  private async generateCarriersReport(
    organizationId: string,
    params: Record<string, any>,
  ): Promise<{ data: any[]; summary: Record<string, any> }> {
    return {
      data: [],
      summary: {
        totalCarriers: 0,
        activeCarriers: 0,
        totalDeliveries: 0,
        onTimeRate: 0,
      },
    };
  }

  /**
   * Generate performance report
   */
  private async generatePerformanceReport(
    organizationId: string,
    params: Record<string, any>,
  ): Promise<{ data: any[]; summary: Record<string, any> }> {
    return {
      data: [],
      summary: {
        averageProcessingTime: 0,
        peakHours: [],
        efficiency: 0,
      },
    };
  }

  /**
   * Generate activity report
   */
  private async generateActivityReport(
    organizationId: string,
    params: Record<string, any>,
  ): Promise<{ data: any[]; summary: Record<string, any> }> {
    return {
      data: [],
      summary: {
        totalActions: 0,
        uniqueUsers: 0,
        topActions: [],
      },
    };
  }

  /**
   * Get quick stats for reports overview
   */
  async getQuickStats(organizationId: string): Promise<{
    packages: { today: number; week: number; month: number };
    carriers: { active: number; total: number };
    performance: { avgProcessingTime: string; efficiency: number };
  }> {
    // Placeholder - would query actual data
    return {
      packages: { today: 0, week: 0, month: 0 },
      carriers: { active: 0, total: 0 },
      performance: { avgProcessingTime: '0h 0m', efficiency: 0 },
    };
  }

  /**
   * Get available report types
   */
  getReportTypes(): { id: ReportType; name: string; description: string }[] {
    return [
      {
        id: ReportType.PACKAGES,
        name: 'Package Report',
        description: 'Detailed report of all package activities and statuses',
      },
      {
        id: ReportType.CARRIERS,
        name: 'Carrier Report',
        description: 'Performance and activity report for all carriers',
      },
      {
        id: ReportType.PERFORMANCE,
        name: 'Performance Report',
        description: 'Operational efficiency and performance metrics',
      },
      {
        id: ReportType.ACTIVITY,
        name: 'Activity Report',
        description: 'User activity and audit log report',
      },
      {
        id: ReportType.CUSTOM,
        name: 'Custom Report',
        description: 'Create a custom report with specific parameters',
      },
    ];
  }

  /**
   * Map database record to response DTO
   */
  private mapToResponse(record: schema.ReportSelect): ReportResponseDto {
    return {
      id: record.id,
      name: record.name,
      reportType: record.reportType as ReportType,
      parameters: record.parameters ? JSON.parse(record.parameters as string) : undefined,
      schedule: record.schedule ? JSON.parse(record.schedule as string) : undefined,
      isScheduled: record.isScheduled,
      lastGeneratedAt: record.lastGeneratedAt ?? undefined,
      fileUrl: record.fileUrl ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

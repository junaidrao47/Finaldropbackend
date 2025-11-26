import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, and, gte, lte, count, desc, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import {
  DashboardFilterDto,
  DashboardPeriod,
  DashboardStatsResponse,
  KanbanBoardResponse,
  KanbanStatusColumn,
  RecentActivityResponse,
  DashboardChartResponse,
  WarehouseOccupancyResponse,
  TopCarriersResponse,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE_CLIENT')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Get dashboard summary statistics (DASH-001)
   */
  async getStats(filter: DashboardFilterDto, userId?: string): Promise<DashboardStatsResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);

    // Get current period counts
    const currentPeriod = await this.getPackageCounts(dateFrom, dateTo, filter.organizationId, filter.warehouseId);

    // Get previous period counts for comparison
    const periodDuration = dateTo.getTime() - dateFrom.getTime();
    const prevDateTo = new Date(dateFrom.getTime() - 1);
    const prevDateFrom = new Date(prevDateTo.getTime() - periodDuration);
    const previousPeriod = await this.getPackageCounts(prevDateFrom, prevDateTo, filter.organizationId, filter.warehouseId);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalPackagesReceived: currentPeriod.received,
      totalPackagesDelivered: currentPeriod.delivered,
      totalPackagesPending: currentPeriod.pending,
      totalPackagesReturned: currentPeriod.returned,
      receivedChangePercent: calcChange(currentPeriod.received, previousPeriod.received),
      deliveredChangePercent: calcChange(currentPeriod.delivered, previousPeriod.delivered),
      pendingChangePercent: calcChange(currentPeriod.pending, previousPeriod.pending),
      returnedChangePercent: calcChange(currentPeriod.returned, previousPeriod.returned),
      avgProcessingTimeHours: 24, // Placeholder - would need additional fields in schema
      customerSatisfactionScore: 4.5, // Placeholder - would come from feedback system
    };
  }

  /**
   * Get Kanban board data for transactions (DASH-002)
   */
  async getKanbanBoard(
    transactionType: string,
    filter: DashboardFilterDto,
  ): Promise<KanbanBoardResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);

    // Get all statuses for this transaction type from status table
    const statuses = await this.db
      .select()
      .from(schema.status)
      .where(eq(schema.status.category, transactionType))
      .orderBy(schema.status.sortOrder);

    const columns: KanbanStatusColumn[] = [];

    for (const status of statuses) {
      // Get packages in this status
      const packages = await this.db
        .select({
          id: schema.packages.id,
          trackingNumber: schema.packages.trackingNumber,
          recipientName: schema.packages.recipientName,
          createdAt: schema.packages.createdAt,
        })
        .from(schema.packages)
        .where(
          and(
            eq(schema.packages.status, status.name),
            filter.organizationId ? eq(schema.packages.organizationId, filter.organizationId) : sql`1=1`,
            filter.warehouseId ? eq(schema.packages.warehouseId, filter.warehouseId) : sql`1=1`,
            gte(schema.packages.createdAt, dateFrom),
            lte(schema.packages.createdAt, dateTo),
          ),
        )
        .limit(50)
        .orderBy(desc(schema.packages.createdAt));

      columns.push({
        statusId: status.id,
        statusName: status.name,
        statusCode: status.name,
        color: status.color || '#6B7280',
        count: packages.length,
        packages: packages.map((p) => ({
          id: p.id,
          trackingNumber: p.trackingNumber || '',
          recipientName: p.recipientName || '',
          carrierName: 'Unknown', // Would need to join with carriers
          createdAt: p.createdAt || new Date(),
          priority: 'normal',
        })),
      });
    }

    return {
      transactionType,
      columns,
      totalCount: columns.reduce((sum, col) => sum + col.count, 0),
    };
  }

  /**
   * Get recent activity (DASH-003)
   */
  async getRecentActivity(
    filter: DashboardFilterDto,
    limit: number = 20,
  ): Promise<RecentActivityResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);

    const activities = await this.db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityName: schema.auditLogs.entityName,
        entityId: schema.auditLogs.entityId,
        userId: schema.auditLogs.userId,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
        timestamp: schema.auditLogs.createdAt,
        oldValues: schema.auditLogs.oldValues,
        newValues: schema.auditLogs.newValues,
        memo: schema.auditLogs.memo,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(
        and(
          gte(schema.auditLogs.createdAt, dateFrom),
          lte(schema.auditLogs.createdAt, dateTo),
          filter.organizationId ? eq(schema.auditLogs.organizationId, filter.organizationId) : sql`1=1`,
        ),
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return {
      activities: activities.map((a) => ({
        id: a.id,
        activityType: this.getActivityType(a.action, a.entityName),
        description: a.memo || this.getActivityDescription(a.action, a.entityName, a.newValues),
        entityType: a.entityName || '',
        entityId: a.entityId || '',
        userId: a.userId || '',
        userName: `${a.userFirstName || ''} ${a.userLastName || ''}`.trim() || 'System',
        timestamp: a.timestamp || new Date(),
        metadata: a.newValues as Record<string, any> | undefined,
      })),
      total: activities.length,
    };
  }

  /**
   * Get chart data for packages over time
   */
  async getPackageChart(
    filter: DashboardFilterDto,
    chartType: string = 'line',
  ): Promise<DashboardChartResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);

    // Group by day
    const groupBy = 'day';

    const data = await this.db
      .select({
        date: sql<string>`DATE_TRUNC(${groupBy}, ${schema.packages.createdAt})::text`,
        count: count(),
      })
      .from(schema.packages)
      .where(
        and(
          gte(schema.packages.createdAt, dateFrom),
          lte(schema.packages.createdAt, dateTo),
          filter.organizationId ? eq(schema.packages.organizationId, filter.organizationId) : sql`1=1`,
        ),
      )
      .groupBy(sql`DATE_TRUNC(${groupBy}, ${schema.packages.createdAt})`)
      .orderBy(sql`DATE_TRUNC(${groupBy}, ${schema.packages.createdAt})`);

    return {
      chartType,
      title: 'Packages Over Time',
      data: data.map((d) => ({
        label: this.formatDateLabel(d.date, groupBy),
        value: d.count,
        date: d.date,
      })),
      period: filter.period || 'last_30_days',
    };
  }

  /**
   * Get warehouse occupancy data
   */
  async getWarehouseOccupancy(organizationId?: string): Promise<WarehouseOccupancyResponse> {
    const whereClause = organizationId 
      ? and(eq(schema.organizationsWarehousesLocations.isActive, true), eq(schema.organizationsWarehousesLocations.organizationId, organizationId))
      : eq(schema.organizationsWarehousesLocations.isActive, true);

    const warehouses = await this.db
      .select({
        id: schema.organizationsWarehousesLocations.id,
        name: schema.organizationsWarehousesLocations.name,
      })
      .from(schema.organizationsWarehousesLocations)
      .where(whereClause);

    const result = await Promise.all(
      warehouses.map(async (warehouse) => {
        // Count packages in storage at this warehouse
        const [occupancy] = await this.db
          .select({ count: count() })
          .from(schema.packages)
          .where(
            and(
              eq(schema.packages.warehouseId, warehouse.id),
              or(
                eq(schema.packages.status, 'Received'),
                eq(schema.packages.status, 'Available'),
                eq(schema.packages.status, 'In Storage'),
              ),
            ),
          );

        const totalCapacity = 1000; // Default capacity - could add to warehouse schema
        const currentOccupancy = occupancy?.count || 0;

        return {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name || 'Unnamed Warehouse',
          totalCapacity,
          currentOccupancy,
          occupancyPercent: Math.round((currentOccupancy / totalCapacity) * 100),
        };
      }),
    );

    return { warehouses: result };
  }

  /**
   * Get top carriers by package count
   */
  async getTopCarriers(filter: DashboardFilterDto, limit: number = 10): Promise<TopCarriersResponse> {
    // Since packages don't have carrierId, we'll return carriers ordered by creation date
    // In a real implementation, you'd add carrierId to packages schema
    const carriers = await this.db
      .select({
        carrierId: schema.carriers.id,
        carrierName: schema.carriers.businessName,
      })
      .from(schema.carriers)
      .where(eq(schema.carriers.isDeleted, false))
      .limit(limit);

    return {
      carriers: carriers.map((c) => ({
        carrierId: c.carrierId,
        carrierName: c.carrierName || 'Unknown Carrier',
        packageCount: 0, // Would need carrierId on packages to calculate
        avgDeliveryTimeHours: 24,
      })),
      period: filter.period || 'last_30_days',
    };
  }

  // Helper methods

  private getDateRange(filter: DashboardFilterDto): { dateFrom: Date; dateTo: Date; period: string } {
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;
    const period = filter.period || DashboardPeriod.LAST_30_DAYS;

    if (filter.dateFrom && filter.dateTo) {
      return {
        dateFrom: new Date(filter.dateFrom),
        dateTo: new Date(filter.dateTo),
        period: 'custom',
      };
    }

    switch (period) {
      case DashboardPeriod.TODAY:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case DashboardPeriod.YESTERDAY:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case DashboardPeriod.LAST_7_DAYS:
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case DashboardPeriod.THIS_MONTH:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case DashboardPeriod.LAST_MONTH:
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case DashboardPeriod.LAST_30_DAYS:
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return { dateFrom, dateTo, period };
  }

  private async getPackageCounts(
    dateFrom: Date,
    dateTo: Date,
    organizationId?: string,
    warehouseId?: string,
  ): Promise<{ received: number; delivered: number; pending: number; returned: number }> {
    const baseWhere = and(
      gte(schema.packages.createdAt, dateFrom),
      lte(schema.packages.createdAt, dateTo),
      organizationId ? eq(schema.packages.organizationId, organizationId) : sql`1=1`,
      warehouseId ? eq(schema.packages.warehouseId, warehouseId) : sql`1=1`,
      eq(schema.packages.isDeleted, false),
    );

    // Count by status field
    const [received] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Received')));

    const [delivered] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Delivered')));

    const [pending] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, or(
        eq(schema.packages.status, 'Pending'),
        eq(schema.packages.status, 'Available'),
        eq(schema.packages.status, 'In Storage'),
      )));

    const [returned] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Returned')));

    return {
      received: received?.count || 0,
      delivered: delivered?.count || 0,
      pending: pending?.count || 0,
      returned: returned?.count || 0,
    };
  }

  private getActivityType(action: string | null, entityName: string | null): string {
    if (!action || !entityName) return 'system';
    return `${entityName.toLowerCase()}_${action.toLowerCase()}`;
  }

  private getActivityDescription(
    action: string | null,
    entityName: string | null,
    newValues: unknown,
  ): string {
    if (!action || !entityName) return 'System activity';
    const values = newValues as Record<string, unknown> | null;
    const name = values?.trackingNumber || values?.name || values?.email || 'item';
    return `${action} ${entityName}: ${name}`;
  }

  private formatDateLabel(date: string, groupBy: string): string {
    const d = new Date(date);
    if (groupBy === 'hour') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

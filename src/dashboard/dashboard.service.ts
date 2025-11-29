import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, and, gte, lte, count, desc, or, like, asc } from 'drizzle-orm';
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
  SummaryStatisticsResponse,
  PerformanceChartResponse,
  RecentTransactionsResponse,
  RecentTransactionsQueryDto,
  RecentActivitySummaryResponse,
  PerformanceChartQueryDto,
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
      totalPackagesTransferred: currentPeriod.transferred,
      totalPackagesCancelled: currentPeriod.cancelled,
      receivedChangePercent: calcChange(currentPeriod.received, previousPeriod.received),
      deliveredChangePercent: calcChange(currentPeriod.delivered, previousPeriod.delivered),
      pendingChangePercent: calcChange(currentPeriod.pending, previousPeriod.pending),
      returnedChangePercent: calcChange(currentPeriod.returned, previousPeriod.returned),
      transferredChangePercent: calcChange(currentPeriod.transferred, previousPeriod.transferred),
      cancelledChangePercent: calcChange(currentPeriod.cancelled, previousPeriod.cancelled),
      avgProcessingTimeHours: 24, // Placeholder - would need additional fields in schema
      customerSatisfactionScore: 4.5, // Placeholder - would come from feedback system
    };
  }

  /**
   * Get summary statistics formatted for the dashboard design (6 cards)
   */
  async getSummaryStatistics(filter: DashboardFilterDto): Promise<SummaryStatisticsResponse> {
    const stats = await this.getStats(filter);

    const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
      if (change > 0) return 'up';
      if (change < 0) return 'down';
      return 'neutral';
    };

    return {
      received: {
        count: stats.totalPackagesReceived,
        changePercent: stats.receivedChangePercent,
        trend: getTrend(stats.receivedChangePercent),
      },
      delivered: {
        count: stats.totalPackagesDelivered,
        changePercent: stats.deliveredChangePercent,
        trend: getTrend(stats.deliveredChangePercent),
      },
      transferred: {
        count: stats.totalPackagesTransferred,
        changePercent: stats.transferredChangePercent,
        trend: getTrend(stats.transferredChangePercent),
      },
      return: {
        count: stats.totalPackagesReturned,
        changePercent: stats.returnedChangePercent,
        trend: getTrend(stats.returnedChangePercent),
      },
      pending: {
        count: stats.totalPackagesPending,
        changePercent: stats.pendingChangePercent,
        trend: getTrend(stats.pendingChangePercent),
      },
      cancelled: {
        count: stats.totalPackagesCancelled,
        changePercent: stats.cancelledChangePercent,
        trend: getTrend(stats.cancelledChangePercent),
      },
    };
  }

  /**
   * Get performance chart data - weekly line chart with multiple series
   */
  async getPerformanceChart(filter: PerformanceChartQueryDto): Promise<PerformanceChartResponse> {
    const { dateFrom, dateTo, period } = this.getDateRange(filter);

    // Get daily data for the period
    const days = this.getDaysInRange(dateFrom, dateTo);
    const labels = days.map((d) => this.formatDayLabel(d));

    // Initialize datasets
    const datasets: { [key: string]: number[] } = {
      Received: [],
      Delivered: [],
      Transferred: [],
      Returned: [],
      Pending: [],
    };

    // Fetch data for each day
    for (const day of days) {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const counts = await this.getPackageCountsForDay(day, nextDay, filter.organizationId, filter.warehouseId);
      datasets.Received.push(counts.received);
      datasets.Delivered.push(counts.delivered);
      datasets.Transferred.push(counts.transferred);
      datasets.Returned.push(counts.returned);
      datasets.Pending.push(counts.pending);
    }

    return {
      period,
      labels,
      datasets: [
        { name: 'Received', color: '#10B981', data: datasets.Received },
        { name: 'Delivered', color: '#F59E0B', data: datasets.Delivered },
        { name: 'Transferred', color: '#3B82F6', data: datasets.Transferred },
        { name: 'Returned', color: '#EF4444', data: datasets.Returned },
        { name: 'Pending', color: '#8B5CF6', data: datasets.Pending },
      ],
    };
  }

  /**
   * Get recent transactions for the dashboard table
   */
  async getRecentTransactions(query: RecentTransactionsQueryDto): Promise<RecentTransactionsResponse> {
    const { dateFrom, dateTo } = this.getDateRange(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [
      gte(schema.packages.createdAt, dateFrom),
      lte(schema.packages.createdAt, dateTo),
      eq(schema.packages.isDeleted, false),
    ];

    if (query.organizationId) {
      whereConditions.push(eq(schema.packages.organizationId, query.organizationId));
    }
    if (query.warehouseId) {
      whereConditions.push(eq(schema.packages.warehouseId, query.warehouseId));
    }
    if (query.status) {
      whereConditions.push(eq(schema.packages.status, query.status));
    }
    if (query.search) {
      whereConditions.push(
        or(
          like(schema.packages.trackingNumber, `%${query.search}%`),
          like(schema.packages.recipientName, `%${query.search}%`),
          like(schema.packages.invoiceNumber, `%${query.search}%`),
        ) as any,
      );
    }

    // Get total count
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(...whereConditions));

    const total = totalResult?.count || 0;

    // Get transactions with user joins
    const transactions = await this.db
      .select({
        id: schema.packages.id,
        createdAt: schema.packages.createdAt,
        status: schema.packages.status,
        invoiceNumber: schema.packages.invoiceNumber,
        trackingNumber: schema.packages.trackingNumber,
        recipientName: schema.packages.recipientName,
        createdById: schema.packages.createdBy,
        creatorFirstName: schema.users.firstName,
        creatorLastName: schema.users.lastName,
      })
      .from(schema.packages)
      .leftJoin(schema.users, eq(schema.packages.createdBy, schema.users.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.packages.createdAt))
      .limit(limit)
      .offset(offset);

    const statusColors: Record<string, string> = {
      Delivered: '#10B981',
      Received: '#3B82F6',
      Pending: '#F59E0B',
      Returned: '#EF4444',
      Cancelled: '#6B7280',
      Transferred: '#8B5CF6',
      'In Transit': '#06B6D4',
    };

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.createdAt || new Date(),
        deliveredBy: {
          id: t.createdById || '',
          name: `${t.creatorFirstName || ''} ${t.creatorLastName || ''}`.trim() || 'Unknown',
        },
        receiver: {
          id: '',
          name: t.recipientName || 'Unknown',
        },
        status: t.status || 'Unknown',
        statusColor: statusColors[t.status || ''] || '#6B7280',
        invoice: t.invoiceNumber || '',
        tracking: t.trackingNumber || '',
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get recent activity summary for dashboard (Dispatched, Blacklist, Linked devices, Received)
   */
  async getActivitySummary(filter: DashboardFilterDto): Promise<RecentActivitySummaryResponse> {
    const { dateFrom, dateTo } = this.getDateRange(filter);

    // Get dispatched count (packages that are out for delivery)
    const [dispatchedResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          gte(schema.packages.createdAt, dateFrom),
          lte(schema.packages.createdAt, dateTo),
          or(
            eq(schema.packages.status, 'Dispatched'),
            eq(schema.packages.status, 'Out for Delivery'),
            eq(schema.packages.status, 'In Transit'),
          ),
          filter.organizationId ? eq(schema.packages.organizationId, filter.organizationId) : sql`1=1`,
        ),
      );

    // Get received count
    const [receivedResult] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(
        and(
          gte(schema.packages.createdAt, dateFrom),
          lte(schema.packages.createdAt, dateTo),
          eq(schema.packages.status, 'Received'),
          filter.organizationId ? eq(schema.packages.organizationId, filter.organizationId) : sql`1=1`,
        ),
      );

    // Get linked devices count (from users_trusted_devices table)
    let linkedDevicesCount = 0;
    try {
      const [devicesResult] = await this.db
        .select({ count: count() })
        .from(schema.usersTrustedDevices)
        .where(
          and(
            gte(schema.usersTrustedDevices.createdAt, dateFrom),
            lte(schema.usersTrustedDevices.createdAt, dateTo),
          ),
        );
      linkedDevicesCount = devicesResult?.count || 0;
    } catch {
      // Table might not exist or have different structure
      linkedDevicesCount = 0;
    }

    // Get blacklist count - currently not in schema, return 0
    // This would need a separate blacklist table or field on users
    const blacklistCount = 0;

    return {
      dispatched: dispatchedResult?.count || 0,
      blacklist: blacklistCount,
      linkedDevices: linkedDevicesCount,
      received: receivedResult?.count || 0,
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
      case DashboardPeriod.THIS_WEEK:
        // Get Monday of current week
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        dateFrom.setHours(0, 0, 0, 0);
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
  ): Promise<{ received: number; delivered: number; pending: number; returned: number; transferred: number; cancelled: number }> {
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

    const [transferred] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Transferred')));

    const [cancelled] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Cancelled')));

    return {
      received: received?.count || 0,
      delivered: delivered?.count || 0,
      pending: pending?.count || 0,
      returned: returned?.count || 0,
      transferred: transferred?.count || 0,
      cancelled: cancelled?.count || 0,
    };
  }

  private async getPackageCountsForDay(
    dateFrom: Date,
    dateTo: Date,
    organizationId?: string,
    warehouseId?: string,
  ): Promise<{ received: number; delivered: number; pending: number; returned: number; transferred: number }> {
    const baseWhere = and(
      gte(schema.packages.createdAt, dateFrom),
      lte(schema.packages.createdAt, dateTo),
      organizationId ? eq(schema.packages.organizationId, organizationId) : sql`1=1`,
      warehouseId ? eq(schema.packages.warehouseId, warehouseId) : sql`1=1`,
      eq(schema.packages.isDeleted, false),
    );

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

    const [transferred] = await this.db
      .select({ count: count() })
      .from(schema.packages)
      .where(and(baseWhere, eq(schema.packages.status, 'Transferred')));

    return {
      received: received?.count || 0,
      delivered: delivered?.count || 0,
      pending: pending?.count || 0,
      returned: returned?.count || 0,
      transferred: transferred?.count || 0,
    };
  }

  private getDaysInRange(dateFrom: Date, dateTo: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(dateFrom);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  private formatDayLabel(date: Date): string {
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return dayNames[date.getDay()];
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

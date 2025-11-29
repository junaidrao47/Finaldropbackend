import { IsString, IsOptional, IsDateString, IsNumber, IsUUID, IsEnum, IsArray, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Dashboard Filter Period
 */
export enum DashboardPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_WEEK = 'this_week',
  CUSTOM = 'custom',
}

/**
 * Dashboard Filter DTO
 */
export class DashboardFilterDto {
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

/**
 * Summary Statistics Response - matches design with 6 cards
 */
export interface SummaryStatisticsResponse {
  received: StatCard;
  delivered: StatCard;
  transferred: StatCard;
  return: StatCard;
  pending: StatCard;
  cancelled: StatCard;
}

export interface StatCard {
  count: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

/**
 * Performance Chart Response - Weekly line chart with multiple series
 */
export interface PerformanceChartResponse {
  period: string;
  labels: string[]; // ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  datasets: PerformanceDataset[];
}

export interface PerformanceDataset {
  name: string; // 'Received', 'Delivered', 'Transferred', 'Returned', 'Pending'
  color: string;
  data: number[];
}

/**
 * Recent Transactions Response - Table data
 */
export interface RecentTransactionsResponse {
  transactions: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TransactionItem {
  id: string;
  date: Date;
  deliveredBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: string;
  statusColor: string;
  invoice: string;
  tracking: string;
}

/**
 * Recent Activity Summary Response - Activity counts for dashboard
 */
export interface RecentActivitySummaryResponse {
  dispatched: number;
  blacklist: number;
  linkedDevices: number;
  received: number;
}

/**
 * Dashboard Statistics Response (Legacy - keeping for backward compatibility)
 */
export interface DashboardStatsResponse {
  // Summary Cards (DASH-001)
  totalPackagesReceived: number;
  totalPackagesDelivered: number;
  totalPackagesPending: number;
  totalPackagesReturned: number;
  totalPackagesTransferred: number;
  totalPackagesCancelled: number;

  // Change percentages
  receivedChangePercent: number;
  deliveredChangePercent: number;
  pendingChangePercent: number;
  returnedChangePercent: number;
  transferredChangePercent: number;
  cancelledChangePercent: number;

  // Additional stats
  avgProcessingTimeHours: number;
  customerSatisfactionScore: number;
}

/**
 * Kanban Board Status Response (DASH-002)
 */
export interface KanbanStatusColumn {
  statusId: string;
  statusName: string;
  statusCode: string;
  color: string;
  count: number;
  packages: KanbanPackageItem[];
}

export interface KanbanPackageItem {
  id: string;
  trackingNumber: string;
  recipientName: string;
  carrierName: string;
  createdAt: Date;
  priority: string;
}

export interface KanbanBoardResponse {
  transactionType: string; // Receive, Deliver, Return
  columns: KanbanStatusColumn[];
  totalCount: number;
}

/**
 * Recent Activity Response (DASH-003)
 */
export interface RecentActivityItem {
  id: string;
  activityType: string; // package_received, package_delivered, user_login, etc.
  description: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RecentActivityResponse {
  activities: RecentActivityItem[];
  total: number;
}

/**
 * Chart Data Response
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface DashboardChartResponse {
  chartType: string; // line, bar, pie
  title: string;
  data: ChartDataPoint[];
  period: string;
}

/**
 * Warehouse Occupancy Response
 */
export interface WarehouseOccupancyItem {
  warehouseId: string;
  warehouseName: string;
  totalCapacity: number;
  currentOccupancy: number;
  occupancyPercent: number;
}

export interface WarehouseOccupancyResponse {
  warehouses: WarehouseOccupancyItem[];
}

/**
 * Top Carriers Response
 */
export interface TopCarrierItem {
  carrierId: string;
  carrierName: string;
  packageCount: number;
  avgDeliveryTimeHours: number;
}

export interface TopCarriersResponse {
  carriers: TopCarrierItem[];
  period: string;
}

/**
 * Quick Stats Card DTO
 */
export class QuickStatsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statTypes?: string[]; // 'received', 'delivered', 'pending', 'returned'

  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod;
}

/**
 * Recent Transactions Query DTO
 */
export class RecentTransactionsQueryDto {
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Performance Chart Query DTO
 */
export class PerformanceChartQueryDto {
  @IsOptional()
  @IsEnum(DashboardPeriod)
  period?: DashboardPeriod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

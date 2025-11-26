import { IsString, IsOptional, IsDateString, IsNumber, IsUUID, IsEnum, IsArray } from 'class-validator';

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
 * Dashboard Statistics Response
 */
export interface DashboardStatsResponse {
  // Summary Cards (DASH-001)
  totalPackagesReceived: number;
  totalPackagesDelivered: number;
  totalPackagesPending: number;
  totalPackagesReturned: number;

  // Change percentages
  receivedChangePercent: number;
  deliveredChangePercent: number;
  pendingChangePercent: number;
  returnedChangePercent: number;

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

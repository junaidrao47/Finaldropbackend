import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { 
  DashboardFilterDto, 
  QuickStatsDto, 
  RecentTransactionsQueryDto, 
  PerformanceChartQueryDto 
} from './dto/dashboard.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard summary statistics (6 cards: Received, Delivered, Transferred, Return, Pending, Cancelled)
   * GET /dashboard/summary
   */
  @Get('summary')
  async getSummaryStatistics(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getSummaryStatistics(filter);
  }

  /**
   * Get performance chart data (Weekly line chart with multiple series)
   * GET /dashboard/performance
   */
  @Get('performance')
  async getPerformanceChart(@Query() filter: PerformanceChartQueryDto) {
    return this.dashboardService.getPerformanceChart(filter);
  }

  /**
   * Get recent transactions for dashboard table
   * GET /dashboard/transactions
   */
  @Get('transactions')
  async getRecentTransactions(@Query() query: RecentTransactionsQueryDto) {
    return this.dashboardService.getRecentTransactions(query);
  }

  /**
   * Get activity summary (Dispatched, Blacklist, Linked devices, Received)
   * GET /dashboard/activity-summary
   */
  @Get('activity-summary')
  async getActivitySummary(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getActivitySummary(filter);
  }

  /**
   * Get dashboard summary statistics (DASH-001) - Legacy endpoint
   * GET /dashboard/stats
   */
  @Get('stats')
  async getStats(@Query() filter: DashboardFilterDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.dashboardService.getStats(filter, userId);
  }

  /**
   * Get Kanban board data for Receive transactions (DASH-002)
   * GET /dashboard/kanban/receive
   */
  @Get('kanban/receive')
  async getReceiveKanban(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getKanbanBoard('receive', filter);
  }

  /**
   * Get Kanban board data for Deliver transactions (DASH-002)
   * GET /dashboard/kanban/deliver
   */
  @Get('kanban/deliver')
  async getDeliverKanban(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getKanbanBoard('deliver', filter);
  }

  /**
   * Get Kanban board data for Return transactions (DASH-002)
   * GET /dashboard/kanban/return
   */
  @Get('kanban/return')
  async getReturnKanban(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getKanbanBoard('return', filter);
  }

  /**
   * Get recent activity (DASH-003)
   * GET /dashboard/activity
   */
  @Get('activity')
  async getRecentActivity(
    @Query() filter: DashboardFilterDto,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getRecentActivity(filter, limit || 20);
  }

  /**
   * Get packages chart data
   * GET /dashboard/charts/packages
   */
  @Get('charts/packages')
  async getPackageChart(
    @Query() filter: DashboardFilterDto,
    @Query('chartType') chartType?: string,
  ) {
    return this.dashboardService.getPackageChart(filter, chartType || 'line');
  }

  /**
   * Get warehouse occupancy
   * GET /dashboard/warehouses/occupancy
   */
  @Get('warehouses/occupancy')
  async getWarehouseOccupancy(@Query('organizationId') organizationId?: string) {
    return this.dashboardService.getWarehouseOccupancy(organizationId);
  }

  /**
   * Get top carriers
   * GET /dashboard/carriers/top
   */
  @Get('carriers/top')
  async getTopCarriers(
    @Query() filter: DashboardFilterDto,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getTopCarriers(filter, limit || 10);
  }

  /**
   * Get quick stats for specific metrics
   * GET /dashboard/quick-stats
   */
  @Get('quick-stats')
  async getQuickStats(@Query() params: QuickStatsDto) {
    const filter: DashboardFilterDto = { period: params.period };
    return this.dashboardService.getStats(filter);
  }
}

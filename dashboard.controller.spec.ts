import { DashboardController } from './src/dashboard/dashboard.controller';
import { DashboardService } from './src/dashboard/dashboard.service';
import {
  DashboardPeriod,
  DashboardFilterDto,
  PerformanceChartQueryDto,
  RecentTransactionsQueryDto,
  QuickStatsDto,
} from './src/dashboard/dto/dashboard.dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockDashboardService: jest.Mocked<Partial<DashboardService>>;

  // ==================== Mock Data ====================
  const mockSummaryStatistics = {
    received: { count: 150, changePercent: 12.5, trend: 'up' as const },
    delivered: { count: 120, changePercent: 8.3, trend: 'up' as const },
    transferred: { count: 45, changePercent: -5.2, trend: 'down' as const },
    return: { count: 15, changePercent: 0, trend: 'neutral' as const },
    pending: { count: 30, changePercent: 3.1, trend: 'up' as const },
    cancelled: { count: 5, changePercent: -10, trend: 'down' as const },
  };

  const mockPerformanceChart = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { label: 'Received', data: [10, 15, 20, 18, 25, 22, 30], color: '#3B82F6' },
      { label: 'Delivered', data: [8, 12, 18, 15, 22, 20, 25], color: '#10B981' },
      { label: 'Transferred', data: [5, 8, 10, 8, 12, 10, 15], color: '#F59E0B' },
      { label: 'Returned', data: [2, 3, 2, 4, 3, 2, 5], color: '#EF4444' },
      { label: 'Pending', data: [3, 5, 6, 4, 7, 5, 8], color: '#6B7280' },
    ],
    period: DashboardPeriod.LAST_7_DAYS,
  };

  const mockRecentTransactions = {
    transactions: [
      {
        id: 'txn-1',
        tracking: 'TRK-001',
        invoice: 'INV-001',
        date: '2024-01-15',
        deliveredBy: { id: 'user-1', name: 'John Doe', avatar: 'JD' },
        receiver: { id: 'recv-1', name: 'Jane Smith', avatar: 'JS' },
        status: 'Delivered',
        statusColor: '#10B981',
      },
      {
        id: 'txn-2',
        tracking: 'TRK-002',
        invoice: 'INV-002',
        date: '2024-01-14',
        deliveredBy: { id: 'user-2', name: 'Alice Brown', avatar: 'AB' },
        receiver: { id: 'recv-2', name: 'Bob Wilson', avatar: 'BW' },
        status: 'Pending',
        statusColor: '#F59E0B',
      },
    ],
    total: 50,
    page: 1,
    pageSize: 10,
    hasMore: true,
  };

  const mockActivitySummary = {
    dispatched: 25,
    blacklist: 3,
    linkedDevices: 12,
    received: 45,
  };

  const mockDashboardStats = {
    totalPackagesReceived: 500,
    totalPackagesDelivered: 420,
    totalPackagesPending: 50,
    totalPackagesReturned: 20,
    totalPackagesTransferred: 80,
    totalPackagesCancelled: 10,
    receivedChangePercent: 15.5,
    deliveredChangePercent: 12.3,
    pendingChangePercent: -5.0,
    returnedChangePercent: 2.5,
    avgProcessingTimeHours: 24,
    customerSatisfactionScore: 4.8,
    period: DashboardPeriod.LAST_30_DAYS,
  };

  const mockKanbanBoard = {
    transactionType: 'receive' as const,
    columns: [
      {
        statusId: 'status-1',
        statusName: 'New',
        statusCode: 'NEW',
        color: '#3B82F6',
        count: 10,
        packages: [
          { id: 'pkg-1', trackingNumber: 'TRK-001', recipientName: 'John', createdAt: new Date() },
        ],
      },
      {
        statusId: 'status-2',
        statusName: 'Processing',
        statusCode: 'PROCESSING',
        color: '#F59E0B',
        count: 5,
        packages: [],
      },
    ],
    totalCount: 15,
  };

  const mockRecentActivity = {
    activities: [
      {
        id: 'activity-1',
        action: 'CREATE',
        entityType: 'Package',
        entityId: 'pkg-1',
        userName: 'John Doe',
        description: 'Created package TRK-001',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'activity-2',
        action: 'UPDATE',
        entityType: 'Package',
        entityId: 'pkg-2',
        userName: 'Jane Smith',
        description: 'Updated package status to Delivered',
        timestamp: new Date().toISOString(),
      },
    ],
    period: DashboardPeriod.LAST_30_DAYS,
  };

  const mockPackageChart = {
    chartType: 'line',
    data: [
      { label: 'Jan 1', value: 10 },
      { label: 'Jan 2', value: 15 },
      { label: 'Jan 3', value: 12 },
      { label: 'Jan 4', value: 18 },
      { label: 'Jan 5', value: 20 },
    ],
    period: DashboardPeriod.LAST_7_DAYS,
  };

  const mockWarehouseOccupancy = {
    warehouses: [
      { id: 'wh-1', name: 'Main Warehouse', occupancy: 75, capacity: 1000, current: 750 },
      { id: 'wh-2', name: 'Secondary', occupancy: 45, capacity: 500, current: 225 },
    ],
  };

  const mockTopCarriers = {
    carriers: [
      { name: 'FedEx', deliveryCount: 150, percentage: 35 },
      { name: 'UPS', deliveryCount: 120, percentage: 28 },
      { name: 'DHL', deliveryCount: 80, percentage: 19 },
    ],
    period: DashboardPeriod.LAST_30_DAYS,
  };

  beforeEach(() => {
    mockDashboardService = {
      getSummaryStatistics: jest.fn().mockResolvedValue(mockSummaryStatistics),
      getPerformanceChart: jest.fn().mockResolvedValue(mockPerformanceChart),
      getRecentTransactions: jest.fn().mockResolvedValue(mockRecentTransactions),
      getActivitySummary: jest.fn().mockResolvedValue(mockActivitySummary),
      getStats: jest.fn().mockResolvedValue(mockDashboardStats),
      getKanbanBoard: jest.fn().mockResolvedValue(mockKanbanBoard),
      getRecentActivity: jest.fn().mockResolvedValue(mockRecentActivity),
      getPackageChart: jest.fn().mockResolvedValue(mockPackageChart),
      getWarehouseOccupancy: jest.fn().mockResolvedValue(mockWarehouseOccupancy),
      getTopCarriers: jest.fn().mockResolvedValue(mockTopCarriers),
    };

    controller = new DashboardController(mockDashboardService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Controller Definition ====================
  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== GET /dashboard/summary ====================
  describe('GET /dashboard/summary', () => {
    it('should return summary statistics', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getSummaryStatistics(filter);

      expect(result).toEqual(mockSummaryStatistics);
      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });

    it('should return 6 stat cards in summary', async () => {
      const result = await controller.getSummaryStatistics({});

      expect(result).toHaveProperty('received');
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('transferred');
      expect(result).toHaveProperty('return');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('cancelled');
    });

    it('should include all required stat types', async () => {
      const result = await controller.getSummaryStatistics({});

      expect(result.received).toHaveProperty('count');
      expect(result.received).toHaveProperty('changePercent');
      expect(result.received).toHaveProperty('trend');
    });

    it('should pass period filter to service', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.LAST_7_DAYS };

      await controller.getSummaryStatistics(filter);

      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });

    it('should pass organizationId filter to service', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      await controller.getSummaryStatistics(filter);

      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });

    it('should pass warehouseId filter to service', async () => {
      const filter: DashboardFilterDto = { warehouseId: 'wh-123' };

      await controller.getSummaryStatistics(filter);

      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getSummaryStatistics = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(controller.getSummaryStatistics({})).rejects.toThrow('Database error');
    });
  });

  // ==================== GET /dashboard/performance ====================
  describe('GET /dashboard/performance', () => {
    it('should return performance chart data', async () => {
      const filter: PerformanceChartQueryDto = {};

      const result = await controller.getPerformanceChart(filter);

      expect(result).toEqual(mockPerformanceChart);
      expect(mockDashboardService.getPerformanceChart).toHaveBeenCalledWith(filter);
    });

    it('should return 5 datasets', async () => {
      const result = await controller.getPerformanceChart({});

      expect(result.datasets).toHaveLength(5);
    });

    it('should include all status datasets', async () => {
      const result = await controller.getPerformanceChart({});

      const labels = result.datasets.map((ds: any) => ds.label);
      expect(labels).toContain('Received');
      expect(labels).toContain('Delivered');
      expect(labels).toContain('Transferred');
      expect(labels).toContain('Returned');
      expect(labels).toContain('Pending');
    });

    it('should return day labels', async () => {
      const result = await controller.getPerformanceChart({});

      expect(result.labels).toHaveLength(7);
    });

    it('should pass period filter to service', async () => {
      const filter: PerformanceChartQueryDto = { period: DashboardPeriod.THIS_WEEK };

      await controller.getPerformanceChart(filter);

      expect(mockDashboardService.getPerformanceChart).toHaveBeenCalledWith(filter);
    });

    it('should pass organizationId filter to service', async () => {
      const filter: PerformanceChartQueryDto = { organizationId: 'org-123' };

      await controller.getPerformanceChart(filter);

      expect(mockDashboardService.getPerformanceChart).toHaveBeenCalledWith(filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getPerformanceChart = jest.fn().mockRejectedValue(new Error('Chart error'));

      await expect(controller.getPerformanceChart({})).rejects.toThrow('Chart error');
    });
  });

  // ==================== GET /dashboard/transactions ====================
  describe('GET /dashboard/transactions', () => {
    it('should return recent transactions with pagination', async () => {
      const query: RecentTransactionsQueryDto = {};

      const result = await controller.getRecentTransactions(query);

      expect(result).toEqual(mockRecentTransactions);
      expect(mockDashboardService.getRecentTransactions).toHaveBeenCalledWith(query);
    });

    it('should return transactions array', async () => {
      const result = await controller.getRecentTransactions({});

      expect(result.transactions).toBeInstanceOf(Array);
      expect(result.transactions).toHaveLength(2);
    });

    it('should include pagination info', async () => {
      const result = await controller.getRecentTransactions({});

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('hasMore');
    });

    it('should pass page and limit to service', async () => {
      const query: RecentTransactionsQueryDto = { page: 2, limit: 20 };

      await controller.getRecentTransactions(query);

      expect(mockDashboardService.getRecentTransactions).toHaveBeenCalledWith(query);
    });

    it('should pass status filter to service', async () => {
      const query: RecentTransactionsQueryDto = { status: 'Delivered' };

      await controller.getRecentTransactions(query);

      expect(mockDashboardService.getRecentTransactions).toHaveBeenCalledWith(query);
    });

    it('should pass search filter to service', async () => {
      const query: RecentTransactionsQueryDto = { search: 'TRK-001' };

      await controller.getRecentTransactions(query);

      expect(mockDashboardService.getRecentTransactions).toHaveBeenCalledWith(query);
    });

    it('should handle empty results', async () => {
      mockDashboardService.getRecentTransactions = jest.fn().mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        pageSize: 10,
        hasMore: false,
      });

      const result = await controller.getRecentTransactions({});

      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getRecentTransactions = jest.fn().mockRejectedValue(new Error('Query error'));

      await expect(controller.getRecentTransactions({})).rejects.toThrow('Query error');
    });
  });

  // ==================== GET /dashboard/activity-summary ====================
  describe('GET /dashboard/activity-summary', () => {
    it('should return activity summary', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getActivitySummary(filter);

      expect(result).toEqual(mockActivitySummary);
      expect(mockDashboardService.getActivitySummary).toHaveBeenCalledWith(filter);
    });

    it('should return all 4 metrics', async () => {
      const result = await controller.getActivitySummary({});

      expect(result).toHaveProperty('dispatched');
      expect(result).toHaveProperty('blacklist');
      expect(result).toHaveProperty('linkedDevices');
      expect(result).toHaveProperty('received');
    });

    it('should return numeric values', async () => {
      const result = await controller.getActivitySummary({});

      expect(typeof result.dispatched).toBe('number');
      expect(typeof result.blacklist).toBe('number');
      expect(typeof result.linkedDevices).toBe('number');
      expect(typeof result.received).toBe('number');
    });

    it('should pass organizationId filter to service', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      await controller.getActivitySummary(filter);

      expect(mockDashboardService.getActivitySummary).toHaveBeenCalledWith(filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getActivitySummary = jest.fn().mockRejectedValue(new Error('Activity error'));

      await expect(controller.getActivitySummary({})).rejects.toThrow('Activity error');
    });
  });

  // ==================== GET /dashboard/stats ====================
  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      const filter: DashboardFilterDto = {};
      const mockReq = { user: { id: 'user-123' } };

      const result = await controller.getStats(filter, mockReq);

      expect(result).toEqual(mockDashboardStats);
      expect(mockDashboardService.getStats).toHaveBeenCalledWith(filter, 'user-123');
    });

    it('should include all stat fields', async () => {
      const mockReq = { user: { id: 'user-123' } };

      const result = await controller.getStats({}, mockReq);

      expect(result).toHaveProperty('totalPackagesReceived');
      expect(result).toHaveProperty('totalPackagesDelivered');
      expect(result).toHaveProperty('totalPackagesPending');
      expect(result).toHaveProperty('totalPackagesReturned');
      expect(result).toHaveProperty('totalPackagesTransferred');
      expect(result).toHaveProperty('totalPackagesCancelled');
      expect(result).toHaveProperty('receivedChangePercent');
      expect(result).toHaveProperty('avgProcessingTimeHours');
      expect(result).toHaveProperty('customerSatisfactionScore');
    });

    it('should pass period filter to service', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.TODAY };
      const mockReq = { user: { id: 'user-123' } };

      await controller.getStats(filter, mockReq);

      expect(mockDashboardService.getStats).toHaveBeenCalledWith(filter, 'user-123');
    });

    it('should handle missing user gracefully', async () => {
      const filter: DashboardFilterDto = {};
      const mockReq = { user: null };

      await controller.getStats(filter, mockReq);

      expect(mockDashboardService.getStats).toHaveBeenCalledWith(filter, undefined);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getStats = jest.fn().mockRejectedValue(new Error('Stats error'));
      const mockReq = { user: { id: 'user-123' } };

      await expect(controller.getStats({}, mockReq)).rejects.toThrow('Stats error');
    });
  });

  // ==================== GET /dashboard/kanban/receive ====================
  describe('GET /dashboard/kanban/receive', () => {
    it('should return receive kanban board', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getReceiveKanban(filter);

      expect(result).toEqual(mockKanbanBoard);
      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('receive', filter);
    });

    it('should return transactionType as receive', async () => {
      const result = await controller.getReceiveKanban({});

      expect(result.transactionType).toBe('receive');
    });

    it('should include columns array', async () => {
      const result = await controller.getReceiveKanban({});

      expect(result.columns).toBeInstanceOf(Array);
    });

    it('should pass organizationId filter to service', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      await controller.getReceiveKanban(filter);

      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('receive', filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getKanbanBoard = jest.fn().mockRejectedValue(new Error('Kanban error'));

      await expect(controller.getReceiveKanban({})).rejects.toThrow('Kanban error');
    });
  });

  // ==================== GET /dashboard/kanban/deliver ====================
  describe('GET /dashboard/kanban/deliver', () => {
    it('should return deliver kanban board', async () => {
      mockDashboardService.getKanbanBoard = jest.fn().mockResolvedValue({
        ...mockKanbanBoard,
        transactionType: 'deliver',
      });
      const filter: DashboardFilterDto = {};

      const result = await controller.getDeliverKanban(filter);

      expect(result.transactionType).toBe('deliver');
      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('deliver', filter);
    });

    it('should pass warehouseId filter to service', async () => {
      const filter: DashboardFilterDto = { warehouseId: 'wh-123' };

      await controller.getDeliverKanban(filter);

      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('deliver', filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getKanbanBoard = jest.fn().mockRejectedValue(new Error('Deliver kanban error'));

      await expect(controller.getDeliverKanban({})).rejects.toThrow('Deliver kanban error');
    });
  });

  // ==================== GET /dashboard/kanban/return ====================
  describe('GET /dashboard/kanban/return', () => {
    it('should return return kanban board', async () => {
      mockDashboardService.getKanbanBoard = jest.fn().mockResolvedValue({
        ...mockKanbanBoard,
        transactionType: 'return',
      });
      const filter: DashboardFilterDto = {};

      const result = await controller.getReturnKanban(filter);

      expect(result.transactionType).toBe('return');
      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('return', filter);
    });

    it('should pass period filter to service', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.THIS_MONTH };

      await controller.getReturnKanban(filter);

      expect(mockDashboardService.getKanbanBoard).toHaveBeenCalledWith('return', filter);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getKanbanBoard = jest.fn().mockRejectedValue(new Error('Return kanban error'));

      await expect(controller.getReturnKanban({})).rejects.toThrow('Return kanban error');
    });
  });

  // ==================== GET /dashboard/activity ====================
  describe('GET /dashboard/activity', () => {
    it('should return recent activity list', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getRecentActivity(filter);

      expect(result).toEqual(mockRecentActivity);
      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith(filter, 20);
    });

    it('should return activities array', async () => {
      const result = await controller.getRecentActivity({});

      expect(result.activities).toBeInstanceOf(Array);
    });

    it('should use default limit of 20', async () => {
      await controller.getRecentActivity({}, undefined);

      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith({}, 20);
    });

    it('should accept custom limit', async () => {
      await controller.getRecentActivity({}, 50);

      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith({}, 50);
    });

    it('should pass organizationId filter to service', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      await controller.getRecentActivity(filter);

      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledWith(filter, 20);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getRecentActivity = jest.fn().mockRejectedValue(new Error('Activity list error'));

      await expect(controller.getRecentActivity({})).rejects.toThrow('Activity list error');
    });
  });

  // ==================== GET /dashboard/charts/packages ====================
  describe('GET /dashboard/charts/packages', () => {
    it('should return package chart data', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getPackageChart(filter);

      expect(result).toEqual(mockPackageChart);
      expect(mockDashboardService.getPackageChart).toHaveBeenCalledWith(filter, 'line');
    });

    it('should return data array', async () => {
      const result = await controller.getPackageChart({});

      expect(result.data).toBeInstanceOf(Array);
    });

    it('should use default chart type of line', async () => {
      await controller.getPackageChart({}, undefined);

      expect(mockDashboardService.getPackageChart).toHaveBeenCalledWith({}, 'line');
    });

    it('should accept bar chart type', async () => {
      await controller.getPackageChart({}, 'bar');

      expect(mockDashboardService.getPackageChart).toHaveBeenCalledWith({}, 'bar');
    });

    it('should pass period filter to service', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.LAST_7_DAYS };

      await controller.getPackageChart(filter);

      expect(mockDashboardService.getPackageChart).toHaveBeenCalledWith(filter, 'line');
    });

    it('should handle service errors', async () => {
      mockDashboardService.getPackageChart = jest.fn().mockRejectedValue(new Error('Chart data error'));

      await expect(controller.getPackageChart({})).rejects.toThrow('Chart data error');
    });
  });

  // ==================== GET /dashboard/warehouses/occupancy ====================
  describe('GET /dashboard/warehouses/occupancy', () => {
    it('should return warehouse occupancy data', async () => {
      const result = await controller.getWarehouseOccupancy();

      expect(result).toEqual(mockWarehouseOccupancy);
      expect(mockDashboardService.getWarehouseOccupancy).toHaveBeenCalledWith(undefined);
    });

    it('should return warehouses array', async () => {
      const result = await controller.getWarehouseOccupancy();

      expect(result.warehouses).toBeInstanceOf(Array);
    });

    it('should pass organizationId to service', async () => {
      await controller.getWarehouseOccupancy('org-123');

      expect(mockDashboardService.getWarehouseOccupancy).toHaveBeenCalledWith('org-123');
    });

    it('should include occupancy percentage for each warehouse', async () => {
      const result = await controller.getWarehouseOccupancy();

      result.warehouses.forEach((wh: any) => {
        expect(wh).toHaveProperty('occupancy');
        expect(typeof wh.occupancy).toBe('number');
      });
    });

    it('should handle service errors', async () => {
      mockDashboardService.getWarehouseOccupancy = jest.fn().mockRejectedValue(new Error('Occupancy error'));

      await expect(controller.getWarehouseOccupancy()).rejects.toThrow('Occupancy error');
    });
  });

  // ==================== GET /dashboard/carriers/top ====================
  describe('GET /dashboard/carriers/top', () => {
    it('should return top carriers list', async () => {
      const filter: DashboardFilterDto = {};

      const result = await controller.getTopCarriers(filter);

      expect(result).toEqual(mockTopCarriers);
      expect(mockDashboardService.getTopCarriers).toHaveBeenCalledWith(filter, 10);
    });

    it('should return carriers array', async () => {
      const result = await controller.getTopCarriers({});

      expect(result.carriers).toBeInstanceOf(Array);
    });

    it('should use default limit of 10', async () => {
      await controller.getTopCarriers({}, undefined);

      expect(mockDashboardService.getTopCarriers).toHaveBeenCalledWith({}, 10);
    });

    it('should accept custom limit', async () => {
      await controller.getTopCarriers({}, 5);

      expect(mockDashboardService.getTopCarriers).toHaveBeenCalledWith({}, 5);
    });

    it('should include delivery count for each carrier', async () => {
      const result = await controller.getTopCarriers({});

      result.carriers.forEach((carrier: any) => {
        expect(carrier).toHaveProperty('deliveryCount');
        expect(typeof carrier.deliveryCount).toBe('number');
      });
    });

    it('should pass period filter to service', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.THIS_MONTH };

      await controller.getTopCarriers(filter);

      expect(mockDashboardService.getTopCarriers).toHaveBeenCalledWith(filter, 10);
    });

    it('should handle service errors', async () => {
      mockDashboardService.getTopCarriers = jest.fn().mockRejectedValue(new Error('Carriers error'));

      await expect(controller.getTopCarriers({})).rejects.toThrow('Carriers error');
    });
  });

  // ==================== GET /dashboard/quick-stats ====================
  describe('GET /dashboard/quick-stats', () => {
    it('should return quick stats', async () => {
      const params: QuickStatsDto = { period: DashboardPeriod.TODAY };

      const result = await controller.getQuickStats(params);

      expect(result).toEqual(mockDashboardStats);
      expect(mockDashboardService.getStats).toHaveBeenCalledWith({ period: DashboardPeriod.TODAY });
    });

    it('should pass period to service', async () => {
      const params: QuickStatsDto = { period: DashboardPeriod.LAST_7_DAYS };

      await controller.getQuickStats(params);

      expect(mockDashboardService.getStats).toHaveBeenCalledWith({ period: DashboardPeriod.LAST_7_DAYS });
    });

    it('should handle undefined period', async () => {
      const params: QuickStatsDto = {} as any;

      await controller.getQuickStats(params);

      expect(mockDashboardService.getStats).toHaveBeenCalledWith({ period: undefined });
    });

    it('should handle service errors', async () => {
      mockDashboardService.getStats = jest.fn().mockRejectedValue(new Error('Quick stats error'));
      const params: QuickStatsDto = { period: DashboardPeriod.TODAY };

      await expect(controller.getQuickStats(params)).rejects.toThrow('Quick stats error');
    });
  });

  // ==================== Filter Combinations ====================
  describe('Filter Combinations', () => {
    it('should handle multiple filters together', async () => {
      const filter: DashboardFilterDto = {
        period: DashboardPeriod.LAST_30_DAYS,
        organizationId: 'org-123',
        warehouseId: 'wh-456',
      };

      await controller.getSummaryStatistics(filter);

      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });

    it('should handle custom date range', async () => {
      const filter: DashboardFilterDto = {
        period: DashboardPeriod.CUSTOM,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };

      await controller.getSummaryStatistics(filter);

      expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service unavailable');
      mockDashboardService.getSummaryStatistics = jest.fn().mockRejectedValue(error);

      await expect(controller.getSummaryStatistics({})).rejects.toThrow('Service unavailable');
    });

    it('should handle null responses gracefully', async () => {
      mockDashboardService.getSummaryStatistics = jest.fn().mockResolvedValue(null);

      const result = await controller.getSummaryStatistics({});

      expect(result).toBeNull();
    });

    it('should handle empty array responses', async () => {
      mockDashboardService.getRecentTransactions = jest.fn().mockResolvedValue({
        transactions: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        hasMore: false,
      });

      const result = await controller.getRecentTransactions({});

      expect(result.transactions).toHaveLength(0);
    });
  });

  // ==================== Period Enum Coverage ====================
  describe('Period Enum Coverage', () => {
    const periods = [
      DashboardPeriod.TODAY,
      DashboardPeriod.YESTERDAY,
      DashboardPeriod.LAST_7_DAYS,
      DashboardPeriod.LAST_30_DAYS,
      DashboardPeriod.THIS_MONTH,
      DashboardPeriod.LAST_MONTH,
      DashboardPeriod.THIS_WEEK,
      DashboardPeriod.CUSTOM,
    ];

    periods.forEach((period) => {
      it(`should handle ${period} period for getSummaryStatistics`, async () => {
        const filter: DashboardFilterDto = { period };

        await controller.getSummaryStatistics(filter);

        expect(mockDashboardService.getSummaryStatistics).toHaveBeenCalledWith(filter);
      });
    });
  });
});

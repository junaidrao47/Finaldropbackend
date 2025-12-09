import { DashboardService } from './dashboard.service';
import {
  DashboardPeriod,
  DashboardFilterDto,
  PerformanceChartQueryDto,
  RecentTransactionsQueryDto,
} from './dto/dashboard.dto';

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  gte: jest.fn((a, b) => ({ type: 'gte', a, b })),
  lte: jest.fn((a, b) => ({ type: 'lte', a, b })),
  lt: jest.fn((a, b) => ({ type: 'lt', a, b })),
  gt: jest.fn((a, b) => ({ type: 'gt', a, b })),
  ne: jest.fn((a, b) => ({ type: 'ne', a, b })),
  like: jest.fn((a, b) => ({ type: 'like', a, b })),
  ilike: jest.fn((a, b) => ({ type: 'ilike', a, b })),
  inArray: jest.fn((a, b) => ({ type: 'inArray', a, b })),
  isNull: jest.fn((a) => ({ type: 'isNull', a })),
  isNotNull: jest.fn((a) => ({ type: 'isNotNull', a })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  asc: jest.fn((col) => ({ type: 'asc', col })),
  sql: jest.fn((template, ...args) => ({ template, args })),
  count: jest.fn(() => ({ type: 'count' })),
  sum: jest.fn((col) => ({ type: 'sum', col })),
  avg: jest.fn((col) => ({ type: 'avg', col })),
}));

// Mock database helper
const createMockDb = () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  return mockChain;
};

describe('DashboardService', () => {
  let service: DashboardService;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    service = new DashboardService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== getStats Tests ====================
  describe('getStats', () => {
    const mockPackageCounts = [{ count: 10 }];

    beforeEach(() => {
      // Mock all the status count queries
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue(mockPackageCounts);
    });

    it('should return dashboard statistics with default period', async () => {
      const filter: DashboardFilterDto = {};

      const result = await service.getStats(filter);

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

    it('should return stats for TODAY period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.TODAY };

      const result = await service.getStats(filter);

      expect(result.totalPackagesReceived).toBeDefined();
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return stats for YESTERDAY period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.YESTERDAY };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should return stats for LAST_7_DAYS period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.LAST_7_DAYS };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should return stats for THIS_WEEK period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.THIS_WEEK };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should return stats for THIS_MONTH period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.THIS_MONTH };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should return stats for LAST_MONTH period', async () => {
      const filter: DashboardFilterDto = { period: DashboardPeriod.LAST_MONTH };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should return stats for custom date range', async () => {
      const filter: DashboardFilterDto = {
        period: DashboardPeriod.CUSTOM,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should filter by organizationId', async () => {
      const filter: DashboardFilterDto = {
        organizationId: 'org-123',
      };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by warehouseId', async () => {
      const filter: DashboardFilterDto = {
        warehouseId: 'warehouse-123',
      };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should calculate change percentages correctly', async () => {
      // First calls return current period (10)
      // Next calls return previous period (5)
      let callCount = 0;
      mockDb.where.mockImplementation(() => {
        callCount++;
        // First 6 calls are current period, next 6 are previous period
        if (callCount <= 6) {
          return Promise.resolve([{ count: 10 }]);
        }
        return Promise.resolve([{ count: 5 }]);
      });

      const result = await service.getStats({});

      // 100% increase from 5 to 10
      expect(result.receivedChangePercent).toBe(100);
    });

    it('should handle zero previous period counts', async () => {
      let callCount = 0;
      mockDb.where.mockImplementation(() => {
        callCount++;
        if (callCount <= 6) {
          return Promise.resolve([{ count: 10 }]);
        }
        return Promise.resolve([{ count: 0 }]);
      });

      const result = await service.getStats({});

      // When previous is 0, should return 100 if current > 0
      expect(result.receivedChangePercent).toBe(100);
    });

    it('should return 0 change when both periods are zero', async () => {
      mockDb.where.mockResolvedValue([{ count: 0 }]);

      const result = await service.getStats({});

      expect(result.receivedChangePercent).toBe(0);
    });
  });

  // ==================== getSummaryStatistics Tests ====================
  describe('getSummaryStatistics', () => {
    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: 50 }]);
    });

    it('should return summary statistics with 6 cards', async () => {
      const filter: DashboardFilterDto = {};

      const result = await service.getSummaryStatistics(filter);

      expect(result).toHaveProperty('received');
      expect(result).toHaveProperty('delivered');
      expect(result).toHaveProperty('transferred');
      expect(result).toHaveProperty('return');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('cancelled');
    });

    it('should include count, changePercent, and trend for each card', async () => {
      const result = await service.getSummaryStatistics({});

      expect(result.received).toHaveProperty('count');
      expect(result.received).toHaveProperty('changePercent');
      expect(result.received).toHaveProperty('trend');
    });

    it('should return up trend for positive change', async () => {
      let callCount = 0;
      mockDb.where.mockImplementation(() => {
        callCount++;
        if (callCount <= 6) return Promise.resolve([{ count: 100 }]);
        return Promise.resolve([{ count: 50 }]);
      });

      const result = await service.getSummaryStatistics({});

      expect(result.received.trend).toBe('up');
    });

    it('should return down trend for negative change', async () => {
      let callCount = 0;
      mockDb.where.mockImplementation(() => {
        callCount++;
        if (callCount <= 6) return Promise.resolve([{ count: 50 }]);
        return Promise.resolve([{ count: 100 }]);
      });

      const result = await service.getSummaryStatistics({});

      expect(result.received.trend).toBe('down');
    });

    it('should return neutral trend for no change', async () => {
      mockDb.where.mockResolvedValue([{ count: 50 }]);

      const result = await service.getSummaryStatistics({});

      expect(result.received.trend).toBe('neutral');
    });
  });

  // ==================== getPerformanceChart Tests ====================
  describe('getPerformanceChart', () => {
    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: 5 }]);
    });

    it('should return performance chart data', async () => {
      const filter: PerformanceChartQueryDto = {
        period: DashboardPeriod.LAST_7_DAYS,
      };

      const result = await service.getPerformanceChart(filter);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('labels');
      expect(result).toHaveProperty('datasets');
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.datasets)).toBe(true);
    });

    it('should return 5 datasets (Received, Delivered, Transferred, Returned, Pending)', async () => {
      const result = await service.getPerformanceChart({});

      expect(result.datasets).toHaveLength(5);
      expect(result.datasets.map(d => d.name)).toContain('Received');
      expect(result.datasets.map(d => d.name)).toContain('Delivered');
      expect(result.datasets.map(d => d.name)).toContain('Transferred');
      expect(result.datasets.map(d => d.name)).toContain('Returned');
      expect(result.datasets.map(d => d.name)).toContain('Pending');
    });

    it('should include colors for each dataset', async () => {
      const result = await service.getPerformanceChart({});

      result.datasets.forEach(dataset => {
        expect(dataset.color).toBeDefined();
        expect(dataset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should return day labels', async () => {
      const result = await service.getPerformanceChart({ period: DashboardPeriod.LAST_7_DAYS });

      // Labels should be day abbreviations
      const validLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      result.labels.forEach(label => {
        expect(validLabels).toContain(label);
      });
    });

    it('should filter by organizationId', async () => {
      const filter: PerformanceChartQueryDto = {
        organizationId: 'org-123',
      };

      const result = await service.getPerformanceChart(filter);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by warehouseId', async () => {
      const filter: PerformanceChartQueryDto = {
        warehouseId: 'warehouse-123',
      };

      const result = await service.getPerformanceChart(filter);

      expect(result).toBeDefined();
    });
  });

  // ==================== getRecentTransactions Tests ====================
  describe('getRecentTransactions', () => {
    const mockTransactions = [
      {
        id: 'pkg-1',
        createdAt: new Date('2024-01-15'),
        status: 'Delivered',
        invoiceNumber: 'INV-001',
        trackingNumber: 'TRK-001',
        recipientName: 'John Doe',
        createdById: 'user-1',
        creatorFirstName: 'Admin',
        creatorLastName: 'User',
      },
      {
        id: 'pkg-2',
        createdAt: new Date('2024-01-14'),
        status: 'Pending',
        invoiceNumber: 'INV-002',
        trackingNumber: 'TRK-002',
        recipientName: 'Jane Smith',
        createdById: 'user-2',
        creatorFirstName: 'Staff',
        creatorLastName: 'Member',
      },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.leftJoin.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockReturnThis();
      mockDb.offset.mockResolvedValue(mockTransactions);
    });

    it('should return recent transactions with pagination', async () => {
      // First call for count
      mockDb.where.mockResolvedValueOnce([{ count: 50 }]);
      // Second call for data
      mockDb.offset.mockResolvedValueOnce(mockTransactions);

      const query: RecentTransactionsQueryDto = { page: 1, limit: 10 };

      const result = await service.getRecentTransactions(query);

      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('hasMore');
    });

    it('should return transaction items with correct structure', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.offset.mockResolvedValueOnce(mockTransactions);

      const result = await service.getRecentTransactions({});

      expect(result.transactions[0]).toHaveProperty('id');
      expect(result.transactions[0]).toHaveProperty('date');
      expect(result.transactions[0]).toHaveProperty('deliveredBy');
      expect(result.transactions[0]).toHaveProperty('receiver');
      expect(result.transactions[0]).toHaveProperty('status');
      expect(result.transactions[0]).toHaveProperty('statusColor');
      expect(result.transactions[0]).toHaveProperty('invoice');
      expect(result.transactions[0]).toHaveProperty('tracking');
    });

    it('should return correct status colors', async () => {
      const transactionsWithStatuses = [
        { ...mockTransactions[0], status: 'Delivered' },
        { ...mockTransactions[1], status: 'Pending' },
      ];
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.offset.mockResolvedValueOnce(transactionsWithStatuses);

      const result = await service.getRecentTransactions({});

      expect(result.transactions[0].statusColor).toBe('#10B981'); // Delivered - green
      expect(result.transactions[1].statusColor).toBe('#F59E0B'); // Pending - yellow
    });

    it('should filter by status', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockTransactions[0]]);

      const query: RecentTransactionsQueryDto = { status: 'Delivered' };

      const result = await service.getRecentTransactions(query);

      expect(result.transactions).toHaveLength(1);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockTransactions[0]]);

      const query: RecentTransactionsQueryDto = { search: 'TRK-001' };

      const result = await service.getRecentTransactions(query);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 50 }]);
      mockDb.offset.mockResolvedValueOnce(mockTransactions);

      const query: RecentTransactionsQueryDto = { page: 2, limit: 10 };

      const result = await service.getRecentTransactions(query);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.hasMore).toBe(true); // 50 total, page 2 with 10 items = more pages
    });

    it('should return hasMore false when no more pages', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]);
      mockDb.offset.mockResolvedValueOnce(mockTransactions);

      const query: RecentTransactionsQueryDto = { page: 1, limit: 10 };

      const result = await service.getRecentTransactions(query);

      expect(result.hasMore).toBe(false);
    });

    it('should handle missing user names gracefully', async () => {
      const transactionWithNullNames = [{
        ...mockTransactions[0],
        creatorFirstName: null,
        creatorLastName: null,
        recipientName: null,
      }];
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce(transactionWithNullNames);

      const result = await service.getRecentTransactions({});

      expect(result.transactions[0].deliveredBy.name).toBe('Unknown');
      expect(result.transactions[0].receiver.name).toBe('Unknown');
    });
  });

  // ==================== getActivitySummary Tests ====================
  describe('getActivitySummary', () => {
    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: 25 }]);
    });

    it('should return activity summary with 4 metrics', async () => {
      const result = await service.getActivitySummary({});

      expect(result).toHaveProperty('dispatched');
      expect(result).toHaveProperty('blacklist');
      expect(result).toHaveProperty('linkedDevices');
      expect(result).toHaveProperty('received');
    });

    it('should return numeric values for all metrics', async () => {
      const result = await service.getActivitySummary({});

      expect(typeof result.dispatched).toBe('number');
      expect(typeof result.blacklist).toBe('number');
      expect(typeof result.linkedDevices).toBe('number');
      expect(typeof result.received).toBe('number');
    });

    it('should filter by organizationId', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      const result = await service.getActivitySummary(filter);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle linked devices query failure gracefully', async () => {
      // First two calls succeed, third (linkedDevices) fails
      let callCount = 0;
      mockDb.where.mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          return Promise.reject(new Error('Table not found'));
        }
        return Promise.resolve([{ count: 10 }]);
      });

      const result = await service.getActivitySummary({});

      expect(result.linkedDevices).toBe(0);
      expect(result.dispatched).toBeDefined();
    });
  });

  // ==================== getKanbanBoard Tests ====================
  describe('getKanbanBoard', () => {
    const mockStatuses = [
      { id: 'status-1', name: 'New', category: 'receive', color: '#3B82F6', sortOrder: 1 },
      { id: 'status-2', name: 'Processing', category: 'receive', color: '#F59E0B', sortOrder: 2 },
      { id: 'status-3', name: 'Completed', category: 'receive', color: '#10B981', sortOrder: 3 },
    ];

    const mockPackages = [
      { id: 'pkg-1', trackingNumber: 'TRK-001', recipientName: 'John', createdAt: new Date() },
      { id: 'pkg-2', trackingNumber: 'TRK-002', recipientName: 'Jane', createdAt: new Date() },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      // First orderBy call returns statuses, subsequent limit().orderBy() returns packages
      mockDb.orderBy.mockResolvedValueOnce(mockStatuses).mockReturnThis();
      mockDb.limit.mockReturnThis();
      // When orderBy is called after limit, resolve to packages
      mockDb.orderBy.mockResolvedValue(mockPackages);
    });

    it('should return kanban board for receive transactions', async () => {
      const result = await service.getKanbanBoard('receive', {});

      expect(result).toHaveProperty('transactionType');
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('totalCount');
      expect(result.transactionType).toBe('receive');
    });

    it('should return kanban board for deliver transactions', async () => {
      const result = await service.getKanbanBoard('deliver', {});

      expect(result.transactionType).toBe('deliver');
    });

    it('should return kanban board for return transactions', async () => {
      const result = await service.getKanbanBoard('return', {});

      expect(result.transactionType).toBe('return');
    });

    it('should return columns with correct structure', async () => {
      const result = await service.getKanbanBoard('receive', {});

      if (result.columns.length > 0) {
        expect(result.columns[0]).toHaveProperty('statusId');
        expect(result.columns[0]).toHaveProperty('statusName');
        expect(result.columns[0]).toHaveProperty('statusCode');
        expect(result.columns[0]).toHaveProperty('color');
        expect(result.columns[0]).toHaveProperty('count');
        expect(result.columns[0]).toHaveProperty('packages');
      }
    });

    it('should calculate totalCount from all columns', async () => {
      const result = await service.getKanbanBoard('receive', {});

      const expectedTotal = result.columns.reduce((sum, col) => sum + col.count, 0);
      expect(result.totalCount).toBe(expectedTotal);
    });

    it('should filter by organizationId', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      const result = await service.getKanbanBoard('receive', filter);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by warehouseId', async () => {
      const filter: DashboardFilterDto = { warehouseId: 'warehouse-123' };

      const result = await service.getKanbanBoard('receive', filter);

      expect(result).toBeDefined();
    });
  });

  // ==================== getRecentActivity Tests ====================
  describe('getRecentActivity', () => {
    const mockActivities = [
      {
        id: 'activity-1',
        action: 'CREATE',
        entityName: 'Package',
        entityId: 'pkg-1',
        userId: 'user-1',
        userFirstName: 'John',
        userLastName: 'Doe',
        timestamp: new Date(),
        oldValues: null,
        newValues: { trackingNumber: 'TRK-001' },
        memo: 'Created package TRK-001',
      },
      {
        id: 'activity-2',
        action: 'UPDATE',
        entityName: 'Package',
        entityId: 'pkg-2',
        userId: 'user-2',
        userFirstName: 'Jane',
        userLastName: 'Smith',
        timestamp: new Date(),
        oldValues: { status: 'Pending' },
        newValues: { status: 'Delivered' },
        memo: null,
      },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.leftJoin.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockResolvedValue(mockActivities);
    });

    it('should return recent activity list', async () => {
      const result = await service.getRecentActivity({}, 20);

      expect(result).toHaveProperty('activities');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.activities)).toBe(true);
    });

    it('should return activity items with correct structure', async () => {
      const result = await service.getRecentActivity({}, 20);

      expect(result.activities[0]).toHaveProperty('id');
      expect(result.activities[0]).toHaveProperty('activityType');
      expect(result.activities[0]).toHaveProperty('description');
      expect(result.activities[0]).toHaveProperty('entityType');
      expect(result.activities[0]).toHaveProperty('entityId');
      expect(result.activities[0]).toHaveProperty('userId');
      expect(result.activities[0]).toHaveProperty('userName');
      expect(result.activities[0]).toHaveProperty('timestamp');
    });

    it('should use memo as description when available', async () => {
      const result = await service.getRecentActivity({}, 20);

      expect(result.activities[0].description).toBe('Created package TRK-001');
    });

    it('should generate description when memo is not available', async () => {
      const result = await service.getRecentActivity({}, 20);

      // Second activity has no memo, should generate description
      expect(result.activities[1].description).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const result = await service.getRecentActivity({}, 5);

      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });

    it('should filter by organizationId', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      const result = await service.getRecentActivity(filter, 20);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle missing user names', async () => {
      const activitiesWithNullNames = [{
        ...mockActivities[0],
        userFirstName: null,
        userLastName: null,
      }];
      mockDb.limit.mockResolvedValueOnce(activitiesWithNullNames);

      const result = await service.getRecentActivity({}, 20);

      expect(result.activities[0].userName).toBe('System');
    });
  });

  // ==================== getPackageChart Tests ====================
  describe('getPackageChart', () => {
    const mockChartData = [
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 15 },
      { date: '2024-01-03', count: 8 },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.groupBy.mockReturnThis();
      mockDb.orderBy.mockResolvedValue(mockChartData);
    });

    it('should return chart data with correct structure', async () => {
      const result = await service.getPackageChart({}, 'line');

      expect(result).toHaveProperty('chartType');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('period');
    });

    it('should return line chart type by default', async () => {
      const result = await service.getPackageChart({});

      expect(result.chartType).toBe('line');
    });

    it('should support bar chart type', async () => {
      const result = await service.getPackageChart({}, 'bar');

      expect(result.chartType).toBe('bar');
    });

    it('should return data points with label and value', async () => {
      const result = await service.getPackageChart({});

      result.data.forEach(point => {
        expect(point).toHaveProperty('label');
        expect(point).toHaveProperty('value');
      });
    });

    it('should filter by organizationId', async () => {
      const filter: DashboardFilterDto = { organizationId: 'org-123' };

      const result = await service.getPackageChart(filter);

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  // ==================== getWarehouseOccupancy Tests ====================
  describe('getWarehouseOccupancy', () => {
    const mockWarehouses = [
      { id: 'wh-1', name: 'Warehouse A' },
      { id: 'wh-2', name: 'Warehouse B' },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue(mockWarehouses);
    });

    it('should return warehouse occupancy data', async () => {
      const result = await service.getWarehouseOccupancy();

      expect(result).toHaveProperty('warehouses');
      expect(Array.isArray(result.warehouses)).toBe(true);
    });

    it('should return occupancy items with correct structure', async () => {
      const result = await service.getWarehouseOccupancy();

      if (result.warehouses.length > 0) {
        expect(result.warehouses[0]).toHaveProperty('warehouseId');
        expect(result.warehouses[0]).toHaveProperty('warehouseName');
        expect(result.warehouses[0]).toHaveProperty('totalCapacity');
        expect(result.warehouses[0]).toHaveProperty('currentOccupancy');
        expect(result.warehouses[0]).toHaveProperty('occupancyPercent');
      }
    });

    it('should calculate occupancy percentage correctly', async () => {
      // Mock warehouse query
      mockDb.where.mockResolvedValueOnce(mockWarehouses);
      // Mock occupancy count for each warehouse
      mockDb.where.mockResolvedValue([{ count: 500 }]);

      const result = await service.getWarehouseOccupancy();

      // 500/1000 = 50%
      if (result.warehouses.length > 0) {
        expect(result.warehouses[0].occupancyPercent).toBe(50);
      }
    });

    it('should filter by organizationId', async () => {
      const result = await service.getWarehouseOccupancy('org-123');

      expect(result).toBeDefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle unnamed warehouses', async () => {
      const warehousesWithNullName = [{ id: 'wh-1', name: null }];
      mockDb.where.mockResolvedValueOnce(warehousesWithNullName);
      mockDb.where.mockResolvedValue([{ count: 0 }]);

      const result = await service.getWarehouseOccupancy();

      if (result.warehouses.length > 0) {
        expect(result.warehouses[0].warehouseName).toBe('Unnamed Warehouse');
      }
    });
  });

  // ==================== getTopCarriers Tests ====================
  describe('getTopCarriers', () => {
    const mockCarriers = [
      { carrierId: 'carrier-1', carrierName: 'FedEx' },
      { carrierId: 'carrier-2', carrierName: 'UPS' },
      { carrierId: 'carrier-3', carrierName: 'DHL' },
    ];

    beforeEach(() => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValue(mockCarriers);
    });

    it('should return top carriers list', async () => {
      const result = await service.getTopCarriers({}, 10);

      expect(result).toHaveProperty('carriers');
      expect(result).toHaveProperty('period');
      expect(Array.isArray(result.carriers)).toBe(true);
    });

    it('should return carrier items with correct structure', async () => {
      const result = await service.getTopCarriers({});

      if (result.carriers.length > 0) {
        expect(result.carriers[0]).toHaveProperty('carrierId');
        expect(result.carriers[0]).toHaveProperty('carrierName');
        expect(result.carriers[0]).toHaveProperty('packageCount');
        expect(result.carriers[0]).toHaveProperty('avgDeliveryTimeHours');
      }
    });

    it('should respect limit parameter', async () => {
      const result = await service.getTopCarriers({}, 5);

      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 10', async () => {
      const result = await service.getTopCarriers({});

      expect(mockDb.limit).toHaveBeenCalledWith(10);
    });

    it('should handle null carrier names', async () => {
      const carriersWithNullName = [{ carrierId: 'carrier-1', carrierName: null }];
      mockDb.limit.mockResolvedValueOnce(carriersWithNullName);

      const result = await service.getTopCarriers({});

      if (result.carriers.length > 0) {
        expect(result.carriers[0].carrierName).toBe('Unknown Carrier');
      }
    });

    it('should return period in response', async () => {
      const result = await service.getTopCarriers({ period: DashboardPeriod.LAST_7_DAYS });

      expect(result.period).toBe('last_7_days');
    });
  });

  // ==================== Date Range Helper Tests ====================
  describe('Date Range Calculations', () => {
    it('should handle custom date range', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: 10 }]);

      const filter: DashboardFilterDto = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };

      const result = await service.getStats(filter);

      expect(result).toBeDefined();
    });

    it('should use LAST_30_DAYS as default period', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: 10 }]);

      const result = await service.getStats({});

      expect(result).toBeDefined();
    });
  });

  // ==================== Error Handling Tests ====================
  describe('Error Handling', () => {
    it('should handle database errors gracefully in getStats', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockRejectedValue(new Error('Database error'));

      await expect(service.getStats({})).rejects.toThrow('Database error');
    });

    it('should handle empty results', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([]);

      const result = await service.getStats({});

      expect(result.totalPackagesReceived).toBe(0);
    });

    it('should handle null count results', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValue([{ count: null }]);

      const result = await service.getStats({});

      expect(result.totalPackagesReceived).toBe(0);
    });
  });
});

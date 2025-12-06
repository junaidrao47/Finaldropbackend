import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PackagesService, PackageStatus } from './src/packages/packages.service';

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  asc: jest.fn((col) => ({ type: 'asc', col })),
  ilike: jest.fn((a, b) => ({ type: 'ilike', a, b })),
  isNull: jest.fn((a) => ({ type: 'isNull', a })),
  sql: jest.fn((template, ...args) => ({ template, args })),
  count: jest.fn(() => ({ type: 'count' })),
}));

const createMockDb = () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };
  return mockChain;
};

describe('PackagesService', () => {
  let service: PackagesService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockPackage = {
    id: 'pkg-001',
    organizationId: 'org-001',
    warehouseId: 'wh-001',
    trackingNumber: 'TRK-12345',
    senderName: 'Sender Inc',
    recipientName: 'John Doe',
    phoneNumber: '+1234567890',
    status: PackageStatus.PENDING,
    expectedDeliveryDate: new Date(),
    signatureRequiredOnDeliver: false,
    isDeleted: false,
    createdBy: 'user-001',
    updatedBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new PackagesService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ==================== create Tests ====================
  describe('create', () => {
    it('should create a new package', async () => {
      mockDb.returning.mockResolvedValueOnce([mockPackage]);

      const dto = {
        organizationId: 'org-001',
        warehouseId: 'wh-001',
        trackingNumber: 'TRK-12345',
        senderName: 'Sender Inc',
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
      };

      const result = await service.create(dto, 'user-001');

      expect(result).toEqual(mockPackage);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should set default status to PENDING', async () => {
      mockDb.returning.mockResolvedValueOnce([mockPackage]);

      const dto = {
        organizationId: 'org-001',
        trackingNumber: 'TRK-12345',
      };

      await service.create(dto, 'user-001');

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PackageStatus.PENDING,
        }),
      );
    });

    it('should handle optional fields', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockPackage, warehouseId: null }]);

      const dto = {
        organizationId: 'org-001',
        trackingNumber: 'TRK-12345',
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
    });

    it('should handle requiresSignature flag', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockPackage, signatureRequiredOnDeliver: true }]);

      const dto = {
        organizationId: 'org-001',
        trackingNumber: 'TRK-12345',
        requiresSignature: true,
      };

      await service.create(dto, 'user-001');

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          signatureRequiredOnDeliver: true,
        }),
      );
    });
  });

  // ==================== findById Tests ====================
  describe('findById', () => {
    it('should find package by ID', async () => {
      mockDb.where.mockResolvedValueOnce([mockPackage]);

      const result = await service.findById('pkg-001');

      expect(result).toEqual(mockPackage);
    });

    it('should throw NotFoundException when package not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findByTrackingNumber Tests ====================
  describe('findByTrackingNumber', () => {
    it('should find package by tracking number', async () => {
      mockDb.where.mockResolvedValueOnce([mockPackage]);

      const result = await service.findByTrackingNumber('TRK-12345', 'org-001');

      expect(result).toEqual(mockPackage);
      expect(result.trackingNumber).toBe('TRK-12345');
    });

    it('should return undefined when not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await service.findByTrackingNumber('NONEXISTENT', 'org-001');

      expect(result).toBeUndefined();
    });
  });

  // ==================== findAll Tests ====================
  describe('findAll', () => {
    it('should return packages with pagination', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage, { ...mockPackage, id: 'pkg-002' }]);

      const result = await service.findAll({ organizationId: 'org-001' });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by organizationId', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({ organizationId: 'org-001' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by warehouseId', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({ warehouseId: 'wh-001' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by transactionStatus', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({ transactionStatus: PackageStatus.PENDING });

      expect(result.data[0].status).toBe(PackageStatus.PENDING);
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({ search: 'TRK-12345' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(20);
      expect(result.pagination.page).toBe(3);
    });

    it('should use default pagination', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      await service.findAll({});

      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });

    it('should handle sort order ascending', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      await service.findAll({ sortOrder: 'asc' });

      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('should sort by tracking number', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockPackage]);

      await service.findAll({ sortBy: 'trackingNumber' });

      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('should return empty array when no packages', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ==================== update Tests ====================
  describe('update', () => {
    it('should update package', async () => {
      mockDb.where.mockResolvedValueOnce([mockPackage]); // findById
      mockDb.returning.mockResolvedValueOnce([{ ...mockPackage, recipientName: 'Jane Doe' }]);

      const result = await service.update('pkg-001', { recipientName: 'Jane Doe' }, 'user-001');

      expect(result.recipientName).toBe('Jane Doe');
    });

    it('should throw NotFoundException when package not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      await expect(
        service.update('nonexistent', { recipientName: 'Jane' }, 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateStatus Tests ====================
  describe('updateStatus', () => {
    it('should update package status', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockPackage, status: PackageStatus.DELIVERED }]);

      const result = await service.updateStatus('pkg-001', PackageStatus.DELIVERED, 'user-001');

      expect(result.status).toBe(PackageStatus.DELIVERED);
    });

    it('should set updatedAt timestamp', async () => {
      mockDb.returning.mockResolvedValueOnce([mockPackage]);

      await service.updateStatus('pkg-001', PackageStatus.RECEIVED, 'user-001');

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  // ==================== Package Status Constants ====================
  describe('PackageStatus', () => {
    it('should have all required statuses', () => {
      expect(PackageStatus.PENDING).toBe('Pending');
      expect(PackageStatus.RECEIVED).toBe('Received');
      expect(PackageStatus.AVAILABLE).toBe('Available');
      expect(PackageStatus.IN_TRANSIT).toBe('In Transit');
      expect(PackageStatus.OUT_FOR_DELIVERY).toBe('Out for Delivery');
      expect(PackageStatus.DELIVERED).toBe('Delivered');
      expect(PackageStatus.RETURNED).toBe('Returned');
      expect(PackageStatus.CANCELLED).toBe('Cancelled');
      expect(PackageStatus.ON_HOLD).toBe('On Hold');
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should handle database errors in create', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.create({ organizationId: 'org-001', trackingNumber: 'TRK' }),
      ).rejects.toThrow('DB error');
    });

    it('should handle database errors in findAll', async () => {
      mockDb.where.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.findAll({})).rejects.toThrow('DB error');
    });
  });
});

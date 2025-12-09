import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', a, b })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  or: jest.fn((...conditions) => ({ type: 'or', conditions })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  ilike: jest.fn((a, b) => ({ type: 'ilike', a, b })),
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
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
  };
  return mockChain;
};

describe('WarehousesService', () => {
  let service: WarehousesService;
  let mockDb: ReturnType<typeof createMockDb>;

  const mockWarehouse = {
    id: 'wh-001',
    organizationId: 'org-001',
    name: 'Main Warehouse',
    profileImage: null,
    phoneNumber: '+1234567890',
    mobileNumber: '+1234567891',
    differentWhatsAppNumber: false,
    whatsAppNumber: null,
    email: 'warehouse@test.com',
    additionalInformation: 'Test warehouse',
    defaultOptions: true,
    isActive: true,
    isDeleted: false,
    isLocked: false,
    createdBy: 'user-001',
    updatedBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb = createMockDb();
    service = new WarehousesService(mockDb as any);
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
    it('should create a new warehouse', async () => {
      mockDb.returning.mockResolvedValueOnce([mockWarehouse]);

      const dto = {
        organizationId: 'org-001',
        name: 'Main Warehouse',
        phoneNumber: '+1234567890',
        email: 'warehouse@test.com',
      };

      const result = await service.create(dto, 'user-001');

      expect(result).toEqual(mockWarehouse);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle optional fields', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, name: null }]);

      const dto = {
        organizationId: 'org-001',
      };

      const result = await service.create(dto, 'user-001');

      expect(result).toBeDefined();
    });

    it('should set default values', async () => {
      mockDb.returning.mockResolvedValueOnce([mockWarehouse]);

      const dto = {
        organizationId: 'org-001',
        name: 'Test',
      };

      await service.create(dto, 'user-001');

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-001',
          isActive: true,
          isDeleted: false,
          isLocked: false,
        }),
      );
    });
  });

  // ==================== findById Tests ====================
  describe('findById', () => {
    it('should find warehouse by ID', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWarehouse]);

      const result = await service.findById('wh-001');

      expect(result).toEqual(mockWarehouse);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== findAll Tests ====================
  describe('findAll', () => {
    it('should return warehouses with pagination', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse, { ...mockWarehouse, id: 'wh-002' }]);

      const result = await service.findAll({ organizationId: 'org-001' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by organizationId', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse]);

      const result = await service.findAll({ organizationId: 'org-001' });

      expect(result.data).toHaveLength(1);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse]);

      const result = await service.findAll({ isActive: true });

      expect(result.data[0].isActive).toBe(true);
    });

    it('should filter by search term', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse]);

      const result = await service.findAll({ search: 'Main' });

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 50 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(10);
    });

    it('should use default pagination', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);
      mockDb.offset.mockResolvedValueOnce([mockWarehouse]);

      await service.findAll({});

      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });

    it('should return empty array when no warehouses', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.offset.mockResolvedValueOnce([]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ==================== update Tests ====================
  describe('update', () => {
    it('should update warehouse', async () => {
      // Mock findById
      mockDb.limit.mockResolvedValueOnce([mockWarehouse]);
      // Mock update
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, name: 'Updated Warehouse' }]);

      const result = await service.update('wh-001', { name: 'Updated Warehouse' }, 'user-001');

      expect(result.name).toBe('Updated Warehouse');
    });

    it('should throw when warehouse is locked', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: true }]);

      await expect(
        service.update('wh-001', { name: 'Updated' }, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(
        service.update('nonexistent', { name: 'Updated' }, 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== remove Tests ====================
  describe('remove', () => {
    it('should soft delete warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWarehouse]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isDeleted: true }]);

      await service.remove('wh-001', 'user-001');

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw when warehouse is locked', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: true }]);

      await expect(service.remove('wh-001', 'user-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== restore Tests ====================
  describe('restore', () => {
    it('should restore soft-deleted warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isDeleted: true }]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isDeleted: false }]);

      const result = await service.restore('wh-001', 'user-001');

      expect(result.isDeleted).toBe(false);
    });
  });

  // ==================== toggleLock Tests ====================
  describe('toggleLock', () => {
    it('should lock warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWarehouse]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: true }]);

      const result = await service.toggleLock('wh-001', true, 'user-001');

      expect(result.isLocked).toBe(true);
    });

    it('should unlock warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: true }]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: false }]);

      const result = await service.toggleLock('wh-001', false, 'user-001');

      expect(result.isLocked).toBe(false);
    });
  });

  // ==================== setActive Tests ====================
  describe('setActive', () => {
    it('should activate warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isActive: false }]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isActive: true }]);

      const result = await service.setActive('wh-001', true, 'user-001');

      expect(result.isActive).toBe(true);
    });

    it('should deactivate warehouse', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWarehouse]);
      mockDb.returning.mockResolvedValueOnce([{ ...mockWarehouse, isActive: false }]);

      const result = await service.setActive('wh-001', false, 'user-001');

      expect(result.isActive).toBe(false);
    });

    it('should throw when warehouse is locked', async () => {
      mockDb.limit.mockResolvedValueOnce([{ ...mockWarehouse, isLocked: true }]);

      await expect(
        service.setActive('wh-001', false, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== getActiveWarehouses Tests ====================
  describe('getActiveWarehouses', () => {
    it('should return active warehouses for organization', async () => {
      mockDb.orderBy.mockReturnValue([mockWarehouse, { ...mockWarehouse, id: 'wh-002' }]);

      const result = await service.getActiveWarehouses('org-001');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no active warehouses', async () => {
      mockDb.orderBy.mockReturnValue([]);

      const result = await service.getActiveWarehouses('org-001');

      expect(result).toHaveLength(0);
    });
  });

  // ==================== getStats Tests ====================
  describe('getStats', () => {
    it('should return warehouse stats', async () => {
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]); // total
      mockDb.where.mockResolvedValueOnce([{ count: 3 }]); // active
      mockDb.where.mockResolvedValueOnce([{ count: 2 }]); // inactive

      const result = await service.getStats('org-001');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('inactive');
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should handle database errors in create', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.create({ organizationId: 'org-001' }, 'user-001'),
      ).rejects.toThrow('DB error');
    });

    it('should handle database errors in findAll', async () => {
      mockDb.where.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.findAll({})).rejects.toThrow('DB error');
    });
  });
});

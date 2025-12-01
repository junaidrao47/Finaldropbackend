import { WarehousesController } from './src/warehouses/warehouses.controller';
import { WarehousesService } from './src/warehouses/warehouses.service';

describe('WarehousesController', () => {
  let controller: WarehousesController;
  let mockWarehousesService: jest.Mocked<Partial<WarehousesService>>;

  const mockWarehouse = {
    id: 'wh-001',
    organizationId: 'org-001',
    name: 'Main Warehouse',
    phoneNumber: '+1234567890',
    email: 'warehouse@test.com',
    isActive: true,
    isDeleted: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = { sub: 'user-001', id: 'user-001' };
  const mockRequest = { user: mockUser };

  beforeEach(() => {
    mockWarehousesService = {
      create: jest.fn().mockResolvedValue(mockWarehouse),
      findAll: jest.fn().mockResolvedValue({ data: [mockWarehouse], total: 1 }),
      findById: jest.fn().mockResolvedValue(mockWarehouse),
      update: jest.fn().mockResolvedValue(mockWarehouse),
      remove: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(mockWarehouse),
      toggleLock: jest.fn().mockResolvedValue(mockWarehouse),
      setActive: jest.fn().mockResolvedValue(mockWarehouse),
      getActiveWarehouses: jest.fn().mockResolvedValue([mockWarehouse]),
      getStats: jest.fn().mockResolvedValue({ total: 5, active: 3, inactive: 2 }),
      createDefaultOptions: jest.fn().mockResolvedValue({}),
      updateDefaultOptions: jest.fn().mockResolvedValue({}),
      getDefaultOptions: jest.fn().mockResolvedValue({}),
      createStorageLayout: jest.fn().mockResolvedValue({}),
      updateStorageLayout: jest.fn().mockResolvedValue({}),
      getStorageLayoutById: jest.fn().mockResolvedValue({}),
      getStorageLayouts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      removeStorageLayout: jest.fn().mockResolvedValue(undefined),
    };

    controller = new WarehousesController(mockWarehousesService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ==================== POST /warehouses ====================
  describe('POST /warehouses', () => {
    it('should create a warehouse', async () => {
      const dto = { organizationId: 'org-001', name: 'New Warehouse' };

      const result = await controller.create(dto, mockRequest);

      expect(result).toEqual(mockWarehouse);
      expect(mockWarehousesService.create).toHaveBeenCalledWith(dto, 'user-001');
    });

    it('should extract user id from request', async () => {
      const requestWithSub = { user: { sub: 'sub-user' } };

      await controller.create({}, requestWithSub);

      expect(mockWarehousesService.create).toHaveBeenCalledWith({}, 'sub-user');
    });
  });

  // ==================== GET /warehouses ====================
  describe('GET /warehouses', () => {
    it('should return all warehouses with pagination', async () => {
      const filter = { organizationId: 'org-001', page: 1, limit: 10 };

      const result = await controller.findAll(filter);

      expect(result).toEqual({ data: [mockWarehouse], total: 1 });
      expect(mockWarehousesService.findAll).toHaveBeenCalledWith(filter);
    });

    it('should return empty data when no warehouses', async () => {
      mockWarehousesService.findAll = jest.fn().mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll({});

      expect(result.data).toHaveLength(0);
    });
  });

  // ==================== GET /warehouses/active/:organizationId ====================
  describe('GET /warehouses/active/:organizationId', () => {
    it('should return active warehouses', async () => {
      const result = await controller.getActiveWarehouses('org-001');

      expect(result).toEqual([mockWarehouse]);
      expect(mockWarehousesService.getActiveWarehouses).toHaveBeenCalledWith('org-001');
    });
  });

  // ==================== GET /warehouses/stats/:organizationId ====================
  describe('GET /warehouses/stats/:organizationId', () => {
    it('should return warehouse stats', async () => {
      const result = await controller.getStats('org-001');

      expect(result).toEqual({ total: 5, active: 3, inactive: 2 });
      expect(mockWarehousesService.getStats).toHaveBeenCalledWith('org-001');
    });
  });

  // ==================== GET /warehouses/:id ====================
  describe('GET /warehouses/:id', () => {
    it('should return warehouse by ID', async () => {
      const result = await controller.findOne('wh-001');

      expect(result).toEqual(mockWarehouse);
      expect(mockWarehousesService.findById).toHaveBeenCalledWith('wh-001');
    });
  });

  // ==================== PUT /warehouses/:id ====================
  describe('PUT /warehouses/:id', () => {
    it('should update warehouse', async () => {
      const dto = { name: 'Updated Warehouse' };

      const result = await controller.update('wh-001', dto, mockRequest);

      expect(result).toEqual(mockWarehouse);
      expect(mockWarehousesService.update).toHaveBeenCalledWith('wh-001', dto, 'user-001');
    });
  });

  // ==================== POST /warehouses/:id/restore ====================
  describe('POST /warehouses/:id/restore', () => {
    it('should restore soft-deleted warehouse', async () => {
      const result = await controller.restore('wh-001', mockRequest);

      expect(result).toEqual(mockWarehouse);
      expect(mockWarehousesService.restore).toHaveBeenCalledWith('wh-001', 'user-001');
    });
  });

  // ==================== POST /warehouses/:id/lock ====================
  describe('POST /warehouses/:id/lock', () => {
    it('should lock warehouse', async () => {
      mockWarehousesService.toggleLock = jest.fn().mockResolvedValue({ ...mockWarehouse, isLocked: true });

      const result = await controller.lock('wh-001', mockRequest);

      expect(result.isLocked).toBe(true);
      expect(mockWarehousesService.toggleLock).toHaveBeenCalledWith('wh-001', true, 'user-001');
    });
  });

  // ==================== POST /warehouses/:id/unlock ====================
  describe('POST /warehouses/:id/unlock', () => {
    it('should unlock warehouse', async () => {
      const result = await controller.unlock('wh-001', mockRequest);

      expect(mockWarehousesService.toggleLock).toHaveBeenCalledWith('wh-001', false, 'user-001');
    });
  });

  // ==================== POST /warehouses/:id/activate ====================
  describe('POST /warehouses/:id/activate', () => {
    it('should activate warehouse', async () => {
      const result = await controller.activate('wh-001', mockRequest);

      expect(mockWarehousesService.setActive).toHaveBeenCalledWith('wh-001', true, 'user-001');
    });
  });

  // ==================== POST /warehouses/:id/deactivate ====================
  describe('POST /warehouses/:id/deactivate', () => {
    it('should deactivate warehouse', async () => {
      mockWarehousesService.setActive = jest.fn().mockResolvedValue({ ...mockWarehouse, isActive: false });

      const result = await controller.deactivate('wh-001', mockRequest);

      expect(result.isActive).toBe(false);
      expect(mockWarehousesService.setActive).toHaveBeenCalledWith('wh-001', false, 'user-001');
    });
  });

  // ==================== DELETE /warehouses/:id ====================
  describe('DELETE /warehouses/:id', () => {
    it('should soft delete warehouse', async () => {
      await controller.remove('wh-001', mockRequest);

      expect(mockWarehousesService.remove).toHaveBeenCalledWith('wh-001', 'user-001');
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('should propagate service errors on create', async () => {
      mockWarehousesService.create = jest.fn().mockRejectedValue(new Error('Create failed'));

      await expect(controller.create({}, mockRequest)).rejects.toThrow('Create failed');
    });

    it('should propagate service errors on findById', async () => {
      mockWarehousesService.findById = jest.fn().mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne('wh-999')).rejects.toThrow('Not found');
    });

    it('should propagate service errors on update', async () => {
      mockWarehousesService.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      await expect(controller.update('wh-001', {}, mockRequest)).rejects.toThrow('Update failed');
    });

    it('should propagate service errors on remove', async () => {
      mockWarehousesService.remove = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove('wh-001', mockRequest)).rejects.toThrow('Delete failed');
    });
  });
});
